# SIRABA ORGANIC — SHIPROCKET LOGISTICS INTEGRATION
## COMPLETE END-TO-END AUDIT, FUNCTIONAL VERIFICATION & ARCHITECTURAL GAP ANALYSIS

**Audit Date:** September 30, 2026  
**Auditor:** Antigravity AI Engineering & Logistics Systems Auditor  
**Repository:** `Siraba-Organic-online-forked`  
**Integration Status:** **NOT READY FOR PRODUCTION**  

---

# 1. EXECUTIVE SUMMARY

| Audit Dimension | Status | Summary Verdict |
| :--- | :--- | :--- |
| **Shiprocket Integration** | **NOT READY** | Core API authentication and serviceability work against live Shiprocket API, but the end-to-end shipment lifecycle has critical disconnects. |
| **AWB Generation** | **PARTIAL** | Functional within `shiprocketService.assignAwb()` and `createShipment()`, but decoupled from vendor status updates and completely broken in `vendorRoutes.js`. |
| **Pickup Scheduling** | **FAIL** | `generatePickup()` exists in `shiprocketService.js` but is **only called on shipment retries** (`if (vendorOrder.shipmentId)`). It is **omitted on the fresh creation path**; couriers are never dispatched automatically for new orders. |
| **Webhook Synchronization** | **PARTIAL** | Webhook endpoint (`/api/fulfillment/status`) verifies signatures, handles state hierarchy, and is idempotent, but `s.includes("PICKUP")` erroneously maps "PICKUP FAILED" to `pickup_scheduled`, delivery failures are ignored, and `shiprocketController.js` is orphaned. |
| **Customer Tracking** | **PASS** | `formatOrderTrackingData` provides a multi-tenant secured, non-mocked timeline with real fallback handling for carrier latency. |
| **Vendor Notification** | **NOT IMPLEMENTED** | Zero vendor email notifications for shipping events; zero notifications for new orders, AWB assignment, or pickup events. |
| **RTO Handling** | **PARTIAL** | Terminal state protection exists, but all RTO sub-statuses ("RTO INITIATED", "RTO OFD", "RTO DELIVERED") are collapsed into a single generic status `"rto"` with no reverse logistics tracking. |
| **Overall Logistics Lifecycle** | **INCOMPLETE** | A successful AWB creation does NOT equal a complete integration. The package remains stranded at the vendor location without manual dashboard intervention. |

---

# 2. CURRENT ARCHITECTURE

Siraba Organic is a multi-vendor organic marketplace where an order placed by a customer may contain products originating from multiple distinct vendors. Each vendor fulfills items from their own warehouse/farm facility.

### Architecture Data & Control Flow:

```text
                             CUSTOMER CHECKOUT
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
     Prepaid (Online)                                     COD Order
           │                                                   │
     Razorpay Gateway                                   Order Controller
  (paymentController / Webhook)                                │
           │                                                   │
           └─────────────────────────┬─────────────────────────┘
                                     │
                                     ▼
                          Parent Order Created (MongoDB)
                                     │
                     VendorOrder Partitioning (Per Vendor)
                                     │
                         BullMQ Shipment Queue
                      (Queue: 'shiprocket-shipments')
                                     │
                                     ▼
                             BullMQ Worker
                      (jobs/shiprocketQueue.js)
                                     │
                                     ▼
                            Shiprocket Service
                     (services/shiprocketService.js)
                                     │
              ┌──────────────────────┴──────────────────────┐
              ▼                                             ▼
   Vendor Location Lookup                        Shiprocket Authentication
(verifyPickupLocation against API)             (POST /auth/login - Token Cache)
              │                                             │
              └──────────────────────┬──────────────────────┘
                                     │
                                     ▼
                            Shiprocket REST API
                       POST /orders/create/adhoc
                                     │
                                     ▼
                           Shiprocket Shipment ID
                                     │
                                     ▼
                            AWB Assignment
                        POST /courier/assign/awb
                                     │
             ┌───────────────────────┴───────────────────────┐
             │ [CRITICAL GAP: generatePickup OMITTED HERE]   │
             └───────────────────────────────────────────────┘
                                     │
                      (Status stays 'processing')
                                     │
                          Courier Event in Transit
                                     │
                                     ▼
                         Shiprocket Status Webhook
                 (POST /api/fulfillment/status or /webhook)
                                     │
                                     ▼
                    Webhook Route (shiprocketWebhookRoutes.js)
            - Auth check (x-api-key)
            - Idempotency check (WebhookLog)
            - Transition hierarchy validation (isTransitionAllowed)
            - Parent Order status aggregation
            - Socket.IO Realtime update
```

### Discovered Implementation Files & Responsibilities:

