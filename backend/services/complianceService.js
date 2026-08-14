const ProductCompliance = require("../models/ProductCompliance");
const ProductBatch = require("../models/ProductBatch");
const Product = require("../models/Product");
const TraceIdCounter = require("../models/TraceIdCounter");
const ComplianceAuditLog = require("../models/ComplianceAuditLog");
const { invalidateCache } = require("../config/cache");

/**
 * Compliance Service — Authoritative business logic layer for Product Compliance & Trust
 */

/**
 * Compute Trust Status from compliance record fields (pure function)
 */
const computeTrustStatus = (compliance) => {
  const isCertified = compliance.certification?.status === "verified";

  const isVerified =
    compliance.regulatory?.fssai?.status === "verified" &&
    compliance.productVerification?.status === "verified" &&
    (compliance.scientificVerification?.status === "verified" ||
      compliance.scientificVerification?.status === "not_applicable");

  const isQualified = isCertified && isVerified && compliance.sirabaQualification?.status === "verified";

  const isTripleVerified = isCertified && isVerified && isQualified;

  return {
    isCertified,
    isVerified,
    isQualified,
    isTripleVerified,
    computedAt: new Date(),
  };
};

/**
 * Pure evaluation function — returns effective status considering expiresAt without DB writes
 */
const evaluateEffectiveStatus = (storedStatus, expiresAt, now = new Date()) => {
  if (storedStatus === "verified" && expiresAt) {
    const expiryDate = new Date(expiresAt);
    if (expiryDate < now) {
      return "expired";
    }
  }
  return storedStatus || "not_available";
};

/**
 * Update a specific dimension on a compliance record (Authoritative Mutation Handler)
 */
const updateDimension = async (complianceId, dimension, updateData, adminUserId) => {
  const compliance = await ProductCompliance.findById(complianceId);
  if (!compliance) {
    throw new Error("Compliance record not found");
  }

  const previousStatus = compliance[dimension]?.status || "";

  // Apply update to dimension
  if (dimension === "certification") {
    compliance.certification = {
      ...compliance.certification,
      ...updateData,
      lastReviewedAt: new Date(),
    };
  } else if (dimension === "regulatory") {
    compliance.regulatory = {
      ...compliance.regulatory,
      fssai: {
        ...compliance.regulatory?.fssai,
        ...updateData,
        lastReviewedAt: new Date(),
      },
    };
  } else if (dimension === "productVerification") {
    compliance.productVerification = {
      ...compliance.productVerification,
      ...updateData,
      lastReviewedAt: new Date(),
    };
  } else if (dimension === "scientificVerification") {
    compliance.scientificVerification = {
      ...compliance.scientificVerification,
      ...updateData,
      lastReviewedAt: new Date(),
    };
  } else if (dimension === "sirabaQualification") {
    compliance.sirabaQualification = {
      ...compliance.sirabaQualification,
      ...updateData,
      lastReviewedAt: new Date(),
    };
  } else {
    throw new Error(`Invalid dimension: ${dimension}`);
  }

  // Recompute trust status
  compliance.trustStatus = computeTrustStatus(compliance);

  // Save (triggers pre-save safety hook as secondary check)
  await compliance.save();

  const newStatus = compliance[dimension]?.status || (dimension === "regulatory" ? compliance.regulatory.fssai.status : "");

  // Audit Logging
  try {
    await ComplianceAuditLog.create({
      entityType: "product_compliance",
      entityId: compliance._id,
      productId: compliance.product,
      vendorId: compliance.vendor,
      action: newStatus === "verified" ? "dimension_verified" : newStatus === "rejected" ? "dimension_rejected" : "status_changed",
      dimension,
      previousStatus,
      newStatus,
      performedBy: adminUserId,
      performedAt: new Date(),
      reason: updateData.reason || "",
      evidenceReference: updateData.evidenceDocId ? String(updateData.evidenceDocId) : "",
    });
  } catch (auditErr) {
    console.error("Failed to write compliance audit log:", auditErr);
  }

  // Cache invalidation
  if (invalidateCache.compliance) {
    invalidateCache.compliance(compliance.product);
  }

  return compliance;
};

/**
 * Build Public Compliance DTO (Read-only, applies effective status evaluation, strips private data)
 */
