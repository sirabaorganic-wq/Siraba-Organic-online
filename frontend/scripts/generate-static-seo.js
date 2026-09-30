/**
 * Script: generate-static-seo.js
 * 
 * Production SEO, Schema, and Dynamic Sitemap Generator
 * 
 * MANDATORY POLICIES ENFORCED:
 * 1. PRODUCTION SEO DATA FAILURE POLICY:
 *    - In production, consumes GET /api/products from authoritative production API.
 *    - Validates response strictly (HTTP 200, application/json, valid array, valid fields).
 *    - IF the production API is unavailable, malformed, unauthorized, or returns invalid product data:
 *      FAILS the SEO generation step with a clear fatal error (process.exit(1)).
 *    - NO silent fallback to mock/local data during production builds.
 *    - Local development may use localhost only when explicitly running a local dev build (--local).
 * 
 * 2. SITEMAP FRESHNESS:
 *    - The static sitemap reflects product database changes upon each build.
 *    - Documented: Real-time sitemap updates for changes without code commits require a Vercel rebuild webhook.
 * 
 * 3. PRODUCT FILTERING:
 *    - Matches the public/indexable inventory from GET /api/products (which enforces isPublic: true).
 *    - Ensures all visible shop products are in the sitemap without arbitrary filtering.
 * 
 * 4. STRUCTURED DATA:
 *    - Emits strictly Product + Offer + BreadcrumbList.
 *    - NO MerchantReturnPolicy, NO OfferShippingDetails, NO reviews per client specification.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const distDir = path.resolve(frontendDir, 'dist');
const publicDir = path.resolve(frontendDir, 'public');

const BASE_URL = 'https://www.sirabaorganic.com';

// Detect build mode
const args = process.argv.slice(2);
const isLocalExplicit = args.includes('--local') || process.env.BUILD_TARGET === 'local';
const isProduction = !isLocalExplicit && (
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL === '1' ||
  process.env.CI === 'true' ||
  args.includes('--prod') ||
  true // Default to production safety
);

const API_URL = isLocalExplicit
  ? (process.env.LOCAL_API_URL || 'http://localhost:5000/api')
  : (process.env.SEO_DATA_API_URL || process.env.VITE_API_BASE_URL || 'https://siraba-organic-online.onrender.com/api');

console.log('------------------------------------------------------------');
console.log('🚀 Siraba Organic - Static SEO & Sitemap Generator');
console.log(`Mode:       ${isLocalExplicit ? 'LOCAL DEV' : 'PRODUCTION'}`);
console.log(`Target API: ${API_URL}`);
console.log('------------------------------------------------------------');

// Helper to escape XML special chars
function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to sanitize HTML attributes
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchProducts() {
  const endpoint = `${API_URL}/products`;
  console.log(`[SEO Build] Fetching public product inventory from: ${endpoint}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Siraba-SEO-Build-Bot/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Invalid Content-Type: expected application/json, received "${contentType}"`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(`Invalid response structure: expected Array, received ${typeof data}`);
    }

    if (data.length === 0) {
      throw new Error('Received empty product array (0 products returned from API)');
    }

    // Validate each product
    for (const p of data) {
      if (!p.slug || typeof p.slug !== 'string') {
        throw new Error(`Product missing required string 'slug': ${JSON.stringify(p)}`);
      }
      if (!p.name || typeof p.name !== 'string') {
        throw new Error(`Product '${p.slug}' missing required string 'name'`);
      }
      if (typeof p.price === 'undefined' || isNaN(Number(p.price))) {
        throw new Error(`Product '${p.slug}' has invalid 'price': ${p.price}`);
      }
    }

    console.log(`[SEO Build] ✅ Successfully retrieved and validated ${data.length} products from API.`);
    return data;
  } catch (error) {
    console.error('\n❌ [FATAL SEO DATA ERROR]');
    console.error(`Endpoint: ${endpoint}`);
    console.error(`Failure:  ${error.message}`);

    if (isProduction) {
      console.error('\n⛔ PRODUCTION SEO DATA FAILURE POLICY VIOLATION:');
      console.error('Silent fallback to mock/local/cached data is FORBIDDEN during production builds.');
      console.error('Failing the build immediately to prevent corrupted/stale SEO indexing.\n');
      process.exit(1);
    } else {
      console.error('\n⚠️ Local development build failed to connect to local API.');
      console.error('Ensure your local backend is running on http://localhost:5000\n');
      process.exit(1);
    }
  }
}

function buildProductSchema(product) {
  const pageUrl = `${BASE_URL}/product/${product.slug}`;
  const imageList = [product.image, ...(product.images || [])]
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean)
    .map((img) => (img.startsWith('http') ? img : `${BASE_URL}${img}`));

  // Resolve Brand & Seller based on client cross-check table (Section 7.1)
  const slug = product.slug || '';
  let brandName = product.brand;
  let sellerName = product.seller;

  if (!brandName || !sellerName) {
    if (slug.includes('cumin') || slug.includes('moringa') || slug.includes('isabgol')) {
      brandName = brandName || 'Rapid Organic';
      sellerName = sellerName || 'Rapid Organic';
    } else if (
      slug.includes('honey') ||
      slug.includes('saffron') ||
      slug.includes('health-full-on') ||
      slug.includes('ashwagandha') ||
      slug.includes('liv-fit')
    ) {
      brandName = brandName || 'Organic Wellness';
      sellerName = sellerName || 'Organic Wellness Products Pvt Ltd';
    } else {
      const vendorName =
        typeof product.vendor === 'object' && product.vendor?.businessName
          ? product.vendor.businessName
          : 'Siraba Organic';
      brandName = brandName || vendorName;
      sellerName = sellerName || vendorName;
    }
  }

  const inStock =
    product.stockQuantity > 0 ||
    product.countInStock > 0 ||
    Boolean(product.inStock);

  const productNode = {
    '@type': 'Product',
    '@id': `${pageUrl}#product`,
    name: product.name,
    url: pageUrl,
    image: imageList,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    offers: {
      '@type': 'Offer',
      url: pageUrl,
      price: Number(product.price),
      priceCurrency: 'INR',
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: sellerName,
      },
    },
  };

  if (product.sku && product.sku !== product.slug) {
    productNode.sku = product.sku;
  }

  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${BASE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: `${BASE_URL}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: pageUrl,
      },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [productNode, breadcrumbNode],
  };
}

function updateSitemap(products) {
  console.log('\n[Sitemap Generation] Generating dynamic sitemap.xml...');

  const today = new Date().toISOString().split('T')[0];

  // Base 25 canonical static pages
  const staticRoutes = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/shop', priority: '0.9', changefreq: 'daily' },
    { loc: '/certifications', priority: '0.9', changefreq: 'monthly' },
    { loc: '/organic-certification-guide', priority: '0.8', changefreq: 'monthly' },
    { loc: '/quality-promise', priority: '0.8', changefreq: 'monthly' },
    { loc: '/about', priority: '0.7', changefreq: 'monthly' },
    { loc: '/why-siraba', priority: '0.7', changefreq: 'monthly' },
    { loc: '/b2b', priority: '0.8', changefreq: 'weekly' },
    { loc: '/blog', priority: '0.8', changefreq: 'weekly' },
    { loc: '/faq', priority: '0.7', changefreq: 'monthly' },
    { loc: '/founder-faqs', priority: '0.7', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
    { loc: '/shipping-policy', priority: '0.5', changefreq: 'monthly' },
    { loc: '/refund-policy', priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
    { loc: '/terms', priority: '0.5', changefreq: 'monthly' },
    { loc: '/vendor', priority: '0.7', changefreq: 'monthly' },
    { loc: '/vendor-qualification', priority: '0.6', changefreq: 'monthly' },
    { loc: '/vendor-benefits', priority: '0.6', changefreq: 'monthly' },
    { loc: '/vendor/badges', priority: '0.6', changefreq: 'monthly' },
    { loc: '/vendor-onboarding-guide', priority: '0.6', changefreq: 'monthly' },
    { loc: '/vendor-onboarding-checklist', priority: '0.6', changefreq: 'monthly' },
    { loc: '/vendor-verification-policies', priority: '0.6', changefreq: 'monthly' },
    { loc: '/vendor-terms-and-conditions', priority: '0.6', changefreq: 'monthly' },
    { loc: '/vendor-faq', priority: '0.6', changefreq: 'monthly' },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const r of staticRoutes) {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${escapeXml(r.loc)}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${r.changefreq}</changefreq>\n`;
    xml += `    <priority>${r.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  // Dynamic public product routes
  for (const p of products) {
    const pDate = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : today;
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/product/${escapeXml(p.slug)}</loc>\n`;
    xml += `    <lastmod>${pDate}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  // Write to dist/sitemap.xml if dist exists
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
    console.log(`[Sitemap Generation] ✅ Written ${distDir}/sitemap.xml (${staticRoutes.length + products.length} URLs)`);
  }

  // Write to public/sitemap.xml
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  console.log(`[Sitemap Generation] ✅ Written ${publicDir}/sitemap.xml`);
}

function cleanTemplateHead(rawHtml) {
  let html = rawHtml;
  html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/gi, '');
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, '');
  return html;
}

const staticPagesSeo = [
  {
    path: '/',
    title: "SIRABA ORGANIC™ | India's Triple-Verified Organic Marketplace™",
    description: "SIRABA ORGANIC™ is India's Triple-Verified Organic Marketplace™ built around international organic certifications, scientific laboratory evidence, batch traceability, and curated vendor qualification.",
    heading: "India's Triple-Verified Organic Marketplace™",
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${BASE_URL}/#organization`,
          name: 'Siraba Organic',
          url: BASE_URL,
          logo: `${BASE_URL}/images/siraba-share.png`,
          sameAs: [
            'https://www.instagram.com/sirabaorganic',
            'https://www.facebook.com/sirabaorganic',
          ],
        },
        {
          '@type': 'WebSite',
          '@id': `${BASE_URL}/#website`,
          name: 'Siraba Organic',
          url: BASE_URL,
          publisher: { '@id': `${BASE_URL}/#organization` },
          potentialAction: {
            '@type': 'SearchAction',
            target: `${BASE_URL}/shop?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'OnlineStore',
          '@id': `${BASE_URL}/#store`,
          name: 'Siraba Organic Store',
          url: `${BASE_URL}/shop`,
          parentOrganization: { '@id': `${BASE_URL}/#organization` },
        },
      ],
    },
  },
  {
    path: '/shop',
    title: 'Certified Organic Grocery & Spices | Siraba Organic Shop',
    description: 'Explore 100% certified organic spices, Kashmiri saffron, pure desi ghee, hing, and natural groceries. Triple-verified authenticity with lab test reports.',
    heading: 'Shop Certified Organic Groceries & Spices',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${BASE_URL}/shop#collection`,
          name: 'Certified Organic Grocery & Spices',
          url: `${BASE_URL}/shop`,
          isPartOf: { '@id': `${BASE_URL}/#website` },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/shop#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Shop', item: `${BASE_URL}/shop` },
          ],
        },
      ],
    },
  },
  {
    path: '/about',
    title: 'About Us & Our Story | Siraba Organic',
    description: "Learn about Siraba Organic's mission to build India's Triple-Verified Organic Marketplace based on international certification standards and radical transparency.",
    heading: 'Our Story & Purpose',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'AboutPage',
          '@id': `${BASE_URL}/about#about`,
          name: 'About Siraba Organic',
          url: `${BASE_URL}/about`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/about#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'About Us', item: `${BASE_URL}/about` },
          ],
        },
      ],
    },
  },
  {
    path: '/contact',
    title: 'Contact Us | Siraba Organic Support & Inquiries',
    description: 'Get in touch with Siraba Organic for inquiries, support, vendor partnerships, or bulk organic supply.',
    heading: 'Contact Siraba Organic',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ContactPage',
          '@id': `${BASE_URL}/contact#contact`,
          name: 'Contact Siraba Organic',
          url: `${BASE_URL}/contact`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/contact#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Contact', item: `${BASE_URL}/contact` },
          ],
        },
      ],
    },
  },
  {
    path: '/faq',
    title: 'Frequently Asked Questions | Siraba Organic',
    description: "Find answers about Siraba Organic's triple-verification, certifications, batch testing, ordering, and delivery.",
    heading: 'Frequently Asked Questions',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'FAQPage',
          '@id': `${BASE_URL}/faq#faq`,
          name: 'Siraba Organic FAQs',
          url: `${BASE_URL}/faq`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/faq#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${BASE_URL}/faq` },
          ],
        },
      ],
    },
  },
  {
    path: '/why-siraba',
    title: "Why Siraba Organic? | India's Triple-Verified Standard",
    description: 'Discover why Siraba Organic sets the benchmark for certified organic authenticity with lab-tested purity, QR traceability, and curated vendor governance.',
    heading: 'Why Siraba Organic?',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/why-siraba#webpage`,
          name: 'Why Siraba Organic',
          url: `${BASE_URL}/why-siraba`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/why-siraba#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Why Siraba', item: `${BASE_URL}/why-siraba` },
          ],
        },
      ],
    },
  },
  {
    path: '/certifications',
    title: 'Organic Certifications & Standards | Siraba Organic',
    description: 'Learn how Siraba Organic verifies organic integrity through NPOP, USDA Organic, EU Organic, Jaivik Bharat, and NABL-accredited laboratory testing.',
    heading: 'Organic Certifications & Verification Standards',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/certifications#webpage`,
          name: 'Organic Certifications',
          url: `${BASE_URL}/certifications`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/certifications#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Certifications', item: `${BASE_URL}/certifications` },
          ],
        },
      ],
    },
  },
  {
    path: '/blog',
    title: 'Organic Living, Wellness & Purity Blog | Siraba Organic',
    description: 'Expert articles, organic farming insights, buyer guides, and wellness tips on pure organic spices, saffron, and chemical-free food from Siraba Organic.',
    heading: 'Siraba Organic Blog & Insights',
    ogType: 'blog',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Blog',
          '@id': `${BASE_URL}/blog#blog`,
          name: 'Siraba Organic Insights & Blog',
          url: `${BASE_URL}/blog`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/blog#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
          ],
        },
      ],
    },
  },
  {
    path: '/organic-certification-guide',
    title: 'Organic Certification Guide | How Purity Is Verified | Siraba Organic',
    description: 'Detailed guide to organic certification in India and globally: NPOP, USDA, EU Organic, residue testing, and how to verify authentic organic products.',
    heading: 'Complete Organic Certification Guide',
    ogType: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          '@id': `${BASE_URL}/organic-certification-guide#article`,
          headline: 'Organic Certification Guide: How Organic Food is Certified & Verified',
          url: `${BASE_URL}/organic-certification-guide`,
          author: { '@type': 'Organization', name: 'Siraba Organic' },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/organic-certification-guide#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Certification Guide', item: `${BASE_URL}/organic-certification-guide` },
          ],
        },
      ],
    },
  },
  {
    path: '/quality-promise',
    title: 'Our Quality Promise | Triple-Verified Organic Standards | Siraba Organic',
    description: "Explore Siraba Organic's uncompromising quality promise: accredited lab residue testing, complete batch traceability, and certified organic sourcing.",
    heading: 'The Siraba Organic Quality Promise',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/quality-promise#webpage`,
          name: 'Our Quality Promise',
          url: `${BASE_URL}/quality-promise`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/quality-promise#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Quality Promise', item: `${BASE_URL}/quality-promise` },
          ],
        },
      ],
    },
  },
  {
    path: '/b2b',
    title: 'B2B & Bulk Organic Solutions | Siraba Organic Wholesale',
    description: 'Source certified bulk organic spices, herbs, and ingredients for businesses, institutions, and exporters with verified lab documentation and traceability.',
    heading: 'B2B & Bulk Organic Solutions',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/b2b#webpage`,
          name: 'B2B & Bulk Organic Solutions',
          url: `${BASE_URL}/b2b`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/b2b#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'B2B Solutions', item: `${BASE_URL}/b2b` },
          ],
        },
      ],
    },
  },
  {
    path: '/vendor',
    title: 'Sell on Siraba Organic | Join the Verified Organic Marketplace',
    description: "Apply to become a verified vendor on Siraba Organic. Partner with India's premier triple-verified organic marketplace to reach conscious consumers.",
    heading: 'Become a Verified Vendor on Siraba Organic',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/vendor#webpage`,
          name: 'Vendor Application & Overview',
          url: `${BASE_URL}/vendor`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/vendor#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Vendors', item: `${BASE_URL}/vendor` },
          ],
        },
      ],
    },
  },
  {
    path: '/vendor-qualification',
    title: 'Vendor Qualification Criteria | Siraba Organic Marketplace',
    description: 'Review the mandatory qualification criteria for vendors on Siraba Organic, including NPOP/USDA organic certification and NABL lab test verification.',
    heading: 'Vendor Qualification Process',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/vendor-qualification#webpage`,
          name: 'Vendor Qualification',
          url: `${BASE_URL}/vendor-qualification`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/vendor-qualification#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Vendor Qualification', item: `${BASE_URL}/vendor-qualification` },
          ],
        },
      ],
    },
  },
  {
    path: '/vendor-benefits',
    title: 'Vendor Benefits & Growth | Siraba Organic Marketplace',
    description: 'Discover the benefits of selling certified organic produce on Siraba: verified trust badges, dedicated storefront, pan-India reach, and fair terms.',
    heading: 'Vendor Benefits & Ecosystem Advantages',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/vendor-benefits#webpage`,
          name: 'Vendor Benefits',
          url: `${BASE_URL}/vendor-benefits`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/vendor-benefits#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Vendor Benefits', item: `${BASE_URL}/vendor-benefits` },
          ],
        },
      ],
    },
  },
  {
    path: '/vendor-onboarding-guide',
    title: 'Vendor Onboarding Step-by-Step Guide | Siraba Organic',
    description: 'Complete walkthrough of the vendor onboarding process on Siraba Organic, from document submission and lab verification to product listing.',
    heading: 'Step-by-Step Vendor Onboarding Guide',
    ogType: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/vendor-onboarding-guide#webpage`,
          name: 'Vendor Onboarding Guide',
          url: `${BASE_URL}/vendor-onboarding-guide`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/vendor-onboarding-guide#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Vendor Onboarding Guide', item: `${BASE_URL}/vendor-onboarding-guide` },
          ],
        },
      ],
    },
  },
  {
    path: '/vendor-verification-policies',
    title: 'Vendor Verification & Audit Policies | Siraba Organic',
    description: "Learn about Siraba Organic's rigorous vendor verification protocols, periodic audit checks, residue testing standards, and compliance governance.",
    heading: 'Vendor Verification & Compliance Policies',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/vendor-verification-policies#webpage`,
          name: 'Vendor Verification Policies',
          url: `${BASE_URL}/vendor-verification-policies`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/vendor-verification-policies#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Verification Policies', item: `${BASE_URL}/vendor-verification-policies` },
          ],
        },
      ],
    },
  },
  {
    path: '/vendor/badges',
    title: 'Vendor Badges & Verification Standards | Siraba Organic',
    description: 'Explore the verification and qualification badges awarded to approved organic vendors on SIRABA ORGANIC.',
    heading: 'Marketplace Badges & Trust Credentials',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/vendor/badges#webpage`,
          name: 'Vendor Badges',
          url: `${BASE_URL}/vendor/badges`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/vendor/badges#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Vendor Badges', item: `${BASE_URL}/vendor/badges` },
          ],
        },
      ],
    },
  },
  {
    path: '/founder-faqs',
    title: 'Founder & Branding FAQs | Siraba Organic',
    description: "Learn more about founder Rajesh Kumar Thakur's vision, philosophy, and brand identity behind SIRABA ORGANIC.",
    heading: 'Founder & Philosophy FAQs',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'FAQPage',
          '@id': `${BASE_URL}/founder-faqs#faq`,
          name: 'Founder FAQs',
          url: `${BASE_URL}/founder-faqs`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/founder-faqs#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Founder FAQs', item: `${BASE_URL}/founder-faqs` },
          ],
        },
      ],
    },
  },
  {
    path: '/vendor-faq',
    title: 'Vendor FAQ | Selling Organic on Siraba Marketplace',
    description: 'Frequently asked questions for organic vendors seeking onboarding and qualification on SIRABA ORGANIC.',
    heading: 'Vendor Frequently Asked Questions',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'FAQPage',
          '@id': `${BASE_URL}/vendor-faq#faq`,
          name: 'Vendor FAQs',
          url: `${BASE_URL}/vendor-faq`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/vendor-faq#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Vendor FAQ', item: `${BASE_URL}/vendor-faq` },
          ],
        },
      ],
    },
  },
  {
    path: '/shipping-policy',
    title: 'Shipping & Delivery Policy | Siraba Organic',
    description: 'Information regarding shipping timelines, pan-India delivery, packaging standards, and tracking for Siraba Organic orders.',
    heading: 'Shipping & Delivery Policy',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/shipping-policy#webpage`,
          name: 'Shipping & Delivery Policy',
          url: `${BASE_URL}/shipping-policy`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/shipping-policy#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Shipping Policy', item: `${BASE_URL}/shipping-policy` },
          ],
        },
      ],
    },
  },
  {
    path: '/refund-policy',
    title: 'Refund & Cancellation Policy | Siraba Organic',
    description: "Review Siraba Organic's policy on refunds, replacements, cancellations, and returns for certified organic grocery products and deliveries.",
    heading: 'Refund, Return & Cancellation Policy',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/refund-policy#webpage`,
          name: 'Refund Policy',
          url: `${BASE_URL}/refund-policy`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/refund-policy#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Refund Policy', item: `${BASE_URL}/refund-policy` },
          ],
        },
      ],
    },
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | Siraba Organic Data Protection',
    description: 'Understand how Siraba Organic collects, uses, and protects your personal data and privacy across our marketplace and services.',
    heading: 'Privacy Policy & Data Protection',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/privacy-policy#webpage`,
          name: 'Privacy Policy',
          url: `${BASE_URL}/privacy-policy`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/privacy-policy#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${BASE_URL}/privacy-policy` },
          ],
        },
      ],
    },
  },
  {
    path: '/terms',
    title: 'Terms & Conditions | Siraba Organic Marketplace',
    description: 'Read the terms of use, legal agreements, and customer conditions for browsing and purchasing on the Siraba Organic platform.',
    heading: 'Terms & Conditions of Use',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/terms#webpage`,
          name: 'Terms & Conditions',
          url: `${BASE_URL}/terms`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/terms#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Terms & Conditions', item: `${BASE_URL}/terms` },
          ],
        },
      ],
    },
  },
  {
    path: '/vendor-terms-and-conditions',
    title: 'Vendor Terms & Conditions | Siraba Organic',
    description: 'Comprehensive terms, operational policies, certification requirements, and commercial compliance guidelines for Siraba Organic marketplace vendors.',
    heading: 'Vendor Terms & Conditions',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/vendor-terms-and-conditions#webpage`,
          name: 'Vendor Terms & Conditions',
          url: `${BASE_URL}/vendor-terms-and-conditions`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/vendor-terms-and-conditions#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Vendor Terms', item: `${BASE_URL}/vendor-terms-and-conditions` },
          ],
        },
      ],
    },
  },
  {
    path: '/vendor-onboarding-checklist',
    title: 'Vendor Onboarding Checklist | Required Documents | Siraba Organic',
    description: 'Complete onboarding checklist for organic producers: certification verification, lab reports, business documents, and packaging compliance for Siraba Organic.',
    heading: 'Vendor Onboarding Document Checklist',
    ogType: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/vendor-onboarding-checklist#webpage`,
          name: 'Vendor Onboarding Checklist',
          url: `${BASE_URL}/vendor-onboarding-checklist`,
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/vendor-onboarding-checklist#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Onboarding Checklist', item: `${BASE_URL}/vendor-onboarding-checklist` },
          ],
        },
      ],
    },
  },
];

function prerenderProductPages(products, baseHtml) {
  console.log('\n[Prerender] Generating crawler-ready pre-rendered HTML for all live products...');

  for (const p of products) {
    const productDir = path.join(distDir, 'product', p.slug);
    fs.mkdirSync(productDir, { recursive: true });

    const pUrl = `${BASE_URL}/product/${p.slug}`;
    const cleanDesc = (p.description || p.fullDescription || p.name)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000);
    const pTitle = `${p.name} | Siraba Organic`;
    const schemas = buildProductSchema(p);

    let html = cleanTemplateHead(baseHtml);

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(pTitle)}</title>`);

    // Inject Head SEO elements
    const headSeo = `
  <meta name="description" content="${escapeHtml(cleanDesc)}" />
  <link rel="canonical" href="${escapeHtml(pUrl)}" />
  <meta property="og:title" content="${escapeHtml(pTitle)}" />
  <meta property="og:description" content="${escapeHtml(cleanDesc)}" />
  <meta property="og:type" content="product" />
  <meta property="og:url" content="${escapeHtml(pUrl)}" />
  <meta property="og:site_name" content="Siraba Organic" />
  ${p.image ? `<meta property="og:image" content="${escapeHtml(p.image)}" />` : `<meta property="og:image" content="${BASE_URL}/images/siraba-share.png" />`}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(pTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(cleanDesc)}" />
  ${p.image ? `<meta name="twitter:image" content="${escapeHtml(p.image)}" />` : `<meta name="twitter:image" content="${BASE_URL}/images/siraba-share.png" />`}
  <script type="application/ld+json" data-siraba-seo="true">
${JSON.stringify(schemas, null, 2)}
  </script>
`;

    html = html.replace('</head>', `${headSeo}\n</head>`);

    // Inject Initial Semantic Content into #root for no-JS crawlers (visually hidden for real users)
    const semanticContent = `
    <div id="root">
      <article class="sr-only-seo" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="false">
        <nav aria-label="Breadcrumb">
          <a href="/">Home</a> &gt; <a href="/shop">Shop</a> &gt; <span>${escapeHtml(p.name)}</span>
        </nav>
        <h1>${escapeHtml(p.name)}</h1>
        <p><strong>Category:</strong> ${escapeHtml(p.category || 'Organic Products')}</p>
        <p><strong>Price:</strong> ₹${escapeHtml(String(p.price))}</p>
        <p><strong>Description:</strong> ${escapeHtml(cleanDesc)}</p>
        ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" style="max-width:300px;" />` : ''}
      </article>
    </div>`;

    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, semanticContent);

    fs.writeFileSync(path.join(productDir, 'index.html'), html, 'utf8');
  }

  console.log(`[Prerender] ✅ Pre-rendered ${products.length} product HTML pages in dist/product/<slug>/index.html`);
}

function prerenderStaticPages(baseHtml) {
  console.log('\n[Prerender] Generating crawler-ready pre-rendered HTML for static public routes...');

  for (const page of staticPagesSeo) {
    let html = cleanTemplateHead(baseHtml);
    const pUrl = page.path === '/' ? `${BASE_URL}/` : `${BASE_URL}${page.path}`;
    const pTitle = page.title;
    const cleanDesc = page.description;
    const ogImg = page.image || `${BASE_URL}/images/siraba-share.png`;

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(pTitle)}</title>`);

    // Inject Head SEO elements
    const headSeo = `
  <meta name="description" content="${escapeHtml(cleanDesc)}" />
  <link rel="canonical" href="${escapeHtml(pUrl)}" />
  <meta property="og:title" content="${escapeHtml(pTitle)}" />
  <meta property="og:description" content="${escapeHtml(cleanDesc)}" />
  <meta property="og:type" content="${escapeHtml(page.ogType || 'website')}" />
  <meta property="og:url" content="${escapeHtml(pUrl)}" />
  <meta property="og:site_name" content="Siraba Organic" />
  <meta property="og:image" content="${escapeHtml(ogImg)}" />
  <meta property="og:image:alt" content="Siraba Organic - India's Triple-Verified Organic Marketplace" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(pTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(cleanDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImg)}" />
  ${page.schema ? `<script type="application/ld+json" data-siraba-seo="true">
${JSON.stringify(page.schema, null, 2)}
  </script>` : ''}
`;

    html = html.replace('</head>', `${headSeo}\n</head>`);

    // Inject Initial Semantic Content into #root for crawlers (visually hidden for real users)
    const semanticContent = `
    <div id="root">
      <article class="sr-only-seo" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="false">
        <nav aria-label="Breadcrumb">
          <a href="/">Home</a> ${page.path !== '/' ? `&gt; <span>${escapeHtml(page.heading || page.title)}</span>` : ''}
        </nav>
        <h1>${escapeHtml(page.heading || page.title)}</h1>
        <p>${escapeHtml(cleanDesc)}</p>
      </article>
    </div>`;

    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, semanticContent);

    if (page.path === '/') {
      fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
    } else {
      const pageDir = path.join(distDir, page.path.replace(/^\//, ''));
      fs.mkdirSync(pageDir, { recursive: true });
      fs.writeFileSync(path.join(pageDir, 'index.html'), html, 'utf8');
    }
  }

  console.log(`[Prerender] ✅ Pre-rendered ${staticPagesSeo.length} core static pages in dist/`);
}

function verifyRootStaticFiles() {
  console.log('\n[Root Files Verification] Ensuring root discovery files exist in dist/...');
  const requiredFiles = ['robots.txt', 'sitemap.xml', 'llms.txt'];
  for (const f of requiredFiles) {
    const pubPath = path.join(publicDir, f);
    const dstPath = path.join(distDir, f);
    if (!fs.existsSync(dstPath) && fs.existsSync(pubPath)) {
      fs.copyFileSync(pubPath, dstPath);
      console.log(`[Root Files Verification] Copied ${f} to dist/${f}`);
    }
  }
}

async function run() {
  const products = await fetchProducts();
  updateSitemap(products);

  if (fs.existsSync(distDir)) {
    const templatePath = path.join(distDir, 'index.html');
    if (fs.existsSync(templatePath)) {
      const baseTemplate = fs.readFileSync(templatePath, 'utf8');
      prerenderProductPages(products, baseTemplate);
      prerenderStaticPages(baseTemplate);
    } else {
      console.warn('[Prerender] dist/index.html template not found. Skipping HTML prerender step.');
    }
  } else {
    console.log('[Prerender] dist/ directory not found. Skipping HTML prerender step (only sitemap updated).');
  }

  verifyRootStaticFiles();
  console.log('\n✨ [SEO Generator] All SEO generation steps completed successfully.\n');
}

run().catch((err) => {
  console.error('[FATAL] Generator unhandled error:', err);
  process.exit(1);
});