| Component | Exact Repository File | Primary Functions / Responsibility |
| :--- | :--- | :--- |
| **Shiprocket Service** | [backend/services/shiprocketService.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/shiprocketService.js) | `login()`, `registerPickupLocation()`, `checkServiceability()`, `verifyPickupLocation()`, `assignAwb()`, `generatePickup()`, `createShipment()`, `cancelShipment()`, `rollbackInventory()`, `trackOrder()` |
| **Asynchronous Job Queue** | [backend/jobs/shiprocketQueue.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/jobs/shiprocketQueue.js) | BullMQ `shipmentQueue`, `enqueueShipment()`, and `shipmentWorker` consumer |
| **Webhook Handler (Active)** | [backend/routes/shiprocketWebhookRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/shiprocketWebhookRoutes.js) | Mounted at `/api/fulfillment/status` & `/api/shiprocket/webhook`; verifies `x-api-key`, deduplicates via `WebhookLog`, maps status, updates DB |
| **Webhook Handler (Orphaned)** | [backend/controllers/shiprocketController.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/controllers/shiprocketController.js) | Unmounted dead code containing unused `handleWebhook` |
| **Shiprocket Admin Routes** | [backend/routes/shiprocketRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/shiprocketRoutes.js) | `GET /track/:awbCode`, `GET /serviceability`, `POST /retry/:vendorOrderId` |
| **Shipping Economics** | [backend/routes/shippingRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/shippingRoutes.js) | `calculateShipping()`: multi-vendor rate aggregation, dynamic ₹999 threshold |
| **Order Management** | [backend/routes/orderRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/orderRoutes.js) | Order placement, COD queueing, `formatOrderTrackingData()`, tracking endpoints |
| **Payment Trigger** | [backend/controllers/paymentController.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/controllers/paymentController.js) | Enqueues prepaid shipments to BullMQ upon verification |
| **Razorpay Webhook Trigger**| [backend/controllers/razorpayWebhook.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/controllers/razorpayWebhook.js) | Asynchronous webhook fallback enqueuing prepaid shipments |
| **Vendor Order Routes** | [backend/routes/vendorRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/vendorRoutes.js) | Vendor order listing, pickup address updates with OTP, buggy status update hook |
| **Database Models** | [backend/models/](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models) | `Order.js`, `VendorOrder.js`, `Vendor.js`, `WebhookLog.js`, `Notification.js` |

---

# 3. SHIPROCKET API INTEGRATION

| API Operation | Shiprocket API Endpoint | Siraba Implementation | Status | Audit Findings |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `POST /auth/login` | `shiprocketService.login()` | **PARTIAL** | Successful auth against live API (JWT returned). Caches in memory & Redis for 8 days. **Flaw:** No 401 interceptor; if token is invalidated in Shiprocket, system keeps sending stale token for up to 8 days. |
| **Location Registration** | `POST /settings/company/addpickup` | `shiprocketService.registerPickupLocation()` | **PASS** | Validates pincode, address, sanitizes location name to <= 36 alphanumeric characters, handles existing locations. |
| **Location Verification** | `GET /settings/company/pickup` | `shiprocketService.verifyPickupLocation()` | **PASS** | Queries registered shipping addresses in Shiprocket to prevent using unregistered pickup locations. |
| **Serviceability Check** | `GET /courier/serviceability/` | `shiprocketService.checkServiceability()` | **PASS** | Correctly queries couriers between pickup and delivery postcodes, calculates best courier based on ETD, rating, and rate. Verified live: returned DTDC Surface (₹63.72). |
| **Order/Shipment Creation** | `POST /orders/create/adhoc` | `shiprocketService.createShipment()` | **PASS** | Properly constructs multi-vendor payload. Resolves vendor pickup code, passes clean phone, dimensions, items, and delivery address. |
| **AWB Assignment** | `POST /courier/assign/awb` | `shiprocketService.assignAwb()` | **PASS** | Auto-invoked if AWB code was not returned immediately in order creation response. |
| **Pickup Scheduling** | `POST /courier/generate/pickup` | `shiprocketService.generatePickup()` | **FAIL** | Implemented as a method, but **only called inside the retry/reuse branch** (`vendorOrder.shipmentId != null`). **Omitted from fresh shipment creation!** |
| **Shipment Cancellation** | `POST /orders/cancel/awb` | `shiprocketService.cancelShipment()` | **FAIL** | Method exists as `cancelShipment(awbCode)`, but calling sites in `orderRoutes.js` and `vendorRoutes.js` call `cancelOrder(vendorOrder.trackingNumber)`, which crashes with `TypeError`! |
| **Shipment Tracking** | `GET /courier/track/awb/:awbCode` | `shiprocketService.trackOrder()` | **PASS** | Live tracking queries carrier data via Shiprocket API. |

---

# 4. SHIPMENT LIFECYCLE & TRACEABILITY

### Happy Path Verification:

```text
[1] Customer Order Placed
    │  Order created in MongoDB with status: 'Pending'
    │  Items partitioned into VendorOrder documents (status: 'pending')
    ▼
[2] Payment Verification (Online or COD)
    │  Prepaid: paymentController / razorpayWebhook enqueues BullMQ job
    │  COD: orderRoutes immediately enqueues BullMQ job
    ▼
[3] BullMQ Job Processing ('create-shipment')
    │  Checks idempotency: if vendorOrder.shiprocketOrderId exists -> skip
    │  Resolves vendor & verifies pickup location against Shiprocket
    ▼
[4] Shiprocket Adhoc Order & Shipment Created
    │  POST /orders/create/adhoc
    │  Returns shiprocketOrderId and shipmentId
    ▼
[5] AWB Generation
    │  POST /courier/assign/awb
    │  awbCode, courierName, courierId saved to VendorOrder
    │  VendorOrder status updated to: 'processing'
    ▼
[6] Pickup Scheduling — [CRITICAL BREAKAGE]
    │  generatePickup() IS NOT CALLED!
    │  Package is NEVER scheduled for pickup by courier.
    │  The lifecycle stalls here unless manually scheduled via Shiprocket dashboard.
    ▼
[7] Physical Pickup & Manifest
    │  (Requires manual dashboard scheduling)
    │  When courier picks up, Shiprocket fires webhook: 'PICKED UP' / 'IN TRANSIT'
    ▼
[8] In Transit
    │  Webhook received -> VendorOrder.status = 'in_transit'
    │  Parent Order.status = 'Shipped'
    ▼
[9] Out for Delivery
    │  Webhook received -> VendorOrder.status = 'out_for_delivery'
    ▼
[10] Delivered
    │  Webhook received -> VendorOrder.status = 'delivered', deliveredAt set
    │  If all VendorOrders delivered -> Parent Order.status = 'Delivered', isDelivered = true
```

