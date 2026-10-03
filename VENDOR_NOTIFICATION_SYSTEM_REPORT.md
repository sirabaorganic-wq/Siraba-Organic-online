# SIRABA ORGANIC — PHASE 2: VENDOR SHIPMENT NOTIFICATION SYSTEM REPORT

**Evaluation & Implementation Date:** October 3, 2026  
**Auditor / Implementation Role:** Senior Full-Stack Engineer specializing in e-commerce logistics, notification architecture, BullMQ, Socket.IO, transactional email, and multi-tenant systems.  
**Repository:** `Siraba-Organic-online-forked`  
**Phase 1 Regression Status:** 131 / 131 PASS (Zero Regressions)  
**Phase 2 Notification Suite Status:** 41 / 41 PASS (100% Pass)  
**Total Automated Assertions:** 172 / 172 PASS  
**Production Build Status:** Frontend Vite & Prerender Build PASSED (0 errors)

---

## 1. EXISTING NOTIFICATION INFRASTRUCTURE (AUDIT PRIOR TO PHASE 2)

Prior to Phase 2 implementation, an exhaustive audit was performed across backend models, routes, queues, email services, and frontend dashboard components.

### What Existed
1. **Notification Database Model (`backend/models/Notification.js`)**:
   - Supported fields: `recipient` (ObjectId), `recipientModel` (`'User' | 'Vendor' | 'Admin'`), `type` (`'info' | 'success' | 'warning' | 'error'`), `title`, `message`, `isRead`, `readAt`, `link`.
   - Index existed on `{ recipient: 1, isRead: 1, createdAt: -1 }`.
   - **Gaps Identified**: Did not support event deduplication (`eventId` was missing), had no relationship fields for `vendorOrder` or `order`, lacked logistics metadata storage, and had no tracking for multi-channel dispatch status (email/socket flags).
2. **Notification Routes (`backend/routes/notificationRoutes.js`)**:
   - Mounted at `/api/notifications`.
   - Endpoints: `GET /vendor`, `GET /user`, `PUT /:id/read`, `PUT /vendor/read-all`.
   - **Gaps Identified**: `PUT /:id/read` lacked multi-tenant ownership verification (any authenticated user could mark any notification as read); did not support `GET /unread-count` or `PATCH` method; lacked pagination.
3. **Email Infrastructure (`backend/utils/emailService.js`)**:
   - Nodemailer configured using environment variables (`EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`, etc.).
   - Contained consumer OTP and welcome email templates.
   - **Gaps Identified**: `createTransporter` was not exported for modular services; zero vendor shipment transactional email templates existed.
4. **Socket.IO Realtime Infrastructure (`backend/server.js`)**:
   - Socket.IO server initialized with CORS.
   - Handled `join_chat` for vendor messages.
   - **Gaps Identified**: No multi-tenant room scoping for private vendor notifications (`join_vendor` was absent); no centralized socket manager module to emit to specific vendors from queues or services.
5. **BullMQ Queues**:
   - `shiprocketQueue.js` and `transferQueue.js` active with Redis connection.
   - **Gaps Identified**: No dedicated queue or worker for asynchronous vendor notifications.

---

## 2. HIGH-LEVEL ARCHITECTURE

The vendor notification architecture strictly follows the **Non-Blocking Asynchronous Event Principle**. Logistics and payment operations (checkout, payment verification, Shiprocket API calls, and webhooks) never perform synchronous notifications, email transmissions, or WebSocket broadcasts directly.

