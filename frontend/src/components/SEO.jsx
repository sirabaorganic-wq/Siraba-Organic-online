import { useEffect } from "react";

const BASE_URL = "https://www.sirabaorganic.com";

/**
 * React helper to render JSON-LD directly into JSX if preferred
 */
export function JsonLd({ data }) {
  if (!data) return null;
  const safeJson = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}

/**
 * 1. Homepage Graph: Organization + OnlineStore + Store + WebSite
 * Enforces stable @id links across entities per client schema specification.
 */
export const getHomepageSchema = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "SIRABA ORGANIC",
      legalName: "Siraba Organic",
      url: `${BASE_URL}/`,
      telephone: "+91-8586836660",
      email: "info@sirabaorganic.com",
      taxID: "06ACMPT6127H1ZA",
      identifier: [
        {
          "@type": "PropertyValue",
          propertyID: "UDYAM",
          value: "UDYAM-HR-05-0179395",
        },
        {
          "@type": "PropertyValue",
          propertyID: "IEC",
          value: "ACMPT6127H",
        },
        {
          "@type": "PropertyValue",
          propertyID: "APEDA RCMC",
          value: "RCMC/APEDA/32995/2026-2027",
        },
      ],
      address: {
        "@type": "PostalAddress",
        streetAddress: "1C, Shani Enclave, Nayagaon Bhondsi",
        addressLocality: "Gurugram",
        addressRegion: "Haryana",
        postalCode: "122102",
        addressCountry: "IN",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: "+91-8586836660",
        email: "info@sirabaorganic.com",
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "https://schema.org/Monday",
            "https://schema.org/Tuesday",
            "https://schema.org/Wednesday",
            "https://schema.org/Thursday",
            "https://schema.org/Friday",
          ],
          opens: "10:00",
          closes: "18:00",
        },
      },
    },
    {
      "@type": "OnlineStore",
      "@id": `${BASE_URL}/#online-store`,
      name: "SIRABA ORGANIC Online Store",
      url: `${BASE_URL}/shop`,
      parentOrganization: {
        "@id": `${BASE_URL}/#organization`,
      },
    },
    {
      "@type": "Store",
      "@id": `${BASE_URL}/#local-store`,
      name: "SIRABA ORGANIC",
      url: `${BASE_URL}/`,
      telephone: "+91-8586836660",
      currenciesAccepted: "INR",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Shani Enclave, 1C, Nayagaon, Maruti Kunj",
        addressLocality: "Gurugram",
        addressRegion: "Haryana",
        postalCode: "122102",
        addressCountry: "IN",
      },
      parentOrganization: {
        "@id": `${BASE_URL}/#organization`,
      },
      sameAs: ["https://share.google/ra03D05f2AHcYmvqx"],
      hasMap: "https://share.google/ra03D05f2AHcYmvqx",
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: `${BASE_URL}/`,
      name: "SIRABA ORGANIC",
      publisher: {
        "@id": `${BASE_URL}/#organization`,
      },
    },
  ],
});

/**
 * 2. Contact Page: ContactPage + Store + BreadcrumbList
 */
export const getContactPageSchema = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${BASE_URL}/contact#webpage`,
      url: `${BASE_URL}/contact`,
      name: "Contact Siraba Organic",
      isPartOf: {
        "@id": `${BASE_URL}/#website`,
      },
      about: {
        "@id": `${BASE_URL}/#organization`,
      },
      mainEntity: {
        "@id": `${BASE_URL}/#local-store`,
      },
    },
    {
      "@type": "Store",
      "@id": `${BASE_URL}/#local-store`,
      name: "SIRABA ORGANIC",
      url: `${BASE_URL}/`,
      telephone: "+91-8586836660",
      currenciesAccepted: "INR",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Shani Enclave, 1C, Nayagaon, Maruti Kunj",
        addressLocality: "Gurugram",
        addressRegion: "Haryana",
        postalCode: "122102",
        addressCountry: "IN",
      },
      parentOrganization: {
        "@id": `${BASE_URL}/#organization`,
      },
      sameAs: ["https://share.google/ra03D05f2AHcYmvqx"],
      hasMap: "https://share.google/ra03D05f2AHcYmvqx",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/contact#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${BASE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Contact",
          item: `${BASE_URL}/contact`,
        },
      ],
    },
  ],
});

/**
 * 3. Shop Page: CollectionPage + ItemList + BreadcrumbList
 * Strictly avoids placing single Product/Offer markup on listing pages.
 */
