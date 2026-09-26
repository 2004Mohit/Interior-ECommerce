/**
 * Ferrado SEO & Schema.org Structured Data Service
 *
 * Construction Products Marketplace Focus:
 * - Dynamic Construction Product Titles & Descriptions
 * - Canonical URLs & OpenGraph Metadata
 * - Schema.org 'Product' Structured Data
 * - Schema.org 'BreadcrumbList' Structured Data
 * - Schema.org 'CollectionPage' Structured Data
 */

export const SITE_CONFIG = {
  siteName: "Ferrado",
  siteUrl: "https://ferrado.in",
  defaultTitle:
    "Ferrado | Hyperlocal Construction Products & Supplies Marketplace in Pune & PCMC",
  defaultDescription:
    "Buy certified cement, TMT steel, AAC blocks, sand, aggregates, plumbing, electrical, and building hardware with 30-minute delivery on eligible Products/orders across Pune & PCMC.",
  defaultImage: "https://ferrado.in/og-construction-marketplace.jpg",
  twitterHandle: "@ferrado_in",
  region: "IN-MH",
  city: "Pune",
};

export const seoService = {
  /**
   * Generates Schema.org Product structured data payload
   */
  generateProductSchema(product) {
    if (!product) return null;

    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      image:
        Array.isArray(product.gallery) && product.gallery.length > 0
          ? product.gallery
          : [product.img],
      description: product.description,
      sku: product.sku || `GM-PROD-${product.id}`,
      brand: {
        "@type": "Brand",
        name: product.brand || "Ferrado Certified Brand",
      },
      category: product.category,
      offers: {
        "@type": "Offer",
        url: `${SITE_CONFIG.siteUrl}/products/${product.slug}`,
        priceCurrency: "INR",
        price: product.price,
        priceValidUntil: "2027-12-31",
        itemCondition: "https://schema.org/NewCondition",
        availability:
          product.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        seller: {
          "@type": "Organization",
          name: product.seller?.name || "Ferrado Construction Depot Hub",
        },
      },
      aggregateRating:
        product.reviews > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: product.rating,
              reviewCount: product.reviews,
              bestRating: "5",
              worstRating: "1",
            }
          : undefined,
    };
  },

  /**
   * Generates Schema.org BreadcrumbList structured data payload
   */
  generateBreadcrumbSchema(breadcrumbs = []) {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url ? `${SITE_CONFIG.siteUrl}${item.url}` : undefined,
      })),
    };
  },

  /**
   * Generates Schema.org CollectionPage / ItemList structured data payload
   */
  generateCollectionSchema({
    categoryName,
    categoryDescription,
    products = [],
  }) {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${categoryName} Products | Ferrado Construction Marketplace`,
      description:
        categoryDescription ||
        `Explore certified ${categoryName} construction supplies with 30-minute delivery on eligible Products/orders across Pune & PCMC.`,
      url: `${SITE_CONFIG.siteUrl}/products?category=${categoryName.toLowerCase().replace(/\s+/g, "-")}`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: products.map((p, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${SITE_CONFIG.siteUrl}/products/${p.slug}`,
          name: p.name,
        })),
      },
    };
  },
};