```
 Business / Logistics Event Source
   ├── Order Placement (orderRoutes.js)
   ├── Payment Confirmation (paymentController.js / razorpayWebhook.js)
   ├── Shipment Worker (shiprocketQueue.js)
   ├── Status Webhook (shiprocketWebhookRoutes.js)
   └── Order Cancellation (orderRoutes.js / vendorRoutes.js)
                           ↓
     dispatchVendorNotification() (vendorNotificationService.js)
     - Builds deterministic eventId
     - Resolves canonical metadata, title, and message
                           ↓
          BullMQ Queue: 'vendor-notifications'
          (jobId: notif_${eventId}, 3 retries, exponential backoff)
                           ↓
               Notification Worker (vendorNotificationQueue.js)
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
   Database Channel   Socket.IO Room   Email Channel
 (Idempotent upsert)  vendor:{vendorId} (Nodemailer HTML)
          │                │                │
          └────────────────┼────────────────┘
                           ↓
      Vendor Dashboard (Notification Center & Realtime)
```

---

## 3. EVENT DEDUPLICATION & CHANNEL MATRIX

All 16 supported events are centralized in [`backend/constants/notificationConstants.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/constants/notificationConstants.js).

| Canonical Event Type | Authoritative Event Source | Trigger Mechanism | In-App DB | Realtime Socket | Transactional Email | Primary Metadata |
|---|---|---|:---:|:---:|:---:|---|
| `vendor_order_received` | `orderRoutes.js` | Order placed (Prepaid/COD) | Yes | Yes | Yes | Order#, items, subtotal, delivery city/state |
| `vendor_order_confirmed` | `paymentController.js` & `razorpayWebhook.js` | Payment verified / COD placed | Yes | Yes | Yes | Order#, items, subtotal, delivery city |
| `order_cancelled` | `orderRoutes.js` / `vendorRoutes.js` | Customer / Vendor cancellation | Yes | Yes | Yes | Order#, cancel reason |
| `shipment_created` | `shiprocketQueue.js` worker | Shiprocket order & shipment created | Yes | Yes | No | Shipment ID, order# |
| `awb_assigned` | `shiprocketQueue.js` worker | AWB code assigned by Shiprocket | Yes | Yes | No | AWB, courier name |
| `pickup_scheduled` | `shiprocketQueue.js` / webhook | Courier pickup booked | Yes | Yes | Yes | AWB, courier, pickup token, scheduled date |
| `pickup_pending` | `shiprocketWebhookRoutes.js` | Courier rescheduled pickup | Yes | Yes | No | AWB, status timestamp |
| `pickup_failed` | `shiprocketQueue.js` / webhook | Courier failed pickup attempt | Yes | Yes | Yes | AWB, courier remark, action required |
| `picked_up` | `shiprocketWebhookRoutes.js` | Package handed over to courier | Yes | Yes | No | AWB, courier name, timestamp |
| `in_transit` | `shiprocketWebhookRoutes.js` | Courier transit hubs | Yes | Yes | No | AWB, courier name |
| `out_for_delivery` | `shiprocketWebhookRoutes.js` | Courier out for delivery to customer | Yes | Yes | No | AWB, destination city |
| `delivery_failed` | `shiprocketWebhookRoutes.js` | Delivery attempt failed | Yes | Yes | Yes | AWB, courier reason, next steps |
| `delivered` | `shiprocketWebhookRoutes.js` | Package delivered to recipient | Yes | Yes | Yes | AWB, delivered date/time, settlement notice |
| `rto_initiated` | `shiprocketWebhookRoutes.js` | Return to origin initiated | Yes | Yes | Yes | AWB, RTO reason, warehouse notice |
| `rto_in_transit` | `shiprocketWebhookRoutes.js` | RTO package in transit to vendor | Yes | Yes | No | AWB, courier name |
| `rto_delivered` | `shiprocketWebhookRoutes.js` | RTO package delivered to vendor | Yes | Yes | Yes | AWB, receipt verification notice |

---

## 4. DATABASE MODEL & INDEXES

The [`backend/models/Notification.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Notification.js) schema was extended with zero breaking changes to existing consumer/admin notifications:

```javascript
{
  recipient: { type: ObjectId, refPath: "recipientModel" },
  recipientModel: { type: String, enum: ["User", "Vendor", "Admin"] },
  type: { type: String, enum: ["info", "success", "warning", "error"], default: "info" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  link: { type: String },

  // Phase 2 Vendor Logistics & Deduplication Fields
  eventId: { type: String }, // Unique sparse indexed
  vendor: { type: ObjectId, ref: "Vendor" },
  vendorOrder: { type: ObjectId, ref: "VendorOrder" },
  order: { type: ObjectId, ref: "Order" },
  eventType: { type: String },
  category: { type: String, enum: ["order", "shipment", "delivery", "rto", "exception", "general"], default: "general" },
  severity: { type: String, enum: ["info", "success", "warning", "error"], default: "info" },
  metadata: { type: mongoose.Schema.Types.Mixed },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
  socketEmitted: { type: Boolean, default: false }
}
```

### Production Indexes
1. `{ eventId: 1 }` (Unique, Sparse) — Enforces database-level idempotency and prevents duplicate notifications across webhook replays, worker retries, and race conditions.
2. `{ vendor: 1, isRead: 1, createdAt: -1 }` — Optimizes fast dashboard notification feeds and unread count queries.
3. `{ vendorOrder: 1, createdAt: -1 }` — Enables vendor order timeline lookups.
4. `{ recipient: 1, isRead: 1, createdAt: -1 }` — Preserves legacy and customer query speeds.

---

## 5. IDEMPOTENCY & DUPLICATION PROTECTION

Idempotency is guaranteed at three distinct defensive layers:

1. **Deterministic `eventId` Generation**:
   ```javascript
   // format: vn_${vendorOrderId}_${eventType}_${timestampOrScan}
   const eventId = `vn_${targetId}_${eventType}${timeFragment}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
   ```
   For webhooks, the courier's `status_date_time` is incorporated so that repeated webhook deliveries of the exact same event produce the identical `eventId`.
2. **BullMQ Deduplication**:
   Jobs are enqueued with `jobId: notif_${eventId}`. BullMQ automatically ignores duplicate job submission attempts while a job is waiting or active.
3. **Atomic MongoDB Unique Sparse Index**:
   If a duplicate job executes during a retry, `Notification.create()` catches the Mongoose `E11000 duplicate key error on eventId`, safely falls back to `Notification.findOne({ eventId })`, and avoids re-sending duplicate emails or persisting duplicate records.
   *Verification:* Verified in `vendor_notifications.test.js` Section 2 — 3 identical executions produced exactly 1 database record with identical notification IDs.

---

## 6. TRANSACTIONAL EMAIL SYSTEM

Implemented in [`backend/utils/vendorEmailService.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/vendorEmailService.js):
- **Email Design**: Modern, responsive HTML email layouts with Siraba Organic forest green brand gradients (`#14532d` to `#15803d`), status badges, order line items table, and direct vendor portal deep link CTA buttons.
- **Recipient Determination**: Authenticated `vendor.email` retrieved from the database.
- **Customer Privacy Protection**: In compliance with strict marketplace privacy rules, customer phone numbers, email addresses, and full street addresses are **never** included in vendor notifications. Only fulfillment destination region (City, State, Pincode) is exposed.
- **Dev/Test Resilience**: When `isEmailConfigured()` is false or in test environments, logs mock delivery and returns `{ success: true, skipped: true }` without crashing or throwing errors.
- **Idempotency**: Flag `emailSent: true` and `emailSentAt: Date` are recorded on the `Notification` record to prevent duplicate emails across worker retries.

---

## 7. REALTIME SOCKET.IO MULTI-TENANT ISOLATION

Implemented in [`backend/utils/socketManager.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/socketManager.js) and wired into [`backend/server.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/server.js):
- **Room Topology**: Vendors join dedicated private rooms scoped strictly by vendor ID: `vendor:${vendorId}` upon emitting `join_vendor`.
- **Zero Global Broadcast of Vendor Data**: All vendor notifications emit strictly to `io.to(`vendor:${vendorId}`).emit('vendor:notification', payload)`.
- **Cross-Vendor Isolation**: Verified that Vendor A events are never emitted to Vendor B's room.
- **Resilience**: If the Socket.IO transport throws an error, `emitToVendor` catches the exception and returns `false`, ensuring zero impact on the database or logistics flow.

