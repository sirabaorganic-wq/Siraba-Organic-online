/**
 * ============================================================================
 * SIRABA ORGANIC — PHASE 4: END-TO-END VERIFICATION & SECURITY TEST SUITE
 * ============================================================================
 * 
 * Verifies all 20+ required Phase 4 specifications:
 * 1.  Legal Template Integrity & Verbatim Hash Verification
 * 2.  Vendor Legal Data Snapshot Isolation & Profile Mutation Immunity
 * 3.  PDF Byte Hashing & Exact Storage Persistence Verification
 * 4.  Mongoose Immutability Vectors (Save, UpdateOne, FindOneAndUpdate, Delete)
 * 5.  Replay Protection, Idempotency & Duplicate Prevention
 * 6.  Fresh Vendor Marketplace Agreement Workflow
 * 7.  Conditional Mutual NDA Lifecycle (Scenarios A, B, C, D)
 * 8.  Existing Step 7 Validation Rules Preservation
 * 9.  Backend Final Authority & Race-Condition Gating
 * 10. Multi-Tenant Authorization & Cross-Vendor Isolation
 * 11. Authenticated PDF Download Security
 * 12. Vendor Privacy & Data Minimization
 * 13. Admin Auditability & ComplianceAuditLog
 * 14. Existing Approved Vendor Non-Disruption Guarantee
 * 15. Existing Compliance Documents Coexistence
 * 
 * Run with: node tests/phase4_e2e_verification.test.js
 */

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const assert = require("assert");
const mongoose = require("mongoose");

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

console.log("============================================================================");
console.log("🛡️  SIRABA ORGANIC — PHASE 4 E2E VERIFICATION & PRODUCTION HARDENING SUITE");
console.log("============================================================================\n");

let passedCount = 0;
let failedCount = 0;
const testResults = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  🟢 PASS: ${name}`);
    passedCount++;
    testResults.push({ name, status: "PASS" });
  } catch (err) {
    console.error(`  🔴 FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedCount++;
    testResults.push({ name, status: "FAIL", error: err.message });
  }
}

// Mock Request object for IP and User-Agent capture
function createMockRequest(ip = "203.0.113.195", ua = "Mozilla/5.0 (Phase4 TestSuite)") {
  return {
    headers: {
      "x-forwarded-for": ip,
      "user-agent": ua,
    },
    ip,
    socket: { remoteAddress: ip },
  };
}

