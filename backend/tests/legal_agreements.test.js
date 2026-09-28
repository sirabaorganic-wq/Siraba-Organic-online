/**
 * Automated Test Suite for SIRABA ORGANIC Phase 2: Backend Legal Documents Foundation
 * 
 * Verifies:
 * 1. Template Registry & SHA-256 Hash Integrity
 * 2. Data Minimization (Snapshot Field Isolation)
 * 3. Handlebars Template Rendering & Context Validation
 * 4. Electronic Execution & PDF Generation
 * 5. Exact PDF Buffer SHA-256 Hashing
 * 6. Strict Mongoose-Level Immutability Enforcement
 * 7. Replay / Duplicate Execution Protection
 * 8. Conditional NDA Requirement Logic
 * 9. Compliance Audit Trail Logging
 * 
 * Run with: node tests/legal_agreements.test.js
 */

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const assert = require("assert");
const mongoose = require("mongoose");

// Load backend environment variables
const backendDir = path.join(__dirname, "..");
require("dotenv").config({ path: path.join(backendDir, ".env") });

const {
  getActiveTemplateConfig,
  loadTemplateWithHash,
} = require("../config/legalTemplates");

const agreementService = require("../services/agreementService");
const LegalAgreement = require("../models/LegalAgreement");
const Vendor = require("../models/Vendor");
const ComplianceAuditLog = require("../models/ComplianceAuditLog");

console.log("===============================================================");
console.log("📜 SIRABA ORGANIC — PHASE 2 LEGAL DOCUMENTS FOUNDATION TEST SUITE");
console.log("===============================================================\n");