---

## 8. VENDOR DASHBOARD NOTIFICATION CENTER

Implemented in [`frontend/src/components/vendor/NotificationDropdown.jsx`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/frontend/src/components/vendor/NotificationDropdown.jsx) and integrated into [`frontend/src/pages/vendor/VendorDashboard.jsx`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/frontend/src/pages/vendor/VendorDashboard.jsx):
- **Notification Bell & Badge**: Dynamic bell icon in the dashboard header displaying unread count badge (with `99+` ceiling).
- **Interactive Notification Center**:
  - Displays icon by severity (green check for delivered, red alert for pickup/delivery failure, blue package for transit/AWB).
  - Shows event title, detailed message, order `#` badge, and AWB badge.
  - Shows relative/formatted timestamp.
- **Deep Linking & Click Behavior**: Clicking any notification automatically marks it as read and switches the active tab to `orders` (`setActiveTab("orders")`).
- **Read State Controls**:
  - Individual notification mark-as-read via checkmark button (`onMarkOneRead`).
  - Bulk "Mark all read" button (`onMarkAsRead`).
- **Realtime Integration**: Subscribes to `socket.on("vendor:notification")`, prepends incoming notifications live without requiring a page refresh, and deduplicates in React state.

---

## 9. VENDOR REST API & AUTHORIZATION

Dedicated routes mounted at `/api/vendors/notifications` (with backwards compatibility on `/api/notifications/vendor`):

| Method | Endpoint | Access | Function |
|---|---|---|---|
| `GET` | `/api/vendors/notifications` | `protectVendor` | Get paginated notifications scoped strictly to `req.vendor._id` |
| `GET` | `/api/vendors/notifications/unread-count` | `protectVendor` | Get unread count for `req.vendor._id` |
| `PATCH` | `/api/vendors/notifications/:id/read` | `protectVendor` | Mark single notification as read (validates ownership) |
| `PATCH` | `/api/vendors/notifications/read-all` | `protectVendor` | Mark all unread notifications as read for `req.vendor._id` |

### Security & Multi-Tenant Enforcement
- Client-supplied `vendorId` in query params or body is **strictly ignored**. Authorization is 100% sourced from `req.vendor._id` verified via JWT.
- Attempting to mark or access another vendor's notification ID returns `403 Forbidden` (`Access denied: You do not own this notification`).

---

## 10. FAILURE RESILIENCE & NON-BLOCKING BEHAVIOR

The system strictly adheres to the rule that notification failures must never break logistics:
- **Email Failure**: Handled inside `sendVendorShipmentEmail` and worker `try/catch`. If SMTP fails, the error is logged, but the order/shipment status is unaffected.
- **Socket.IO Failure**: Handled inside `socketManager.js`. If WebSocket connection drops, in-app database notification persists safely.
- **Queue/Worker Failure**: Wrapped in `dispatchVendorNotification`. If Redis is temporarily unreachable, notifications fall back to direct asynchronous persistence without throwing errors to the calling payment or logistics modules.
- **Shiprocket Webhooks**: Return HTTP 200 immediately; notification dispatch occurs asynchronously.

---

## 11. AUTOMATED TEST RESULTS

### 11.1 Phase 1 Logistics Regression Suite (Zero Regressions)
All 5 Phase 1 test suites were rerun against the live repository:

1. `backend/tests/shiprocket_webhook.test.js`:
   - Authentication tests (A, B, C, C2, D, E, F): **7 / 7 PASS**
   - Status transition & terminal state tests (0A, 0B, 1, 2, 2B, 2C, 3, 4, 5, 6, 7): **11 / 11 PASS**
   - Idempotency tests (8): **2 / 2 PASS**
   - *Subtotal:* **20 / 20 PASS**