export const getShopPageSchema = (products = []) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${BASE_URL}/shop#webpage`,
      url: `${BASE_URL}/shop`,
      name: "Shop Organic Products | SIRABA ORGANIC",
      isPartOf: {
        "@id": `${BASE_URL}/#website`,
      },
      mainEntity: {
        "@id": `${BASE_URL}/shop#product-list`,
      },
    },
    {
      "@type": "ItemList",
      "@id": `${BASE_URL}/shop#product-list`,
      name: "SIRABA ORGANIC Product Collection",
      numberOfItems: products.length,
      itemListElement: products.map((prod, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: prod.name,
        url: `${BASE_URL}/product/${prod.slug}`,
      })),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/shop#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${BASE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Shop",
          item: `${BASE_URL}/shop`,
        },
      ],
    },
  ],
});

/**
 * 4. Product Page: Product + Offer + BreadcrumbList
 * Strictly adheres to client's Section 7 specification:
 * - NO MerchantReturnPolicy
 * - NO OfferShippingDetails
 * - NO aggregateRating / review
 * - SKU only if real value exists in database
 * - Dynamic inStock
 * - Brand & Seller mapped accurately
 */
export const buildProductSchema = (product) => {
  if (!product) return null;

  const pageUrl = product.url || `${BASE_URL}/product/${product.slug}`;
  const imageList = [product.image, ...(product.images || [])]
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter(Boolean)
    .map((img) => (img.startsWith("http") ? img : `${BASE_URL}${img}`));

  // Resolve Brand & Seller based on client cross-check table (Section 7.1)
  const slug = product.slug || "";
  let brandName = product.brand;
  let sellerName = product.seller;

  if (!brandName || !sellerName) {
    if (slug.includes("cumin") || slug.includes("moringa") || slug.includes("isabgol")) {
      brandName = brandName || "Rapid Organic";
      sellerName = sellerName || "Rapid Organic";
    } else if (
      slug.includes("honey") ||
      slug.includes("saffron") ||
      slug.includes("health-full-on") ||
      slug.includes("ashwagandha") ||
      slug.includes("liv-fit")
    ) {
      brandName = brandName || "Organic Wellness";
      sellerName = sellerName || "Organic Wellness Products Pvt Ltd";
    } else {
      const vendorName =
        typeof product.vendor === "object" && product.vendor?.businessName
          ? product.vendor.businessName
          : "Siraba Organic";
      brandName = brandName || vendorName;
      sellerName = sellerName || vendorName;
    }
  }

  // Dynamic stock check
  const inStock =
    typeof product.inStock !== "undefined"
      ? Boolean(product.inStock)
      : (product.stockQuantity > 0 || (product.countInStock || 0) > 0);

  const productNode = {
    "@type": "Product",
    "@id": `${pageUrl}#product`,
    name: product.name,
    url: pageUrl,
    image: imageList,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      price: Number(product.price),
      priceCurrency: "INR",
      itemCondition: "https://schema.org/NewCondition",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: sellerName,
      },
    },
  };

  // Only add SKU if a real value exists in database (do not fallback to slug)
  if (product.sku && product.sku !== product.slug) {
    productNode.sku = product.sku;
  }

  const breadcrumbNode = {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${BASE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${BASE_URL}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: pageUrl,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [productNode, breadcrumbNode],
  };
};

/**
 * 5. Vendor Program Page: WebPage + Service + BreadcrumbList
 */
export const getVendorPageSchema = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${BASE_URL}/vendor#webpage`,
      url: `${BASE_URL}/vendor`,
      name: "Sell on SIRABA ORGANIC | Vendor Program",
      isPartOf: {
        "@id": `${BASE_URL}/#website`,
      },
      about: {
        "@id": `${BASE_URL}/vendor#vendor-program`,
      },
    },
    {
      "@type": "Service",
      "@id": `${BASE_URL}/vendor#vendor-program`,
      name: "SIRABA ORGANIC Vendor Program",
      serviceType: "Organic marketplace vendor onboarding and selling program",
      provider: {
        "@id": `${BASE_URL}/#organization`,
      },
      audience: {
        "@type": "BusinessAudience",
        audienceType:
          "Certified organic brands, manufacturers, suppliers and eligible producers",
      },
      description:
        "Vendor program for eligible organic businesses to apply, submit certification documents, complete product verification, list products and sell through SIRABA ORGANIC.",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/vendor#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${BASE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Sell on Siraba",
          item: `${BASE_URL}/vendor`,
        },
      ],
    },
  ],
});