### Exception Paths Verification:

```text
[A] Pickup Location Unverified:
    │  verifyPickupLocation returns false -> Throws PICKUP_LOCATION_NOT_REGISTERED
    │  Worker marks VendorOrder.status = 'shipment_blocked_pickup_unverified'
    │  Error logged, Notification created. (Safe, non-destructive ✓)

[B] Shiprocket API Failure / Timeout:
    │  BullMQ retries 3 times with exponential backoff (5s, 10s, 20s).
    │  After 3 failures: VendorOrder.status = 'partially_failed'
    │  Parent Order remains confirmed. (Safe ✓)

[C] Pickup Failed:
    │  Webhook received with status "PICKUP FAILED".
    │  [BUG]: shiprocketWebhookRoutes.js line 28 matches s.includes("PICKUP").
    │  VendorOrder is WRONGLY marked as 'pickup_scheduled' instead of recording failure!

[D] Delivery Failed / Undelivered:
    │  Webhook received with status "UNDELIVERED" or "DELIVERY FAILED".
    │  [BUG]: Falls through to default "processing", rejected by isTransitionAllowed hierarchy.
    │  Failure event is silently lost!

[E] RTO Initiated / In Transit / Delivered:
    │  Webhook received -> VendorOrder.status = 'rto'.
    │  Terminal state protection prevents regression to in_transit.
    │  [GAP]: Single 'rto' status loses distinction between RTO in-transit vs delivered back to vendor.
```

---

# 5. WEBHOOK & TRACKING SYNCHRONIZATION ANALYSIS

### 1. Webhook Ingestion & Dual Route Mounting:
The webhook is mounted at:
- `POST /api/fulfillment/status` (Recommended)
- `POST /api/shiprocket/webhook` (Legacy)

In `server.js`, line 87 mistakenly mounts `app.use("/api/shiprocket", shiprocketRoutes)` before `express.json()`, and mounts it again on line 190. While the webhook routes are mounted on lines 191–193 after `express.json()`, the duplicate mount at line 87 is an architectural flaw.

### 2. Orphaned Controller:
`backend/controllers/shiprocketController.js` contains a complete webhook implementation that is **never imported or routed anywhere**. The actual production webhook logic resides entirely in `backend/routes/shiprocketWebhookRoutes.js`.

### 3. Authentication & Security Vulnerability:
```javascript
const incomingToken = req.headers["x-api-key"] || req.headers["x-shiprocket-secret"] || req.headers["shiprocket-secret"];
const expectedSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;

if (expectedSecret && incomingToken !== expectedSecret) {
  return res.status(401).json({ message: "Invalid webhook secret" });
}
```
**Vulnerability:** If `SHIPROCKET_WEBHOOK_SECRET` is unset in `.env`, `expectedSecret` is falsy, and the webhook **accepts unauthenticated spoofed payloads from anywhere on the internet**.

### 4. Status Mapping Audit:

| Shiprocket / Courier Status | Siraba Status | Correct? | Detailed Evaluation |
| :--- | :--- | :--- | :--- |
| `AWB Assigned` | `processing` | **PARTIAL** | Kept in `processing`. AWB exists, but pickup is not scheduled. |
| `Pickup Scheduled` | `pickup_scheduled` | **PASS** | Correctly maps manifest/pickup scheduled. |
| `Pickup Pending` | `pickup_scheduled` | **FAIL** | Matches `s.includes("PICKUP")`; marks as scheduled even if pending. |
| `Picked Up` | `in_transit` | **PARTIAL** | Collapses physical pickup event into general in-transit state. |
| `In Transit` | `in_transit` | **PASS** | Correctly maps in transit. |
| `Out for Delivery` | `out_for_delivery` | **PASS** | Correctly maps out for delivery. |
| `Delivered` | `delivered` | **PASS** | Correctly maps delivered, sets `deliveredAt`, updates parent order. |
| `Pickup Failed` | `pickup_scheduled` | **CRITICAL FAIL** | **Catastrophic substring match:** `s.includes("PICKUP")` causes pickup failure to be recorded as "pickup scheduled"! |
| `Delivery Failed` | `processing` (ignored) | **HIGH FAIL** | "DELIVERY FAILED" or "UNDELIVERED" falls through to `processing`, which is discarded by `isTransitionAllowed`. |
| `RTO Initiated` | `rto` | **PASS** | Correctly moves to RTO. |
| `RTO In Transit` | `rto` | **PARTIAL** | Collapses in-transit return into generic RTO. |
| `RTO Delivered` | `rto` | **PARTIAL** | Lumps return delivery with initiation; vendor cannot tell if goods returned. |
| `Cancelled` | `cancelled` | **PASS** | Correctly marks cancelled. |

---

# 6. VENDOR NOTIFICATION ANALYSIS — AUDIT ONLY

