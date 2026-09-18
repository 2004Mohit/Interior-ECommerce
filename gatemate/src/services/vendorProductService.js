/**
 * GateMate Vendor Product Service
 *
 * Supabase-backed product CRUD and moderation workflow.
 *
 * Identity:
 * - auth.users.id -> vendor_profiles.user_id
 * - vendor_profiles.id -> vendor_products.vendor_id
 */

import { supabase } from "../lib/supabaseClient";
import { vendorIdentityService } from "./vendorIdentityService";
import { uploadService } from "./uploadService";

export const PRODUCT_APPROVAL_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
};

const PRODUCT_STATUSES = new Set(Object.values(PRODUCT_APPROVAL_STATUS));

const validateCategoryExists = async (categorySlug) => {
  if (!categorySlug) {
    throw new Error("Please select a product category.");
  }

  const { data, error } = await supabase
    .from("product_categories")
    .select("slug")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to verify product category: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      `The selected product category "${categorySlug}" does not exist in the GateMate category catalogue.`,
    );
  }

  return true;
};

const cleanText = (value) => {
  return value == null ? "" : String(value).trim();
};

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const normaliseArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const slugify = (value) => {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
};

/**
 * Convert Supabase DB row into frontend-friendly camelCase object.
 */
const mapRow = (row) => {
  if (!row) {
    return null;
  }

  const images = normaliseArray(row.image_urls).filter(Boolean);

  /*
   * vendor_inventory is not physically stored inside vendor_products.
   * This is only used when the query returns a joined inventory object.
   */
  const inventory = Array.isArray(row.vendor_inventory)
    ? row.vendor_inventory[0]
    : row.vendor_inventory;

  const onHand = Number(inventory?.on_hand_stock ?? inventory?.stock ?? 0);

  const reserved = Number(inventory?.reserved_stock ?? 0);

  const availableStock = Math.max(0, onHand - reserved);

  return {
    id: row.id,
    vendorId: row.vendor_id,

    slug: row.slug,

    name: row.name,
    brand: row.brand,

    category: row.category_slug,
    categorySlug: row.category_slug,

    unit: row.unit,

    sku: row.sku || "",

    price: Number(row.price),

    originalPrice:
      row.original_price == null ? null : Number(row.original_price),

    moq: Number(row.moq ?? 1),

    isExpress30MinAvailable: Boolean(row.is_express_30min_available),

    description: row.description || "",

    features: normaliseArray(row.features),

    dynamicAttributes: normaliseArray(row.dynamic_attributes),

    images,

    imageUrls: images,

    img: row.cover_image_url || images[0] || "",

    coverImageUrl: row.cover_image_url || images[0] || "",

    stock: availableStock,

    onHandStock: onHand,

    reservedStock: reserved,

    status: row.status,

    reviewerNotes: row.reviewer_notes || "",

    reviewedAt: row.reviewed_at || null,

    reviewedBy: row.reviewed_by || null,

    submittedAt: row.submitted_at || null,

    publishedAt: row.published_at || null,

    createdAt: row.created_at || null,

    updatedAt: row.updated_at || null,
  };
};

/**
 * Convert frontend product object into Supabase DB fields.
 */
const toDbPayload = (payload = {}) => {
  return {
    name: cleanText(payload.name),

    brand: cleanText(payload.brand),

    category_slug: cleanText(payload.categorySlug ?? payload.category_slug),

    unit: cleanText(payload.unit),

    sku: cleanText(payload.sku) || null,

    price: toNumberOrNull(payload.price),

    original_price: toNumberOrNull(
      payload.originalPrice ?? payload.original_price,
    ),

    moq: Number(payload.moq || 1),

    is_express_30min_available: Boolean(
      payload.isExpress30MinAvailable ?? payload.is_express_30min_available,
    ),

    description: cleanText(payload.description),

    features: normaliseArray(payload.features).map(cleanText).filter(Boolean),

    dynamic_attributes: normaliseArray(
      payload.dynamicAttributes ?? payload.dynamic_attributes,
    ),
  };
};

/**
 * Strict validation used when submitting a product.
 */
