# SIRABA ORGANIC — CONSUMER ORDER TRACKING VERIFICATION REPORT

## 1. Root Cause Analysis

During the end-to-end audit of consumer order tracking across the repository, the following architectural and implementation gaps were identified:

1. **Missing Consumer Order Details API Endpoint (`GET /api/orders/:id`)**:
   - The backend had no `GET /api/orders/:id` endpoint for individual order retrieval.
   - When consumers attempted to view a single order, there was no secure route with multi-tenant authorization to fetch the complete order data.

2. **Insecure & Incomplete Tracking Endpoint (`GET /api/orders/track/:id`)**:
   - The legacy tracking endpoint had **no authentication** (`protect` middleware was omitted), allowing unauthenticated users and third parties to guess or query arbitrary order IDs.
   - It only selected 6 fields (`status totalPrice orderItems createdAt isDelivered deliveredAt`), completely omitting the shipping address snapshot, financial breakdown (`itemsPrice`, `taxPrice`, `shippingPrice`, `discountAmount`), payment method, payment status, and vendor shipment data.
   - On the frontend (`TrackOrder.jsx`), this caused subtotal, tax, and delivery charges to display as `₹0.00 / Free`.

3. **Missing Multi-Vendor Shipment Data in Consumer APIs**:
   - In Siraba's marketplace architecture, shipment identifiers (`shipmentId`, `awbCode`, `courierName`, `trackingNumber`, `shippingRoutingCode`) are stored on the `VendorOrder` model, not the top-level `Order` model.
   - `GET /api/orders/myorders` only queried `Order.find({ user: req.user._id })` without joining `VendorOrder`.
   - Consequently, consumers never received the courier name, AWB code, shipment ID, or package tracking links for their orders.

4. **Broken Status Normalization & Hardcoded Timeline Steps in Frontend**:
   - In `Account.jsx`, `getOrderStatusInfo` only mapped 4 hardcoded statuses (`Pending`, `Approved`, `Packed`, `Shipped`), falling back to step 1 ("Order Placed") for `Processing`, `Delivered`, `in_transit`, or `out_for_delivery`. A delivered order was erroneously displayed as "Order Placed" with a yellow badge.
   - In `TrackOrder.jsx`, `getStatusStep` returned `0` for statuses like `Processing`, `in_transit`, `out_for_delivery`, or `pickup_scheduled`, breaking the visual timeline.
   - The progress timeline omitted the terminal "Delivered" step on order cards.

5. **Contradictory Cancelled / Return States**:
   - Cancelled orders displayed active shipment progress timelines instead of a dedicated cancellation and refund notice.

---

## 2. Existing Architecture

```
                    ┌─────────────────────────┐
                    │    Authenticated User   │
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
┌───────────────────────┐                   ┌─────────────────────────┐
│  GET /api/orders/     │                   │ GET /api/orders/:id/    │
│  myorders             │                   │ tracking (or /:id)      │
└──────────┬────────────┘                   └────────────┬────────────┘
           │                                             │
           ├─────────────────► Authenticate (protect) ◄──┤
           │                   Validate user ownership   │
           │                                             │
           ▼                                             ▼
┌───────────────────────┐                   ┌─────────────────────────┐
│  Order Collection     │                   │  VendorOrder Collection │
│  - orderItems         │                   │  - shipmentId           │
│  - shippingAddress    │◄─────────────────►│  - awbCode              │
│  - pricing & tax      │   (Order 1-to-N   │  - courierName          │
│  - paymentStatus      │    VendorOrders)  │  - shipment status      │
│  - overall status     │                   │  - vendor details       │
└───────────────────────┘                   └────────────┬────────────┘
                                                         │
                                                         ▼
                                            ┌─────────────────────────┐
                                            │ Shiprocket Integration  │
                                            │ - /courier/track/awb/:id│
                                            │ - Webhook synchronization│
                                            │   (/api/fulfillment/    │
                                            │    status)              │
                                            └─────────────────────────┘
```

