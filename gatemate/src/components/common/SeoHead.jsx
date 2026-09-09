import React, { useEffect } from "react";
import { SITE_CONFIG } from "../../services/seoService";

export const SeoHead = ({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = "website",
  structuredData = null,
  noIndex = false,
}) => {
  const fullTitle = title
    ? title.includes(SITE_CONFIG.siteName)
      ? title
      : `${title} | ${SITE_CONFIG.siteName}`
    : SITE_CONFIG.defaultTitle;

  const metaDesc = description || SITE_CONFIG.defaultDescription;
  const canonical = canonicalUrl
    ? `${SITE_CONFIG.siteUrl}${canonicalUrl}`
    : SITE_CONFIG.siteUrl;
  const image = ogImage || SITE_CONFIG.defaultImage;

  useEffect(() => {
    // 1. Update Document Title
    document.title = fullTitle;

    // Helper for update/create meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Helper for update/create link tag
    const setLinkTag = (rel, href) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // 2. Standard Meta Tags
    setMetaTag("name", "description", metaDesc);
    setMetaTag(
      "name",
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow",
    );
    setLinkTag("canonical", canonical);

    // 3. Open Graph Tags
    setMetaTag("property", "og:site_name", SITE_CONFIG.siteName);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", metaDesc);
    setMetaTag("property", "og:url", canonical);
    setMetaTag("property", "og:image", image);

    // 4. Twitter Card Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", metaDesc);
    setMetaTag("name", "twitter:image", image);

    // 5. JSON-LD Structured Data Script
    const existingScripts = document.querySelectorAll(
      'script[data-schema="gatemate-jsonld"]',
    );
    existingScripts.forEach((s) => s.remove());

    if (structuredData) {
      const schemas = Array.isArray(structuredData)
        ? structuredData
        : [structuredData];
      schemas.filter(Boolean).forEach((schemaPayload) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-schema", "gatemate-jsonld");
        script.textContent = JSON.stringify(schemaPayload);
        document.head.appendChild(script);
      });
    }

    return () => {
      const cleanScripts = document.querySelectorAll(
        'script[data-schema="gatemate-jsonld"]',
      );
      cleanScripts.forEach((s) => s.remove());
    };
  }, [fullTitle, metaDesc, canonical, image, ogType, structuredData, noIndex]);

  return null;
};
