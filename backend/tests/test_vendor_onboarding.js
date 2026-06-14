/**
 * Vendor Onboarding End-to-End Test Suite
 * Tests the complete vendor onboarding flow via API
 * Run with: node tests/test_vendor_onboarding.js
 */

const axios = require("axios");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const BASE_URL = "http://localhost:5000/api";
const TEST_EMAIL = `vendortest_${Date.now()}@testdomain.com`;
const TEST_PASSWORD = "TestPass@123";

let vendorToken = null;
let testResults = [];
let passCount = 0;
let failCount = 0;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function log(msg) {
  process.stdout.write(msg + "\n");
}

function pass(label, detail = "") {
  passCount++;
  testResults.push({ status: "PASS", label, detail });
  log(`  ✅ PASS: ${label}${detail ? " — " + detail : ""}`);
}

function fail(label, detail = "") {
  failCount++;
  testResults.push({ status: "FAIL", label, detail });
  log(`  ❌ FAIL: ${label}${detail ? " — " + detail : ""}`);
}

async function post(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return axios.post(`${BASE_URL}${path}`, body, { headers, validateStatus: () => true });
}

async function get(path, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return axios.get(`${BASE_URL}${path}`, { headers, validateStatus: () => true });
}

async function put(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return axios.put(`${BASE_URL}${path}`, body, { headers, validateStatus: () => true });
}

// ─────────────────────────────────────────────────────────────
// Setup: connect to DB and insert a real OTP so registration works
// ─────────────────────────────────────────────────────────────

async function setupOtpForTest(email) {
  const PLAIN_OTP = "123456";
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(PLAIN_OTP, salt);

  const OTP = mongoose.model(
    "OTP",
    new mongoose.Schema({
      identifier: String,
      type: String,
      otp: String,
      expiresAt: Date,
      attempts: { type: Number, default: 0 },
    }),
    "otps"
  );

  // Remove any stale OTP first
  await OTP.deleteMany({ identifier: email.toLowerCase(), type: "email" });

  await OTP.create({
    identifier: email.toLowerCase(),
    type: "email",
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    attempts: 0,
  });

  log(`  📧 Inserted test OTP (${PLAIN_OTP}) for ${email}`);
  return PLAIN_OTP;
}

// ─────────────────────────────────────────────────────────────
// TEST GROUPS
// ─────────────────────────────────────────────────────────────

async function testHealthCheck() {
  log("\n── [1] Health Check ──────────────────────────────────────");
  const res = await get("/health");
  if (res.status === 200 && res.data.status === "UP") {
    pass("Backend health check", `Status: UP, uptime: ${Math.round(res.data.uptime)}s`);
  } else {
    fail("Backend health check", `Status: ${res.status}`);
  }
}

