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

  // Base 26 canonical pages
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
    { loc: '/marketplace-badges', priority: '0.6', changefreq: 'monthly' },
    { loc: '/product-verification', priority: '0.7', changefreq: 'monthly' },
    { loc: '/vendor/qualification', priority: '0.6', changefreq: 'monthly' },
    { loc: '/vendor-intro', priority: '0.6', changefreq: 'monthly' },
    { loc: '/vendor-benefits', priority: '0.6', changefreq: 'monthly' },
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

function prerenderProductPages(products) {
  if (!fs.existsSync(distDir)) {
    console.log('[Prerender] dist/ directory not found. Skipping HTML prerender step (only sitemap updated).');
    return;
  }

  const templatePath = path.join(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.warn('[Prerender] dist/index.html template not found. Skipping HTML prerender step.');
    return;
  }

  console.log('\n[Prerender] Generating crawler-ready pre-rendered HTML for all live products...');
  const baseHtml = fs.readFileSync(templatePath, 'utf8');

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

    let html = baseHtml;

    // Clean default meta description, og tags, and canonical tags to avoid duplicates
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi, '');
    html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/gi, '');
    html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/gi, '');
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, '');

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
  ${p.image ? `<meta property="og:image" content="${escapeHtml(p.image)}" />` : ''}
  <script type="application/ld+json" data-siraba-seo="true">
${JSON.stringify(schemas, null, 2)}
  </script>
`;

    html = html.replace('</head>', `${headSeo}\n</head>`);

    // Inject Initial Semantic Content into #root for no-JS crawlers
    const semanticContent = `
    <div id="root">
      <article class="sr-only-seo" style="max-width:800px;margin:2rem auto;padding:1rem;font-family:sans-serif;" aria-hidden="false">
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

    html = html.replace(/<div id="root"><\/div>/i, semanticContent);

    fs.writeFileSync(path.join(productDir, 'index.html'), html, 'utf8');
  }

  console.log(`[Prerender] ✅ Pre-rendered ${products.length} product HTML pages in dist/product/<slug>/index.html`);
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
  prerenderProductPages(products);
  verifyRootStaticFiles();
  console.log('\n✨ [SEO Generator] All SEO generation steps completed successfully.\n');
}

run().catch((err) => {
  console.error('[FATAL] Generator unhandled error:', err);
  process.exit(1);
});