let passedCount = 0;
let failedCount = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  🟢 PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  🔴 FAIL: ${name}`);
    console.error(`     Error: ${err.message}\n`);
    failedCount++;
  }
}

async function runAllTests() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is missing in .env. Cannot run tests.");
    process.exit(1);
  }

  console.log("Connecting to database...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB successfully.\n");

  const testVendorId = new mongoose.Types.ObjectId();
  let createdAgreementIds = [];
  let createdAuditLogIds = [];

  try {
    // -------------------------------------------------------------
    // 1. Template Registry & Hash Integrity
    // -------------------------------------------------------------
    console.log("--- Group 1: Template Registry & Cryptographic Hash Integrity ---");

    await test("Master Vendor Agreement template configuration & SHA-256 templateHash", () => {
      const config = getActiveTemplateConfig("VENDOR_MARKETPLACE_AGREEMENT");
      assert.strictEqual(config.documentType, "VENDOR_MARKETPLACE_AGREEMENT");
      assert.strictEqual(config.version, "1.0");
      assert.ok(config.filePath, "filePath should be set");
      assert.ok(fs.existsSync(config.filePath), "Template HTML file must exist on disk");

      const fileContent = fs.readFileSync(config.filePath, "utf8");
      const expectedHash = crypto.createHash("sha256").update(fileContent, "utf8").digest("hex");
      const { templateHash } = loadTemplateWithHash("VENDOR_MARKETPLACE_AGREEMENT");

      assert.strictEqual(templateHash.length, 64, "SHA-256 hash must be 64 characters hex");
      assert.strictEqual(templateHash, expectedHash, "Dynamic templateHash must match exact file content hash");
    });

    await test("Mutual NDA template configuration & SHA-256 templateHash", () => {
      const config = getActiveTemplateConfig("MUTUAL_NDA");
      assert.strictEqual(config.documentType, "MUTUAL_NDA");
      assert.strictEqual(config.version, "1.0");
      assert.ok(config.filePath, "filePath should be set");
      assert.ok(fs.existsSync(config.filePath), "Template HTML file must exist on disk");

      const fileContent = fs.readFileSync(config.filePath, "utf8");
      const expectedHash = crypto.createHash("sha256").update(fileContent, "utf8").digest("hex");
      const { templateHash } = loadTemplateWithHash("MUTUAL_NDA");

      assert.strictEqual(templateHash.length, 64, "SHA-256 hash must be 64 characters hex");
      assert.strictEqual(templateHash, expectedHash, "Dynamic templateHash must match exact file content hash");
    });

    // -------------------------------------------------------------
    // 2. Data Minimization & Legal Snapshot Isolation
    // -------------------------------------------------------------
    console.log("\n--- Group 2: Data Minimization & Legal Snapshot Isolation ---");

    const fullVendorDoc = {
      _id: testVendorId,
      businessName: "Nature Gold Organics Private Limited",
      password: "hashed_sensitive_password_12345",
      resetPasswordToken: "secret_token_abc",
      otp: "998877",
      email: "contact@naturegold.in",
      contactPerson: "Rajesh Sharma",
      authorizedSignatoryName: "Rajesh Sharma",
      businessType: "manufacturer",
      panNumber: "AABCN1234D",
      gstApplicable: "yes",
      gstNumber: "07AABCN1234D1Z5",
      fssaiNumber: "10019011000543",
      commissionRate: 12,
      pricingTier: "Professional",
      allowedCategories: ["Spices & Herbs", "Grains & Pulses"],
      address: {
        street: "42 Greenfield Agro Park",
        city: "Jaipur",
        state: "Rajasthan",
        postalCode: "302001",
        country: "India",
      },
      organicCertification: {
        certificationRoute: "npop",
        certificationBody: "OneCert International",
        certificateNumber: "NPOP/NAB/0012/2024",
        certificateValidUntil: new Date("2028-06-30"),
      },
      shopSettings: {
        shopName: "Nature Gold Store",
        shopSlug: "nature-gold",
      },
      adminNotes: [{ note: "Internal credit assessment passed" }],
    };

    await test("Snapshot extracts only explicit legal fields and strips sensitive/irrelevant fields", () => {
      const snapshot = agreementService.buildVendorLegalSnapshot(fullVendorDoc, {
        signatoryName: "Rajesh Sharma",
        signatoryDesignation: "Managing Director",
      });

      // Permitted legal fields
      assert.strictEqual(snapshot.legalName, "Nature Gold Organics Private Limited");
      assert.strictEqual(snapshot.tradeName, "Nature Gold Store");
      assert.strictEqual(snapshot.businessType, "manufacturer");
      assert.strictEqual(snapshot.address.street, "42 Greenfield Agro Park");
      assert.strictEqual(snapshot.address.city, "Jaipur");
      assert.strictEqual(snapshot.address.state, "Rajasthan");
      assert.strictEqual(snapshot.address.postalCode, "302001");
      assert.strictEqual(snapshot.pan, "AABCN1234D");
      assert.strictEqual(snapshot.gstin, "07AABCN1234D1Z5");
      assert.strictEqual(snapshot.fssai, "10019011000543");
      assert.strictEqual(snapshot.organicCertification.route, "npop");
      assert.strictEqual(snapshot.organicCertification.body, "OneCert International");
      assert.strictEqual(snapshot.organicCertification.certificateNumber, "NPOP/NAB/0012/2024");
      assert.strictEqual(snapshot.authorizedRepresentative, "Rajesh Sharma");
      assert.strictEqual(snapshot.designation, "Managing Director");
      assert.strictEqual(snapshot.commercialTerms.commissionRate, 12);
      assert.deepStrictEqual(snapshot.approvedCategories, ["Spices & Herbs", "Grains & Pulses"]);

      // Verify prohibited/unnecessary fields are completely absent
      assert.strictEqual(snapshot.password, undefined, "Password must not be in legal snapshot");
      assert.strictEqual(snapshot.resetPasswordToken, undefined, "Reset token must not be in legal snapshot");
      assert.strictEqual(snapshot.otp, undefined, "OTP must not be in legal snapshot");
      assert.strictEqual(snapshot.adminNotes, undefined, "Admin notes must not be in legal snapshot");
    });

    // -------------------------------------------------------------
    // 3. Preview Generation (Rendered HTML without Execution)
    // -------------------------------------------------------------
    console.log("\n--- Group 3: Agreement Preview Generation ---");

    await test("Generate preview for Vendor Marketplace Agreement", async () => {
      const preview = await agreementService.generateAgreementPreview(
        fullVendorDoc,
        "VENDOR_MARKETPLACE_AGREEMENT"
      );
      assert.strictEqual(preview.documentType, "VENDOR_MARKETPLACE_AGREEMENT");
      assert.strictEqual(preview.templateVersion, "1.0");
      assert.strictEqual(typeof preview.templateHash, "string");
      assert.strictEqual(preview.templateHash.length, 64);
      assert.strictEqual(typeof preview.htmlHash, "string");
      assert.strictEqual(preview.htmlHash.length, 64);
      assert.ok(preview.html.includes("Nature Gold Organics Private Limited"), "HTML contains legalName");
      assert.ok(preview.html.includes("AABCN1234D"), "HTML contains PAN");
      assert.ok(preview.html.includes("07AABCN1234D1Z5"), "HTML contains GSTIN");
      assert.ok(preview.html.includes("MASTER VENDOR MARKETPLACE AGREEMENT"), "HTML contains agreement title");
    });

    await test("Generate preview for Mutual NDA", async () => {
      const preview = await agreementService.generateAgreementPreview(
        fullVendorDoc,
        "MUTUAL_NDA"
      );
      assert.strictEqual(preview.documentType, "MUTUAL_NDA");
      assert.strictEqual(preview.templateVersion, "1.0");
      assert.strictEqual(typeof preview.templateHash, "string");
      assert.strictEqual(preview.templateHash.length, 64);
      assert.ok(
        preview.html.includes("MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT") ||
        preview.html.includes("Mutual Non-Disclosure"),
        "HTML contains NDA title"
      );
      assert.ok(preview.html.includes("Nature Gold Organics Private Limited"), "HTML contains legalName");
    });

    // -------------------------------------------------------------
    // 4. Agreement Execution, PDF Generation & Exact Byte Hashing
    // -------------------------------------------------------------
    console.log("\n--- Group 4: Electronic Execution & Byte Hashing ---");

    // Create a real database Vendor document for execution testing
    const dbVendor = await Vendor.create({
      _id: testVendorId,
      businessName: "Nature Gold Organics Private Limited",
      email: `test_legal_${Date.now()}@naturegold.in`,
      password: "HashedPassword123!",
      businessType: "manufacturer",
      panNumber: "AABCN1234D",
      gstApplicable: "yes",
      gstNumber: "07AABCN1234D1Z5",
      fssaiNumber: "10019011000543",
      contactPerson: "Rajesh Sharma",
      authorizedSignatoryName: "Rajesh Sharma",
      phone: "9876543210",
      status: "pending",
      onboardingStep: 6,
      address: {
        street: "42 Greenfield Agro Park",
        city: "Jaipur",
        state: "Rajasthan",
        postalCode: "302001",
        country: "India",
      },
      agreements: {
        marketplaceAgreement: { status: "pending" },
        mutualNda: { isRequired: false, status: "not_applicable" },
      },
    });

    let executedAgreement = null;

    await test("Execute Marketplace Agreement: generates PDF, hashes exact bytes, stores record", async () => {
      const mockReq = {
        ip: "103.21.244.2",
        socket: { remoteAddress: "103.21.244.2" },
        headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser/1.0" },
      };

      const result = await agreementService.executeAgreement({
        vendorId: dbVendor._id,
        documentType: "VENDOR_MARKETPLACE_AGREEMENT",
        signatoryName: "Rajesh Sharma",
        signatoryDesignation: "Managing Director",
        agreed: true,
        req: mockReq,
      });

      assert.strictEqual(result.isAlreadyExecuted, false);
      assert.ok(result.agreement, "Agreement record must be returned");
      executedAgreement = result.agreement;
      createdAgreementIds.push(executedAgreement._id);

      // Verify LegalAgreement schema fields
      assert.strictEqual(executedAgreement.vendor.toString(), dbVendor._id.toString());
      assert.strictEqual(executedAgreement.documentType, "VENDOR_MARKETPLACE_AGREEMENT");
      assert.strictEqual(executedAgreement.template.version, "1.0");
      assert.strictEqual(executedAgreement.execution.status, "executed");
      assert.strictEqual(executedAgreement.execution.signatoryName, "Rajesh Sharma");
      assert.strictEqual(executedAgreement.execution.signatoryDesignation, "Managing Director");
      assert.strictEqual(executedAgreement.execution.agreed, true);
      assert.strictEqual(executedAgreement.execution.ipAddress, "103.21.244.2");

      // Verify exact PDF bytes hash
      const documentHash = executedAgreement.artifact.documentHash;
      assert.strictEqual(documentHash.length, 64, "documentHash must be a 64-character SHA-256 hex");

      // Check persisted file in storage (local disk or Cloudinary)
      if (executedAgreement.artifact.documentUrl.startsWith("/uploads/")) {
        const localFilePath = path.join(backendDir, executedAgreement.artifact.documentUrl);
        assert.ok(fs.existsSync(localFilePath), "Generated PDF file must exist in storage");
        const diskPdfBytes = fs.readFileSync(localFilePath);
        const computedDiskHash = crypto.createHash("sha256").update(diskPdfBytes).digest("hex");
        assert.strictEqual(documentHash, computedDiskHash, "documentHash must equal SHA-256 of exact persisted PDF bytes");
      } else {
        assert.ok(
          executedAgreement.artifact.documentUrl.startsWith("http"),
          "documentUrl must be a valid Cloudinary/HTTP URL"
        );
      }

      // Verify Vendor cache state update
      const reloadedVendor = await Vendor.findById(dbVendor._id);
      assert.strictEqual(reloadedVendor.agreements.marketplaceAgreement.status, "executed");
      assert.strictEqual(reloadedVendor.agreements.marketplaceAgreement.executedVersion, "1.0");
      assert.strictEqual(
        reloadedVendor.agreements.marketplaceAgreement.currentAgreement.toString(),
        executedAgreement._id.toString()
      );
    });

    await test("ComplianceAuditLog entry created on execution", async () => {
      const auditLog = await ComplianceAuditLog.findOne({
        entityType: "vendor_agreement",
        entityId: executedAgreement._id,
      });
      assert.ok(auditLog, "Audit log record must exist for executed agreement");
      createdAuditLogIds.push(auditLog._id);
      assert.strictEqual(auditLog.action, "agreement_accepted");
      assert.strictEqual(auditLog.newStatus, "executed");
      assert.strictEqual(auditLog.metadata.documentHash, executedAgreement.artifact.documentHash);
      assert.strictEqual(auditLog.metadata.templateVersion, "1.0");
      assert.strictEqual(auditLog.metadata.ipAddress, "103.21.244.2");
    });

    // -------------------------------------------------------------
    // 5. Immutability Enforcement on Executed Records
    // -------------------------------------------------------------
    console.log("\n--- Group 5: Strict Mongoose-Level Immutability Enforcement ---");

    await test("Mutation of vendorDataSnapshot on executed record is blocked", async () => {
      let threw = false;
      try {
        const agreement = await LegalAgreement.findById(executedAgreement._id);
        agreement.vendorDataSnapshot.legalName = "Tampered Legal Name LLC";
        await agreement.save();
      } catch (err) {
        threw = true;
        assert.ok(
          /IMMUTABILITY VIOLATION/i.test(err.message),
          `Expected immutability violation, got: ${err.message}`
        );
      }
      assert.strictEqual(threw, true, "Modifying vendorDataSnapshot on executed agreement must throw");
    });

    await test("Mutation of artifact.documentHash on executed record is blocked", async () => {
      let threw = false;
      try {
        const agreement = await LegalAgreement.findById(executedAgreement._id);
        agreement.artifact.documentHash = "0000000000000000000000000000000000000000000000000000000000000000";
        await agreement.save();
      } catch (err) {
        threw = true;
        assert.ok(
          /IMMUTABILITY VIOLATION/i.test(err.message),
          `Expected immutability violation, got: ${err.message}`
        );
      }
      assert.strictEqual(threw, true, "Modifying documentHash on executed agreement must throw");
    });

    await test("Mutation of execution.signatoryName on executed record is blocked", async () => {
      let threw = false;
      try {
        const agreement = await LegalAgreement.findById(executedAgreement._id);
        agreement.execution.signatoryName = "Fraudulent Signatory";
        await agreement.save();
      } catch (err) {
        threw = true;
        assert.ok(
          /IMMUTABILITY VIOLATION/i.test(err.message),
          `Expected immutability violation, got: ${err.message}`
        );
      }
      assert.strictEqual(threw, true, "Modifying signatoryName on executed agreement must throw");
    });

    await test("Deletion of executed LegalAgreement record is blocked", async () => {
      let threw = false;
      try {
        const agreement = await LegalAgreement.findById(executedAgreement._id);
        await agreement.deleteOne();
      } catch (err) {
        threw = true;
        assert.ok(
          /IMMUTABILITY VIOLATION/i.test(err.message),
          `Expected deletion prevention, got: ${err.message}`
        );
      }
      assert.strictEqual(threw, true, "Deleting an executed agreement must throw an error");
    });

    // -------------------------------------------------------------
    // 6. Replay & Duplicate Execution Protection
    // -------------------------------------------------------------
    console.log("\n--- Group 6: Replay & Idempotency Protection ---");

    await test("Subsequent execution of same version returns existing agreement (idempotent)", async () => {
      const replayResult = await agreementService.executeAgreement({
        vendorId: dbVendor._id,
        documentType: "VENDOR_MARKETPLACE_AGREEMENT",
        signatoryName: "Rajesh Sharma",
        signatoryDesignation: "Managing Director",
        agreed: true,
      });

      assert.strictEqual(replayResult.isAlreadyExecuted, true);
      assert.strictEqual(
        replayResult.agreement._id.toString(),
        executedAgreement._id.toString(),
        "Replay must return the original executed agreement document ID"
      );
    });

    // -------------------------------------------------------------
    // 7. Conditional Mutual NDA Workflow
    // -------------------------------------------------------------
    console.log("\n--- Group 7: Conditional Mutual NDA Workflow ---");

    await test("Admin toggle sets mutual NDA to required -> status transitions to pending", async () => {
      const vendor = await Vendor.findById(dbVendor._id);
      vendor.agreements.mutualNda.isRequired = true;
      vendor.agreements.mutualNda.status = "pending";
      await vendor.save();

      const reloaded = await Vendor.findById(dbVendor._id);
      assert.strictEqual(reloaded.agreements.mutualNda.isRequired, true);
      assert.strictEqual(reloaded.agreements.mutualNda.status, "pending");
    });

    await test("Execute Mutual NDA: generates PDF, marks executed, updates Vendor status", async () => {
      const ndaResult = await agreementService.executeAgreement({
        vendorId: dbVendor._id,
        documentType: "MUTUAL_NDA",
        signatoryName: "Rajesh Sharma",
        signatoryDesignation: "Managing Director",
        agreed: true,
      });

      assert.strictEqual(ndaResult.isAlreadyExecuted, false);
      createdAgreementIds.push(ndaResult.agreement._id);

      const reloadedVendor = await Vendor.findById(dbVendor._id);
      assert.strictEqual(reloadedVendor.agreements.mutualNda.status, "executed");
      assert.strictEqual(reloadedVendor.agreements.mutualNda.executedVersion, "1.0");
      assert.strictEqual(
        reloadedVendor.agreements.mutualNda.currentAgreement.toString(),
        ndaResult.agreement._id.toString()
      );

      const ndaAudit = await ComplianceAuditLog.findOne({
        entityType: "mutual_nda",
        entityId: ndaResult.agreement._id,
      });
      assert.ok(ndaAudit, "Audit log must exist for executed NDA");
      createdAuditLogIds.push(ndaAudit._id);
      assert.strictEqual(ndaAudit.action, "nda_accepted");
    });

  } finally {
    // -------------------------------------------------------------
    // Cleanup Test Data
    // -------------------------------------------------------------
    console.log("\nCleaning up test artifacts...");
    if (createdAgreementIds.length > 0) {
      const ags = await LegalAgreement.find({ _id: { $in: createdAgreementIds } });
      for (const ag of ags) {
        if (ag.artifact?.documentUrl?.startsWith("/uploads/")) {
          const filePath = path.join(backendDir, ag.artifact.documentUrl);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (e) {}
          }
        }
      }
      await LegalAgreement.collection.deleteMany({ _id: { $in: createdAgreementIds } });
    }

    if (createdAuditLogIds.length > 0) {
      await ComplianceAuditLog.collection.deleteMany({ _id: { $in: createdAuditLogIds } });
    }

    await Vendor.collection.deleteOne({ _id: testVendorId });
    await mongoose.disconnect();
    console.log("Database disconnected. Clean up completed.");
  }

  console.log("\n===============================================================");
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("===============================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Unhandled error running tests:", err);
  process.exit(1);
});
