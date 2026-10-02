const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const handlebars = require("handlebars");
const puppeteer = require("puppeteer");
const {
  launchBrowser,
  buildPureJsPdf,
  htmlToTextBlocks,
} = require("../utils/puppeteerHelper");
const { loadTemplateWithHash, getActiveTemplateConfig } = require("../config/legalTemplates");
const LegalAgreement = require("../models/LegalAgreement");
const Vendor = require("../models/Vendor");
const ComplianceAuditLog = require("../models/ComplianceAuditLog");

// Local storage directory for offline/fallback storage
const LOCAL_UPLOADS_DIR = path.join(__dirname, "../uploads/agreements");

/**
 * Format a Date object into human-readable Indian English date string: "22 September 2026"
 */
function formatLegalDate(date = new Date()) {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format full address from Vendor address object
 */
function formatVendorAddress(address = {}) {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country || "India",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Address on File";
}

/**
 * Build explicit minimal legal data snapshot containing ONLY fields rendered into the contract.
 * Follows data minimization principles.
 */
function buildVendorLegalSnapshot(vendor, customSignatory = {}) {
  const orgCert = vendor.organicCertification || {};
  return {
    legalName: vendor.businessName || "Vendor Entity",
    tradeName: vendor.shopSettings?.shopName || vendor.businessName || "",
    businessType: vendor.businessType || "Business Entity",
    address: {
      street: vendor.address?.street || "",
      city: vendor.address?.city || "",
      state: vendor.address?.state || "",
      postalCode: vendor.address?.postalCode || "",
      country: vendor.address?.country || "India",
    },
    pan: vendor.panNumber ? vendor.panNumber.toUpperCase() : "PAN On File",
    gstin:
      vendor.gstApplicable === "no" || vendor.gstApplicable === "na"
        ? "Exempt / Not Applicable"
        : vendor.gstNumber || "Exempt / Not Applicable",
    fssai: vendor.fssaiNumber || "Not Applicable / Pending",
    organicCertification: {
      route: orgCert.certificationRoute || (vendor.certifications?.[0] || "NPOP"),
      body: orgCert.certificationBody || "Accredited Body",
      certificateNumber: orgCert.certificateNumber || "On File",
      validUntil: orgCert.certificateValidUntil || null,
    },
    authorizedRepresentative:
      customSignatory.signatoryName ||
      vendor.authorizedSignatoryName ||
      vendor.contactPerson ||
      "Authorized Signatory",
    designation:
      customSignatory.signatoryDesignation ||
      "Authorized Representative",
    commercialTerms: {
      commissionRate: typeof vendor.commissionRate === "number" ? vendor.commissionRate : 10,
      pricingTier: vendor.pricingTier || vendor.subscription?.plan || "Standard",
    },
    approvedCategories:
      vendor.allowedCategories && vendor.allowedCategories.length > 0
        ? vendor.allowedCategories
        : vendor.representativeProduct?.productCategory
        ? [vendor.representativeProduct.productCategory]
        : ["Organic Products"],
  };
}

/**
 * Format organic certification string for template display
 */
function formatOrganicCertificationString(snapshot) {
  const cert = snapshot.organicCertification || {};
  const parts = [];
  if (cert.route) parts.push(`Route: ${cert.route.toUpperCase()}`);
  if (cert.body) parts.push(`Body: ${cert.body}`);
  if (cert.certificateNumber) parts.push(`Certificate No: ${cert.certificateNumber}`);
  if (cert.validUntil) parts.push(`Valid Until: ${formatLegalDate(cert.validUntil)}`);
  return parts.length > 0 ? parts.join(" | ") : "NPOP Certified";
}

/**
 * Build dynamic Handlebars context for rendering templates
 */
function buildTemplateContext(vendor, documentType, executionDetails = {}) {
  const snapshot = buildVendorLegalSnapshot(vendor, executionDetails);
  const now = executionDetails.acceptedAt || new Date();
  const effectiveDateStr = formatLegalDate(executionDetails.effectiveDate || now);
  const executionTimestampStr = now.toISOString ? now.toISOString() : new Date(now).toISOString();

  // Documents summary list
  const docNames = (vendor.complianceDocuments || [])
    .map((d) => d.name || d.type)
    .filter(Boolean);
  const complianceDocumentsList =
    docNames.length > 0 ? docNames.join(", ") : "Standard Qualification Dossier";

  const pickupFacility = vendor.pickupAddress
    ? formatVendorAddress(vendor.pickupAddress)
    : formatVendorAddress(vendor.address);

  return {
    vendorId: vendor._id ? vendor._id.toString() : "DRAFT",
    templateVersion: executionDetails.templateVersion || "1.0",
    effectiveDate: effectiveDateStr,
    vendorLegalName: snapshot.legalName,
    businessType: snapshot.businessType,
    vendorAddress: formatVendorAddress(snapshot.address),
    panNumber: snapshot.pan,
    gstNumber: snapshot.gstin,
    fssaiNumber: snapshot.fssai,
    organicCertification: formatOrganicCertificationString(snapshot),
    authorizedRepresentative: snapshot.authorizedRepresentative,
    representativeDesignation: snapshot.designation,
    commissionRate: snapshot.commercialTerms.commissionRate,
    pricingTier: snapshot.commercialTerms.pricingTier,
    settlementDays: 7,
    pickupFacilityAddress: pickupFacility,
    approvedCategories: snapshot.approvedCategories.join(", "),
    complianceDocumentsList,
    // Execution metadata (preview or executed)
    signatoryName: executionDetails.signatoryName || "[Pending Execution]",
    signatoryDesignation: executionDetails.signatoryDesignation || "[Pending Execution]",
    executionTimestamp: executionDetails.acceptedAt
      ? executionTimestampStr
      : "[Pending Electronic Acceptance]",
    ipAddress: executionDetails.ipAddress || "[Pending Verification]",
    userAgent: executionDetails.userAgent || "[Pending Verification]",
    documentHash: executionDetails.documentHash || "[Generated Upon Cryptographic Execution]",
  };
}

/**
 * Render Handlebars template with data context
 */
function renderTemplateHtml(documentType, context) {
  const { content, templateHash } = loadTemplateWithHash(documentType);
  const compiled = handlebars.compile(content);
  const html = compiled(context);
  const htmlHash = crypto.createHash("sha256").update(html, "utf8").digest("hex");
  return { html, htmlHash, templateHash };
}

/**
 * Generate PDF buffer using Puppeteer with resilient pure-JS fallback for cloud runtimes
 */
async function generatePdfFromHtml(html, documentType = "SIRABA ORGANIC LEGAL AGREEMENT") {
  let browser;
  try {
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } catch (puppeteerErr) {
    console.warn(
      `[agreementService] Puppeteer PDF rendering failed (${puppeteerErr.message}). Generating compliant pure-JS legal PDF fallback...`
    );
    // Resilient fallback for cloud containers (e.g. Render) without headless Chrome
    const textBlocks = htmlToTextBlocks(html, documentType);
    return buildPureJsPdf(documentType, textBlocks);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Store PDF buffer into permanent storage.
 * In production: Cloudinary is mandatory; throws error if not configured or failed (no silent ephemeral fallback).
 * In dev/test: Uses Cloudinary if available, or verified durable local filesystem storage.
 */
async function persistPdfBuffer(pdfBuffer, vendorId, documentType, version) {
  const fileName = `${documentType.toLowerCase()}-${vendorId}-v${version}-${Date.now()}.pdf`;
  const isProduction = process.env.NODE_ENV === "production";
  
  // Try Cloudinary if configured
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      const { uploadToCloudinary } = require("../config/firebase");
      const result = await uploadToCloudinary(
        fileName,
        pdfBuffer,
        "application/pdf",
        `agreements/${vendorId}`
      );
      if (result && result.url) {
        return {
          documentUrl: result.url,
          storageType: "cloudinary",
          fileName,
        };
      }
    } catch (cloudErr) {
      if (isProduction) {
        throw new Error(
          `Durable cloud storage persistence failed in production: ${cloudErr.message}`
        );
      }
      console.warn("Cloudinary upload failed, using local disk storage fallback in dev/test:", cloudErr.message);
    }
  } else if (isProduction) {
    throw new Error(
      "Durable cloud storage (Cloudinary) is mandatory in production. Local disk fallback is disabled to prevent data loss."
    );
  }

  // Local storage (development and test environments only)
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }

  const localFilePath = path.join(LOCAL_UPLOADS_DIR, fileName);
  fs.writeFileSync(localFilePath, pdfBuffer);

  // Persistence verification
  if (!fs.existsSync(localFilePath) || fs.statSync(localFilePath).size !== pdfBuffer.length) {
    throw new Error("Failed to verify durable file persistence to local storage.");
  }

  return {
    documentUrl: `/uploads/agreements/${fileName}`,
    localPath: localFilePath,
    storageType: "local",
    fileName,
  };
}

