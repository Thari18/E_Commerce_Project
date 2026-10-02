# LOCALMART — PHASE 4.1 TECHNICAL PLAN
## Multi-Vendor Cart & Checkout Architecture Specification

**DOCUMENT STATUS:** APPROVED / BASELINE LOCKED  
**AUTHOR:** Lead UI/UX Architect & Systems Architect  
**DATE:** October 02, 2026  
**STATUS RECOMMENDATION:** **APPROVED / BASELINE LOCKED**  

**TARGET STACK:** Angular 19 (Frontend Client), ASP.NET Core 8.0 Web API (.NET 8 / C# Backend), PostgreSQL / Supabase  
**DESIGN SYSTEM:** Phase 2.1 CSS Variable Design Tokens (`--lm-bg: #090D16`, `--lm-surface: #0F172A`, `--lm-surface-elevated: #1E293B`, `--lm-primary: #3B82F6`, `--lm-border: #1E293B`)  

---

### 1. Executive Summary & Purpose

Phase 4.1 defines the complete technical architecture and implementation specification for the **Multi-Vendor Cart & Checkout** subsystem of LocalMart. LocalMart is a location-aware multi-vendor marketplace where a customer can place items from multiple neighborhood vendors into a single shopping session.

When checkout occurs, the system MUST:
1. Re-validate real-time inventory stock (`BR-005`, `BR-006`).
2. Attach customer shipping address details from the completed Phase 3.2 Address Management UI (`/customer/addresses`).
3. Create a **Parent Order** (`orders` table) with provider-neutral payment method (`"COD"` or `"Online"`).
4. Automatically split the purchase into individual **Vendor Sub-Orders** (`vendor_orders` table) per vendor (`BR-011`).
5. Calculate vendor commissions (`VendorOrder.CommissionAmount`) by snapshotting `Vendor.CommissionRate` percentage at order creation time.
6. Provide a seamless, responsive Angular 19 frontend experience using Phase 2.1 Dark Navy / Electric Blue design tokens, Signal-driven state, and Phase 3.3 Shared UI Infrastructure (`ToastService`, `SkeletonLoaderComponent`, `EmptyStateComponent`, `ErrorStateComponent`).

This document provides the mandatory pre-implementation repository audit, data flow architecture, database mapping, API contract specification, UI/UX specification, file plan, and implementation breakdown.

---

### 2. Repository Audit & Backend/Frontend Readiness

A comprehensive audit of the workspace (`d:\new e commers`) yields the following readiness assessment across layers:

#### A. Backend Entity & Schema Audit (`src/LocalMart.Domain` & `src/LocalMart.Infrastructure`)
- **Entities Existing in Domain:**
  - `Cart.cs` (`CustomerId`, `Items`) — **EXISTS**
  - `CartItem.cs` (`CartId`, `ProductId`, `Quantity`, `UnitPrice`) — **EXISTS**
  - `Order.cs` (`CustomerId`, `OrderNumber`, `ShippingAddressId`, `SubTotal`, `DiscountAmount`, `DeliveryFee`, `GrandTotal`, `PaymentStatus`, `PaymentMethod`, `VendorOrders`, `Payment`) — **EXISTS**
  - `VendorOrder.cs` (`ParentOrderId`, `VendorId`, `SubOrderNumber`, `SubTotal`, `CommissionRate`, `CommissionAmount`, `NetEarnings`, `Status`, `Items`) — **EXISTS**
  - `OrderItem.cs` (`VendorOrderId`, `ProductId`, `ProductName`, `UnitPrice`, `Quantity`, `TotalPrice`) — **EXISTS**
  - `Payment.cs` (`OrderId`, `Amount`, `PaymentMethod`, `PaymentStatus`, `GatewayTransactionId`) — **EXISTS**
  - `CustomerAddress.cs` (`CustomerId`, `AddressLine1`, `City`, `State`, `PostalCode`, `Latitude`, `Longitude`, `IsDefault`) — **EXISTS**
  - `Inventory.cs` (`ProductId`, `QuantityAvailable`, `QuantityReserved`) — **EXISTS**
  - `Coupon.cs` & `CouponUsage.cs` — **EXISTS**
- **DbSets Existing in `ApplicationDbContext.cs`:**
  - `DbSet<Cart>`, `DbSet<CartItem>`, `DbSet<Order>`, `DbSet<VendorOrder>`, `DbSet<OrderItem>`, `DbSet<Payment>`, `DbSet<CustomerAddress>`, `DbSet<Inventory>`, `DbSet<Coupon>`, `DbSet<CouponUsage>` — **ALL EXIST**

#### B. Live Database Schema Reconciliation (`SUPABASE_BASELINE_SYNC_REPORT.md`)
- The 30 baseline domain tables (including `carts`, `cart_items`, `orders`, `vendor_orders`, `order_items`, `payments`, `customer_addresses`, `inventories`) are **PRESENT and SYNCED** in the live Supabase PostgreSQL database.
- **0 New EF Core Migrations Required** for baseline Cart, Order, and Payment entities.

#### C. Frontend Client Audit (`src/LocalMart.Client/src/app`)
- **Shared UI Infrastructure (Phase 3.3):**
  - `ToastService` & `ToastContainerComponent` — **ACTIVE**
  - `SkeletonLoaderComponent` (`card`, `detail`, `table`, `text`) — **ACTIVE**
  - `EmptyStateComponent` (`search`, `address`, `box`) — **ACTIVE**
  - `ErrorStateComponent` (`isNotice`, `retryClicked`) — **ACTIVE**
- **Address Management UI (Phase 3.2):**
  - `/customer/addresses` & `AddressService` — **ACTIVE**
- **Product Detail Component (Phase 3.1):**
  - `addToCart()` method contains `ToastService.info('Shopping Cart management will be enabled in Phase 4.1')` placeholder — **READY FOR WIRING**.

#### D. Web API Controller Architecture Audit (`src/LocalMart.WebAPI/Controllers`)
- `CartController.cs` (`/api/v1/cart/*`) — **IMPLEMENTED (Phase 4.1A)**
- `OrdersController.cs` (`/api/v1/checkout/validate` & `/api/v1/orders/*`) — **PLANNED (Phase 4.1C)**
- `PaymentsController.cs` (`/api/v1/payments/webhook`) — **PLANNED (Phase 4.1E)**


---

### 3. Multi-Vendor Cart Architecture

```
[ Customer Cart Session ]
          │
          ├── Vendor A (e.g. Green Valley Dairy)
          │     ├── Product 1: Whole Milk (Qty: 2 x $4.99 = $9.98)
          │     └── Product 2: Farm Butter (Qty: 1 x $5.50 = $5.50)
          │     └── Vendor Subtotal A = $15.48
          │
          └── Vendor B (e.g. Fresh Orchards)
                ├── Product 3: Organic Apples (Qty: 3 x $3.00 = $9.00)
                └── Vendor Subtotal B = $9.00
          │
          ├── Cart Raw Subtotal = $24.48
          ├── Delivery Fee (Server-Calculated Configured Flat Fee) = Configured Marketplace Fee
          ├── Promo Discount (Coupon) = -$2.50
          └── Cart Grand Total = Subtotal + DeliveryFee - DiscountAmount
```

#### Key Rules:
1. **Multi-Vendor Support:** The cart accepts products from multiple vendors simultaneously. Items are visually grouped by Vendor Store Name in the UI.
2. **Quantity & Stock Boundary:** Adding or updating item quantities validates `Quantity <= Inventory.QuantityAvailable`. If stock is depleted, the item is marked with an "Out of Stock" warning badge.
3. **Price Snapshot Rule:** `CartItem.UnitPrice` is populated at item addition, but re-validated against `Product.Price` during Checkout Validation.
4. **Calculated Totals:**
   $$\text{VendorSubtotal}_v = \sum (\text{UnitPrice}_i \times \text{Quantity}_i) \quad \text{for items in vendor } v$$
   $$\text{CartSubtotal} = \sum \text{VendorSubtotal}_v$$
   $$\text{GrandTotal} = \text{CartSubtotal} + \text{DeliveryFee} - \text{DiscountAmount}$$

---

### 4. Parent Order & Vendor Sub-Orders Hierarchy

When checkout completes successfully, the system writes a strict 1-to-N order tree:

```
                  ┌─────────────────────────────────────────┐
                  │          Parent Order (orders)          │
                  │  OrderNumber: "LM-20261002-9901"        │
                  │  CustomerId: <uuid>                     │
                  │  ShippingAddressId: <uuid>              │
                  │  GrandTotal: Server Calculated          │
                  │  PaymentMethod: COD | Online            │
                  │  PaymentStatus: Pending                 │
                  └────────────────────┬────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│     VendorOrder A (vendor_orders)     │   │     VendorOrder B (vendor_orders)     │
│ SubOrderNumber: "LM-20261002-9901-V01"│   │ SubOrderNumber: "LM-20261002-9901-V02"│
│ VendorId: VendorA_ID                  │   │ VendorId: VendorB_ID                  │
│ SubTotal: $15.48                      │   │ SubTotal: $9.00                       │
│ CommissionRate: 10.00% (Snapshotted)  │   │ CommissionRate: 10.00% (Snapshotted)  │
│ CommissionAmount: $1.55               │   │ CommissionAmount: $0.90               │
│ NetEarnings: $13.93                   │   │ NetEarnings: $8.10                    │
│ Status: Pending                       │   │ Status: Pending                       │
└───────────────────┬───────────────────┘   └───────────────────┬───────────────────┘
                    │                                           │
          ┌─────────┴─────────┐                                 │
          ▼                   ▼                                 ▼
   ┌─────────────┐     ┌─────────────┐                   ┌─────────────┐
   │ OrderItem 1 │     │ OrderItem 2 │                   │ OrderItem 3 │
   │ Whole Milk  │     │ Farm Butter │                   │ Organic App │
   └─────────────┘     └─────────────┘                   └─────────────┘
```

#### Commission Calculation Specification:
- **Source Rate:** `Vendor.CommissionRate` is the source percentage (e.g. `10.00` = 10.00%).
- **Snapshotting:** `VendorOrder.CommissionRate` is snapshotted from `Vendor.CommissionRate` at order creation time to ensure historical accuracy if the vendor rate is changed later.
- **Formulas:**
  $$\text{CommissionAmount} = \text{VendorSubTotal} \times \left( \frac{\text{VendorOrder.CommissionRate}}{100} \right)$$
  $$\text{NetEarnings} = \text{VendorSubTotal} - \text{CommissionAmount}$$
- **Base:** Commission calculation applies strictly to the vendor product subtotal (`VendorSubTotal`) before global shipping fee additions or promotional coupon discounts.

---

### 5. Inventory & Concurrency Validation Strategy

- **Validation Timeframes:**
  1. *Add to Cart:* Validates `Quantity <= Inventory.QuantityAvailable`.
  2. *Checkout Validation (`POST /api/v1/checkout/validate`):* Re-validates real-time available stock for all cart items.
  3. *Order Creation (`POST /api/v1/orders`):* Performs atomic database check.
- **Overselling Prevention & Concurrency:**
  - Database level update using optimistic concurrency or atomic SQL execution:
    ```sql
    UPDATE inventories 
    SET quantity_available = quantity_available - @qty 
    WHERE product_id = @productId AND quantity_available >= @qty;
    ```
  - If rows affected == 0, transaction rolls back and throws `400 Bad Request` ("Item '[ProductName]' is no longer available in the requested quantity").
- **Reservation / Hold Strategy:** Physical stock decrement occurs at order placement (`POST /api/v1/orders`). Temporary cart hold timers remain deferred to Phase 5.

---

### 6. Customer Address Integration (`/customer/addresses`) & Coordinates

- **Address Reuse:** Checkout consumes the existing Customer Address vertical slice (`CustomerAddress` entity & `/customer/addresses` UI) without modifying `AddressService`.
- **Address Resolution Rules:**
  1. Default selection pre-fills with customer's `IsDefault = true` address.
  2. Customer can select any previously saved address from a card selector.
  3. Selected `ShippingAddressId` is passed in `POST /api/v1/orders`.
- **Inline Address Creation Rule:** Reuses existing verified `/customer/addresses` component contract. If inline modal trigger requires separate layout integration, it is marked as a deferred UI refinement. No unverified modal APIs are invented.
- **Geographic Coordinates Rule:** `Latitude` and `Longitude` from `CustomerAddress` are retained for future location-aware delivery routing. Dynamic distance matrix calculation and dynamic per-distance delivery fees are **NOT performed in Phase 4.1**.

---

### 7. Delivery Fee Strategy (MVP Rule)

- **MVP Delivery Fee Rule:** The delivery fee is a **server-calculated configured flat marketplace delivery fee** added to `Order.DeliveryFee`.
- **No Hardcoded Currency/Amount:** Currency symbols and monetary amounts are **NOT hardcoded in frontend source code**. Values are served dynamically from backend DTOs.
- **Security Boundary:** Delivery fee is calculated **strictly on the backend**. The client NEVER submits or alters the delivery fee in the request payload.
- **Deferred Feature:** Dynamic distance-matrix delivery fee calculation per vendor sub-order remains deferred to Phase 5.

---

### 8. Idempotency Architecture & Payment Webhook Boundary

#### A. Idempotency Architecture Specification
- **Header:** Client sends `Idempotency-Key: <uuid>` (Client-generated UUID).
- **Single-Instance In-Memory Store:** Single-instance Phase 4.1 in-memory idempotency store uses `IMemoryCache`.
- **Atomic Reservation:** Atomic concurrent reservation is performed before order processing.
- **Verified Idempotency Behavior Rules:**
  1. **New Key:** Request proceeds to execute order creation.
  2. **Same Key + Same Request Payload:** Server returns cached `201 Created` order response instantly without re-processing order logic or decrementing inventory stock.
  3. **Same Key + Different Request Payload:** Server returns `409 Conflict` ("Idempotency key was previously used with a different request payload").
  4. **Concurrent In-Flight Use of Same Key:** Server detects active atomic lock and returns `409 Conflict` ("Order creation currently in-flight for this key").
- **Retention:** Successful response retention window is **24 hours**.
- **Database Boundary:** **0 database tables** for idempotency and **0 EF Core migrations** for idempotency in Phase 4.1.
- **Phase 5 Scope:** Distributed/multi-instance persistence is deferred to Phase 5.

#### B. Payment Architecture & Webhook Boundary
- **Supported Payment Methods:**
  - `COD` (Cash on Delivery): Order created with `PaymentStatus = Pending` and `VendorOrderStatus = Pending`. Vendor can confirm fulfillment immediately upon order placement (`BR-009`).
  - `Online` (Provider-Neutral Payment Boundary): Order created with `PaymentStatus = Pending`. Vendor fulfillment (`Preparing`) remains blocked until an authenticated payment webhook updates status to `Paid` (`BR-009`).
- **Provider-Neutral Webhook Boundary:**
  - Endpoint: `POST /api/v1/payments/webhook` (`ProcessPaymentWebhookCommand`).
  - Phase 4.1 handles provider-neutral `PaymentStatus` transitions (`Pending` -> `Paid` | `Failed`).
  - **Provider-Specific Webhook Authentication:** Provider-specific webhook cryptographic signature verification (e.g. Stripe-Signature / PayHere HMAC) is **DEFERRED** until an actual external payment provider is selected by product management. Production-grade provider webhook verification is NOT claimed for Phase 4.1.



---

### 10. Real-Time & SignalR Requirements Audit

- **Audit Findings:** SignalR is **NOT required** for basic Cart operations or Checkout submission.
- **Future Real-Time Scope (Phase 5/6):** SignalR hub (`/hubs/notifications`) will be used later for push notifications when a vendor changes sub-order status (`Pending` -> `Preparing` -> `OutForDelivery`).

---

### 11. Cart UI/UX Technical Specification

- **Route:** `/customer/cart` (guarded by `authGuard`, `roleGuard` `['Customer']`).
- **Layout & Visual Hierarchy (Phase 2.1 Tokens):**
  - **Header Banner:** Page title ("Shopping Cart"), vendor count badge, "Clear Cart" button.
  - **Vendor Groups:** Rendered as dark surface cards (`bg-lm-surface border-lm-border rounded-2xl p-6`). Each card displays Vendor Store Name, vendor location badge, and item list.
  - **Item Rows:** Product thumbnail image, Product Title, SKU badge, Unit Price, Quantity Stepper (`- Qty +`), Item Total Price, Remove Item (`✕`) button.
  - **Order Summary Sidebar (Sticky):**
    - Subtotal
    - Estimated Delivery Fee
    - Applied Coupon / Promo Discount
    - **Grand Total**
    - "Proceed to Checkout" CTA button (`lm-btn-primary` Electric Blue gradient).
  - **Fallback States:** Consumes `SkeletonLoaderComponent` (`type="card"`), `EmptyStateComponent` (`iconType="box"`, "Your Shopping Cart is Empty"), and `ErrorStateComponent`.

---

### 12. Checkout UI/UX Technical Specification

- **Routes:**
  - `/customer/checkout` (guarded by `authGuard`, `roleGuard` `['Customer']`).
  - `/customer/orders/:id/success` (guarded by `authGuard`, `roleGuard` `['Customer']`).
- **Checkout Multi-Section Layout:**
  1. **Section 1: Delivery Address Selection**
     - Renders saved customer address cards with radio selection.
     - Add address action triggering address management.
  2. **Section 2: Multi-Vendor Order Review**
     - Grouped summary of sub-orders by vendor.
  3. **Section 3: Payment Method Selection**
     - Radio options: `Cash on Delivery (COD)` vs. `Online Card Payment`.
  4. **Section 4: Promo Coupon Input**
     - Code input field with "Apply Coupon" button (`POST /api/v1/checkout/validate`).
  5. **Section 5: Final Order Summary & Place Order CTA**
     - Displays breakdown of Subtotal, Delivery Fee, Discount, and Grand Total.
     - "Place Order Now" primary action button with loading spinner & `Idempotency-Key` header.
  6. **Order Success Component (`order-success.component.ts`):**
     - Renders success checkmark, parent Order Number (`LM-20261002-XXXX`), sub-orders breakdown, and "Track Order" button.

---

### 13. Controller Architecture & API Endpoint Mapping

The mapping between HTTP endpoints, controllers, and CQRS handlers is locked as follows:

#### A. CartController (`/api/v1/cart/*`)
- `GET /api/v1/cart` -> `GetCartQuery`
- `POST /api/v1/cart/items` -> `AddToCartCommand`
- `PUT /api/v1/cart/items/{id}` -> `UpdateCartItemCommand`
- `DELETE /api/v1/cart/items/{id}` -> `RemoveCartItemCommand`
- `DELETE /api/v1/cart` -> `ClearCartCommand`

#### B. OrdersController (`/api/v1/checkout/validate` & `/api/v1/orders/*`)
- `POST /api/v1/checkout/validate` -> `ValidateCheckoutQuery`
- `POST /api/v1/orders` -> `CreateOrderCommand`
- `GET /api/v1/orders` -> `GetCustomerOrdersQuery`
- `GET /api/v1/orders/{id}` -> `GetOrderByIdQuery`

#### C. PaymentsController (`/api/v1/payments/webhook`)
- `POST /api/v1/payments/webhook` -> `ProcessPaymentWebhookCommand`

*(Note: All checkout validation and order placement operations are mapped under `OrdersController` to maintain clean RESTful controller boundaries).*

---

### 14. Security, Authorization & Tampering Prevention

1. **Price Tampering Prevention:** Client NEVER submits prices or total amounts. `UnitPrice`, `SubTotal`, `DeliveryFee`, `CommissionAmount`, and `GrandTotal` are calculated strictly on the backend from authoritative database records.
2. **Customer Isolation:** Customers can only view/modify their own cart (`CustomerId` extracted from JWT claims).
3. **Stock Tampering Prevention:** Requested item quantities are capped by real-time `Inventory.QuantityAvailable`.

---

### 15. Database Schema Impact & Constraints

- **Existing Tables Utilized:** `carts`, `cart_items`, `orders`, `vendor_orders`, `order_items`, `payments`, `customer_addresses`, `inventories`, `coupons`, `coupon_usages`.
- **Database Status:** Live Supabase PostgreSQL database is 100% synced with baseline EF Core model (`SUPABASE_BASELINE_SYNC_REPORT.md`).
- **Database Migrations Needed:** **0 New Migrations Required.**

---

### 16. Exact File Plan & Implementation Sequence

#### A. Backend Files to Create (15 New Files)
1. `src/LocalMart.Application/Features/Cart/DTOs/CartDtos.cs`
2. `src/LocalMart.Application/Features/Cart/Queries/GetCartQuery.cs`
3. `src/LocalMart.Application/Features/Cart/Commands/AddToCartCommand.cs`
4. `src/LocalMart.Application/Features/Cart/Commands/UpdateCartItemCommand.cs`
5. `src/LocalMart.Application/Features/Cart/Commands/RemoveCartItemCommand.cs`
6. `src/LocalMart.Application/Features/Cart/Commands/ClearCartCommand.cs`
7. `src/LocalMart.Application/Features/Orders/DTOs/OrderDtos.cs`
8. `src/LocalMart.Application/Features/Orders/Queries/ValidateCheckoutQuery.cs`
9. `src/LocalMart.Application/Features/Orders/Commands/CreateOrderCommand.cs`
10. `src/LocalMart.Application/Features/Orders/Queries/GetCustomerOrdersQuery.cs`
11. `src/LocalMart.Application/Features/Orders/Queries/GetOrderByIdQuery.cs`
12. `src/LocalMart.Application/Features/Payments/Commands/ProcessPaymentWebhookCommand.cs`
13. `src/LocalMart.WebAPI/Controllers/CartController.cs`
14. `src/LocalMart.WebAPI/Controllers/OrdersController.cs`
15. `src/LocalMart.WebAPI/Controllers/PaymentsController.cs`

#### B. Frontend Files to Create (6 New Files)
1. `src/LocalMart.Client/src/app/core/models/cart.models.ts`
2. `src/LocalMart.Client/src/app/core/services/cart.service.ts`
3. `src/LocalMart.Client/src/app/core/services/order.service.ts`
4. `src/LocalMart.Client/src/app/features/customer/cart.component.ts` (`/customer/cart`)
5. `src/LocalMart.Client/src/app/features/customer/checkout.component.ts` (`/customer/checkout`)
6. `src/LocalMart.Client/src/app/features/customer/order-success.component.ts` (`/customer/orders/:id/success`)

#### C. Frontend Files to Refactor (3 Existing Files)
1. `src/LocalMart.Client/src/app/app.routes.ts` (Register `/customer/cart`, `/customer/checkout`, and `/customer/orders/:id/success`)
2. `src/LocalMart.Client/src/app/shared/components/navbar/navbar.component.ts` (Bind Cart Counter Badge)
3. `src/LocalMart.Client/src/app/features/customer/product-detail.component.ts` (Wire `addToCart()` to `CartService`)

#### D. Recommended Implementation Sequence
To ensure dependency safety, Phase 4.1 implementation will proceed in 6 controlled sub-phases:

```
┌───────────────────────────────────────────────────────────────────┐
│ Phase 4.1A: Backend Cart Vertical Slice                           │
│ (Cart CQRS Handlers, DTOs, CartController)                        │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│ Phase 4.1B: Frontend Cart Infrastructure & UI                     │
│ (CartService, /customer/cart page, Navbar Cart Counter)           │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│ Phase 4.1C: Backend Checkout & Order Placement Vertical Slice     │
│ (ValidateCheckout, CreateOrder, GetCustomerOrders, GetOrderById)  │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│ Phase 4.1D: Frontend Checkout & Order Success UI                  │
│ (/customer/checkout, Address Selector, /customer/orders/:id/succ)│
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│ Phase 4.1E: Provider-Neutral Payment Boundary & Controller        │
│ (PaymentsController, ProcessPaymentWebhookCommand)                │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│ Phase 4.1F: End-to-End Verification & Automated Testing           │
│ (Build, Unit Tests, Live Chrome Multi-Vendor Flow Verification)   │
└───────────────────────────────────────────────────────────────────┘
```


---

### 18. Comprehensive Testing Strategy

1. **Backend Unit Tests:**
   - Test multi-vendor sub-order splitting logic in `CreateOrderCommand`.
   - Test commission calculation (`CommissionAmount = SubTotal * (CommissionRate / 100)`).
   - Test inventory stock decrement & overselling exception handling.
   - Test `GetOrderByIdQuery` and `GetCustomerOrdersQuery`.
2. **Frontend Unit Tests:**
   - Test `CartService` signal updates when items are added, updated, or removed.
   - Test checkout form validation, address selection, and payment method selection.
3. **End-to-End Build & Verification:**
   - `dotnet build LocalMart.sln`
   - `node node_modules/@angular/cli/bin/ng.js build --configuration production`
   - `node node_modules/@angular/cli/bin/ng.js test --watch=false`

---

### 19. Blockers & Deferred Architectural Decisions

- **Deferred Decision 1: External Payment Gateway Signature Authentication** — Specific gateway webhook HMAC signature verification (Stripe-Signature/PayHere) is deferred until an external provider is selected.
- **Deferred Decision 2: Distance-Based Dynamic Delivery Fee Engine** — Dynamic per-distance delivery fee matrix remains deferred to Phase 5.
- **Deferred Decision 3: Distributed Multi-Instance Idempotency Store** — Distributed multi-instance persistence (e.g., Redis or shared database store) remains deferred to Phase 5.

---

### 20. Acceptance Criteria & Final Readiness Recommendation

1. Customer can add products from multiple vendors into a single cart session.
2. Items are cleanly grouped by Vendor Store Name in the Cart UI.
3. Quantities can be incremented, decremented, or removed with immediate subtotal re-calculation.
4. Checkout consumes customer's saved shipping addresses from `/customer/addresses`.
5. Order placement generates 1 Parent Order + N Vendor Sub-Orders with automatic commission calculations.
6. Both `GetCustomerOrdersQuery` and `GetOrderByIdQuery` allow viewing order details.
7. Real-time inventory stock is decremented upon order creation.
8. Production build compiles cleanly with 0 errors and 0 warnings.
9. 100% unit tests passing.

---

**FINAL RECOMMENDATION:** **`APPROVED / BASELINE LOCKED`**  
*(The technical plan document [`docs/UI_UX_PHASE_4_1_CART_CHECKOUT_PLAN.md`](file:///d:/new%20e%20commers/docs/UI_UX_PHASE_4_1_CART_CHECKOUT_PLAN.md) is now fully corrected, synchronized, and locked as the approved baseline.)*


---
*END OF REVISED TECHNICAL PLAN*