> **Constraint Compliance:** In accordance with prompt instructions, **NO vendor notification features have been modified or implemented**.

### Formal Evaluation:

```text
Vendor Dashboard Notification: PARTIAL (Only errors and webhook status updates; no operational flow)
Vendor Email Notification:     NOT IMPLEMENTED (Zero emails sent for any shipping events)
Shiprocket Vendor Comm.:       NOT APPLICABLE (Shiprocket communicates with buyer, not marketplace vendors)
Siraba Vendor Comm.:           MISSING (No unified vendor shipping notification engine)
```

### Detailed Findings:
1. **Vendor Dashboard In-App Notifications:**
   - When a webhook transitions a shipment to `delivered`, `in_transit`, `rto`, or `cancelled`, a database record is created in `Notification` ([backend/models/Notification.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Notification.js)).
   - When shipment creation fails due to unverified pickup location or max retries, a notification is created.
   - **Gaps:** There are **NO notifications** created for:
     - New order assigned to vendor
     - Shipment created
     - AWB assigned
     - Pickup scheduled (courier arrival time)
     - Pickup pending
     - Pickup completed
     - Pickup failed
     - Delivery failed
2. **Vendor Email Notifications:**
   - Inspection of `backend/utils/emailService.js` confirms that the email service **only implements OTP verification, vendor welcome emails, and admin registration alerts**.
   - There are **ZERO email dispatch functions** for order placement, shipment creation, AWB allocation, courier pickup, or delivery exceptions.
3. **Shiprocket Account Architecture Communication:**
   - Siraba operates a single centralized Shiprocket master account.
   - Vendors are merely registered as `pickup_locations` within Siraba's account; they do not have independent Shiprocket logins.
   - Shiprocket's automated buyer tracking SMS/Email alerts are directed to `billing_email` and `billing_phone` (the consumer), **never to the vendor**.
   - Therefore, vendors receive zero communication from Shiprocket directly.

---

# 7. DATABASE & ODM ANALYSIS

Siraba Organic utilizes **MongoDB with Mongoose ODM**, not Prisma.

### Inspection of `models/VendorOrder.js`:
The schema persists logistics data under the following fields:
```javascript
shiprocketOrderId:    { type: String },
shipmentId:           { type: String },
awbCode:              { type: String },
courierId:            { type: String },
courierName:          { type: String },
shiprocketStatus:     { type: String },
shippingRoutingCode:  { type: String },
labelUrl:             { type: String },
shippedAt:            { type: Date },
deliveredAt:          { type: Date },
trackingNumber:       { type: String },
shippingCarrier:      { type: String },
shipmentError:        { code: String, message: String, timestamp: Date },
```

### Missing Fields Required for Production Reliability:

| Missing Field | Recommended Type | Architectural Rationale |
| :--- | :--- | :--- |
| `pickupScheduledAt` | `Date` | Needed to record when the courier pickup was scheduled and audit dispatch latency. |
| `pickupTokenNumber` | `String` | Shiprocket generates a pickup token / manifest identifier required by courier agents at warehouse pickup. |
| `pickedUpAt` | `Date` | Needed to distinguish actual physical courier pickup from "in transit" hub arrival. |
| `estimatedDeliveryDate` | `Date` | Carrier promised delivery date returned by Shiprocket during serviceability/AWB assignment. |
| `manifestUrl` | `String` | Shiprocket generates a printable Manifest PDF for the courier pickup executive to sign. |
| `rtoInitiatedAt` | `Date` | Needed to calculate return transit duration and notify vendor of incoming return. |
| `rtoDeliveredAt` | `Date` | Needed for inventory restocking and seller credit reconciliation upon verified receipt. |

---

# 8. SECURITY & AUTHORIZATION FINDINGS

### 1. Vendor Data Isolation (Multi-Tenant IDOR Audit):
- **Verification:** All vendor endpoints in `backend/routes/vendorRoutes.js` strictly enforce:
  `const vendorOrder = await VendorOrder.findOne({ _id: req.params.id, vendor: req.vendor._id });`
- **Result:** **PASS**. Vendor A cannot query, view, or mutate Vendor B's orders or shipments. Any attempt results in `404 Not Found`.

### 2. Customer Order Tracking Isolation:
- **Verification:** `backend/routes/orderRoutes.js` (`getOrderTrackingHandler` lines 1008–1010):
  `if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin)` -> `403 Forbidden`.
- **Result:** **PASS**. Validated via test suite: Consumer B cannot track Consumer A's orders.

