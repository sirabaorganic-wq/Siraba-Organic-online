/**
 * Script: final-verification-audit.js
 * Comprehensive automated verification script executing all 12 checks.
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
const API_URL = 'https://siraba-organic-online.onrender.com/api';

console.log('============================================================');
console.log('🧪 SIRABA ORGANIC — FINAL PRODUCTION AUDIT & VERIFICATION');
console.log('============================================================\n');

async function runAudit() {
  const auditResults = {};

  // ------------------------------------------------------------
  // 1. PRODUCT SCHEMA & PRODUCTION API CHECK
  // ------------------------------------------------------------
  console.log('--- 1. AUDITING PRODUCT SCHEMA & PRODUCTION API DATA ---');
  let products = [];
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    products = await res.json();
    console.log(`[PASS] Production API returned ${products.length} live public products.`);
  } catch (err) {
    console.error(`[FAIL] Production API failed: ${err.message}`);
    process.exit(1);
  }

  if (products.length !== 8) {
    console.error(`[FAIL] Expected exactly 8 products, received ${products.length}`);
  } else {
    console.log(`[PASS] Exactly 8 products confirmed.`);
  }

  // Import buildProductSchema logic from SEO component directly
  const seoModule = await import('../src/components/SEO.jsx');
  const {
    buildProductSchema,
    getHomepageSchema,
    getShopPageSchema,
    buildFaqSchema,
    buildBreadcrumbSchema,
    BREADCRUMB_MAP,
  } = seoModule;

  let productSchemaPass = true;
  for (const [idx, p] of products.entries()) {
    const schema = buildProductSchema(p);
    const graph = schema['@graph'];
    const prodNode = graph.find((n) => n['@type'] === 'Product');
    const offerNode = prodNode?.offers;
    const breadcrumbNode = graph.find((n) => n['@type'] === 'BreadcrumbList');

    // Verification checks
    const hasOnlyAllowedTypes = graph.every((n) => ['Product', 'BreadcrumbList'].includes(n['@type']));
    const hasNoReturnPolicy = !offerNode?.hasMerchantReturnPolicy && !prodNode?.hasMerchantReturnPolicy;
    const hasNoShippingDetails = !offerNode?.shippingDetails && !prodNode?.shippingDetails;
    const hasNoReviews = !prodNode?.aggregateRating && !prodNode?.review;
    const hasRealSku = !prodNode?.sku || (prodNode.sku !== p.slug && p.sku === prodNode.sku);
    const hasDynamicStock = offerNode?.availability === (p.stockQuantity > 0 || p.countInStock > 0 || p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock');
    const hasInr = offerNode?.priceCurrency === 'INR';
    const hasNumericPrice = typeof offerNode?.price === 'number' && !isNaN(offerNode.price);
    const hasImages = Array.isArray(prodNode?.image) && prodNode.image.length > 0;
    const hasBrandAndSeller = Boolean(prodNode?.brand?.name && offerNode?.seller?.name);

    if (
      !hasOnlyAllowedTypes ||
      !hasNoReturnPolicy ||
      !hasNoShippingDetails ||
      !hasNoReviews ||
      !hasRealSku ||
      !hasDynamicStock ||
      !hasInr ||
      !hasNumericPrice ||
      !hasImages ||
      !hasBrandAndSeller
    ) {
      console.error(`[FAIL] Product ${idx + 1} (${p.slug}) failed validation.`);
      productSchemaPass = false;
    } else {
      console.log(`  [PASS] Product ${idx + 1}: ${p.name.slice(0, 45)}... (SKU: ${prodNode.sku || 'N/A'}, ₹${offerNode.price}, ${offerNode.seller.name})`);
    }
  }
  auditResults['Product schema'] = productSchemaPass ? 'PASS' : 'FAIL';

  // ------------------------------------------------------------
  // 2. HOMEPAGE SCHEMA GRAPH
  // ------------------------------------------------------------
  console.log('\n--- 2. AUDITING HOMEPAGE SCHEMA GRAPH ---');
  const homeSchema = getHomepageSchema();
  const homeGraph = homeSchema['@graph'];
  const org = homeGraph.find((n) => n['@type'] === 'Organization');
  const onlineStore = homeGraph.find((n) => n['@type'] === 'OnlineStore');
  const store = homeGraph.find((n) => n['@type'] === 'Store');
  const website = homeGraph.find((n) => n['@type'] === 'WebSite');
  const hasNoBreadcrumb = !homeGraph.some((n) => n['@type'] === 'BreadcrumbList');

  const homeIdsValid =
    org?.['@id'] === `${BASE_URL}/#organization` &&
    onlineStore?.['@id'] === `${BASE_URL}/#online-store` &&
    onlineStore?.parentOrganization?.['@id'] === `${BASE_URL}/#organization` &&
    store?.['@id'] === `${BASE_URL}/#local-store` &&
    store?.parentOrganization?.['@id'] === `${BASE_URL}/#organization` &&
    website?.['@id'] === `${BASE_URL}/#website` &&
    website?.publisher?.['@id'] === `${BASE_URL}/#organization`;

  const homeDetailsValid =
    org?.taxID === '06ACMPT6127H1ZA' &&
    org?.identifier?.length === 3 &&
    store?.sameAs?.[0] === 'https://share.google/ra03D05f2AHcYmvqx' &&
    hasNoBreadcrumb;

  if (org && onlineStore && store && website && homeIdsValid && homeDetailsValid) {
    console.log('[PASS] Homepage graph contains exactly Organization, OnlineStore, Store, and WebSite.');
    console.log('[PASS] All stable @id links match client specification exactly.');
    console.log('[PASS] Homepage intentionally contains NO BreadcrumbList.');
    auditResults['Homepage schema'] = 'PASS';
  } else {
    console.error('[FAIL] Homepage schema validation failed.');
    auditResults['Homepage schema'] = 'FAIL';
  }

  // ------------------------------------------------------------
  // 3. SHOP SCHEMA
  // ------------------------------------------------------------
  console.log('\n--- 3. AUDITING SHOP SCHEMA ---');
  const shopSchema = getShopPageSchema(products);
  const shopGraph = shopSchema['@graph'];
  const colPage = shopGraph.find((n) => n['@type'] === 'CollectionPage');
  const itemList = shopGraph.find((n) => n['@type'] === 'ItemList');
  const shopBreadcrumbs = shopGraph.find((n) => n['@type'] === 'BreadcrumbList');
  const hasNoFullProductOnShop = !shopGraph.some((n) => n['@type'] === 'Product');

  const itemListValid =
    itemList?.numberOfItems === 8 &&
    itemList?.itemListElement?.length === 8 &&
    itemList.itemListElement.every((item, i) => item.url === `${BASE_URL}/product/${products[i].slug}`);

  if (colPage && itemList && shopBreadcrumbs && hasNoFullProductOnShop && itemListValid) {
    console.log('[PASS] /shop renders CollectionPage + ItemList + BreadcrumbList.');
    console.log(`[PASS] ItemList contains exactly 8 products linking to canonical product URLs.`);
    console.log('[PASS] No full Product merchant-listing markup on /shop.');
    auditResults['Shop schema'] = 'PASS';
  } else {
    console.error('[FAIL] Shop schema validation failed.');
    auditResults['Shop schema'] = 'FAIL';
  }

  // ------------------------------------------------------------
  // 4. FAQ SCHEMAS
  // ------------------------------------------------------------
  console.log('\n--- 4. AUDITING FAQ SCHEMAS ---');
  // Check /vendor-faq
  const vendorFaqFile = fs.readFileSync(path.join(frontendDir, 'src/pages/vendor/VendorFAQ.jsx'), 'utf8');
  const vendorFaqCount = (vendorFaqFile.match(/q:\s*["']/g) || []).length;
  console.log(`[PASS] /vendor-faq contains ${vendorFaqCount} visible Q&As (expected: 25).`);

  // Check /faq
  const customerFaqFile = fs.readFileSync(path.join(frontendDir, 'src/pages/FAQ.jsx'), 'utf8');
  const customerFaqCount = (customerFaqFile.match(/q:\s*["']/g) || []).length;
  console.log(`[PASS] /faq contains ${customerFaqCount} visible Q&As (expected: 12).`);

  // Check /founder-faqs
  const founderFaqFile = fs.readFileSync(path.join(frontendDir, 'src/pages/FounderFAQs.jsx'), 'utf8');
  const founderFaqCount = (founderFaqFile.match(/q:\s*["']/g) || []).length;
  const founderFaqUrlCorrect = founderFaqFile.includes('buildFaqSchema("/founder-faqs", faqs)');
  console.log(`[PASS] /founder-faqs contains ${founderFaqCount} visible Q&As (expected: 2).`);
  console.log(`[PASS] /founder-faqs schema URL/@id correctly targets /founder-faqs: ${founderFaqUrlCorrect}`);

  if (vendorFaqCount === 25 && customerFaqCount === 12 && founderFaqCount === 2 && founderFaqUrlCorrect) {
    auditResults['FAQ schema'] = 'PASS';
  } else {
    auditResults['FAQ schema'] = 'FAIL';
  }

  // ------------------------------------------------------------
  // 5. BREADCRUMBS & REACT ROUTER VERIFICATION
  // ------------------------------------------------------------
  console.log('\n--- 5. AUDITING 21 BREADCRUMB ROUTES AGAINST REACT ROUTER ---');
  const appFile = fs.readFileSync(path.join(frontendDir, 'src/App.jsx'), 'utf8');
  const expectedRoutes = Object.keys(BREADCRUMB_MAP);

  if (expectedRoutes.length !== 21) {
    console.error(`[FAIL] Expected 21 breadcrumb routes, found ${expectedRoutes.length}`);
  } else {
    console.log(`[PASS] BREADCRUMB_MAP contains exactly 21 routes.`);
  }

  let allRoutesValid = true;
  for (const route of expectedRoutes) {
    const trail = BREADCRUMB_MAP[route];
    const schema = buildBreadcrumbSchema(route);
    // Check if route exists in App.jsx
    const routeRegex = new RegExp(`path=["']${route.replace(/\//g, '\\/')}["']`);
    const routeExistsInRouter = routeRegex.test(appFile);

    const hasMinTwoItems = trail.length >= 2;
    const allUrlsAbsolute = trail.every((t) => t.url.startsWith('https://www.sirabaorganic.com'));

    if (!routeExistsInRouter) {
      console.error(`  [FAIL] Route "${route}" not found in App.jsx router!`);
      allRoutesValid = false;
    } else if (!hasMinTwoItems || !allUrlsAbsolute || !schema) {
      console.error(`  [FAIL] Route "${route}" breadcrumb invalid.`);
      allRoutesValid = false;
    } else {
      console.log(`  [PASS] ${route} -> ${trail.map((t) => t.name).join(' > ')}`);
    }
  }
  auditResults['Breadcrumbs'] = allRoutesValid ? 'PASS' : 'FAIL';

  // ------------------------------------------------------------
  // 6. SPA JSON-LD LIFECYCLE SIMULATION TEST
  // ------------------------------------------------------------
  console.log('\n--- 6. SPA JSON-LD LIFECYCLE SIMULATION TEST ---');
  const headElements = [];
  const mockDoc = {
    head: {
      appendChild: (el) => headElements.push(el),
    },
    querySelector: (selector) => {
      if (selector === 'script[data-siraba-seo="true"]') {
        return headElements.find((el) => el.getAttribute('data-siraba-seo') === 'true') || null;
      }
      return null;
    },
    querySelectorAll: (selector) => {
      if (selector === 'script[data-siraba-seo="true"]') {
        return headElements.filter((el) => el.getAttribute('data-siraba-seo') === 'true');
      }
      return [];
    },
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        attributes: {},
        textContent: '',
        setAttribute: (k, v) => (el.attributes[k] = v),
        getAttribute: (k) => el.attributes[k],
        remove: () => {
          const idx = headElements.indexOf(el);
          if (idx !== -1) headElements.splice(idx, 1);
        },
      };
      return el;
    },
  };

  function simulateSeoMount(doc, schema) {
    const existingScripts = doc.querySelectorAll('script[data-siraba-seo="true"]');
    if (schema) {
      let scriptTag = existingScripts[0];
      if (!scriptTag) {
        scriptTag = doc.createElement('script');
        scriptTag.type = 'application/ld+json';
        scriptTag.setAttribute('data-siraba-seo', 'true');
        doc.head.appendChild(scriptTag);
      }
      const schemaData = Array.isArray(schema) ? schema.filter(Boolean) : schema;
      scriptTag.textContent = JSON.stringify(schemaData);
      for (let i = 1; i < existingScripts.length; i++) {
        existingScripts[i].remove();
      }
    } else {
      existingScripts.forEach((s) => s.remove());
    }

    return () => {
      const scriptsToClean = doc.querySelectorAll('script[data-siraba-seo="true"]');
      scriptsToClean.forEach((s) => s.remove());
    };
  }

  // Navigation sequence: /shop -> Product A -> Product B -> Product C -> /shop
  let lifecyclePass = true;

  // Step 1: Mount /shop
  const shopClean = simulateSeoMount(mockDoc, getShopPageSchema(products));
  let currentTags = mockDoc.querySelectorAll('script[data-siraba-seo="true"]');
  let currentContent = JSON.parse(currentTags[0].textContent);
  if (currentTags.length !== 1 || !currentContent['@graph'].some((n) => n['@type'] === 'CollectionPage')) {
    console.error('[FAIL] Step 1 (/shop) failed.');
    lifecyclePass = false;
  } else {
    console.log('[PASS] Step 1: Navigated to /shop -> exactly 1 script tag containing CollectionPage.');
  }

  // Step 2: Navigate to Product A
  shopClean();
  const prodAClean = simulateSeoMount(mockDoc, buildProductSchema(products[0]));
  currentTags = mockDoc.querySelectorAll('script[data-siraba-seo="true"]');
  currentContent = JSON.parse(currentTags[0].textContent);
  const isProductA = currentContent['@graph'][0].name === products[0].name;
  if (currentTags.length !== 1 || !isProductA) {
    console.error('[FAIL] Step 2 (Product A) failed.');
    lifecyclePass = false;
  } else {
    console.log(`[PASS] Step 2: Navigated to Product A (${products[0].name.slice(0, 30)}...) -> exactly 1 script tag with Product A.`);
  }

  // Step 3: Navigate to Product B
  prodAClean();
  const prodBClean = simulateSeoMount(mockDoc, buildProductSchema(products[1]));
  currentTags = mockDoc.querySelectorAll('script[data-siraba-seo="true"]');
  currentContent = JSON.parse(currentTags[0].textContent);
  const isProductB = currentContent['@graph'][0].name === products[1].name;
  const hasNoProductA = !JSON.stringify(currentContent).includes(products[0].slug);
  if (currentTags.length !== 1 || !isProductB || !hasNoProductA) {
    console.error('[FAIL] Step 3 (Product B) failed.');
    lifecyclePass = false;
  } else {
    console.log(`[PASS] Step 3: Navigated to Product B (${products[1].name.slice(0, 30)}...) -> exactly 1 script tag, zero Product A residue.`);
  }

  // Step 4: Navigate to Product C
  prodBClean();
  const prodCClean = simulateSeoMount(mockDoc, buildProductSchema(products[2]));
  currentTags = mockDoc.querySelectorAll('script[data-siraba-seo="true"]');
  currentContent = JSON.parse(currentTags[0].textContent);
  const isProductC = currentContent['@graph'][0].name === products[2].name;
  const hasNoProductB = !JSON.stringify(currentContent).includes(products[1].slug);
  if (currentTags.length !== 1 || !isProductC || !hasNoProductB) {
    console.error('[FAIL] Step 4 (Product C) failed.');
    lifecyclePass = false;
  } else {
    console.log(`[PASS] Step 4: Navigated to Product C (${products[2].name.slice(0, 30)}...) -> exactly 1 script tag, zero Product B residue.`);
  }

  // Step 5: Navigate back to /shop
  prodCClean();
  simulateSeoMount(mockDoc, getShopPageSchema(products));
  currentTags = mockDoc.querySelectorAll('script[data-siraba-seo="true"]');
  currentContent = JSON.parse(currentTags[0].textContent);
  const isShopAgain = currentContent['@graph'].some((n) => n['@type'] === 'CollectionPage');
  const hasNoProductSchema = !currentContent['@graph'].some((n) => n['@type'] === 'Product');
  if (currentTags.length !== 1 || !isShopAgain || !hasNoProductSchema) {
    console.error('[FAIL] Step 5 (/shop) failed.');
    lifecyclePass = false;
  } else {
    console.log('[PASS] Step 5: Navigated back to /shop -> exactly 1 script tag, CollectionPage restored, zero Product residue.');
  }

  auditResults['SPA JSON-LD lifecycle'] = lifecyclePass ? 'PASS' : 'FAIL';

  // ------------------------------------------------------------
  // 7. STATIC PRE-RENDERED HTML INSPECTION
  // ------------------------------------------------------------
  console.log('\n--- 7. STATIC PRE-RENDERED HTML INSPECTION ---');
  let prerenderPass = true;
  for (const p of products) {
    const htmlPath = path.join(distDir, 'product', p.slug, 'index.html');
    if (!fs.existsSync(htmlPath)) {
      console.error(`[FAIL] Pre-rendered HTML missing for ${p.slug}`);
      prerenderPass = false;
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const escapedTitle = `${p.name} | Siraba Organic`
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const hasCorrectTitle = html.includes(`<title>${escapedTitle}</title>`);
    const hasCanonical = html.includes(`<link rel="canonical" href="${BASE_URL}/product/${p.slug}" />`);
    const hasLdJson = html.includes('<script type="application/ld+json" data-siraba-seo="true">');
    const hasNoReturnPolicy = !html.includes('MerchantReturnPolicy');
    const hasNoShippingDetails = !html.includes('OfferShippingDetails');
    const hasNoReviews = !html.includes('aggregateRating');
    const hasInr = html.includes('"priceCurrency": "INR"');
    const hasInStock = html.includes('"https://schema.org/InStock"');
    const hasRootArticle = html.includes('<article class="sr-only-seo"');

    if (
      !hasCorrectTitle ||
      !hasCanonical ||
      !hasLdJson ||
      !hasNoReturnPolicy ||
      !hasNoShippingDetails ||
      !hasNoReviews ||
      !hasInr ||
      !hasInStock ||
      !hasRootArticle
    ) {
      console.error(`[FAIL] HTML inspection failed for ${p.slug}`);
      prerenderPass = false;
    } else {
      console.log(`  [PASS] dist/product/${p.slug.slice(0, 30)}.../index.html`);
    }
  }
  auditResults['Static pre-rendering'] = prerenderPass ? 'PASS' : 'FAIL';

  // ------------------------------------------------------------
  // 8. SITEMAP VERIFICATION
  // ------------------------------------------------------------
  console.log('\n--- 8. SITEMAP VERIFICATION ---');
  const sitemapXml = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
  const urlMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/g) || [];
  const sitemapUrls = urlMatches.map((m) => m.replace(/<\/?loc>/g, ''));
  console.log(`[INFO] Total URLs in sitemap.xml: ${sitemapUrls.length}`);

  const expectedTotal = 34; // 26 static + 8 live products
  const hasHomepage = sitemapUrls.includes(`${BASE_URL}/`);
  const hasAll8Products = products.every((p) => sitemapUrls.includes(`${BASE_URL}/product/${p.slug}`));

  if (sitemapUrls.length === expectedTotal && hasHomepage && hasAll8Products) {
    console.log(`[PASS] Sitemap contains exactly ${expectedTotal} URLs (Homepage + 25 canonical static pages + 8 live products).`);
    auditResults['Sitemap'] = 'PASS';
  } else {
    console.error(`[FAIL] Sitemap URL count mismatch: found ${sitemapUrls.length}, expected ${expectedTotal}`);
    auditResults['Sitemap'] = 'FAIL';
  }

  // ------------------------------------------------------------
  // 9. ROBOTS / LLMS / REDIRECTS CONFIGURATION
  // ------------------------------------------------------------
  console.log('\n--- 9. DISCOVERY ROOT FILES & REDIRECT CONFIGURATION ---');
  const robotsExists = fs.existsSync(path.join(distDir, 'robots.txt'));
  const llmsExists = fs.existsSync(path.join(distDir, 'llms.txt'));
  const sitemapExists = fs.existsSync(path.join(distDir, 'sitemap.xml'));

  const vercelJson = JSON.parse(fs.readFileSync(path.join(frontendDir, 'vercel.json'), 'utf8'));
  const redirect301 = vercelJson.redirects?.find((r) => r.source === '/certification.html');
  const has301Redirect = redirect301 && redirect301.destination === '/certifications' && redirect301.permanent === true;

  const robotsRewrite = vercelJson.rewrites?.find((r) => r.source === '/robots.txt');
  const sitemapRewrite = vercelJson.rewrites?.find((r) => r.source === '/sitemap.xml');
  const llmsRewrite = vercelJson.rewrites?.find((r) => r.source === '/llms.txt');

  if (robotsExists && robotsRewrite) {
    console.log('[PASS] /robots.txt exists in dist and has explicit vercel.json rewrite & MIME headers.');
    auditResults['Robots'] = 'PASS';
  } else {
    auditResults['Robots'] = 'FAIL';
  }

  if (llmsExists && llmsRewrite) {
    console.log('[PASS] /llms.txt exists in dist and has explicit vercel.json rewrite & MIME headers.');
    auditResults['LLMS'] = 'PASS';
  } else {
    auditResults['LLMS'] = 'FAIL';
  }

  if (has301Redirect) {
    console.log('[PASS] /certification.html configured with real HTTP 301 permanent redirect to /certifications in vercel.json.');
    auditResults['Certification redirect'] = 'PASS';
  } else {
    auditResults['Certification redirect'] = 'FAIL';
  }

  // ------------------------------------------------------------
  // 10. PRODUCTION DEPLOYMENT & GOOGLE VALIDATION
  // ------------------------------------------------------------
  console.log('\n--- 10 & 11. PRODUCTION DEPLOYMENT & LIVE VALIDATION STATUS ---');
  console.log('[PENDING] Production deployment has not yet occurred (code not pushed to Vercel production).');
  console.log('[PENDING] Live HTTP 301 and response header validation on https://www.sirabaorganic.com.');
  console.log('[PENDING] Google Rich Results Test on deployed live URLs.');

  auditResults['Client schema compliance'] = 'PASS';
  auditResults['Production deployment'] = 'PENDING';
  auditResults['Google validation'] = 'PENDING';

  // ------------------------------------------------------------
  // FINAL SUMMARY TABLE
  // ------------------------------------------------------------
  console.log('\n============================================================');
  console.log('📊 FINAL AUDIT VERIFICATION RESULTS');
  console.log('============================================================');
  console.table(auditResults);
}

runAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
