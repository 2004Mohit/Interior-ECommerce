/**
 * Ferrado Vendor Product Service
 *
 * Supabase-backed product CRUD + moderation + inventory initialization.
 *
 * Inventory architecture:
 * - vendor_products = product/catalogue information
 * - vendor_inventory = physical inventory information
 * - vendor_inventory.product_id = vendor_products.id
 * - reserved_stock starts at 0
 * - low_stock_threshold defaults to 10
 *
 * Important identity rule:
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

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const cleanText = (value) => (value == null ? "" : String(value).trim());

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const normaliseArray = (value) => (Array.isArray(value) ? value : []);

const slugify = (value) =>
  cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

/**
 * Convert a DB product row into the frontend product structure.
 */
const mapRow = (row) => {
  if (!row) return null;

  const images = normaliseArray(row.image_urls).filter(Boolean);

  const inventory = Array.isArray(row.vendor_inventory)
    ? row.vendor_inventory[0]
    : row.vendor_inventory;

  const onHand = Number(inventory?.on_hand_stock ?? inventory?.stock ?? 0);

  const reserved = Number(inventory?.reserved_stock ?? 0);

  const lowStockThreshold = Number(
    inventory?.low_stock_threshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
  );

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

    /*
     * Inventory
     */
    stock: availableStock,

    availableStock,

    onHandStock: onHand,

    reservedStock: reserved,

    lowStockThreshold,

    isLowStock: availableStock <= lowStockThreshold && availableStock > 0,

    isOutOfStock: availableStock <= 0,

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
 * Convert frontend product data into vendor_products DB fields.
 *
 * Inventory fields are deliberately NOT included here.
 * They belong to vendor_inventory.
 */
const toDbPayload = (payload = {}) => ({
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
});

/**
 * Validate normal product fields.
 */
const validateForSubmit = (payload = {}) => {
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

  if (errors.length) {
    throw new Error(errors.join(" "));
  }

  return db;
};

/**
 * Inventory validation for NEW products.
 *
 * This is intentionally separate from product validation because
 * inventory lives in vendor_inventory.
 */
const validateInitialInventory = (payload = {}) => {
  const initialStock =
    payload.initialStock ?? payload.onHandStock ?? payload.stock ?? 0;

  const threshold = payload.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;

  const onHand = Number(initialStock);
  const lowStockThreshold = Number(threshold);

  if (!Number.isInteger(onHand) || onHand < 0) {
    throw new Error(
      "Initial on-hand quantity must be a whole number greater than or equal to 0.",
    );
  }

  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    throw new Error(
      "Low stock threshold must be a whole number greater than or equal to 0.",
    );
  }

  return {
    onHandStock: onHand,
    lowStockThreshold,
  };
};

const validateActiveCategory = async (categorySlug) => {
  const slug = cleanText(categorySlug);

  if (!slug) {
    throw new Error("Product category is required.");
  }

  const { data, error } = await supabase
    .from("product_categories")
    .select("id, slug, name, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to validate product category: ${error.message}`);
  }

  if (!data) {
    throw new Error("Selected product category does not exist or is inactive.");
  }

  return data;
};

const resolveVendorId = async () => {
  const vendorId = await vendorIdentityService.getVendorProfileId();

  if (!vendorId) {
    throw new Error("Unable to resolve the authenticated vendor profile.");
  }

  return vendorId;
};

/**
 * Generate a unique product slug.
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
 */
const uploadImages = async (productId, files = []) => {
  const uploaded = [];

  for (const file of files) {
    if (!file) continue;

    const result = await uploadService.uploadProductImage(productId, file);

    uploaded.push(result);
  }

  return uploaded;
};

/**
 * Remove uploaded product images if a later operation fails.
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
 * Convert Supabase image URL to storage path.
 */
const extractStoragePath = (value) => {
  if (!value) return null;

  if (value.includes("/storage/v1/object/public/product-images/")) {
    return value.split("/storage/v1/object/public/product-images/")[1];
  }

  if (value.includes("/storage/v1/object/sign/product-images/")) {
    return value.split("/storage/v1/object/sign/product-images/")[1];
  }

  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value;
  }

  return null;
};

/**
 * IMPORTANT:
 *
 * There is currently no INSERT trigger on vendor_products
 * that creates vendor_inventory.
 *
 * Therefore product creation must explicitly initialize
 * vendor_inventory.
 *
 * Upsert also makes this safe if an inventory row was
 * created elsewhere in the future.
 */
const ensureInventoryForNewProduct = async ({
  productId,
  vendorId,
  initialStock = 0,
  lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
}) => {
  const stock = Number(initialStock);
  const threshold = Number(lowStockThreshold);

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error(
      "Initial on-hand quantity must be a whole number greater than or equal to 0.",
    );
  }

  if (!Number.isInteger(threshold) || threshold < 0) {
    throw new Error(
      "Low stock threshold must be a whole number greater than or equal to 0.",
    );
  }

  const { data, error } = await supabase
    .from("vendor_inventory")
    .upsert(
      {
        product_id: productId,
        vendor_id: vendorId,
        on_hand_stock: stock,
        reserved_stock: 0,
        low_stock_threshold: threshold,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "product_id",
      },
    )
    .select(
      "product_id, vendor_id, on_hand_stock, reserved_stock, low_stock_threshold",
    )
    .single();

  if (error) {
    throw new Error(`Unable to initialize product inventory: ${error.message}`);
  }

  return data;
};