### Data Models
- **`Order`**: Authoritative record for the consumer's purchase, containing line items, pricing, tax, payment status, delivery address snapshot, and aggregated lifecycle status (`Pending`, `Approved`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
- **`VendorOrder`**: Sub-order allocated per vendor containing specific package items, vendor payout accounting, and Shiprocket shipment tracking fields (`shipmentId`, `awbCode`, `courierName`, `courierId`, `shippingRoutingCode`, `shippedAt`, `deliveredAt`).
- **`User`**: Authentication principal with addresses and role validation.

---

## 3. Changes Made

| File / Module | Type | Description |
| ------------- | ---- | ----------- |
| `backend/routes/orderRoutes.js` | Backend API | 1. Added `formatOrderTrackingData` helper to build normalized consumer tracking representations.<br>2. Updated `GET /api/orders/myorders` to sort by `createdAt: -1` and attach multi-vendor shipment tracking details.<br>3. Implemented `GET /api/orders/:id` with strict multi-tenant ownership verification.<br>4. Replaced insecure public `GET /api/orders/track/:id` with authenticated handler and added `GET /api/orders/:id/tracking`.<br>5. Implemented live carrier tracking fallback without emitting fake data when Shiprocket is offline. |
| `frontend/src/context/OrderContext.jsx` | Frontend Context | Added `getOrderById(orderId)`, `getOrderTracking(orderId, live)`, and `refreshOrders()` methods to context. |
| `frontend/src/pages/TrackOrder.jsx` | Frontend Page | Completely upgraded tracking experience: authenticated session check, multi-vendor package breakdown, courier partner names, AWB tracking numbers, official Shiprocket tracking links, address snapshot, full payment summary, and cancellation/refund details. |
| `frontend/src/pages/Account.jsx` | Frontend Page | 1. Enhanced `getOrderStatusInfo` to normalize all canonical statuses (`Pending`, `Approved`, `Processing`, `In Transit`, `Out for Delivery`, `Delivered`, `Cancelled`, `Returned`).<br>2. Added multi-vendor shipment & courier tracking blocks to order cards.<br>3. Corrected order progress bar to 5 accurate milestones (`Placed`, `Confirmed`, `Processing`, `In Transit`, `Delivered`).<br>4. Handled cancelled orders gracefully. |
| `backend/tests/consumer_order_tracking.test.js` | Automated Tests | Created 24-test end-to-end test suite verifying authentication, ownership isolation, shipment tracking, multi-vendor separation, webhook synchronization, and persistence. |

---

## 4. API Verification

| Operation | Endpoint | Method | Auth | Ownership Check | Status |
| --------- | -------- | ------ | ---- | --------------- | ------ |
| List consumer orders | `/api/orders/myorders` | GET | Private (`protect`) | Queries only `user: req.user._id` | Verified |
| Get order details | `/api/orders/:id` | GET | Private (`protect`) | Rejects non-owner with 403 Forbidden | Verified |
| Get order tracking | `/api/orders/:id/tracking` | GET | Private (`protect`) | Rejects non-owner with 403 Forbidden | Verified |
| Legacy tracking alias | `/api/orders/track/:id` | GET | Private (`protect`) | Rejects non-owner with 403 Forbidden | Verified |
| Cancel order | `/api/orders/:id/cancel` | POST | Private (`protect`) | Rejects non-owner with 401/403 | Verified |
| Return order | `/api/orders/:id/return` | POST | Private (`protect`) | Rejects non-owner with 401/403; requires Delivered | Verified |

---

## 5. Order Status Verification

### Canonical Status Mapping

| External / Shiprocket Status | Canonical Internal Status | Consumer UI Label | Progress Milestone |
| ---------------------------- | ------------------------- | ----------------- | ------------------ |
| `NEW` / `PAYMENT_PENDING` | `Pending` | Order Placed | Step 1 (Placed) |
| `CONFIRMED` / `PROCESSING` | `Approved` / `Processing` | Confirmed / Processing | Step 2 (Confirmed) |
| `MANIFEST GENERATED` / `PICKUP SCHEDULED` | `pickup_scheduled` / `processing` | Pickup Scheduled | Step 2 (Processing) |
| `PICKED UP` / `IN TRANSIT` | `in_transit` / `Shipped` | In Transit | Step 3 (In Transit) |
| `OUT FOR DELIVERY` | `out_for_delivery` | Out for Delivery | Step 4 (Out for Delivery) |
| `DELIVERED` | `delivered` / `Delivered` | Delivered | Step 5 (Delivered) |
| `CANCELLED` | `cancelled` / `Cancelled` | Cancelled | Cancelled banner |
| `RTO DELIVERED` / `RETURNED` | `rto` / `Returned` | Returned | Returned banner |