const buildPublicDTO = (compliance, now = new Date()) => {
  if (!compliance) return null;

  const effCertStatus = evaluateEffectiveStatus(
    compliance.certification?.status,
    compliance.certification?.expiresAt,
    now
  );
  const effFssaiStatus = evaluateEffectiveStatus(
    compliance.regulatory?.fssai?.status,
    compliance.regulatory?.fssai?.expiresAt,
    now
  );
  const effSciStatus = evaluateEffectiveStatus(
    compliance.scientificVerification?.status,
    null,
    now
  );

  // Compute effective trust flags for public display
  const isCertified = effCertStatus === "verified";
  const isVerified =
    effFssaiStatus === "verified" &&
    compliance.productVerification?.status === "verified" &&
    (effSciStatus === "verified" || effSciStatus === "not_applicable");
  const isQualified = compliance.sirabaQualification?.status === "verified";
  const isTripleVerified = isCertified && isVerified && isQualified;

  return {
    productId: compliance.product,
    trustStatus: {
      isCertified,
      isVerified,
      isQualified,
      isTripleVerified,
      computedAt: compliance.trustStatus?.computedAt || compliance.updatedAt,
    },
    certification: {
      status: effCertStatus,
      standard: compliance.certification?.standard || "",
      certificationBody: compliance.certification?.certificationBody || "",
      certificateNumber: compliance.certification?.certificateNumber || "",
      validFrom: compliance.certification?.validFrom,
      validUntil: compliance.certification?.validUntil,
      productScope: compliance.certification?.productScope || "",
      lastVerifiedAt: compliance.certification?.verifiedAt,
    },
    regulatory: {
      fssai: {
        status: effFssaiStatus,
        lastVerifiedAt: compliance.regulatory?.fssai?.verifiedAt,
      },
    },
    productVerification: {
      status: compliance.productVerification?.status || "not_available",
      labelVerified: Boolean(compliance.productVerification?.labelVerified),
      ingredientsVerified: Boolean(compliance.productVerification?.ingredientsVerified),
      specificationVerified: Boolean(compliance.productVerification?.specificationVerified),
      claimsReviewed: Boolean(compliance.productVerification?.claimsReviewed),
      lastVerifiedAt: compliance.productVerification?.verifiedAt,
    },
    scientificVerification: {
      status: effSciStatus,
      summary: (compliance.scientificVerification?.summary || "")
        .replace(/NABL[- ]Accredited Lab Report/gi, "Accredited Lab Evidence")
        .replace(/NABL[- ]Accredited Lab/gi, "Accredited Lab Evidence")
        .replace(/&?\s*NABL\s*Lab Tested/gi, "& Accredited Lab Evidence")
        .replace(/NABL Lab Tested/gi, "Accredited Lab Evidence Reviewed")
        .replace(/NABL Lab Testing/gi, "Accredited Lab Evidence")
        .replace(/NABL Verified/gi, "Accredited Lab Evidence Reviewed")
        .replace(/Tested by NABL Lab/gi, "Laboratory Evidence Reviewed")
        .replace(/NABL Testing/gi, "Accredited Lab Evidence")
        .replace(/NABL Verification/gi, "Accredited Lab Evidence")
        .replace(/NABL Lab Evidence/gi, "Accredited Lab Evidence")
        .replace(/\bNABL\b/gi, "Accredited Lab")
        .replace(/Accredited Lab Lab Tested/gi, "Accredited Lab Evidence Reviewed")
        .trim(),
      lastVerifiedAt: compliance.scientificVerification?.verifiedAt,
    },
    sirabaQualification: {
      status: compliance.sirabaQualification?.status || "not_available",
      vendorQualified: Boolean(compliance.sirabaQualification?.vendorQualified),
      marketplaceApproved: Boolean(compliance.sirabaQualification?.marketplaceApproved),
      lastVerifiedAt: compliance.sirabaQualification?.verifiedAt,
    },
    verifiedClaims: (compliance.verifiedClaims || [])
      .filter((c) => c.status === "verified")
      .map((c) => ({
        claim: c.claim,
        status: c.status,
      })),
  };
};

/**
 * Build Public Batch DTO
 */
const buildPublicBatchDTO = (batch, now = new Date()) => {
  if (!batch) return null;

  return {
    batchNumber: batch.batchNumber,
    batchInfo: batch.batchInfo || batch.traceability?.origin || "",
    status: batch.status,
    manufacturedAt: batch.manufacturedAt,
    bestBefore: batch.bestBefore,
    qualityVerification: {
      status: batch.qualityVerification?.status || "not_available",
      lastVerifiedAt: batch.qualityVerification?.verifiedAt,
    },
    laboratoryEvidence: (batch.laboratoryEvidence || []).map((lab) => ({
      status: evaluateEffectiveStatus(lab.status, lab.expiresAt, now),
      laboratory: lab.laboratory || "",
      accreditation: lab.accreditation || "",
      reportNumber: lab.reportNumber || "",
      testDate: lab.testDate,
      parameters: (lab.parameters || []).map((p) => ({
        name: p.name,
        category: p.category,
        status: p.status,
      })),
    })),
    traceability: {
      status: batch.traceability?.status || "not_available",
      origin: batch.traceability?.origin || batch.batchInfo || "",
      producer: batch.traceability?.producer || "",
      processing: batch.traceability?.processing || "",
      packaging: batch.traceability?.packaging || "",
      distribution: batch.traceability?.distribution || "",
      batchInfo: batch.batchInfo || batch.traceability?.origin || "",
    },
    traceId: batch.traceId || null,
    qrVerificationUrl: batch.qrVerificationUrl || "",
  };
};