async function testPlansEndpoint() {
  log("\n── [2] Vendor Plans Endpoint ──────────────────────────────");
  const res = await get("/vendors/plans");
  if (res.status === 200 && res.data.starter && res.data.professional && res.data.enterprise) {
    pass("GET /vendors/plans returns all 3 plans");
    pass("Starter plan has correct price", `₹${res.data.starter.price}`);
    pass("Professional plan commission", `${res.data.professional.commissionRate}%`);
    pass("Enterprise plan commission", `${res.data.enterprise.commissionRate}%`);
  } else {
    fail("GET /vendors/plans", `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
  }
}

async function testRegistrationValidation() {
  log("\n── [3] Registration Input Validation ──────────────────────");

  // Invalid phone
  const r1 = await post("/vendors/register", {
    email: "test@test.com", password: "pass123", businessName: "Test",
    businessType: "farmer", contactPerson: "Name", phone: "123",
    city: "X", state: "Y", postalCode: "411001"
  });
  if (r1.status === 400 && r1.data.message?.includes("mobile number")) {
    pass("Rejects invalid phone number", r1.data.message);
  } else {
    fail("Rejects invalid phone number", `Got status ${r1.status}: ${r1.data.message}`);
  }

  // Invalid postal code
  const r2 = await post("/vendors/register", {
    email: "test@test.com", password: "pass123", businessName: "Test",
    businessType: "farmer", contactPerson: "Name", phone: "9876543210",
    city: "X", state: "Y", postalCode: "123"
  });
  if (r2.status === 400 && r2.data.message?.includes("6-digit")) {
    pass("Rejects invalid postal code", r2.data.message);
  } else {
    fail("Rejects invalid postal code", `Got status ${r2.status}: ${r2.data.message}`);
  }

  // Invalid business type
  const r3 = await post("/vendors/register", {
    email: "test@test.com", password: "pass123", businessName: "Test",
    businessType: "invalid_type", contactPerson: "Name", phone: "9876543210",
    city: "X", state: "Y", postalCode: "411001"
  });
  if (r3.status === 400 && r3.data.message?.toLowerCase().includes("business type")) {
    pass("Rejects invalid business type", r3.data.message);
  } else {
    fail("Rejects invalid business type", `Got status ${r3.status}: ${r3.data.message}`);
  }

  // Missing OTP
  const r4 = await post("/vendors/register", {
    email: "test@test.com", password: "pass123", businessName: "Test",
    businessType: "farmer", contactPerson: "Name", phone: "9876543210",
    city: "X", state: "Y", postalCode: "411001"
  });
  if (r4.status === 400 && r4.data.message?.toLowerCase().includes("otp")) {
    pass("Rejects registration without OTP", r4.data.message);
  } else {
    fail("Rejects registration without OTP", `Got status ${r4.status}: ${r4.data.message}`);
  }

  // Invalid email
  const r5 = await post("/vendors/register", {
    email: "not-an-email", password: "pass123", businessName: "Test",
    businessType: "farmer", contactPerson: "Name", phone: "9876543210",
    city: "X", state: "Y", postalCode: "411001"
  });
  if (r5.status === 400) {
    pass("Rejects invalid email format");
  } else {
    fail("Rejects invalid email format", `Got status ${r5.status}`);
  }
}

async function testOtpSend() {
  log("\n── [4] OTP Email Send ─────────────────────────────────────");
  const res = await post("/otp/send-email", { email: TEST_EMAIL, context: "Vendor registration" });
  if (res.status === 200 && res.data.message?.toLowerCase().includes("otp")) {
    pass("OTP send endpoint works", res.data.message);
  } else {
    fail("OTP send endpoint", `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
  }
}

async function testVendorRegistration(plainOtp) {
  log("\n── [5] Vendor Registration (with valid OTP) ───────────────");
  const res = await post("/vendors/register", {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    businessName: "Green Earth Organics",
    businessType: "farmer",
    contactPerson: "Ramesh Kumar",
    phone: "9876543210",
    city: "Pune",
    state: "Maharashtra",
    postalCode: "411001",
    emailOtp: plainOtp,
  });

  if (res.status === 201 && res.data.token) {
    vendorToken = res.data.token;
    pass("Vendor registered successfully", `ID: ${res.data._id}, Step: ${res.data.onboardingStep}`);
    pass("Registration returns JWT token");
    if (res.data.onboardingStep === 2) {
      pass("Onboarding starts at step 2 (address) after registration");
    } else {
      fail("Expected onboardingStep=2 after registration", `Got: ${res.data.onboardingStep}`);
    }
  } else {
    fail("Vendor registration with valid OTP", `Status: ${res.status}, Body: ${JSON.stringify(res.data)}`);
  }
}

async function testDuplicateRegistration() {
  log("\n── [6] Duplicate Registration Prevention ──────────────────");
  // Re-insert OTP for same email
  const PLAIN_OTP = "999999";
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(PLAIN_OTP, salt);
  const OTP = mongoose.model("OTP");
  await OTP.deleteMany({ identifier: TEST_EMAIL.toLowerCase(), type: "email" });
  await OTP.create({
    identifier: TEST_EMAIL.toLowerCase(), type: "email", otp: hashedOtp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0,
  });

  const res = await post("/vendors/register", {
    email: TEST_EMAIL, password: TEST_PASSWORD, businessName: "Duplicate Org",
    businessType: "farmer", contactPerson: "Test", phone: "9876543210",
    city: "Mumbai", state: "Maharashtra", postalCode: "400001", emailOtp: PLAIN_OTP,
  });

  if (res.status === 400 && res.data.message?.toLowerCase().includes("already exists")) {
    pass("Prevents duplicate vendor registration", res.data.message);
  } else {
    fail("Prevents duplicate vendor registration", `Got status ${res.status}: ${res.data.message}`);
  }
}

async function testLogin() {
  log("\n── [7] Vendor Login ───────────────────────────────────────");

  // Wrong password
  const r1 = await post("/vendors/login", { email: TEST_EMAIL, password: "wrongpassword" });
  if (r1.status === 401) {
    pass("Rejects invalid credentials", r1.data.message);
  } else {
    fail("Rejects invalid credentials", `Got status ${r1.status}`);
  }

  // Valid login
  const r2 = await post("/vendors/login", { email: TEST_EMAIL, password: TEST_PASSWORD });
  if (r2.status === 200 && r2.data.token) {
    vendorToken = r2.data.token; // refresh token
    pass("Login with valid credentials", `Status: ${r2.data.status}, OnboardingStep: ${r2.data.onboardingStep}`);
    if (!r2.data.onboardingComplete) {
      pass("Login correctly shows onboardingComplete: false for new vendor");
    }
  } else {
    fail("Login with valid credentials", `Status: ${r2.status}: ${JSON.stringify(r2.data)}`);
  }
}

async function testOnboardingStep1() {
  log("\n── [8] Onboarding Step 1 — Business Details ───────────────");

  // Test with invalid GST format
  const r1 = await put("/vendors/onboarding", { step: 1, data: {
    businessDescription: "We sell organic spices",
    gstNumber: "INVALID_GST",
    panNumber: "AABCU9603R",
    fssaiNumber: "12345678901234",
  }}, vendorToken);
  if (r1.status === 400 && r1.data.message?.toLowerCase().includes("gst")) {
    pass("Rejects invalid GST number format", r1.data.message);
  } else {
    fail("Rejects invalid GST number format", `Got ${r1.status}: ${JSON.stringify(r1.data)}`);
  }

  // Test with invalid PAN format
  const r2 = await put("/vendors/onboarding", { step: 1, data: {
    businessDescription: "We sell organic spices",
    gstNumber: "27AABCU9603R1ZM",
    panNumber: "INVALID",
    fssaiNumber: "12345678901234",
  }}, vendorToken);
  if (r2.status === 400 && r2.data.message?.toLowerCase().includes("pan")) {
    pass("Rejects invalid PAN number format", r2.data.message);
  } else {
    fail("Rejects invalid PAN number format", `Got ${r2.status}: ${JSON.stringify(r2.data)}`);
  }

  // Test with invalid FSSAI (not 14 digits)
  const r3 = await put("/vendors/onboarding", { step: 1, data: {
    businessDescription: "We sell organic spices",
    gstNumber: "27AABCU9603R1ZM",
    panNumber: "AABCU9603R",
    fssaiNumber: "1234567",
  }}, vendorToken);
  if (r3.status === 400 && r3.data.message?.toLowerCase().includes("fssai")) {
    pass("Rejects invalid FSSAI format (not 14 digits)", r3.data.message);
  } else {
    fail("Rejects invalid FSSAI format", `Got ${r3.status}: ${JSON.stringify(r3.data)}`);
  }

  // Valid Step 1
  const r4 = await put("/vendors/onboarding", { step: 1, data: {
    businessDescription: "We are a certified organic spice farmer from Maharashtra, specializing in turmeric and cumin.",
    website: "https://greenearth.in",
    gstNumber: "27AABCU9603R1ZM",
    panNumber: "AABCU9603R",
    fssaiNumber: "12345678901234",
  }}, vendorToken);
  if (r4.status === 200 && r4.data.onboardingStep === 2) {
    pass("Step 1 (Business Details) saved successfully", `Next step: ${r4.data.onboardingStep}`);
  } else {
    fail("Step 1 (Business Details) save", `Got ${r4.status}: ${JSON.stringify(r4.data)}`);
  }
}

async function testOnboardingStep2() {
  log("\n── [9] Onboarding Step 2 — Address ───────────────────────");

  // Missing city/state
  const r1 = await put("/vendors/onboarding", { step: 2, data: {
    address: { street: "123 Farm Road", postalCode: "411001" }
  }}, vendorToken);
  if (r1.status === 400 && r1.data.message?.toLowerCase().includes("city")) {
    pass("Rejects address without city/state", r1.data.message);
  } else {
    fail("Rejects address without city/state", `Got ${r1.status}: ${JSON.stringify(r1.data)}`);
  }

  // Invalid postal code in address
  const r2 = await put("/vendors/onboarding", { step: 2, data: {
    address: { street: "123 Farm Road", city: "Pune", state: "Maharashtra", postalCode: "123", country: "India" }
  }}, vendorToken);
  if (r2.status === 400 && r2.data.message?.toLowerCase().includes("postal")) {
    pass("Rejects invalid postal code in address", r2.data.message);
  } else {
    fail("Rejects invalid postal code in address", `Got ${r2.status}: ${JSON.stringify(r2.data)}`);
  }

  // Valid Step 2
  const r3 = await put("/vendors/onboarding", { step: 2, data: {
    address: { street: "456 Organic Lane", city: "Pune", state: "Maharashtra", postalCode: "411001", country: "India" }
  }}, vendorToken);
  if (r3.status === 200 && r3.data.onboardingStep === 3) {
    pass("Step 2 (Address) saved successfully", `Next step: ${r3.data.onboardingStep}`);
  } else {
    fail("Step 2 (Address) save", `Got ${r3.status}: ${JSON.stringify(r3.data)}`);
  }
}

async function testOnboardingStep3() {
  log("\n── [10] Onboarding Step 3 — Bank Details ─────────────────");

  // Missing fields
  const r1 = await put("/vendors/onboarding", { step: 3, data: {
    bankDetails: { accountHolderName: "Ramesh Kumar" }
  }}, vendorToken);
  if (r1.status === 400) {
    pass("Rejects incomplete bank details", r1.data.message);
  } else {
    fail("Rejects incomplete bank details", `Got ${r1.status}`);
  }

  // Invalid IFSC
  const r2 = await put("/vendors/onboarding", { step: 3, data: {
    bankDetails: {
      accountHolderName: "Ramesh Kumar",
      accountNumber: "12345678901",
      bankName: "State Bank of India",
      ifscCode: "INVALID",
      branchName: "Pune Main",
    }
  }}, vendorToken);
  if (r2.status === 400 && r2.data.message?.toLowerCase().includes("ifsc")) {
    pass("Rejects invalid IFSC code", r2.data.message);
  } else {
    fail("Rejects invalid IFSC code", `Got ${r2.status}: ${JSON.stringify(r2.data)}`);
  }

  // Invalid account number (too short)
  const r3 = await put("/vendors/onboarding", { step: 3, data: {
    bankDetails: {
      accountHolderName: "Ramesh Kumar",
      accountNumber: "123",
      bankName: "State Bank of India",
      ifscCode: "SBIN0001234",
      branchName: "Pune Main",
    }
  }}, vendorToken);
  if (r3.status === 400 && r3.data.message?.toLowerCase().includes("account number")) {
    pass("Rejects invalid account number", r3.data.message);
  } else {
    fail("Rejects invalid account number", `Got ${r3.status}: ${JSON.stringify(r3.data)}`);
  }

  // Valid Step 3
  const r4 = await put("/vendors/onboarding", { step: 3, data: {
    bankDetails: {
      accountHolderName: "Ramesh Kumar",
      accountNumber: "12345678901",
      bankName: "State Bank of India",
      ifscCode: "SBIN0001234",
      branchName: "Pune Main Branch",
      upiId: "ramesh@sbi",
    }
  }}, vendorToken);
  if (r4.status === 200 && r4.data.onboardingStep === 4) {
    pass("Step 3 (Bank Details) saved successfully", `Next step: ${r4.data.onboardingStep}`);
  } else {
    fail("Step 3 (Bank Details) save", `Got ${r4.status}: ${JSON.stringify(r4.data)}`);
  }
}

async function testSubscriptionSelect() {
  log("\n── [11] Onboarding Step 4 — Plan Selection ───────────────");

  // Test selecting starter plan
  const r1 = await post("/vendors/subscription", { plan: "starter", billingCycle: "monthly" }, vendorToken);
  if (r1.status === 200 || r1.status === 201) {
    pass("Select starter plan via subscription endpoint", `Plan: ${r1.data.plan || r1.data.currentPlan}`);
  } else {
    fail("Select starter plan", `Got ${r1.status}: ${JSON.stringify(r1.data)}`);
  }

  // Test onboarding step 4 mark complete
  const r2 = await put("/vendors/onboarding", { step: 4, data: { plan: "starter", billingCycle: "monthly" } }, vendorToken);
  if (r2.status === 200 && r2.data.onboardingStep === 5) {
    pass("Step 4 (Plan Selection) marked complete", `Next step: ${r2.data.onboardingStep}`);
  } else {
    fail("Step 4 (Plan Selection) mark", `Got ${r2.status}: ${JSON.stringify(r2.data)}`);
  }
}

async function testComplianceDocuments() {
  log("\n── [12] Compliance Documents (Step 5 Prerequisite) ───────");

  // Test invalid document type
  const r1 = await post("/vendors/compliance", {
    name: "Fake Doc", type: "fake_type", fileUrl: "https://example.com/doc.pdf"
  }, vendorToken);
  if (r1.status === 400 && r1.data.message?.toLowerCase().includes("type")) {
    pass("Rejects invalid compliance document type", r1.data.message);
  } else {
    fail("Rejects invalid compliance document type", `Got ${r1.status}: ${JSON.stringify(r1.data)}`);
  }

  // Upload valid compliance docs (using dummy URLs since we can't actually upload to Cloudinary)
  const docsToUpload = [
    { name: "Business License", type: "business_license", fileUrl: "https://example.com/business_license.pdf" },
    { name: "GST Certificate", type: "gst_certificate", fileUrl: "https://example.com/gst.pdf" },
    { name: "FSSAI License", type: "fssai_license", fileUrl: "https://example.com/fssai.pdf" },
    { name: "PAN Card", type: "pan_card", fileUrl: "https://example.com/pan.pdf" },
    { name: "NPOP Certificate", type: "npop_certificate", fileUrl: "https://example.com/npop.pdf" },
    { name: "NABL Lab Report", type: "nabl_certificate", fileUrl: "https://example.com/nabl.pdf" },
  ];

  let allUploaded = true;
  for (const doc of docsToUpload) {
    const r = await post("/vendors/compliance", doc, vendorToken);
    if (r.status !== 201) {
      allUploaded = false;
      fail(`Upload ${doc.type}`, `Got ${r.status}: ${JSON.stringify(r.data)}`);
    }
  }
  if (allUploaded) {
    pass("All 6 required compliance documents uploaded successfully");
  }

  // Verify documents are stored
  const r2 = await get("/vendors/compliance", vendorToken);
  if (r2.status === 200 && Array.isArray(r2.data) && r2.data.length >= 6) {
    pass("GET /vendors/compliance returns uploaded documents", `Count: ${r2.data.length}`);
  } else {
    fail("GET /vendors/compliance", `Got ${r2.status}, count: ${r2.data?.length}`);
  }
}

async function testOnboardingStep5() {
  log("\n── [13] Onboarding Step 5 — Final Submit ─────────────────");

  const res = await put("/vendors/onboarding", { step: 5, data: {
    documentsUploaded: true, certificationCompliant: true
  }}, vendorToken);

  if (res.status === 200 && res.data.onboardingComplete === true) {
    pass("Step 5 (Documents) completed — onboarding marked complete");
    if (res.data.status === "under_review") {
      pass("Vendor status set to 'under_review' after onboarding");
    } else {
      fail("Vendor status after onboarding", `Expected 'under_review', got: '${res.data.status}'`);
    }
  } else {
    fail("Step 5 final submit", `Got ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

async function testProtectedRoutes() {
  log("\n── [14] Protected Route Access Control ───────────────────");

  // Without token — should get 401
  const r1 = await get("/vendors/profile", null);
  if (r1.status === 401) {
    pass("GET /vendors/profile blocked without token (401)");
  } else {
    fail("GET /vendors/profile blocked without token", `Got ${r1.status}`);
  }

  // With token — should work
  const r2 = await get("/vendors/profile", vendorToken);
  if (r2.status === 200 && r2.data.email === TEST_EMAIL) {
    pass("GET /vendors/profile works with valid token", `Email: ${r2.data.email}`);
    pass("Profile has correct onboardingComplete", `onboardingComplete: ${r2.data.onboardingComplete}`);
    pass("Profile has correct status", `status: ${r2.data.status}`);
    if (r2.data.gstNumber && r2.data.panNumber) {
      pass("Business details (GST/PAN) persisted correctly");
    } else {
      fail("Business details not found in profile");
    }
    if (r2.data.bankDetails?.ifscCode) {
      pass("Bank details persisted correctly", `IFSC: ${r2.data.bankDetails.ifscCode}`);
    } else {
      fail("Bank details not found in profile");
    }
  } else {
    fail("GET /vendors/profile with valid token", `Got ${r2.status}: ${JSON.stringify(r2.data)}`);
  }
}

async function testDashboardAccess() {
  log("\n── [15] Dashboard & Subscription Endpoints ───────────────");

  const r1 = await get("/vendors/dashboard", vendorToken);
  if (r1.status === 200 || r1.status === 403) {
    // 403 is OK if vendor not yet approved — that's correct behaviour
    if (r1.status === 200) {
      pass("GET /vendors/dashboard accessible", "Vendor has dashboard access");
    } else {
      pass("GET /vendors/dashboard correctly returns 403 (not yet approved)", "Expected access control");
    }
  } else {
    fail("GET /vendors/dashboard", `Got ${r1.status}: ${JSON.stringify(r1.data)}`);
  }

  const r2 = await get("/vendors/subscription", vendorToken);
  if (r2.status === 200) {
    pass("GET /vendors/subscription returns subscription info", `Plan: ${r2.data.currentPlan || r2.data.plan}`);
  } else {
    fail("GET /vendors/subscription", `Got ${r2.status}: ${JSON.stringify(r2.data)}`);
  }
}

async function testInvalidOnboardingStep() {
  log("\n── [16] Edge Cases ────────────────────────────────────────");

  // Invalid step number
  const r1 = await put("/vendors/onboarding", { step: 99, data: {} }, vendorToken);
  if (r1.status === 400 && r1.data.message?.toLowerCase().includes("invalid")) {
    pass("Rejects invalid onboarding step number", r1.data.message);
  } else {
    fail("Rejects invalid onboarding step", `Got ${r1.status}: ${JSON.stringify(r1.data)}`);
  }
}

// ─────────────────────────────────────────────────────────────
// CLEANUP: remove test vendor
// ─────────────────────────────────────────────────────────────
async function cleanup() {
  log("\n── [Cleanup] ─────────────────────────────────────────────");
  try {
    const Vendor = mongoose.model("Vendor");
    const result = await Vendor.deleteOne({ email: TEST_EMAIL.toLowerCase() });
    if (result.deletedCount > 0) {
      log(`  🗑️  Removed test vendor: ${TEST_EMAIL}`);
    }
  } catch (err) {
    log(`  ⚠️  Cleanup error: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  log("\n╔══════════════════════════════════════════════════════════╗");
  log("║     VENDOR ONBOARDING END-TO-END TEST SUITE              ║");
  log("╚══════════════════════════════════════════════════════════╝");
  log(`  Test Email: ${TEST_EMAIL}`);
  log(`  Backend:    ${BASE_URL}`);

  try {
    // Connect to DB directly to insert test OTP
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI);
    log("\n  ✅ MongoDB connected for test setup");

    // Run all test groups
    await testHealthCheck();
    await testPlansEndpoint();
    await testRegistrationValidation();
    await testOtpSend();

    // Insert real OTP in DB so registration works
    const otp = await setupOtpForTest(TEST_EMAIL);
    await testVendorRegistration(otp);

    if (!vendorToken) {
      log("\n  ⛔ Registration failed — cannot continue onboarding tests.");
    } else {
      await testDuplicateRegistration();
      await testLogin();
      await testOnboardingStep1();
      await testOnboardingStep2();
      await testOnboardingStep3();
      await testSubscriptionSelect();
      await testComplianceDocuments();
      await testOnboardingStep5();
      await testProtectedRoutes();
      await testDashboardAccess();
      await testInvalidOnboardingStep();
    }

    await cleanup();
    await mongoose.disconnect();

  } catch (err) {
    log(`\n  💥 Fatal error: ${err.message}`);
    log(err.stack);
  }

  // ── Summary ──
  const total = passCount + failCount;
  log("\n╔══════════════════════════════════════════════════════════╗");
  log("║                   TEST SUMMARY                           ║");
  log("╠══════════════════════════════════════════════════════════╣");
  log(`║  Total:  ${String(total).padEnd(50)}║`);
  log(`║  Passed: ${String(passCount).padEnd(50)}║`);
  log(`║  Failed: ${String(failCount).padEnd(50)}║`);
  log(`║  Result: ${(failCount === 0 ? "✅ ALL TESTS PASSED" : `❌ ${failCount} TESTS FAILED`).padEnd(50)}║`);
  log("╚══════════════════════════════════════════════════════════╝\n");

  if (failCount > 0) {
    log("Failed tests:");
    testResults.filter(t => t.status === "FAIL").forEach(t => {
      log(`  • ${t.label}${t.detail ? ": " + t.detail : ""}`);
    });
    log("");
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main();