---

## 6. Shiprocket Verification

1. **Shipment Creation & Association**:
   - Shipments are created per vendor sub-order (`VendorOrder`) through `shiprocketService.createShipment` or the BullMQ queue (`shiprocketQueue`).
   - Persisted fields on `VendorOrder`: `shipmentId`, `awbCode`, `courierName`, `courierId`, `shippingRoutingCode`, `labelUrl`, `status`.
2. **Consumer Exposure**:
   - Consumer endpoints (`/api/orders/myorders`, `/api/orders/:id`, `/api/orders/:id/tracking`) map these fields into `vendorOrders` arrays.
3. **Official Tracking URLs**:
   - When an AWB code exists, a direct tracking URL is exposed: `https://shiprocket.co/tracking/${awbCode}`.
4. **Live Courier Tracking Downtime Handling**:
   - When live carrier tracking is requested (`?live=true`), if Shiprocket API is unreachable, the system returns persisted database status with `liveTrackingError: "Carrier live tracking service is temporarily unavailable."` without faking scans or failing the request.
5. **Webhook Status Synchronization**:
   - `POST /api/fulfillment/status` idempotently ingests Shiprocket delivery status, updates `VendorOrder.status`, records timestamps (`deliveredAt`, `shippedAt`), and updates the parent `Order.status` to `Delivered` when all vendor shipments are delivered.

---

## 7. Frontend Verification

### My Orders (`/account` -> Orders Tab)
- Real order records loaded directly from `/api/orders/myorders`.
- Orders sorted chronologically (newest first).
- Displays total amount, placement date, and status badges.
- Displays multi-vendor shipment breakdown: Seller name, courier partner, AWB code, and direct "Track Package" link.
- Displays 5-milestone progress timeline (`Placed`, `Confirmed`, `Processing`, `In Transit`, `Delivered`).
- In-flight cancellation and post-delivery return actions integrated.
- Invoice download (`PDF`) functional.

### Track Order (`/track-order?orderId=...`)
- Authenticated access check: Displays clear login prompt if user is unauthenticated.
- Cross-consumer rejection: Displays access denied error if user is not the order owner.
- Dynamic timeline responds to backend statuses.
- Displays detailed vendor package cards with AWB codes and courier names.
- Displays full shipping address snapshot (recipient, phone, street, landmark, city, state, postal code).
- Displays price and tax breakdown (items subtotal, GST 18%, delivery charge, discounts, total).
- Live status refresh button allows consumers to poll for updates on demand.

---

## 8. Security Verification

### Multi-Tenant Isolation Evidence
- **Test 1**: Unauthenticated request to `/api/orders/myorders` -> `401 Unauthorized` (PASS).
- **Test 2**: Unauthenticated request to `/api/orders/:id` -> `401 Unauthorized` (PASS).
- **Test 3**: Unauthenticated request to `/api/orders/:id/tracking` -> `401 Unauthorized` (PASS).
- **Test 4**: Consumer A requests `/api/orders/myorders` -> Only Consumer A orders returned, Consumer B orders completely isolated (PASS).
- **Test 5**: Consumer A attempts to view Consumer B's order details -> `403 Forbidden` (PASS).
- **Test 6**: Consumer A attempts to track Consumer B's order -> `403 Forbidden` (PASS).
- **Test 7**: Consumer B attempts to track Consumer A's order -> `403 Forbidden` (PASS).
- **Test 8**: Invalid/malformed ObjectId payload -> `400 Bad Request` safely handled (PASS).

---

## 9. Multi-Vendor Verification

- In orders containing products from multiple vendors (e.g. Himalayan Organic Herbs and Kashmir Saffron Co):
  - Each vendor order is tracked as a distinct package in `vendorOrders`.
  - Individual packages carry separate courier partners (e.g. Delhivery Surface vs Blue Dart), separate AWB codes, and independent fulfillment states (`in_transit` vs `processing`).
  - The consumer UI renders separate package tracking cards rather than conflating distinct shipments.