/**
 * 6. Vendor Badges Page: WebPage + BreadcrumbList
 */
export const getVendorBadgesPageSchema = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${BASE_URL}/vendor/badges#webpage`,
      url: `${BASE_URL}/vendor/badges`,
      name: "Vendor Badges | SIRABA ORGANIC",
      isPartOf: {
        "@id": `${BASE_URL}/#website`,
      },
      about: [
        {
          "@id": `${BASE_URL}/#organization`,
        },
        {
          "@id": `${BASE_URL}/vendor#vendor-program`,
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/vendor/badges#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${BASE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Sell on Siraba",
          item: `${BASE_URL}/vendor`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Vendor Badges",
          item: `${BASE_URL}/vendor/badges`,
        },
      ],
    },
  ],
});

/**
 * 7. FAQ Page Schema (Section 9)
 * Used on /vendor-faq (25 visible Q&As) and /faq (customer FAQs).
 */
export const buildFaqSchema = (url, faqItems = []) => {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${fullUrl}#faq`,
    url: fullUrl,
    mainEntity: faqItems
      .filter((item) => item && (item.question || item.q) && (item.answer || item.a))
      .map((item) => ({
        "@type": "Question",
        name: item.question || item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer || item.a,
        },
      })),
  };
};

/**
 * 8. BreadcrumbList 21-URL Route Map (Section 10)
 */
export const BREADCRUMB_MAP = {
  "/shop": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Shop", url: `${BASE_URL}/shop` },
  ],
  "/our-story": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Our Story", url: `${BASE_URL}/our-story` },
  ],
  "/why-siraba": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Why Siraba", url: `${BASE_URL}/why-siraba` },
  ],
  "/certifications": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Certifications", url: `${BASE_URL}/certifications` },
  ],
  "/blog": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Blog", url: `${BASE_URL}/blog` },
  ],
  "/contact": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Contact", url: `${BASE_URL}/contact` },
  ],
  "/vendor-qualification": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Vendor Qualification", url: `${BASE_URL}/vendor-qualification` },
  ],
  "/vendor": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Sell on Siraba", url: `${BASE_URL}/vendor` },
  ],
  "/vendor-benefits": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Sell on Siraba", url: `${BASE_URL}/vendor` },
    { name: "Vendor Benefits", url: `${BASE_URL}/vendor-benefits` },
  ],
  "/vendor/badges": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Sell on Siraba", url: `${BASE_URL}/vendor` },
    { name: "Vendor Badges", url: `${BASE_URL}/vendor/badges` },
  ],
  "/vendor-onboarding-checklist": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Sell on Siraba", url: `${BASE_URL}/vendor` },
    {
      name: "Vendor Onboarding Checklist",
      url: `${BASE_URL}/vendor-onboarding-checklist`,
    },
  ],
  "/vendor-verification-policies": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Sell on Siraba", url: `${BASE_URL}/vendor` },
    {
      name: "Vendor Verification Policy",
      url: `${BASE_URL}/vendor-verification-policies`,
    },
  ],
  "/vendor-terms-and-conditions": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Sell on Siraba", url: `${BASE_URL}/vendor` },
    {
      name: "Vendor Terms & Conditions",
      url: `${BASE_URL}/vendor-terms-and-conditions`,
    },
  ],
  "/vendor-faq": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Sell on Siraba", url: `${BASE_URL}/vendor` },
    { name: "Vendor FAQ", url: `${BASE_URL}/vendor-faq` },
  ],
  "/shipping-policy": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Shipping Policy", url: `${BASE_URL}/shipping-policy` },
  ],
  "/refund-policy": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Refund & Cancellation", url: `${BASE_URL}/refund-policy` },
  ],
  "/faq": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Customer FAQs", url: `${BASE_URL}/faq` },
  ],
  "/about": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "About Siraba", url: `${BASE_URL}/about` },
  ],
  "/organic-certification-guide": [
    { name: "Home", url: `${BASE_URL}/` },
    {
      name: "Organic Certification Guide",
      url: `${BASE_URL}/organic-certification-guide`,
    },
  ],
  "/privacy-policy": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Privacy Policy", url: `${BASE_URL}/privacy-policy` },
  ],
  "/terms": [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Terms & Conditions", url: `${BASE_URL}/terms` },
  ],
};

