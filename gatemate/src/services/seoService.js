/**
 * GateMate SEO & Schema.org Structured Data Service
 *
 * Supports:
 * - Unique Dynamic Page Titles & Descriptions
 * - Canonical URLs & OpenGraph Metadata
 * - Schema.org 'Product' Structured Data
 * - Schema.org 'BreadcrumbList' Structured Data
 * - Schema.org 'CollectionPage' Structured Data
 */

export const SITE_CONFIG = {
  siteName: "GateMate",
  siteUrl: "https://gatemate.in",
  defaultTitle:
    "GateMate | Pune & PCMC Architectural Gates, Hardware & Artisan Crafts",
  defaultDescription:
    "Authentic handcrafted home decor, blue pottery, and heavy-duty gate automation delivered in 30 minutes across Pune & Pimpri-Chinchwad.",
  defaultImage: "https://gatemate.in/og-gatemate.jpg",
  twitterHandle: "@gatemate_in",
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
      sku: product.sku || `GM-SKU-${product.id}`,
      brand: {
        "@type": "Brand",
        name: product.brand || "GateMate Heritage",
      },
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
          name: product.seller?.name || "GateMate Verified Vendor Hub",
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
      name: `${categoryName} | GateMate Pune & PCMC`,
      description:
        categoryDescription ||
        `Explore ${categoryName} on GateMate with 30-minute delivery in Pune & PCMC.`,
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