/**
 * Make sure an inventory row exists without changing
 * the current physical stock.
 *
 * Used for old products that may have been created
 * before inventory initialization was added.
 */
const ensureInventoryExists = async ({
  productId,
  vendorId,
  lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
}) => {
  const { data: existing, error: fetchError } = await supabase
    .from("vendor_inventory")
    .select(
      "product_id, vendor_id, on_hand_stock, reserved_stock, low_stock_threshold",
    )
    .eq("product_id", productId)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Unable to check product inventory: ${fetchError.message}`);
  }

  if (existing) {
    return existing;
  }

  return ensureInventoryForNewProduct({
    productId,
    vendorId,
    initialStock: 0,
    lowStockThreshold,
  });
};

export const vendorProductService = {
  /**
   * Get all products belonging to the authenticated vendor.
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
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to fetch vendor products: ${error.message}`);
    }

    return (data || []).map(mapRow);
  },

  /**
   * Get one vendor product.
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
   * Create a new product AND initialize its inventory.
   *
   * Initial inventory:
   * - on_hand_stock = payload.initialStock
   * - reserved_stock = 0
   * - low_stock_threshold = payload.lowStockThreshold
   */
  async createVendorProduct(payload = {}, files = []) {
    const vendorId = await resolveVendorId();

    const dbPayload = validateForSubmit({
      ...payload,
      status: PRODUCT_APPROVAL_STATUS.SUBMITTED,
    });

    await validateActiveCategory(dbPayload.category_slug);

    const { onHandStock, lowStockThreshold } =
      validateInitialInventory(payload);

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
       * Inventory is initialized immediately after
       * vendor_products is created.
       */
      await ensureInventoryForNewProduct({
        productId: created.id,
        vendorId,
        initialStock: onHandStock,
        lowStockThreshold,
      });

      /*
       * Upload files after product + inventory exist.
       */
      if (files.length) {
        uploaded.push(...(await uploadImages(created.id, files)));
      }

      const existingImageUrls = normaliseArray(
        payload.imageUrls ?? payload.image_urls,
      );

      const uploadedImageUrls = uploaded
        .map((item) => item?.url)
        .filter(Boolean);

      const imageUrls = [...existingImageUrls, ...uploadedImageUrls].filter(
        Boolean,
      );

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

      /*
       * Re-read with inventory so caller receives
       * the complete product object.
       */
      return await this.getVendorProductById(updated.id, vendorId);
    } catch (error) {
      await cleanupUploadedImages(uploaded);

      /*
       * Inventory automatically cascades when the
       * vendor_products row is deleted.
       */
      await supabase
        .from("vendor_products")
        .delete()
        .eq("id", created.id)
        .eq("vendor_id", vendorId);

      throw new Error(error.message || "Product creation failed.");
    }
  },

  /**
   * Update an existing product.
   *
   * IMPORTANT:
   * This does NOT overwrite on_hand_stock or
   * reserved_stock.
   *
   * Physical stock is managed through the Inventory
   * workflow.
   *
   * The low-stock threshold can be updated here.
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

    await validateActiveCategory(dbPayload.category_slug);

    let slug = existing.slug;

    if (cleanText(payload.name) && cleanText(payload.name) !== existing.name) {
      slug = await ensureUniqueSlug(payload.name, productId);
    }

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
        ...uploaded.map((item) => item?.url).filter(Boolean),
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
       * A product returned for changes goes back
       * into moderation after the vendor edits it.
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
       * Make sure older products also have an
       * inventory row.
       */
      await ensureInventoryExists({
        productId,
        vendorId,
        lowStockThreshold:
          payload.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
      });

      /*
       * Remove storage objects for images removed
       * from the product.
       */
      const oldImages = normaliseArray(existing.image_urls);

      const removedPaths = oldImages
        .filter((url) => !imageUrls.includes(url))
        .map(extractStoragePath)
        .filter(Boolean);

      if (removedPaths.length) {
        await supabase.storage.from("product-images").remove(removedPaths);
      }

      /*
       * Update low-stock threshold only.
       *
       * We intentionally do not change:
       * - on_hand_stock
       * - reserved_stock
       */
      if (
        payload.lowStockThreshold !== undefined &&
        payload.lowStockThreshold !== null &&
        payload.lowStockThreshold !== ""
      ) {
        const threshold = Number(payload.lowStockThreshold);

        if (!Number.isInteger(threshold) || threshold < 0) {
          throw new Error(
            "Low stock threshold must be a whole number greater than or equal to 0.",
          );
        }

        const { error: inventoryError } = await supabase
          .from("vendor_inventory")
          .update({
            low_stock_threshold: threshold,
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", productId)
          .eq("vendor_id", vendorId);

        if (inventoryError) {
          throw new Error(
            `Unable to update low stock threshold: ${inventoryError.message}`,
          );
        }
      }

      return await this.getVendorProductById(productId, vendorId);
    } catch (error) {
      await cleanupUploadedImages(uploaded);

      throw new Error(error.message || "Failed to update product.");
    }
  },

  /**
   * Save a product draft.
   *
   * A new draft also receives an inventory row.
   * Its initial stock is taken from the form.
   */
  async saveProductDraft(payload = {}, productId = null, files = []) {
    const vendorId = await resolveVendorId();

    const dbPayload = toDbPayload(payload);

    if (dbPayload.category_slug) {
      await validateActiveCategory(dbPayload.category_slug);
    }

    /*
     * Existing draft
     */
    if (productId) {
      const { data: existing, error: existingError } = await supabase
        .from("vendor_products")
        .select("*")
        .eq("id", productId)
        .eq("vendor_id", vendorId)
        .maybeSingle();

      if (existingError) {
        throw new Error(`Unable to load draft: ${existingError.message}`);
      }

      if (!existing) {
        throw new Error("Product draft not found.");
      }

      const uploaded = [];

      try {
        const existingImages = normaliseArray(
          payload.imageUrls ?? payload.image_urls ?? existing.image_urls,
        ).filter(Boolean);

        if (files.length) {
          uploaded.push(...(await uploadImages(productId, files)));
        }

        const imageUrls = [
          ...existingImages,
          ...uploaded.map((item) => item?.url).filter(Boolean),
        ].filter(Boolean);

        const { data, error } = await supabase
          .from("vendor_products")
          .update({
            ...dbPayload,
            image_urls: imageUrls,
            cover_image_url: imageUrls[0] || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId)
          .eq("vendor_id", vendorId)
          .select("*")
          .single();

        if (error) {
          throw new Error(`Unable to save draft: ${error.message}`);
        }

        await ensureInventoryExists({
          productId,
          vendorId,
          lowStockThreshold:
            payload.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
        });

        /*
         * Update only the threshold if provided.
         */
        if (
          payload.lowStockThreshold !== undefined &&
          payload.lowStockThreshold !== null &&
          payload.lowStockThreshold !== ""
        ) {
          const threshold = Number(payload.lowStockThreshold);

          if (!Number.isInteger(threshold) || threshold < 0) {
            throw new Error(
              "Low stock threshold must be a whole number greater than or equal to 0.",
            );
          }

          const { error: inventoryError } = await supabase
            .from("vendor_inventory")
            .update({
              low_stock_threshold: threshold,
              updated_at: new Date().toISOString(),
            })
            .eq("product_id", productId)
            .eq("vendor_id", vendorId);

          if (inventoryError) {
            throw new Error(
              `Unable to update low stock threshold: ${inventoryError.message}`,
            );
          }
        }

        return await this.getVendorProductById(data.id, vendorId);
      } catch (error) {
        await cleanupUploadedImages(uploaded);

        throw new Error(error.message || "Unable to save draft.");
      }
    }

    /*
     * New draft
     */
    if (!dbPayload.name) {
      throw new Error("Product name is required to save a draft.");
    }

    const { onHandStock, lowStockThreshold } =
      validateInitialInventory(payload);

    const slug = await ensureUniqueSlug(dbPayload.name);

    const { data: created, error } = await supabase
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

    const uploaded = [];

    try {
      await ensureInventoryForNewProduct({
        productId: created.id,
        vendorId,
        initialStock: onHandStock,
        lowStockThreshold,
      });

      if (files.length) {
        uploaded.push(...(await uploadImages(created.id, files)));
      }

      const imageUrls = [
        ...normaliseArray(payload.imageUrls ?? payload.image_urls),
        ...uploaded.map((item) => item?.url).filter(Boolean),
      ].filter(Boolean);

      await supabase
        .from("vendor_products")
        .update({
          image_urls: imageUrls,
          cover_image_url: imageUrls[0] || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", created.id)
        .eq("vendor_id", vendorId);

      return await this.getVendorProductById(created.id, vendorId);
    } catch (error) {
      await cleanupUploadedImages(uploaded);

      await supabase
        .from("vendor_products")
        .delete()
        .eq("id", created.id)
        .eq("vendor_id", vendorId);

      throw new Error(error.message || "Unable to create draft.");
    }
  },

  /**
   * Submit an existing product for moderation.
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

    await validateActiveCategory(product.category_slug);

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

    /*
     * Ensure inventory exists before submission.
     */
    await ensureInventoryExists({
      productId,
      vendorId,
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

    return await this.getVendorProductById(data.id, vendorId);
  },

  /**
   * Delete a product.
   *
   * vendor_inventory and vendor_inventory_audit_log
   * use ON DELETE CASCADE in your DB, so no manual
   * inventory deletion is required.
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
   * Admin product review methods.
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
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to fetch products for review: ${error.message}`);
    }

    return data || [];
  },

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