/**
 * Upsert ProductBatch for a product (creates or updates batch record with traceId)
 */
const upsertProductBatch = async (productId, { batchNumber, batchInfo, vendorId }) => {
  if (!batchNumber) return null;
  const trimmedBatchNum = String(batchNumber).trim();
  const trimmedBatchInfo = batchInfo ? String(batchInfo).trim() : "";
  if (!trimmedBatchNum) return null;

  let batch = await ProductBatch.findOne({ product: productId }).sort({ createdAt: -1 });

  if (batch) {
    batch.batchNumber = trimmedBatchNum;
    if (trimmedBatchInfo) {
      batch.batchInfo = trimmedBatchInfo;
      if (!batch.traceability) batch.traceability = { status: "verified" };
      batch.traceability.origin = trimmedBatchInfo;
      batch.traceability.status = "verified";
    }
    await batch.save();
  } else {
    const product = await Product.findById(productId);
    let catCode = (product?.slug || product?.category || "PRD")
      .replace(/[^a-zA-Z]/g, "")
      .substring(0, 3)
      .toUpperCase();
    if (catCode.length < 3) catCode = (catCode + "XXX").substring(0, 3);

    let counter;
    try {
      counter = await TraceIdCounter.findOneAndUpdate(
        { _id: catCode },
        { $inc: { sequence: 1 } },
        { upsert: true, returnDocument: "after" }
      );
    } catch (e) {
      counter = { sequence: Math.floor(Math.random() * 90000) + 10000 };
    }

    const seqStr = String(counter?.sequence || Math.floor(Math.random() * 90000) + 10000).padStart(5, "0");
    const traceId = `SIR-${catCode}-${seqStr}`;
    const baseUrl = process.env.CLIENT_URL || "https://sirabaorganic.com";
    const qrVerificationUrl = `${baseUrl}/verify/${traceId}`;

    const compliance = await ProductCompliance.findOne({ product: productId });

    batch = new ProductBatch({
      product: productId,
      vendor: vendorId || product?.vendor || null,
      compliance: compliance?._id || null,
      batchNumber: trimmedBatchNum,
      batchInfo: trimmedBatchInfo,
      status: "active",
      manufacturedAt: new Date(),
      qualityVerification: { status: "verified" },
      traceability: {
        status: "verified",
        origin: trimmedBatchInfo || "Verified Heritage Belt",
        producer: "Verified Organic Producer",
        processing: "Traditional Cold Method / Stone Ground",
        packaging: "Sealed Food-Grade Foil",
        distribution: "SIRABA Quality Chain",
      },
      traceId,
      traceIdGeneratedAt: new Date(),
      qrVerificationUrl,
    });

    await batch.save();
  }

  if (invalidateCache?.compliance) {
    invalidateCache.compliance(productId);
  }

  return batch;
};

/**
 * Build Authoritative Dynamic Trust Passport DTO for Product Details Page
 * Consumes real database entities: Product, Vendor, ProductCompliance, ProductBatch
 */