### 3. Public AWB Tracking Leakage:
- **Endpoint:** `GET /api/shiprocket/track/:awbCode` ([backend/routes/shiprocketRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/shiprocketRoutes.js#L12))
- **Finding:** **MEDIUM SECURITY RISK**. This endpoint is completely unauthenticated and proxies raw Shiprocket tracking responses without rate limiting. If an attacker enumerates AWB numbers, they can view carrier tracking logs.

### 4. Webhook Authentication Bypass Risk:
- **Endpoint:** `POST /api/fulfillment/status`
- **Finding:** **HIGH SECURITY RISK**. If `SHIPROCKET_WEBHOOK_SECRET` is missing from the environment, authentication checks are skipped, allowing anyone to forge delivery or cancellation events.

---

# 9. TEST RESULTS & COMPREHENSIVE MATRIX

### Automated Test Suite Execution Summary:

1. **Shipping Economics & Logistics Audit (`shipping_logistics_audit.test.js`):**
   - **34 / 34 PASSED (100%)**
   - Verified authoritative ₹999 threshold, checkout matrices, multi-vendor rate aggregation, zero logistics deductions from vendor payouts, and platform subsidy accounting.
2. **Consumer Order Tracking Test Suite (`consumer_order_tracking.test.js`):**
   - **24 / 24 PASSED (100%)**
   - Verified authentication barriers, multi-tenant isolation, immutable snapshot verification, multi-vendor package segregation, webhook state updates, and graceful carrier API failure handling.
3. **Shiprocket Webhook Test Suite (`shiprocket_webhook.test.js`):**
   - **15 / 15 PASSED (100%)**
   - Verified secret header enforcement, legacy route compatibility, forward status transitions, terminal state immutability, and deterministic idempotency deduplication.
4. **Multi-Vendor Pickup Routing Test Suite (`shiprocket_vendor_routing.test.js`):**
   - **32 / 33 PASSED (1 Failed due to outdated test assertion)**
   - Test 5 expected an old fallback to "Primary" when pickup code is missing. The active codebase now strictly rejects unverified pickup locations (`PICKUP_LOCATION_NOT_REGISTERED`), which is the correct secure behavior.
5. **Live Shiprocket API Verification (Empirical Read-Only Test):**
   - Authentication against `https://apiv2.shiprocket.in/v1/external`: **SUCCESS** (Valid 397-character JWT returned).
   - Live Courier Serviceability check: **SUCCESS** (DTDC Surface returned, ₹63.72 rate).
   - Live Pickup Location query: **DISCOVERY** (Live account has locations `Home`, `OW_Gurugram_Wh`, `VENDOR`. Location `Primary` does NOT exist in live account).

### Complete Verification Matrix:

| Test Case | Expected Behavior | Actual Behavior | Test Type | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API Authentication** | Return valid JWT, cache in Redis/memory | Returns 397-char JWT, cached for 8 days | External API Test | **PASS** | `shiprocketService.login()` tested against live API |
| **Courier Serviceability** | Return cheapest/fastest courier | Returned DTDC Surface (₹63.72) | External API Test | **PASS** | Live query Delhi (110030) to Delhi (110022) |
| **Vendor Pickup Resolution**| Use Vendor's registered pickup code | Uses `vendor.shiprocket_pickup_code` | Internal Logic Test | **PASS** | Tested in `shiprocket_vendor_routing.test.js` |
| **Unverified Location Safeguard** | Reject order creation if location not in SR | Throws `PICKUP_LOCATION_NOT_REGISTERED` | Internal Logic Test | **PASS** | Prevents dispatching courier to wrong warehouse |
| **Default Location Fallback** | Fallback to platform location | Tries 'Primary', which fails in SR | External API Test | **FAIL** | 'Primary' does not exist in live Shiprocket account |
| **Shipment Creation** | Create adhoc order in SR | Payload structured, AWB assigned | Internal Logic Test | **PASS** | Validated payload mapping |
| **Duplicate Shipment Prevention** | Skip if shipment already exists | Skips via `shiprocketOrderId` check | Internal Logic Test | **PASS** | BullMQ worker check + service reuse check |
| **Pickup Scheduling** | Schedule courier pickup via API | **Never called on initial creation** | Internal Logic Test | **FAIL** | `generatePickup` only exists in retry branch |
| **Webhook Signature Validation** | Reject invalid/missing secret | Returns 401 when secret is set | Internal Logic Test | **PASS** | Tested in `shiprocket_webhook.test.js` |
| **Webhook Idempotency** | Ignore duplicate delivery events | Returns 200 "Event already processed" | Internal Logic Test | **PASS** | Unique index on `WebhookLog.eventId` |
| **Webhook Pickup Failed** | Record failure, alert vendor | **Maps to 'pickup_scheduled'** | Internal Logic Test | **FAIL** | Substring `s.includes("PICKUP")` bug |
| **Webhook Delivery Failed** | Record delivery exception | Ignored / discarded | Internal Logic Test | **FAIL** | Unhandled status mapping |
| **Customer Tracking Isolation** | Consumer B cannot track Consumer A | Returns 403 Forbidden | Internal Logic Test | **PASS** | Tested in `consumer_order_tracking.test.js` |
| **Vendor Order Isolation** | Vendor A cannot access Vendor B | Returns 404 Not Found | Internal Logic Test | **PASS** | Filtered by `vendor: req.vendor._id` |
| **Shipment Cancellation** | Cancel AWB in Shiprocket | Crashes with `TypeError` | Internal Logic Test | **FAIL** | Calls non-existent `cancelOrder` |

---

# 10. BUGS FOUND

### BUG-01: Pickup Scheduling Omitted on Initial Shipment Creation Flow
- **Severity:** **CRITICAL**
- **File:** [backend/services/shiprocketService.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/shiprocketService.js#L328-L334) & [backend/jobs/shiprocketQueue.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/jobs/shiprocketQueue.js#L68-L80)
- **Problem:** `generatePickup(shipmentId)` is only invoked inside the `if (vendorOrder.shipmentId)` branch (lines 328–334), which is the retry/reuse code path. On fresh shipment creation (lines 339–420), `createShipment()` creates the order and assigns the AWB, but **never calls `generatePickup()`**.
- **Root Cause:** Incomplete flow structure during refactoring; pickup request was added to the retry block but omitted from the initial creation block.
- **Impact:** Every fresh order successfully receives an AWB, but the courier is **never requested to physically pick up the package**. The order remains frozen in `processing` indefinitely unless manually scheduled through the Shiprocket portal.
- **Recommended Fix:** Invoke `await this.generatePickup(shipmentData.shipmentId)` in `createShipment()` immediately after AWB assignment, record `pickupScheduledAt: new Date()`, and set `vendorOrder.status = 'pickup_scheduled'`.

---

### BUG-02: `vendorRoutes.js` Calls Non-Existent Shiprocket Functions with Hardcoded "Primary"
- **Severity:** **CRITICAL**
- **File:** [backend/routes/vendorRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/vendorRoutes.js#L1820-L1864)
- **Function:** `router.put("/orders/:id/status")`
- **Problem:** When a vendor confirms an order, the route attempts to call:
  `await shiprocketService.createOrder({ pickup_location: "Primary", ... })`
  When a vendor cancels an order, it calls:
  `await shiprocketService.cancelOrder(vendorOrder.trackingNumber)`
- **Root Cause:** Outdated legacy prototype code calling non-existent functions (`createOrder` and `cancelOrder` do not exist on `shiprocketService`; the active functions are `createShipment` and `cancelShipment`).
- **Impact:** Throws `TypeError: shiprocketService.createOrder is not a function`, caught silently by `catch (err)`. No shipment is created or cancelled. If it had worked, it would have routed all vendor orders to the hardcoded `"Primary"` warehouse rather than the vendor's actual address.
- **Recommended Fix:** Remove manual shipment creation from this route (let BullMQ handle it), or replace with `shiprocketService.createShipment(vendorOrder, order, vendor)`.

---

### BUG-03: Webhook Logic Erroneously Maps "PICKUP FAILED" to "pickup_scheduled"
- **Severity:** **CRITICAL**
- **File:** [backend/routes/shiprocketWebhookRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/shiprocketWebhookRoutes.js#L28)
- **Function:** `mapShiprocketStatus()`
- **Problem:** Line 28 states:
  `if (s === "PICKUP SCHEDULED" || s === "MANIFEST GENERATED" || s.includes("MANIFEST") || s.includes("PICKUP")) return "pickup_scheduled";`
- **Root Cause:** Overly broad substring match `s.includes("PICKUP")`.
- **Impact:** If the courier fails to pick up the parcel from the vendor and Shiprocket sends a status of `"PICKUP FAILED"`, `"PICKUP EXCEPTION"`, or `"PICKUP RESCHEDULED"`, the substring match evaluates to `true` and marks the order as `"pickup_scheduled"`, masking the failure from admins and vendors.
- **Recommended Fix:** Check for failure states before checking for pickup:
  `if (s.includes("PICKUP FAILED") || s.includes("PICKUP EXCEPTION")) return "pickup_failed";`

---

### BUG-04: Non-Existent `cancelOrder` Called During Customer Order Cancellation
- **Severity:** **HIGH**
- **File:** [backend/routes/orderRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/orderRoutes.js#L1342)
- **Function:** `router.post("/:id/cancel")`
- **Problem:** When an order is cancelled, line 1342 calls:
  `await shiprocketService.cancelOrder(vendorOrder.trackingNumber);`
- **Root Cause:** Function name in `shiprocketService.js` is `cancelShipment(awbCode)`, and AWB is stored in `vendorOrder.awbCode` (not `trackingNumber`).
- **Impact:** Throws runtime error caught by try-catch. Shiprocket is never informed of the order cancellation; courier may still arrive for pickup, and Shiprocket bills shipping charges.
- **Recommended Fix:** Change to:
  `if (vendorOrder.awbCode) await shiprocketService.cancelShipment(vendorOrder.awbCode);`

---

### BUG-05: Missing 401 Response Interceptor in `shiprocketService.js`
- **Severity:** **HIGH**
- **File:** [backend/services/shiprocketService.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/shiprocketService.js#L41-L86)
- **Function:** `login()`
- **Problem:** JWT tokens are cached for 8 days in memory and Redis. If Shiprocket revokes the token (password reset, manual session termination, security cycle), the cached token returns 401 Unauthorized on subsequent requests, but is never cleared.
- **Root Cause:** No Axios response interceptor attached to `this.client` to catch 401, evict cache, and retry.
- **Impact:** Entire logistics integration will experience a hard failure for up to 8 days following any Shiprocket credential or token invalidation.
- **Recommended Fix:** Add Axios response interceptor that catches 401, clears `shiprocket_token` in Redis and memory, re-authenticates via `login()`, and retries the failed request once.

---

### BUG-06: Direct Platform Products Crash Due to Non-Existent "Primary" Location
- **Severity:** **HIGH**
- **File:** [backend/jobs/shiprocketQueue.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/jobs/shiprocketQueue.js#L45-L48) & [backend/routes/shiprocketRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/shiprocketRoutes.js#L76)
- **Problem:** Default fallback pickup location is hardcoded as `process.env.SHIPROCKET_PRIMARY_LOCATION || "Primary"`. `SHIPROCKET_PRIMARY_LOCATION` is missing from `.env`, so it defaults to `"Primary"`.
- **Root Cause:** Live verification against Shiprocket API reveals registered locations are `Home`, `OW_Gurugram_Wh`, and `VENDOR`. `"Primary"` does not exist.
- **Impact:** Any order placed for a platform-direct (non-vendor) product immediately fails verification and is permanently blocked (`shipment_blocked_pickup_unverified`).
- **Recommended Fix:** Set `SHIPROCKET_PRIMARY_LOCATION=OW_Gurugram_Wh` (or `Home`) in `backend/.env`.

---

### BUG-07: Public AWB Tracking Endpoint Unauthenticated and Unthrottled
- **Severity:** **MEDIUM**
- **File:** [backend/routes/shiprocketRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/shiprocketRoutes.js#L12)
- **Problem:** `GET /api/shiprocket/track/:awbCode` is completely public and has no rate limiting or authentication.
- **Root Cause:** Development convenience endpoint left exposed.
- **Impact:** External actors can flood Shiprocket API rate limits or scrape tracking history.
- **Recommended Fix:** Require user/vendor authentication, or apply rate limiting (`apiLimiter`).

---

### BUG-08: Orphaned Dead Code in `shiprocketController.js`
- **Severity:** **MEDIUM**
- **File:** [backend/controllers/shiprocketController.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/controllers/shiprocketController.js)
- **Problem:** File contains legacy `handleWebhook` logic with conflicting status mapping that is never mounted in `server.js`.
- **Root Cause:** Leftover code when `routes/shiprocketWebhookRoutes.js` was introduced.
- **Impact:** Severe confusion during maintenance and future audits.
- **Recommended Fix:** Delete `backend/controllers/shiprocketController.js`.

---

# 11. REQUIRED MODIFICATIONS

### Must Fix Before Production (Blockers):
1. **Fix Pickup Scheduling in `shiprocketService.createShipment`:**
   Call `generatePickup(shipmentId)` immediately upon AWB creation for fresh orders; update `vendorOrder.status = 'pickup_scheduled'` and save `pickupScheduledAt`.
2. **Fix `vendorRoutes.js` Status Handler:**
   Remove obsolete calls to `shiprocketService.createOrder` and `cancelOrder`.
3. **Fix Webhook "PICKUP FAILED" Mapping:**
   Update `mapShiprocketStatus` in `shiprocketWebhookRoutes.js` to accurately parse `PICKUP FAILED`, `PICKUP EXCEPTION`, and `DELIVERY FAILED`.
4. **Fix Cancellation Flow in `orderRoutes.js`:**
   Replace `shiprocketService.cancelOrder(vendorOrder.trackingNumber)` with `shiprocketService.cancelShipment(vendorOrder.awbCode)`.
5. **Configure `SHIPROCKET_PRIMARY_LOCATION` in `.env`:**
   Set to an existing registered Shiprocket pickup location (`OW_Gurugram_Wh` or `Home`).
6. **Enforce Webhook Secret Requirement:**
   Reject webhook requests with HTTP 500/401 if `SHIPROCKET_WEBHOOK_SECRET` is not set on the server.

### Should Fix:
1. **Add Axios 401 Interceptor to `shiprocketService.js`:**
   Automatically purge token cache and re-authenticate when Shiprocket returns 401 Unauthorized.
2. **Delete Orphaned `shiprocketController.js`:**
   Remove unused controller to eliminate ambiguity.
3. **Remove Redundant Mount in `server.js`:**
   Delete line 87 (`app.use("/api/shiprocket", shiprocketRoutes)`) mounted before `express.json()`.
4. **Add Missing Logistics Fields to `VendorOrder.js`:**
   Add `pickupScheduledAt`, `pickedUpAt`, `pickupTokenNumber`, `estimatedDeliveryDate`, `manifestUrl`, `rtoInitiatedAt`, and `rtoDeliveredAt`.

### Optional Improvements:
1. **Protect or Rate-Limit `GET /api/shiprocket/track/:awbCode`:**
   Prevent third-party scraping and API quota exhaustion.
2. **Reverse Logistics / RTO Workflow:**
   Distinguish between `rto_initiated`, `rto_in_transit`, and `rto_delivered` to allow vendors to verify return parcel condition before approving refunds.

---

# 12. NEXT PHASE REQUIREMENTS: VENDOR SHIPMENT NOTIFICATION SYSTEM

> **NOTE:** In accordance with the prompt's instructions, this system has **NOT been implemented** during this audit. The requirements below are specified for implementation in the next phase.

### Architecture Overview:
The next phase must build a dedicated, event-driven **Vendor Logistics Notification Engine** supporting both:
1. **Vendor Dashboard In-App Notifications** (stored in MongoDB `Notification` collection and broadcasted via Socket.IO room `vendor_${vendorId}`)
2. **Vendor Email Notifications** (templated HTML emails dispatched via `backend/utils/emailService.js`)

### Event Flow Pipeline:
```text
Order / Logistics Event Trigger
              │
              ▼
Vendor Isolation Filter:
Determine which Vendor owns each VendorOrder (vendorId)
              │
              ▼
Notification Dispatcher (notificationService.js)
              ├── Vendor In-App Notification (Notification.create & socket.emit)
              └── Vendor Email Notification (transporter.sendMail)
```

### Event Specifications to Implement:

| Event Identifier | Trigger Condition | Recipient | Dashboard Title & Message | Email Subject & Contents |
| :--- | :--- | :--- | :--- | :--- |
| `NEW_ORDER_RECEIVED` | Customer order placed & payment verified | Vendor owning the items | "New Order Assigned: #{id}" (Items list, subtotal, preparation prompt) | "New Order Received - Order #{id}" (Full order breakdown, packaging instructions) |
| `SHIPMENT_CREATED` | Shiprocket shipment generated | Order Vendor only | "Shipment Created: #{id}" (Shipment ID generated) | N/A (Optional / Combined with AWB) |
| `AWB_ASSIGNED` | Courier assigned & AWB generated | Order Vendor only | "Courier Assigned: {courierName} (AWB: {awb})" | "Courier Assigned for Order #{id}" (AWB code, shipping label PDF download link) |
| `PICKUP_SCHEDULED` | Courier pickup scheduled with Shiprocket | Order Vendor only | "Pickup Scheduled: Courier arriving for Order #{id}" | "Action Required: Prepare Order #{id} for Courier Pickup" (Pickup date, manifest details) |
| `PICKUP_COMPLETED` | Courier scans & accepts parcel | Order Vendor only | "Parcel Picked Up by {courierName}" | "Order #{id} Dispatched Successfully" |
| `PICKUP_FAILED` | Courier unable to pick up from vendor | Order Vendor & Admin | "URGENT: Pickup Failed for Order #{id}" (Reason code, retry prompt) | "Urgent: Courier Pickup Failed for Order #{id}" (Reason, next steps) |
| `IN_TRANSIT` | Parcel in transit between hubs | Order Vendor only | "Order #{id} is In Transit" | (Dashboard notification sufficient) |
| `OUT_FOR_DELIVERY` | Parcel out with local delivery agent | Order Vendor only | "Order #{id} Out for Delivery" | (Dashboard notification sufficient) |
| `DELIVERED` | Parcel delivered to customer | Order Vendor only | "Order #{id} Delivered!" (Wallet credit updated) | "Order #{id} Delivered Successfully" (Earnings credited to wallet) |
| `DELIVERY_FAILED` | Delivery attempt failed | Order Vendor & Support | "Delivery Attempt Failed for Order #{id}" | "Notice: Delivery Attempt Failed - Order #{id}" |
| `RTO_INITIATED` | Return to Origin initiated | Order Vendor only | "RTO Alert: Order #{id} is returning" | "Return Alert: Order #{id} Returning to Warehouse" |
| `RTO_DELIVERED` | Return package received back at warehouse | Order Vendor only | "RTO Delivered: Order #{id} returned" | "Return Received: Please verify items for Order #{id}" |

### Strict Tenant-Isolation Rule:
- Vendor A must **NEVER** receive notifications for Vendor B's orders.
- Each notification record must specify `recipient: vendorOrder.vendor` and `recipientModel: 'Vendor'`.
- Socket.IO events must target the vendor's private room: `socket.to("vendor_" + vendorId).emit(...)`.

---

# 13. FINAL VERDICT

### 1. What Works:
- **API Authentication:** Connects to live Shiprocket API and retrieves valid JWT tokens.
- **Courier Serviceability Check:** Dynamically compares couriers, ETD, and rates against live Shiprocket endpoints.
- **Multi-Vendor Shipment Partitioning:** Correctly splits parent cart items into vendor-specific orders.
- **Customer Delivery Addressing:** Customer shipping address is correctly passed to Shiprocket without vendor address confusion.
- **Vendor Location Verification:** Strictly validates vendor pickup location in Shiprocket before creating shipments, preventing incorrect pickup routing.
- **Webhook Deduplication & Hierarchy:** Validates incoming `x-api-key`, deduplicates events via `WebhookLog`, and protects terminal delivery states.
- **Multi-Tenant Security:** Customers and vendors are completely isolated from unauthorized order data.

### 2. What Does Not Work:
- **Automatic Courier Pickup Scheduling:** `generatePickup()` is **omitted on initial shipment creation**. Shipments receive an AWB but the courier is never requested to pick up the parcel.
- **Vendor Order Status Sync in `vendorRoutes.js`:** `PUT /orders/:id/status` calls non-existent functions `createOrder` and `cancelOrder` with hardcoded `"Primary"`, crashing on execution.
- **Order Cancellation Synchronization:** Order cancellation in `orderRoutes.js` calls non-existent `cancelOrder` instead of `cancelShipment`.
- **Webhook Error Classification:** "PICKUP FAILED" is incorrectly mapped to `pickup_scheduled` due to a substring match bug.
- **Delivery Failure Recording:** Undelivered shipments are unhandled and ignored by the webhook router.
- **Vendor Notifications:** Completely missing email notifications; in-app dashboard notifications only cover failures and delivery, missing operational pickup milestones.

### 3. What is Unverified:
- **Automatic Reverse Logistics / Return Pickups:** No automated customer return pickup generation flow exists through Shiprocket.
- **Shiprocket Direct Pickup API (`POST /settings/company/addpickup`):** Account-level API permission for creating pickup locations dynamically without seller panel intervention is subject to Shiprocket plan tier.

### 4. What Must Be Fixed:
- Fix `createShipment()` to call `generatePickup()` immediately after AWB assignment.
- Repair status update and cancellation hooks in `vendorRoutes.js` and `orderRoutes.js`.
- Correct status mapping for `PICKUP FAILED` and `DELIVERY FAILED` in `shiprocketWebhookRoutes.js`.
- Set `SHIPROCKET_PRIMARY_LOCATION` in `.env` to match a real registered location.
- Add Axios 401 token refresh interceptor in `shiprocketService.js`.

### 5. What Should Be Implemented Next:
- Transition to the next phase to build the comprehensive **Vendor Shipment Notification System** (Dashboard alerts + Email notifications per vendor-specific order event).