const validateForSubmit = (payload) => {
  const db = toDbPayload(payload);

  const errors = [];

  if (!db.name) {
    errors.push("Product name is required.");
  }

  if (!db.brand) {
    errors.push("Brand is required.");
  }

  if (!db.category_slug) {
    errors.push("Product category is required.");
  }

  if (!db.unit) {
    errors.push("Unit is required.");
  }

  if (!db.description) {
    errors.push("Product description is required.");
  }

  if (db.price === null || db.price <= 0) {
    errors.push("Price must be greater than 0.");
  }

  if (db.original_price !== null && db.original_price < db.price) {
    errors.push("Original price cannot be lower than the selling price.");
  }

  if (!Number.isInteger(db.moq) || db.moq < 1) {
    errors.push("Minimum order quantity must be at least 1.");
  }

  if (
    !PRODUCT_STATUSES.has(payload.status || PRODUCT_APPROVAL_STATUS.SUBMITTED)
  ) {
    errors.push("Invalid product approval status.");
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  return db;
};

/**
 * Resolve vendor_profiles.id for the currently
 * authenticated vendor.
 */
const resolveVendorId = async () => {
  return vendorIdentityService.getVendorProfileId();
};

/**
 * Generate a globally unique product slug.
 */
const ensureUniqueSlug = async (name, currentProductId = null) => {
  const base = slugify(name);

  if (!base) {
    throw new Error("A valid product name is required to generate a URL slug.");
  }

  let candidate = base;
  let suffix = 2;

  while (true) {
    let query = supabase
      .from("vendor_products")
      .select("id")
      .eq("slug", candidate)
      .limit(1);

    if (currentProductId) {
      query = query.neq("id", currentProductId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Unable to check product slug: ${error.message}`);
    }

    if (!data?.length) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;

    suffix += 1;
  }
};

/**
 * Upload product images.
 *
 * Product must already exist because its UUID is used
 * as the storage directory.
 */
const uploadImages = async (productId, files = []) => {
  const uploaded = [];

  for (const file of files) {
    if (!file) {
      continue;
    }

    const result = await uploadService.uploadProductImage(productId, file);

    uploaded.push(result);
  }

  return uploaded;
};

/**
 * Remove uploaded files if database operation fails.
 */
const cleanupUploadedImages = async (uploaded = []) => {
  await Promise.allSettled(
    uploaded
      .map((item) => item?.path)
      .filter(Boolean)
      .map((path) => uploadService.removeFile("product-images", path)),
  );
};

/**
 * Extract Supabase storage path from URL.
 */
const extractStoragePath = (value) => {
  if (!value) {
    return null;
  }

  if (value.includes("/storage/v1/object/public/product-images/")) {
    return value.split("/storage/v1/object/public/product-images/")[1];
  }

  if (value.includes("/storage/v1/object/sign/product-images/")) {
    return value.split("/storage/v1/object/sign/product-images/")[1];
  }

  /*
   * Also support raw storage paths.
   */
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value;
  }

  return null;
};

export const vendorProductService = {
  /**
   * Get all products belonging to current vendor.
   */
  async getVendorProducts(vendorId = null) {
    const resolvedVendorId = vendorId || (await resolveVendorId());

    const { data, error } = await supabase
      .from("vendor_products")
      .select(
        `
          *,
          vendor_inventory (
            on_hand_stock,
            reserved_stock,
            low_stock_threshold
          )
        `,
      )
      .eq("vendor_id", resolvedVendorId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(`Unable to fetch vendor products: ${error.message}`);
    }

    return (data || []).map(mapRow);
  },

  /**
   * Get one product belonging to current vendor.
   */
  async getVendorProductById(productId, vendorId = null) {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    const resolvedVendorId = vendorId || (await resolveVendorId());

    const { data, error } = await supabase
      .from("vendor_products")
      .select(
        `
          *,
          vendor_inventory (
            on_hand_stock,
            reserved_stock,
            low_stock_threshold
          )
        `,
      )
      .eq("id", productId)
      .eq("vendor_id", resolvedVendorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to fetch product: ${error.message}`);
    }

    return mapRow(data);
  },

  /**
   * Create product and immediately submit it
   * for admin moderation.
   */
  async createVendorProduct(payload = {}, files = []) {
    const vendorId = await resolveVendorId();

    await validateCategoryExists(payload.categorySlug ?? payload.category_slug);

    const dbPayload = validateForSubmit({
      ...payload,
      status: PRODUCT_APPROVAL_STATUS.SUBMITTED,
    });

    const slug = await ensureUniqueSlug(dbPayload.name);

    const insertPayload = {
      ...dbPayload,

      vendor_id: vendorId,

      slug,

      status: PRODUCT_APPROVAL_STATUS.SUBMITTED,

      submitted_at: new Date().toISOString(),

      image_urls: [],

      cover_image_url: null,
    };

    const { data: created, error: insertError } = await supabase
      .from("vendor_products")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertError) {
      throw new Error(`Unable to create product: ${insertError.message}`);
    }

    const uploaded = [];

    try {
      /*
       * Upload actual images to Supabase Storage.
       */
      if (files.length) {
        uploaded.push(...(await uploadImages(created.id, files)));
      }

      const imageUrls = [
        ...normaliseArray(payload.imageUrls ?? payload.image_urls),

        ...uploaded.map((item) => item.url).filter(Boolean),
      ].filter(Boolean);

      const coverImageUrl = imageUrls[0] || null;

      const { data: updated, error: updateError } = await supabase
        .from("vendor_products")
        .update({
          image_urls: imageUrls,

          cover_image_url: coverImageUrl,

          updated_at: new Date().toISOString(),
        })
        .eq("id", created.id)
        .eq("vendor_id", vendorId)
        .select("*")
        .single();

      if (updateError) {
        throw updateError;
      }

      return mapRow(updated);
    } catch (error) {
      /*
       * If upload/update fails, clean up
       * uploaded storage files.
       */
      await cleanupUploadedImages(uploaded);

      /*
       * Remove incomplete database record.
       */
      await supabase
        .from("vendor_products")
        .delete()
        .eq("id", created.id)
        .eq("vendor_id", vendorId);

      throw new Error(
        error.message || "Product was created but image upload failed.",
      );
    }
  },

  /**
   * Update an existing vendor product.
   */
  async updateVendorProduct(productId, payload = {}, files = []) {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    const vendorId = await resolveVendorId();

    const { data: existing, error: existingError } = await supabase
      .from("vendor_products")
      .select("*")
      .eq("id", productId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Unable to load product: ${existingError.message}`);
    }

    if (!existing) {
      throw new Error("Product not found.");
    }

    const dbPayload = validateForSubmit({
      ...payload,
      status: existing.status,
    });

    let slug = existing.slug;

    /*
     * Generate a new slug if product name changed.
     */
    if (cleanText(payload.name) && cleanText(payload.name) !== existing.name) {
      slug = await ensureUniqueSlug(payload.name, productId);
    }

    /*
     * Existing images retained by form.
     */
    const existingImages = normaliseArray(
      payload.imageUrls ?? payload.image_urls ?? existing.image_urls,
    ).filter(Boolean);

    const uploaded = [];

    try {
      if (files.length) {
        uploaded.push(...(await uploadImages(productId, files)));
      }

      const imageUrls = [
        ...existingImages,

        ...uploaded.map((item) => item.url).filter(Boolean),
      ].filter(Boolean);

      const coverImageUrl = imageUrls[0] || null;

      const updatePayload = {
        ...dbPayload,

        slug,

        image_urls: imageUrls,

        cover_image_url: coverImageUrl,

        updated_at: new Date().toISOString(),
      };

      /*
       * If admin requested changes,
       * corrected product goes back to SUBMITTED.
       */
      if (existing.status === PRODUCT_APPROVAL_STATUS.CHANGES_REQUESTED) {
        updatePayload.status = PRODUCT_APPROVAL_STATUS.SUBMITTED;

        updatePayload.submitted_at = new Date().toISOString();
      }

      const { data: updated, error: updateError } = await supabase
        .from("vendor_products")
        .update(updatePayload)
        .eq("id", productId)
        .eq("vendor_id", vendorId)
        .select("*")
        .single();

      if (updateError) {
        throw updateError;
      }

      /*
       * Remove images which vendor deleted.
       */
      const oldImages = normaliseArray(existing.image_urls);

      const removedPaths = oldImages
        .filter((url) => !imageUrls.includes(url))
        .map(extractStoragePath)
        .filter(Boolean);

      if (removedPaths.length) {
        await supabase.storage.from("product-images").remove(removedPaths);
      }

      return mapRow(updated);
    } catch (error) {
      await cleanupUploadedImages(uploaded);

      throw new Error(error.message || "Failed to update product.");
    }
  },

  /**
   * Save incomplete product as draft.
   *
   * Drafts do not use strict submission validation.
   */
  async saveProductDraft(payload = {}, productId = null, files = []) {
    const vendorId = await resolveVendorId();

    const dbPayload = toDbPayload(payload);

    /*
     * Existing draft.
     */
    if (productId) {
      const { data, error } = await supabase
        .from("vendor_products")
        .update({
          ...dbPayload,

          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("vendor_id", vendorId)
        .select("*")
        .single();

      if (error) {
        throw new Error(`Unable to save draft: ${error.message}`);
      }

      return mapRow(data);
    }

    if (!dbPayload.name) {
      throw new Error("Product name is required to save a draft.");
    }

    const slug = await ensureUniqueSlug(dbPayload.name);

    const { data, error } = await supabase
      .from("vendor_products")
      .insert({
        ...dbPayload,

        vendor_id: vendorId,

        slug,

        status: PRODUCT_APPROVAL_STATUS.DRAFT,

        image_urls: [],

        cover_image_url: null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Unable to create draft: ${error.message}`);
    }

    return mapRow(data);
  },

  /**
   * Submit an existing draft for moderation.
   */
  async submitProductForReview(productId) {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    const vendorId = await resolveVendorId();

    const { data: product, error: fetchError } = await supabase
      .from("vendor_products")
      .select("*")
      .eq("id", productId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Unable to load product: ${fetchError.message}`);
    }

    if (!product) {
      throw new Error("Product not found.");
    }

    /*
     * Validate existing database data.
     */
    validateForSubmit({
      name: product.name,

      brand: product.brand,

      categorySlug: product.category_slug,

      unit: product.unit,

      price: product.price,

      originalPrice: product.original_price,

      moq: product.moq,

      description: product.description,

      features: product.features,

      dynamicAttributes: product.dynamic_attributes,

      status: PRODUCT_APPROVAL_STATUS.SUBMITTED,
    });

    const { data, error } = await supabase
      .from("vendor_products")
      .update({
        status: PRODUCT_APPROVAL_STATUS.SUBMITTED,

        submitted_at: new Date().toISOString(),

        reviewer_notes: null,

        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("vendor_id", vendorId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Unable to submit product: ${error.message}`);
    }

    return mapRow(data);
  },

  /**
   * Delete vendor product.
   */
  async deleteVendorProduct(productId) {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    const vendorId = await resolveVendorId();

    const { data: product, error: fetchError } = await supabase
      .from("vendor_products")
      .select("id, image_urls")
      .eq("id", productId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Unable to load product: ${fetchError.message}`);
    }

    if (!product) {
      throw new Error("Product not found.");
    }

    /*
     * Remove associated storage images.
     */
    const paths = normaliseArray(product.image_urls)
      .map(extractStoragePath)
      .filter(Boolean);

    if (paths.length) {
      await supabase.storage.from("product-images").remove(paths);
    }

    const { error } = await supabase
      .from("vendor_products")
      .delete()
      .eq("id", productId)
      .eq("vendor_id", vendorId);

    if (error) {
      throw new Error(`Unable to delete product: ${error.message}`);
    }

    return true;
  },

  /**
   * Admin compatibility method.
   *
   * Actual security is enforced by Supabase RLS.
   */
  async getAllProductsForAdminReview() {
    const { data, error } = await supabase
      .from("vendor_products")
      .select(
        `
          *,
          vendor_profiles (
            id,
            business_name,
            trade_name,
            contact_person,
            email,
            phone
          ),
          vendor_inventory (
            on_hand_stock,
            reserved_stock,
            low_stock_threshold
          )
        `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(`Unable to fetch products for review: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Admin product moderation.
   */
  async updateAdminProductModeration(productId, status, reviewerNotes = null) {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    if (!PRODUCT_STATUSES.has(status)) {
      throw new Error("Invalid product moderation status.");
    }

    const { data: userData } = await supabase.auth.getUser();

    const updatePayload = {
      status,

      reviewer_notes: reviewerNotes,

      reviewed_at: new Date().toISOString(),

      reviewed_by: userData?.user?.id || null,

      updated_at: new Date().toISOString(),
    };

    if (status === PRODUCT_APPROVAL_STATUS.SUBMITTED) {
      updatePayload.submitted_at = new Date().toISOString();
    }

    if (status === PRODUCT_APPROVAL_STATUS.PUBLISHED) {
      updatePayload.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("vendor_products")
      .update(updatePayload)
      .eq("id", productId)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Unable to update product moderation status: ${error.message}`,
      );
    }

    return mapRow(data);
  },
};