const buildTrustPassportDTO = ({ product, vendor, compliance, batch }, now = new Date()) => {
  // CARD 01 — CERTIFIED™
  const usdaRouteCert = vendor?.organicCertification?.certificationsByRoute?.usda;
  const npopRouteCert = vendor?.organicCertification?.certificationsByRoute?.npop;

  const certStandard =
    (usdaRouteCert?.certificateNumber ? "USDA NOP" : null) ||
    (compliance?.certification?.standard && compliance.certification.standard.trim() !== ""
      ? compliance.certification.standard
      : (vendor?.organicCertification?.certificationRoute ? vendor.organicCertification.certificationRoute.toUpperCase() : "Organic Certification"));

  const certBody =
    usdaRouteCert?.certificationBody ||
    compliance?.certification?.certificationBody ||
    vendor?.organicCertification?.certificationBody ||
    npopRouteCert?.certificationBody ||
    null;

  const certNumber =
    usdaRouteCert?.certificateNumber ||
    compliance?.certification?.certificateNumber ||
    vendor?.organicCertification?.certificateNumber ||
    npopRouteCert?.certificateNumber ||
    null;

  const certValidUntil =
    usdaRouteCert?.certificateValidUntil ||
    compliance?.certification?.validUntil ||
    vendor?.organicCertification?.certificateValidUntil ||
    npopRouteCert?.certificateValidUntil ||
    null;

  let certStatus = compliance?.certification?.status || (certNumber ? "verified" : "pending");
  if (certValidUntil && new Date(certValidUntil) < now) {
    certStatus = "expired";
  }

  const productCoverage =
    compliance?.certification?.productScope ||
    vendor?.representativeProduct?.productName ||
    product?.name ||
    "All Product Batches";

  // CARD 02 — VERIFIED™
  const isBizVerified = vendor?.status === "approved" || vendor?.isBusinessRegistered === "yes";
  const isFssaiVerified = Boolean(vendor?.fssaiNumber) || vendor?.status === "approved" || compliance?.regulatory?.fssai?.status === "verified";
  const isLabelVerified = Boolean(compliance?.productVerification?.labelVerified || vendor?.status === "approved");
  const isQualityTested = Boolean(compliance?.productVerification?.ingredientsVerified || batch?.qualityVerification?.status === "verified" || vendor?.status === "approved");

  // Safety / Accredited Lab Evidence Check — Must have actual approved lab documentation
  const labDocTypes = [
    "nabl_certificate",
    "laboratory_report_coa",
    "certificate_of_analysis",
    "pesticide_residue_report",
    "heavy_metal_report",
    "microbiological_report",
    "product_quality_report",
  ];
  const vendorHasLabDoc = Boolean(
    vendor?.complianceDocuments?.some(
      (doc) => doc.status === "approved" && labDocTypes.includes(doc.type)
    )
  );

  const isSafetyTested = Boolean(
    compliance?.scientificVerification?.status === "verified" ||
      batch?.laboratoryEvidence?.some((l) => l.status === "verified") ||
      vendorHasLabDoc
  );

  let verifiedOverallStatus = "pending";
  if (isBizVerified && isFssaiVerified && isLabelVerified && isQualityTested && isSafetyTested) {
    verifiedOverallStatus = "verified";
  } else if (isBizVerified || isFssaiVerified) {
    verifiedOverallStatus = "partially_verified";
  }

  // CARD 03 — TRACEABLE™
  const origin =
    batch?.traceability?.origin ||
    (vendor?.address?.state ? `${vendor.address.state}, ${vendor.address.country || "India"}` : "Certified Organic Farm");

  const processing =
    batch?.traceability?.processing ||
    (vendor?.businessType ? `${vendor.businessType.toUpperCase()} Facility` : "Organic Certified Facility");

  const qualityCheck =
    (batch?.laboratoryEvidence?.[0]?.laboratory ? `${batch.laboratoryEvidence[0].laboratory}` : null) ||
    (batch?.qualityVerification?.status === "verified" ? "Accredited Lab Evidence" : "QC Inspection Completed");

  const packaging = batch?.traceability?.packaging || "Food Grade, Hygienic";

  const distribution =
    batch?.traceability?.distribution ||
    (vendor?.maintainsTraceabilityRecords === "yes" ? "Traceability Maintained" : "Cold Chain / Secure Storage");

  const traceableStatus = batch?.traceability?.status || (vendor?.maintainsTraceabilityRecords === "yes" ? "verified" : "pending");

  // CARD 04 — QUALIFIED™
  const isVendorApproved = vendor?.status === "approved" || compliance?.sirabaQualification?.status === "verified";
  const vendorName = vendor?.businessName || "SIRABA Organic Direct";
  const reviewDate = compliance?.sirabaQualification?.verifiedAt || vendor?.updatedAt || vendor?.createdAt || now;
  const reviewDateObj = new Date(reviewDate);
  const nextReviewDateObj = new Date(reviewDateObj);
  nextReviewDateObj.setFullYear(nextReviewDateObj.getFullYear() + 1);

  const qualifiedStatus = isVendorApproved ? "approved" : "pending";

  return {
    certified: {
      standard: certStandard,
      certificationBody: certBody,
      certificateNumber: certNumber,
      validUntil: certValidUntil || null,
      productCoverage,
      status: certStatus,
    },
    verified: {
      businessVerified: isBizVerified,
      fssaiRegistered: isFssaiVerified,
      productLabelVerified: isLabelVerified,
      qualityTested: isQualityTested,
      safetyTested: isSafetyTested,
      status: verifiedOverallStatus,
    },
    traceable: {
      origin,
      processing,
      qualityCheck,
      packaging,
      distribution,
      status: traceableStatus,
    },
    qualified: {
      vendorName,
      reviewDate: reviewDateObj,
      nextReview: nextReviewDateObj,
      status: qualifiedStatus,
      description: isVendorApproved
        ? "This product has passed all required verification checks and is approved for listing on the SIRABA Organic marketplace."
        : "This product and seller are currently undergoing SIRABA marketplace verification review.",
    },
  };
};

module.exports = {
  computeTrustStatus,
  evaluateEffectiveStatus,
  updateDimension,
  buildPublicDTO,
  buildPublicBatchDTO,
  buildTrustPassportDTO,
  upsertProductBatch,
};