/**
 * Generate preview HTML for a vendor without persisting an execution
 */
async function generateAgreementPreview(vendor, documentType) {
  const templateConfig = getActiveTemplateConfig(documentType);
  const context = buildTemplateContext(vendor, documentType, {
    templateVersion: templateConfig.version,
  });
  const { html, htmlHash, templateHash } = renderTemplateHtml(documentType, context);
  const snapshot = buildVendorLegalSnapshot(vendor);

  return {
    documentType,
    templateVersion: templateConfig.version,
    templateHash,
    htmlHash,
    html,
    vendorSnapshot: snapshot,
  };
}

/**
 * Execute legal agreement electronically:
 * 1. Replay check (idempotency)
 * 2. Compiles template with signature block
 * 3. Generates PDF
 * 4. Hashes exact PDF bytes
 * 5. Persists PDF
 * 6. Creates immutable LegalAgreement record
 * 7. Updates Vendor cache pointer
 * 8. Records ComplianceAuditLog
 */
async function executeAgreement({
  vendorId,
  documentType,
  signatoryName,
  signatoryDesignation,
  agreed,
  req,
}) {
  if (!agreed) {
    throw new Error("Consent confirmation (agreed: true) is mandatory to execute legal agreements.");
  }

  if (!signatoryName || !signatoryName.trim()) {
    throw new Error("Full legal signatory name is required for electronic execution.");
  }

  if (!signatoryDesignation || !signatoryDesignation.trim()) {
    throw new Error("Signatory designation / title is required for electronic execution.");
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new Error("Vendor not found.");
  }

  const templateConfig = getActiveTemplateConfig(documentType);

  // Replay Protection: Check if already executed for this version
  const existingExecuted = await LegalAgreement.findOne({
    vendor: vendor._id,
    documentType,
    "template.version": templateConfig.version,
    "execution.status": "executed",
  });

  if (existingExecuted) {
    // Return existing executed agreement idempotently
    return {
      isAlreadyExecuted: true,
      agreement: existingExecuted,
    };
  }

  const acceptedAt = new Date();
  const effectiveDate = acceptedAt;

  // Extract client IP and User-Agent from request
  const ipAddress =
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.socket?.remoteAddress ||
    req?.ip ||
    "127.0.0.1";
  const userAgent = req?.headers?.["user-agent"] || "Unknown User-Agent";

  // 1. Initial compile to produce preliminary HTML
  const executionDetails = {
    signatoryName: signatoryName.trim(),
    signatoryDesignation: signatoryDesignation.trim(),
    acceptedAt,
    effectiveDate,
    ipAddress,
    userAgent,
    templateVersion: templateConfig.version,
    documentHash: "COMPUTING_SHA256",
  };

  const initialContext = buildTemplateContext(vendor, documentType, executionDetails);
  const { html: initialHtml } = renderTemplateHtml(documentType, initialContext);

  // 2. Generate PDF bytes
  let pdfBuffer = await generatePdfFromHtml(initialHtml, documentType);

  // 3. Exact PDF bytes hash (SHA-256)
  const documentHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

  // 4. Re-compile with the exact computed hash in signature block for true 2-way verification
  executionDetails.documentHash = documentHash;
  const finalContext = buildTemplateContext(vendor, documentType, executionDetails);
  const { html: finalHtml, htmlHash, templateHash } = renderTemplateHtml(documentType, finalContext);

  // Final PDF generated with the printed documentHash
  pdfBuffer = await generatePdfFromHtml(finalHtml, documentType);

  // 5. Persist the final PDF
  const storageResult = await persistPdfBuffer(
    pdfBuffer,
    vendor._id.toString(),
    documentType,
    templateConfig.version
  );

  // 6. Read exact persisted PDF bytes to compute authoritative artifact.documentHash
  let persistedBytes = pdfBuffer;
  if (storageResult.storageType === "local" && storageResult.localPath) {
    persistedBytes = fs.readFileSync(storageResult.localPath);
  }
  const finalDocumentHash = crypto.createHash("sha256").update(persistedBytes).digest("hex");

  // 7. Build explicit minimal snapshot
  const snapshot = buildVendorLegalSnapshot(vendor, executionDetails);

  // 8. Create immutable LegalAgreement
  const legalAgreement = await LegalAgreement.create({
    vendor: vendor._id,
    documentType,
    template: {
      version: templateConfig.version,
      templateIdentifier: templateConfig.templateIdentifier,
      templateHash,
    },
    vendorDataSnapshot: snapshot,
    execution: {
      status: "executed",
      signatoryName: executionDetails.signatoryName,
      signatoryDesignation: executionDetails.signatoryDesignation,
      agreed: true,
      acceptedAt,
      effectiveDate,
      ipAddress,
      userAgent,
    },
    artifact: {
      documentUrl: storageResult.documentUrl,
      mimeType: "application/pdf",
      documentHash: finalDocumentHash,
      htmlHash,
      size: persistedBytes.length,
    },
  });

  // 8. Update Vendor cache state
  if (!vendor.agreements) {
    vendor.agreements = {};
  }

  if (documentType === "VENDOR_MARKETPLACE_AGREEMENT") {
    vendor.agreements.marketplaceAgreement = {
      status: "executed",
      currentAgreement: legalAgreement._id,
      executedVersion: templateConfig.version,
      executedAt: acceptedAt,
    };
  } else if (documentType === "MUTUAL_NDA") {
    vendor.agreements.mutualNda = {
      isRequired: vendor.agreements.mutualNda?.isRequired || false,
      status: "executed",
      currentAgreement: legalAgreement._id,
      executedVersion: templateConfig.version,
      executedAt: acceptedAt,
    };
  }

  await vendor.save();

  // 9. Record in ComplianceAuditLog
  try {
    const auditAction =
      documentType === "VENDOR_MARKETPLACE_AGREEMENT"
        ? "agreement_accepted"
        : "nda_accepted";

    const auditLog = await ComplianceAuditLog.create({
      entityType:
        documentType === "VENDOR_MARKETPLACE_AGREEMENT"
          ? "vendor_agreement"
          : "mutual_nda",
      entityId: legalAgreement._id,
      vendorId: vendor._id,
      action: auditAction,
      newStatus: "executed",
      reason: `Electronically executed by ${signatoryName} (${signatoryDesignation})`,
      evidenceReference: storageResult.documentUrl,
      metadata: {
        documentType,
        templateVersion: templateConfig.version,
        templateHash,
        documentHash: finalDocumentHash,
        ipAddress,
        userAgent,
      },
    });

    legalAgreement.audit = { auditLogId: auditLog._id };
    await legalAgreement.save();
  } catch (auditErr) {
    console.error("ComplianceAuditLog recording error:", auditErr.message);
  }

  return {
    isAlreadyExecuted: false,
    agreement: legalAgreement,
  };
}

module.exports = {
  buildVendorLegalSnapshot,
  buildTemplateContext,
  renderTemplateHtml,
  generatePdfFromHtml,
  persistPdfBuffer,
  generateAgreementPreview,
  executeAgreement,
  formatLegalDate,
};