export const buildBreadcrumbSchema = (pathname) => {
  const items = BREADCRUMB_MAP[pathname];
  if (!items || items.length < 2) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${BASE_URL}${pathname}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * Backward-compatible aliases
 */
export const getOrganizationSchema = getHomepageSchema;
export const getCollectionPageSchema = getShopPageSchema;
export const getProductSchema = buildProductSchema;
export const getFAQSchema = (faqs) => buildFaqSchema(`${BASE_URL}/faq`, faqs);
export const getBreadcrumbSchema = (items = []) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: item.name,
    item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
  })),
});

export const getBlogPostingSchema = (blog) => {
  if (!blog) return null;
  const blogUrl = `${BASE_URL}/blog/${blog.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${blogUrl}#article`,
    headline: blog.title,
    description: blog.excerpt || blog.title,
    image: blog.image
      ? [blog.image.startsWith("http") ? blog.image : `${BASE_URL}${blog.image}`]
      : undefined,
    datePublished: blog.createdAt
      ? new Date(blog.createdAt).toISOString()
      : undefined,
    dateModified: blog.updatedAt
      ? new Date(blog.updatedAt).toISOString()
      : undefined,
    author: {
      "@type": "Person",
      name: blog.author?.name || "Siraba Organic Editorial Team",
      jobTitle: blog.author?.title || "Ayurvedic & Organic Specialist",
    },
    publisher: {
      "@type": "Organization",
      name: "Siraba Organic",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/vite.svg`,
      },
    },
    mainEntityOfPage: blogUrl,
  };
};

/**
 * Dynamic SEO Component
 * Automatically manages title, meta description, robots, canonical tags, and JSON-LD scripts.
 */
const SEO = ({
  title,
  description,
  canonicalUrl,
  noindex = false,
  ogType = "website",
  ogImage,
  schema,
}) => {
  useEffect(() => {
    // 1. Update Title
    const finalTitle = title
      ? (title.includes("Siraba") || title.includes("SIRABA") ? title : `${title} | Siraba Organic`)
      : "SIRABA ORGANIC™ | India's Triple-Verified Organic Marketplace™";
    document.title = finalTitle;

    // 2. Update Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    // 3. Update Robots
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!metaRobots) {
        metaRobots = document.createElement("meta");
        metaRobots.name = "robots";
        document.head.appendChild(metaRobots);
      }
      metaRobots.content = "noindex, follow";
    } else if (metaRobots) {
      metaRobots.content = "index, follow";
    }

    // 4. Update Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalUrl) {
      const finalCanonical = canonicalUrl.startsWith("http")
        ? canonicalUrl
        : `${BASE_URL}${canonicalUrl}`;
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.rel = "canonical";
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = finalCanonical;
    } else if (canonicalLink) {
      canonicalLink.remove();
    }

    // 5. OpenGraph & Twitter Tags
    const setMetaTag = (property, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMetaTag("og:title", finalTitle);
    if (description) setMetaTag("og:description", description);
    setMetaTag("og:type", ogType);
    if (canonicalUrl) {
      setMetaTag(
        "og:url",
        canonicalUrl.startsWith("http") ? canonicalUrl : `${BASE_URL}${canonicalUrl}`
      );
    }
    if (ogImage) {
      setMetaTag(
        "og:image",
        ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`
      );
    }

    // 6. JSON-LD Structured Data Lifecycle Management
    const existingScripts = document.querySelectorAll('script[data-siraba-seo="true"]');
    if (schema) {
      let scriptTag = existingScripts[0];
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.type = "application/ld+json";
        scriptTag.setAttribute("data-siraba-seo", "true");
        document.head.appendChild(scriptTag);
      }
      const schemaData = Array.isArray(schema) ? schema.filter(Boolean) : schema;
      scriptTag.textContent = JSON.stringify(schemaData);
      // Clean up any extra duplicate scripts that may have accumulated
      for (let i = 1; i < existingScripts.length; i++) {
        existingScripts[i].remove();
      }
    } else {
      existingScripts.forEach((s) => s.remove());
    }

    return () => {
      // Clean up on unmount so no stale schema remains on routes without SEO schemas
      const scriptsToClean = document.querySelectorAll('script[data-siraba-seo="true"]');
      scriptsToClean.forEach((s) => s.remove());
    };
  }, [title, description, canonicalUrl, noindex, ogType, ogImage, schema]);

  return null;
};

export default SEO;