---

## 10. Automated Tests

Executed automated test suites:

### 1. `backend/tests/consumer_order_tracking.test.js`
Command: `node tests/consumer_order_tracking.test.js`
Result: **24 PASSED, 0 FAILED**

```
  [ PASS ]  1. Unauthenticated consumer cannot access /api/orders/myorders (401)
  [ PASS ]  2. Unauthenticated consumer cannot access /api/orders/:id (401)
  [ PASS ]  3. Unauthenticated consumer cannot access /api/orders/:id/tracking (401)
  [ PASS ]  4. Unauthenticated consumer cannot access legacy /api/orders/track/:id (401)
  [ PASS ]  5. Consumer A can list their own orders only (does not leak Consumer B orders)
  [ PASS ]  6. Consumer A can view their own order details
  [ PASS ]  7. Consumer A CANNOT view Consumer B's order details (403 Forbidden)
  [ PASS ]  8. Consumer A CANNOT access Consumer B's tracking endpoint (403 Forbidden)
  [ PASS ]  9. Consumer B CANNOT access Consumer A's tracking endpoint (403 Forbidden)
  [ PASS ]  10. Invalid ObjectId format is rejected safely (400 Bad Request)
  [ PASS ]  11. Consumer receives complete order items and financial breakdown
  [ PASS ]  12. Consumer receives complete immutable shippingAddress snapshot
  [ PASS ]  13. Consumer receives accurate payment status and payment method
  [ PASS ]  14. Order without shipment correctly reports trackingAvailable = false
  [ PASS ]  15. Order with shipment exposes shipmentId, AWB code, courierName, and trackingUrl
  [ PASS ]  16. Multi-vendor order preserves separate packages and vendor identities
  [ PASS ]  17. Cancelled order does not show contradictory active delivery timeline
  [ PASS ]  18. GET /api/orders/myorders returns orders sorted newest first
  [ PASS ]  19. Webhook delivery status update synchronizes VendorOrder and parent Order
  [ PASS ]  20. Delivered order displays completed delivery timeline
  [ PASS ]  21. Live tracking handles carrier API errors gracefully without fake data
  [ PASS ]  22. Order tracking data remains consistent and persistent across re-fetches
  [ PASS ]  23. Non-existent order returns 404 Not Found cleanly
  [ PASS ]  24. Order return request enforces ownership and delivered status requirement
```

### 2. `backend/tests/consumer_address_checkout.test.js` (Regression Suite)
Command: `node tests/consumer_address_checkout.test.js`
Result: **18 PASSED, 0 FAILED**

### 3. `backend/tests/shiprocket_webhook.test.js` (Webhook Suite)
Command: `node tests/shiprocket_webhook.test.js`
Result: **15 PASSED, 0 FAILED**

### 4. Frontend Production Build
Command: `npx vite build`
Result: **BUILD SUCCESS (0 errors, 2646 modules transformed)**

---

## 11. Manual Browser Verification

Verified consumer UI flows in browser:
1. **Navigation from My Orders**:
   - Consumer logs in -> opens `/account` -> navigates to "My Orders".
   - Real orders are listed with order ID, date, status, items, price breakdown, and courier tracking details.
   - Clicking "Full Tracking Details" navigates to `/track-order?orderId=...`.
2. **Direct Tracking Page Navigation**:
   - Opening `/track-order?orderId=...` while logged in immediately resolves order details, courier details, and fulfillment timeline.
   - Entering an order ID manually into the tracking search input fetches and displays real tracking info.
3. **Multi-Vendor Shipment Display**:
   - Order with split vendors clearly displays Package 1 and Package 2 with vendor names, respective items, and AWB links.
4. **Order Without Shipment**:
   - Placed order displays "Awaiting seller dispatch. Tracking details will appear once picked up" with no fake courier data.

---

## 12. Remaining Issues

No known issues remain based on the verification performed.
The consumer order tracking lifecycle is fully functional, multi-tenant secure, and synchronized with Shiprocket fulfillment states end-to-end.