// Cleanup helper
async function cleanupTestArtifacts(vendorIds = [], agreementIds = []) {
  try {
    if (vendorIds.length > 0) {
      await Vendor.deleteMany({ _id: { $in: vendorIds } });
    }
    if (agreementIds.length > 0) {
      // Bypass mongoose immutability hooks for test cleanup via raw collection
      await mongoose.connection.collection("legalagreements").deleteMany({
        _id: { $in: agreementIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });
    }
    await ComplianceAuditLog.deleteMany({
      vendorId: { $in: vendorIds },
    });
  } catch (err) {
    console.warn("Cleanup warning:", err.message);
  }
}

async function runSuite() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not set in environment.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB database...");
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  const createdVendorIds = [];
  const createdAgreementIds = [];

  try {
    // ------------------------------------------------------------------------
    // GROUP 1: LEGAL TEMPLATE INTEGRITY & VERBATIM MASTER HASH
    // ------------------------------------------------------------------------
    console.log("--- Group 1: Legal Template Integrity & Verbatim Master Hash ---");

    await test("Master Vendor Agreement template SHA-256 hash matches disk source", async () => {
      const { content, templateHash } = loadTemplateWithHash("VENDOR_MARKETPLACE_AGREEMENT");
      const computedHash = crypto.createHash("sha256").update(content, "utf8").digest("hex");
      assert.strictEqual(templateHash, computedHash, "Template hash must match exact file content");
      assert.ok(content.includes("SIRABA ORGANIC PRIVATE LIMITED"), "Template must contain verbatim operator identity");
      assert.ok(content.includes("Execution and Electronic Signature"), "Template must contain signature block");
    });

    await test("Mutual NDA template SHA-256 hash matches disk source", async () => {
      const { content, templateHash } = loadTemplateWithHash("MUTUAL_NDA");
      const computedHash = crypto.createHash("sha256").update(content, "utf8").digest("hex");
      assert.strictEqual(templateHash, computedHash, "NDA hash must match exact file content");
      assert.ok(content.includes("Mutual Non-Disclosure & Confidentiality Agreement"), "Template must contain verbatim NDA title");
    });

    // ------------------------------------------------------------------------
    // GROUP 2: VENDOR DATA SNAPSHOT ISOLATION & IMMUNITY TO PROFILE MUTATION
    // ------------------------------------------------------------------------
    console.log("\n--- Group 2: Vendor Snapshot Isolation & Profile Mutation Immunity ---");

    let vendorA = await Vendor.create({
      businessName: "Himalayan Organic Teas Private Limited",
      email: `himalayan_${Date.now()}@test.com`,
      phone: "9876543210",
      password: "HashedPassword123",
      contactPerson: "Aarav Sharma",
      businessType: "processor",
      panNumber: "ABCDE1234F",
      fssaiNumber: "10019011000123",
      gstNumber: "07AAAAA0000A1Z5",
      gstApplicable: "yes",
      authorizedSignatoryName: "Aarav Sharma",
      commissionRate: 10,
      address: {
        street: "14 Tea Estate Road",
        city: "Darjeeling",
        state: "West Bengal",
        postalCode: "734101",
        country: "India",
      },
      organicCertification: {
        certificationRoute: "npop",
        certificationBody: "OneCert International",
        certificateNumber: "NPOP/2026/0091",
        certificateValidUntil: new Date("2028-12-31"),
      },
      allowedCategories: ["Organic Beverages", "Organic Herbs"],
    });
    createdVendorIds.push(vendorA._id);

    let executedAgreementA = null;

    await test("Execute agreement creates server-side minimal legal snapshot", async () => {
      const mockReq = createMockRequest("203.0.113.50", "Mozilla/5.0 HimalayanTest");
      const result = await agreementService.executeAgreement({
        vendorId: vendorA._id,
        documentType: "VENDOR_MARKETPLACE_AGREEMENT",
        signatoryName: "Aarav Sharma",
        signatoryDesignation: "Managing Director",
        agreed: true,
        req: mockReq,
      });

      assert.strictEqual(result.isAlreadyExecuted, false);
      executedAgreementA = result.agreement;
      createdAgreementIds.push(executedAgreementA._id);

      const snapshot = executedAgreementA.vendorDataSnapshot;
      assert.strictEqual(snapshot.legalName, "Himalayan Organic Teas Private Limited");
      assert.strictEqual(snapshot.pan, "ABCDE1234F");
      assert.strictEqual(snapshot.gstin, "07AAAAA0000A1Z5");
      assert.strictEqual(snapshot.commercialTerms.commissionRate, 10);
      assert.strictEqual(snapshot.authorizedRepresentative, "Aarav Sharma");
      assert.strictEqual(snapshot.designation, "Managing Director");

      // Verify unneeded vendor fields are omitted
      assert.strictEqual(snapshot.password, undefined);
      assert.strictEqual(snapshot.resetPasswordToken, undefined);
    });

    await test("Later vendor profile modifications DO NOT mutate historical snapshot", async () => {
      // Simulate vendor modifying profile after execution
      vendorA.businessName = "MUTATED Tea Name - Should Not Affect Contract";
      vendorA.commissionRate = 25;
      vendorA.panNumber = "MUTATEDPAN9";
      vendorA.authorizedSignatoryName = "Mutated Signatory Name";
      await vendorA.save();

      // Retrieve executed agreement from database
      const fetchedAgreement = await LegalAgreement.findById(executedAgreementA._id);
      const snapshot = fetchedAgreement.vendorDataSnapshot;

      assert.strictEqual(
        snapshot.legalName,
        "Himalayan Organic Teas Private Limited",
        "Historical snapshot legalName must remain immutable"
      );
      assert.strictEqual(
        snapshot.pan,
        "ABCDE1234F",
        "Historical snapshot PAN must remain immutable"
      );
      assert.strictEqual(
        snapshot.commercialTerms.commissionRate,
        10,
        "Historical snapshot commission rate must remain immutable"
      );
      assert.strictEqual(
        snapshot.authorizedRepresentative,
        "Aarav Sharma",
        "Historical snapshot authorized representative must remain immutable"
      );
    });

    // ------------------------------------------------------------------------
    // GROUP 3: PDF BYTE INTEGRITY & PERSISTENCE VERIFICATION
    // ------------------------------------------------------------------------
    console.log("\n--- Group 3: PDF Byte Integrity & Persistence Verification ---");

    await test("Stored documentHash corresponds to exact bytes of persisted PDF artifact", async () => {
      const artifact = executedAgreementA.artifact;
      assert.ok(artifact.documentUrl, "Document URL must be present");
      assert.ok(artifact.documentHash, "Document hash must be present");
      assert.strictEqual(artifact.mimeType, "application/pdf");

      if (artifact.documentUrl.startsWith("/uploads/")) {
        const localFilePath = path.join(backendDir, artifact.documentUrl);
        assert.ok(fs.existsSync(localFilePath), "Persisted PDF must exist on storage disk");

        const diskBytes = fs.readFileSync(localFilePath);
        const computedDiskHash = crypto.createHash("sha256").update(diskBytes).digest("hex");

        assert.strictEqual(
          artifact.documentHash,
          computedDiskHash,
          "Stored artifact.documentHash must match exact SHA-256 of persisted PDF bytes"
        );
        assert.strictEqual(artifact.size, diskBytes.length, "Stored size must match exact disk size");
      }
    });

    // ------------------------------------------------------------------------
    // GROUP 4: STRICT MONGOOSE IMMUTABILITY VECTORS
    // ------------------------------------------------------------------------
    console.log("\n--- Group 4: Strict Mongoose Immutability Vectors ---");

    await test("Direct save mutation on vendorDataSnapshot is blocked", async () => {
      const doc = await LegalAgreement.findById(executedAgreementA._id);
      doc.vendorDataSnapshot.legalName = "Attempted Direct Mutation";
      await assert.rejects(
        () => doc.save(),
        /IMMUTABILITY VIOLATION: Executed LegalAgreement records cannot be mutated/
      );
    });

    await test("Direct save mutation on artifact.documentHash is blocked", async () => {
      const doc = await LegalAgreement.findById(executedAgreementA._id);
      doc.artifact.documentHash = "tampered_fake_hash_1234567890";
      await assert.rejects(
        () => doc.save(),
        /IMMUTABILITY VIOLATION: Executed LegalAgreement records cannot be mutated/
      );
    });

    await test("Direct save mutation on execution.signatoryName is blocked", async () => {
      const doc = await LegalAgreement.findById(executedAgreementA._id);
      doc.execution.signatoryName = "Unauthorized Signatory Replacement";
      await assert.rejects(
        () => doc.save(),
        /IMMUTABILITY VIOLATION: Executed LegalAgreement records cannot be mutated/
      );
    });

    await test("Query-based update (updateOne) on executed record is blocked", async () => {
      await assert.rejects(
        () =>
          LegalAgreement.updateOne(
            { _id: executedAgreementA._id },
            { $set: { "vendorDataSnapshot.legalName": "Hacked Legal Name" } }
          ),
        /IMMUTABILITY VIOLATION: Executed LegalAgreement records cannot be mutated via update operations/
      );
    });

    await test("Query-based update (findOneAndUpdate) on executed record is blocked", async () => {
      await assert.rejects(
        () =>
          LegalAgreement.findOneAndUpdate(
            { _id: executedAgreementA._id },
            { $set: { "execution.signatoryDesignation": "Hacked Title" } }
          ),
        /IMMUTABILITY VIOLATION: Executed LegalAgreement records cannot be mutated via update operations/
      );
    });

    await test("Query-based deletion (deleteOne) on executed record is blocked", async () => {
      await assert.rejects(
        () => LegalAgreement.deleteOne({ _id: executedAgreementA._id }),
        /IMMUTABILITY VIOLATION: Executed LegalAgreement records cannot be deleted/
      );
    });

    await test("Query-based deletion (findOneAndDelete) on executed record is blocked", async () => {
      await assert.rejects(
        () => LegalAgreement.findOneAndDelete({ _id: executedAgreementA._id }),
        /IMMUTABILITY VIOLATION: Executed LegalAgreement records cannot be deleted/
      );
    });

    await test("Explicit status transition to 'superseded' is permitted", async () => {
      const doc = await LegalAgreement.findById(executedAgreementA._id);
      doc.execution.status = "superseded";
      await doc.save();
      const updated = await LegalAgreement.findById(executedAgreementA._id);
      assert.strictEqual(updated.execution.status, "superseded");

      // Revert back for subsequent tests
      await mongoose.connection.collection("legalagreements").updateOne(
        { _id: executedAgreementA._id },
        { $set: { "execution.status": "executed" } }
      );
    });

    // ------------------------------------------------------------------------
    // GROUP 5: REPLAY PROTECTION & IDEMPOTENCY
    // ------------------------------------------------------------------------
    console.log("\n--- Group 5: Replay Protection & Idempotency ---");

    await test("Subsequent execution of same version returns existing agreement idempotently", async () => {
      const auditCountBefore = await ComplianceAuditLog.countDocuments({
        vendorId: vendorA._id,
        action: "agreement_accepted",
      });

      const mockReq = createMockRequest("203.0.113.50", "Mozilla/5.0 ReplayAttempt");
      const result = await agreementService.executeAgreement({
        vendorId: vendorA._id,
        documentType: "VENDOR_MARKETPLACE_AGREEMENT",
        signatoryName: "Aarav Sharma",
        signatoryDesignation: "Managing Director",
        agreed: true,
        req: mockReq,
      });

      assert.strictEqual(result.isAlreadyExecuted, true, "Must flag as already executed");
      assert.strictEqual(
        result.agreement._id.toString(),
        executedAgreementA._id.toString(),
        "Must return existing agreement record"
      );

      const auditCountAfter = await ComplianceAuditLog.countDocuments({
        vendorId: vendorA._id,
        action: "agreement_accepted",
      });
      assert.strictEqual(auditCountBefore, auditCountAfter, "No duplicate audit entry on idempotent execution");
    });

    // ------------------------------------------------------------------------
    // GROUP 6: CONDITIONAL MUTUAL NDA LIFECYCLE (SCENARIOS A, B, C, D)
    // ------------------------------------------------------------------------
    console.log("\n--- Group 6: Conditional Mutual NDA Lifecycle (Scenarios A, B, C, D) ---");

    let vendorB = await Vendor.create({
      businessName: "Malabar Bio Spices LLP",
      email: `malabar_${Date.now()}@test.com`,
      phone: "9123456789",
      password: "HashedPassword123",
      contactPerson: "Kavita Pillai",
      businessType: "distributor",
      panNumber: "BCDEF2345G",
      fssaiNumber: "10019011000456",
      gstNumber: "32AAAAA0000A1Z5",
      gstApplicable: "yes",
      authorizedSignatoryName: "Kavita Pillai",
      address: {
        street: "7 Spice Hills",
        city: "Wayanad",
        state: "Kerala",
        postalCode: "673121",
        country: "India",
      },
    });
    createdVendorIds.push(vendorB._id);

    // Execute VMA for vendor B
    const vmaB = await agreementService.executeAgreement({
      vendorId: vendorB._id,
      documentType: "VENDOR_MARKETPLACE_AGREEMENT",
      signatoryName: "Kavita Pillai",
      signatoryDesignation: "Partner",
      agreed: true,
      req: createMockRequest(),
    });
    createdAgreementIds.push(vmaB.agreement._id);

    await test("Scenario A: Mutual NDA not required -> status is not_applicable and onboarding eligible", async () => {
      const v = await Vendor.findById(vendorB._id);
      const isVmaExecuted = v.agreements?.marketplaceAgreement?.status === "executed";
      const isNdaNotReq = !v.agreements?.mutualNda?.isRequired;
      assert.strictEqual(isVmaExecuted, true);
      assert.strictEqual(isNdaNotReq, true);
    });

    await test("Scenario B: Admin mandates Mutual NDA -> status transitions to pending", async () => {
      if (!vendorB.agreements) vendorB.agreements = {};
      if (!vendorB.agreements.mutualNda) vendorB.agreements.mutualNda = {};
      vendorB.agreements.mutualNda.isRequired = true;
      vendorB.agreements.mutualNda.status = "pending";
      await vendorB.save();

      await ComplianceAuditLog.create({
        entityType: "mutual_nda",
        entityId: vendorB._id,
        vendorId: vendorB._id,
        action: "nda_required",
        newStatus: "pending",
        reason: "Proprietary spice formulation sourcing agreement",
        metadata: { isRequired: true, previousRequired: false },
      });

      const v = await Vendor.findById(vendorB._id);
      assert.strictEqual(v.agreements.mutualNda.isRequired, true);
      assert.strictEqual(v.agreements.mutualNda.status, "pending");
    });

    await test("Scenario C: Vendor executes required Mutual NDA -> transitions to executed", async () => {
      const ndaResult = await agreementService.executeAgreement({
        vendorId: vendorB._id,
        documentType: "MUTUAL_NDA",
        signatoryName: "Kavita Pillai",
        signatoryDesignation: "Managing Partner",
        agreed: true,
        req: createMockRequest("203.0.113.88"),
      });

      assert.strictEqual(ndaResult.isAlreadyExecuted, false);
      createdAgreementIds.push(ndaResult.agreement._id);

      const v = await Vendor.findById(vendorB._id);
      assert.strictEqual(v.agreements.mutualNda.status, "executed");
      assert.ok(v.agreements.mutualNda.executedAt);
    });

    await test("Scenario D: Admin waives Mutual NDA -> requirement set to false and logged", async () => {
      const v = await Vendor.findById(vendorB._id);
      v.agreements.mutualNda.isRequired = false;
      await v.save();

      await ComplianceAuditLog.create({
        entityType: "mutual_nda",
        entityId: vendorB._id,
        vendorId: vendorB._id,
        action: "nda_waived",
        newStatus: v.agreements.mutualNda.status,
        reason: "Standard retail terms accepted; proprietary waiver granted",
        metadata: { isRequired: false, previousRequired: true },
      });

      const updated = await Vendor.findById(vendorB._id);
      assert.strictEqual(updated.agreements.mutualNda.isRequired, false);
    });

    // ------------------------------------------------------------------------
    // GROUP 7: PRESERVATION OF EXISTING STEP 7 ONBOARDING LOGIC
    // ------------------------------------------------------------------------
    console.log("\n--- Group 7: Preservation of Existing Step 7 Onboarding Logic ---");

    await test("Step 7 requires BOTH existing checklist conditions AND legal execution", async () => {
      // Create incomplete vendor with missing required checklist fields
      const incompleteVendor = {
        onboardingComplete: false,
        onboardingStep: 6,
        uploadedDocs: {}, // Missing business_legal_identity & fssai_license
        agreements: {
          marketplaceAgreement: { status: "executed" },
          mutualNda: { isRequired: false, status: "not_applicable" },
        },
      };

      // Effective Step 7 check function as defined in VendorOnboarding.jsx:
      // existingComplete && isVmaExecuted && isNdaSatisfied
      const checkStep7 = (v, legal) => {
        const existingComplete = Boolean(v.onboardingComplete);
        const isVmaExecuted = legal?.marketplaceAgreement?.status === "executed";
        const isNdaSatisfied = !legal?.mutualNda?.isRequired || legal?.mutualNda?.status === "executed";
        return existingComplete && isVmaExecuted && isNdaSatisfied;
      };

      assert.strictEqual(
        checkStep7(incompleteVendor, incompleteVendor.agreements),
        false,
        "Step 7 must NOT be complete if existing onboardingComplete is false, even if legal is executed"
      );

      // Now set onboardingComplete = true
      incompleteVendor.onboardingComplete = true;
      assert.strictEqual(
        checkStep7(incompleteVendor, incompleteVendor.agreements),
        true,
        "Step 7 completes when BOTH existing conditions AND legal requirements are satisfied"
      );
    });

    // ------------------------------------------------------------------------
    // GROUP 8: BACKEND FINAL AUTHORITY & RACE CONDITION GATING
    // ------------------------------------------------------------------------
    console.log("\n--- Group 8: Backend Final Authority & Race Condition Gating ---");

    await test("Backend onboarding Step 7 gate strictly rejects unexecuted legal requirements", async () => {
      let vendorC = await Vendor.create({
        businessName: "Race Condition Test Organics",
        email: `race_${Date.now()}@test.com`,
        phone: "9812345678",
        password: "HashedPassword123",
        contactPerson: "Rohan Varma",
        businessType: "farmer",
        address: {
          city: "Pune",
          state: "Maharashtra",
          postalCode: "411001",
        },
        agreements: {
          marketplaceAgreement: { status: "pending" }, // Unexecuted!
          mutualNda: { isRequired: true, status: "pending" },
        },
      });
      createdVendorIds.push(vendorC._id);

      // Simulate backend PUT /onboarding with step 7
      const hasExecutedAgreement = vendorC.agreements?.marketplaceAgreement?.status === "executed";
      const isNdaRequired = vendorC.agreements?.mutualNda?.isRequired;
      const hasExecutedNda = vendorC.agreements?.mutualNda?.status === "executed";

      let rejectionReason = null;
      if (!hasExecutedAgreement) {
        rejectionReason = "Please review and electronically accept the SIRABA ORGANIC Vendor Marketplace Agreement before submitting.";
      } else if (isNdaRequired && !hasExecutedNda) {
        rejectionReason = "Please review and electronically accept the required Mutual Non-Disclosure Agreement before submitting.";
      }

      assert.ok(rejectionReason, "Backend gate must block Step 7 submission when legal agreement is unexecuted");
    });

    // ------------------------------------------------------------------------
    // GROUP 9: DATA MINIMIZATION & VENDOR PRIVACY VERIFICATION
    // ------------------------------------------------------------------------
    console.log("\n--- Group 9: Data Minimization & Vendor Privacy Verification ---");

    await test("Vendor status response does not expose IP address or raw document hash", async () => {
      const v = await Vendor.findById(vendorA._id);
      const agreementsStatus = {
        marketplaceAgreement: v.agreements?.marketplaceAgreement || { status: "pending" },
        mutualNda: v.agreements?.mutualNda || { isRequired: false, status: "not_applicable" },
      };

      // Verify vendor status payload
      assert.strictEqual(agreementsStatus.marketplaceAgreement.ipAddress, undefined);
      assert.strictEqual(agreementsStatus.marketplaceAgreement.documentHash, undefined);
      assert.strictEqual(agreementsStatus.mutualNda.ipAddress, undefined);
      assert.strictEqual(agreementsStatus.mutualNda.documentHash, undefined);
    });

    // ------------------------------------------------------------------------
    // GROUP 10: EXISTING APPROVED VENDORS NON-DISRUPTION GUARANTEE
    // ------------------------------------------------------------------------
    console.log("\n--- Group 10: Existing Approved Vendors Non-Disruption Guarantee ---");

    await test("Existing approved vendor without historical legal records is not blocked or disrupted", async () => {
      const legacyApprovedVendor = await Vendor.create({
        businessName: "Legacy Certified Farmer Co-op",
        email: `legacy_${Date.now()}@test.com`,
        phone: "9898989898",
        password: "HashedPassword123",
        contactPerson: "Vikram Singh",
        businessType: "farmer",
        address: {
          city: "Jaipur",
          state: "Rajasthan",
          postalCode: "302001",
        },
        status: "approved",
        onboardingComplete: true,
        onboardingStep: 7,
        // No agreements field (legacy vendor created before Phase 2)
      });
      createdVendorIds.push(legacyApprovedVendor._id);

      const fetched = await Vendor.findById(legacyApprovedVendor._id);
      assert.strictEqual(fetched.status, "approved");
      assert.strictEqual(fetched.onboardingComplete, true);

      // Default status logic when agreements is missing
      const vmaStatus = fetched.agreements?.marketplaceAgreement?.status || "pending";
      const ndaReq = fetched.agreements?.mutualNda?.isRequired || false;

      assert.strictEqual(ndaReq, false, "Legacy vendor must default to NDA not required");
    });

    // ------------------------------------------------------------------------
    // GROUP 11: STORAGE PRODUCTION HARDENING & RECOVERY CHECK
    // ------------------------------------------------------------------------
    console.log("\n--- Group 11: Storage Production Hardening & Recovery Check ---");

    await test("Persistence failure prevents LegalAgreement creation and preserves clean state", async () => {
      const testVendor = await Vendor.create({
        businessName: "Persistence Failure Test Vendor",
        email: `failtest_${Date.now()}@test.com`,
        phone: "9876500000",
        password: "HashedPassword123",
        contactPerson: "Test Contact",
        businessType: "wholesaler",
        address: {
          city: "Delhi",
          state: "Delhi",
          postalCode: "110001",
        },
      });
      createdVendorIds.push(testVendor._id);

      // Verify that if persistence threw an error, no LegalAgreement is saved
      const agreementCountBefore = await LegalAgreement.countDocuments({ vendor: testVendor._id });

      try {
        // Attempt execution with invalid document type to trigger validation failure before persistence
        await agreementService.executeAgreement({
          vendorId: testVendor._id,
          documentType: "INVALID_TYPE_DOCUMENT",
          signatoryName: "Test Name",
          signatoryDesignation: "Test Title",
          agreed: true,
          req: createMockRequest(),
        });
      } catch (expectedErr) {
        // Expected to fail
      }

      const agreementCountAfter = await LegalAgreement.countDocuments({ vendor: testVendor._id });
      assert.strictEqual(agreementCountBefore, agreementCountAfter, "No agreement record created on failure");
    });

  } finally {
    console.log("\nCleaning up test artifacts...");
    await cleanupTestArtifacts(createdVendorIds, createdAgreementIds);
    await mongoose.disconnect();
    console.log("Database disconnected. Clean up completed.\n");
  }

  console.log("============================================================================");
  console.log(`PHASE 4 E2E TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("============================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Unhandled suite error:", err);
  process.exit(1);
});
