const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Master Legal Template Configuration & Registry
 * Identifies authoritative templates, active versions, and cryptographic integrity hashes.
 */
const TEMPLATES_DIR = path.join(__dirname, "../templates/agreements");

const legalTemplates = {
  VENDOR_MARKETPLACE_AGREEMENT: {
    documentType: "VENDOR_MARKETPLACE_AGREEMENT",
    templateIdentifier: "SIRABA_VMA_MASTER",
    title: "SIRABA ORGANIC Master Vendor Marketplace Agreement",
    version: "1.0",
    status: "active",
    templateFileName: "master-vendor-agreement-template.html",
    isMandatory: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    activatedAt: new Date("2026-01-01T00:00:00.000Z"),
    legalReviewStatus: "approved",
  },
  MUTUAL_NDA: {
    documentType: "MUTUAL_NDA",
    templateIdentifier: "SIRABA_MNDA_MASTER",
    title: "SIRABA ORGANIC Mutual Non-Disclosure & Confidentiality Agreement",
    version: "1.0",
    status: "active",
    templateFileName: "mutual-nda-template.html",
    isMandatory: false, // Conditional
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    activatedAt: new Date("2026-01-01T00:00:00.000Z"),
    legalReviewStatus: "approved",
  },
};

// In-memory cache for template contents and SHA-256 hashes
const templateCache = new Map();

/**
 * Load template content and compute SHA-256 templateHash
 * @param {string} documentType 
 * @returns {{ content: string, templateHash: string, config: Object }}
 */
function loadTemplateWithHash(documentType) {
  const config = legalTemplates[documentType];
  if (!config) {
    throw new Error(`Unsupported legal document type: ${documentType}`);
  }

  const filePath = path.join(TEMPLATES_DIR, config.templateFileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template file not found at: ${filePath}`);
  }

  // Check stats to invalidate cache if file modified on disk
  const stats = fs.statSync(filePath);
  const cacheKey = `${documentType}_${config.version}`;
  const cached = templateCache.get(cacheKey);

  if (cached && cached.mtimeMs === stats.mtimeMs) {
    return {
      content: cached.content,
      templateHash: cached.templateHash,
      config,
    };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const templateHash = crypto.createHash("sha256").update(content, "utf8").digest("hex");

  templateCache.set(cacheKey, {
    content,
    templateHash,
    mtimeMs: stats.mtimeMs,
  });

  return {
    content,
    templateHash,
    config,
  };
}

/**
 * Get active template configuration for a document type
 * @param {string} documentType 
 * @returns {Object}
 */
function getActiveTemplateConfig(documentType) {
  const { config, templateHash } = loadTemplateWithHash(documentType);
  const filePath = path.join(TEMPLATES_DIR, config.templateFileName);
  return {
    ...config,
    filePath,
    templateHash,
  };
}

/**
 * Get all registered template definitions
 */
function getAllTemplateConfigs() {
  return Object.keys(legalTemplates).map((type) => getActiveTemplateConfig(type));
}

module.exports = {
  legalTemplates,
  loadTemplateWithHash,
  getActiveTemplateConfig,
  getAllTemplateConfigs,
};