2. `backend/tests/shiprocket_vendor_routing.test.js`:
   - Multi-vendor pickup routing & customer shipping address verification: **35 / 35 PASS**

3. `backend/tests/shipping_logistics_audit.test.js`:
   - Free shipping ₹999 threshold, settlement economics & subsidies: **34 / 34 PASS**

4. `backend/tests/consumer_order_tracking.test.js`:
   - Multi-vendor split packages, auth access, carrier tracking timelines: **24 / 24 PASS**

5. `backend/tests/shiprocket_remediation_lifecycle.test.js`:
   - Fresh shipment creation, automatic pickup scheduling, token recovery: **18 / 18 PASS**

**Total Phase 1 Regression Assertions: 131 / 131 PASS (100%)**

---

### 11.2 Phase 2 Vendor Notification Suite
Automated suite in [`backend/tests/vendor_notifications.test.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/tests/vendor_notifications.test.js):

- **Section 1: Canonical Event Generation (All 16 Lifecycle Events)**:
  - 1.1 Canonical event types list contains at least 16 events: **PASS**
  - 1.2 Event dispatch across all 16 events: **16 / 16 PASS**
  - 1.3 All 16 events persisted in database: **PASS**
- **Section 2: Idempotency & Deduplication**:
  - 2.1 First execution creates notification: **PASS**
  - 2.2 Replay 1 succeeds idempotently: **PASS**
  - 2.3 Replay 2 succeeds idempotently with same notificationId: **PASS**
  - 2.4 Exactly 1 record exists in database after 3 executions: **PASS**
- **Section 3: Multi-Tenant Vendor Isolation**:
  - 3.1 Vendor A notification belongs strictly to Vendor A: **PASS**
  - 3.2 Vendor B notification belongs strictly to Vendor B: **PASS**
  - 3.3 Vendor A query does not contain Vendor B notifications: **PASS**
  - 3.4 Vendor B query does not contain Vendor A notifications: **PASS**
  - 3.5 Vendor A accessing Vendor B notification returns 403 Forbidden: **PASS**
- **Section 4: Unread Count & Read-State APIs**:
  - 4.1 Unread count endpoint returns number > 0: **PASS**
  - 4.2 Mark single notification returns 200 and isRead true: **PASS**
  - 4.3 DB state reflects populated readAt timestamp: **PASS**
  - 4.4 Mark all read returns 200 OK: **PASS**
  - 4.5 Unread count becomes 0 for Vendor A: **PASS**
  - 4.6 Vendor B unread count remains untouched after Vendor A read-all: **PASS**
- **Section 5: Realtime Socket.IO Multi-Tenant Isolation**:
  - 5.1 Socket emission for Vendor A sent to room `vendor:{vendorA}`: **PASS**
  - 5.2 Socket emission for Vendor B sent to room `vendor:{vendorB}`: **PASS**
  - 5.3 Vendor A notification NEVER emitted to Vendor B room: **PASS**
- **Section 6: Email Templates & Customer PII Privacy**:
  - 6.1 Email HTML contains courier name and AWB: **PASS**
  - 6.2 Email HTML does NOT leak customer street address or phone: **PASS**
  - 6.3 `sendVendorShipmentEmail` executes safely without throwing: **PASS**
- **Section 7: Failure Resilience & Non-Blocking Behavior**:
  - 7.1 Dispatch without vendorId returns safely with reason: **PASS**
  - 7.2 Socket failure handled gracefully without crashing: **PASS**

**Total Phase 2 Notification Assertions: 41 / 41 PASS (100%)**

---

### 11.3 Static & Production Build Verification
- `npm run build` (Frontend): **SUCCESS**
  - 2647 modules transformed cleanly.
  - Zero syntax or bundling errors.
  - Static SEO & Sitemap generator generated crawler-ready files (33 sitemap URLs, 8 product pre-renders, 25 static pages).

---

## 12. VERIFICATION QUESTIONS CHECKLIST

| # | Verification Question | Answer | Code / Test Evidence |
|---|---|:---:|---|
| 1 | Can Vendor A receive Vendor B's notification? | **NO** | Scoped via `vendor: req.vendor._id` filter; verified in Test 3.3 & 3.4 |
| 2 | Can Vendor A query Vendor B's notification through the API? | **NO** | `vendorNotificationController.js` validates `req.vendor._id`; returns 403 on mismatch (Test 3.5) |
| 3 | Can Vendor A receive Vendor B's Socket.IO event? | **NO** | Socket emissions restricted to `vendor:${vendorId}` private room (Test 5.1, 5.2, 5.3) |
| 4 | Can Vendor A receive Vendor B's shipment email? | **NO** | Recipient email loaded from authenticated vendor profile in `Vendor.findById(vendorId)` |
| 5 | Can a duplicate Shiprocket webhook create duplicate notifications? | **NO** | Deduplicated via unique sparse index on `eventId` and deterministic scan timestamps |
| 6 | Can a BullMQ retry create duplicate notifications? | **NO** | BullMQ uses `jobId: notif_${eventId}` and worker handles duplicate key idempotently (Test 2.1-2.4) |
| 7 | Can email failure break shipment processing? | **NO** | Emails are processed asynchronously in BullMQ worker and wrapped in `try/catch` |
| 8 | Can Socket.IO failure break shipment processing? | **NO** | `socketManager.emitToVendor` catches all socket errors and logs warning (Test 7.2) |
| 9 | Does every notification link to the correct VendorOrder? | **YES** | Every notification stores `vendorOrder` ObjectId and `vendorOrderNumber` in metadata |
| 10 | Does every shipment milestone originate from the existing logistics source of truth? | **YES** | Consumes events directly from `shiprocketQueue.js` and `shiprocketWebhookRoutes.js` without Shiprocket polling |
| 11 | Does the existing 131-test Phase 1 suite still pass? | **YES** | 131 / 131 tests passed with 0 failures |
| 12 | Are notification tests independently passing? | **YES** | 41 / 41 tests passed in `vendor_notifications.test.js` |
| 13 | Are customer PII and vendor data properly isolated? | **YES** | Notifications omit customer street address, phone, and email; only city/state/pincode included |
| 14 | Are unread/read operations vendor-scoped? | **YES** | Both single read and read-all enforce `req.vendor._id` in DB query (Test 4.1-4.6) |
| 15 | Are notification failures observable and retryable? | **YES** | Queued with 3 exponential backoff retries in BullMQ with failure logging |

---

## 13. REMAINING OBSERVATIONS

### BLOCKERS
- **None.** Phase 2 is complete, verified, and production-ready.

### NON-BLOCKING OBSERVATIONS
- **Redis Connection in Local Testing**: The cloud Redis instance used by BullMQ is active. In standalone CI environments without Redis, `vendorNotificationService` automatically falls back to in-process execution, guaranteeing tests run smoothly anywhere.
- **SMS / WhatsApp Channel**: While Email, In-App DB, and Socket.IO channels are operational, vendor SMS/WhatsApp notifications remain deferred for future phases if requested by business stakeholders.

### FUTURE ENHANCEMENTS
- **Vendor Granular Preferences**: Vendors currently receive mandatory operational notifications. In a future phase, a settings panel can allow vendors to toggle optional email milestones (e.g., mute in-transit scans while keeping pickup/delivery emails enabled).
- **Shipment Sound / Push Notifications**: Browser Web Push notifications (Service Worker) can be added for instant mobile alerts when the browser tab is closed.

---

## 14. FINAL PHASE 2 VERDICT

# `PHASE 2 VERIFIED — VENDOR NOTIFICATIONS READY`
