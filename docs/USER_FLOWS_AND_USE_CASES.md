# LocalMart — User Flows & Use Case Specification

**Document Version:** 1.1 (Controlled Correction Pass Applied)  
**Phase:** 02 — Detailed User Flows & Use Case Specification  
**Status:** Approved Phase 02 Baseline  
**Date:** September 12, 2026  
**Primary Source Document:** `LocalMart_BRD_v1.0(1).md`  
**Consolidated Reference:** `docs/BRD_BASELINE.md`  
**SRS Reference:** `docs/SRS.md`  
**Project:** LocalMart — Location-Aware Multi-Vendor E-Commerce Marketplace  

---

## 1. Document Control

### 1.1 Purpose
This document defines the complete operational User Flows, System Interactions, Exception Journeys, Use Case Specifications, and Role-Based Authorization Matrices for **LocalMart**. It translates the business rules defined in [`LocalMart_BRD_v1.0(1).md`](file:///d:/new%20e%20commers/LocalMart_BRD_v1.0%281%29.md), consolidated in [`docs/BRD_BASELINE.md`](file:///d:/new%20e%20commers/docs/BRD_BASELINE.md), and specified in [`docs/SRS.md`](file:///d:/new%20e%20commers/docs/SRS.md) into concrete, step-by-step behavioral workflows to guide frontend development, backend API design, database schema design, and QA testing.

### 1.2 Document Scope
This specification details all actor journeys across LocalMart:
* Customer discovery, search, multi-vendor cart management, checkout, payment processing, delivery tracking, and reviews.
* Vendor application onboarding, verification review tracking, store profile configuration, product management, inventory operations, order fulfillment, and analytics.
* Administrator governance including application verification, product moderation, commission setup, coupon management, review moderation, search analytics, and audit logging.
* Delivery staff assignment queues, pickup workflows, and status updates.
* Multi-vendor order splitting, stock validation, payment callback handling, and error/exception recovery flows.

---

## 2. Actors Definition

### 2.1 Human Actors
1. **Customer:** End-user who accesses LocalMart to discover local vendors, search for products, manage shopping carts, execute multi-vendor checkouts, pay for orders, track delivery status, and leave product reviews.
2. **Vendor / Vendor Applicant:** Local merchant who submits a `VendorApplication` for onboarding. The application progresses through `Pending → Under Review → Approved / Rejected / Suspended`. Upon Administrator approval, the vendor becomes an active selling `Vendor` who manages store profile information, creates catalog listings, manages stock levels, processes assigned vendor orders (`VendorOrders`), and views payouts (`BR-001`).
3. **Delivery Staff:** Operational personnel responsible for receiving order delivery assignments, picking up orders from vendor shop locations, updating delivery transit states (`Picked Up`, `Out for Delivery`, `Delivered`), and managing delivery handoffs.
4. **Administrator:** System supervisor responsible for reviewing vendor applications, moderating product listings, managing categories/brands, configuring commission rates, managing coupons, moderating reviews, analyzing search logs, and monitoring audit logs.

### 2.2 System & External Actors
1. **Payment Gateway:** External third-party payment infrastructure (Stripe or suitable regional/local gateway) handling online payment authorization and asynchronous cryptographic webhook callbacks.
2. **Notification / Real-Time System:** Internal SignalR real-time notification engine pushing order updates, delivery assignments, low-stock alerts, and approval notices.
3. **Media Service (Cloudinary):** External cloud asset provider handling vendor logos, cover images, product image uploads, and image optimization.
4. **Maps Service:** External geocoding and mapping API providing latitude/longitude geocoding and distance calculation utilities.
5. **System / Background Processes:** Automated platform tasks handling order timeouts, notification queues, search query logging, and analytics aggregation.

---

## 3. Global End-to-End User Flow

```text
               ┌────────────────────────────────────────┐
               │              Landing Page              │
               └───────────────────┬────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
         [ Guest Browsing ]             [ Authenticated User ]
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                   Search / Browse / Nearby Discovery
                                   │
                     (300ms Frontend Debounce)
                                   │
                                   ▼
                         Product Details View
                                   │
                                   ▼
                            Add to Cart
                                   │
                                   ▼
                         Multi-Vendor Cart View
                                   │
                                   ▼
                         Proceed to Checkout
                                   │
                                   ▼
                      Address & Delivery Method
                                   │
                                   ▼
                      Payment (COD / Gateway)
                                   │
                   System Revalidates Stock & Price
                                   │
                                   ▼
                        Main Order Created (#1000)
                                   │
                ┌──────────────────┴──────────────────┐
                ▼                                     ▼
      Vendor A Order (#1000-A)              Vendor B Order (#1000-B)
                │                                     │
                ▼                                     ▼
            Confirmed                             Confirmed
                │                                     │
                ▼                                     ▼
            Preparing                             Preparing
                │                                     │
                └──────────────────┬──────────────────┘
                                   │
                                   ▼
                           Ready for Pickup
                                   │
                                   ▼
                          Delivery Assignment
                                   │
                                   ▼
                               Picked Up
                                   │
                                   ▼
                           Out for Delivery
                                   │
                                   ▼
                               Delivered
                                   │
                                   ▼
                      Customer Review (Eligible Only)
```

---

## 4. Customer User Flows (`CF-001` to `CF-029`)

### `CF-001` Customer Registration
* **Actor:** Customer
* **Goal:** Create a personal customer account to enable purchasing, address management, and order tracking.
* **Preconditions:** Customer is unauthenticated.
* **Trigger:** Customer clicks "Register" or "Sign Up" on the storefront navbar.
* **Main Success Flow:**
  1. Customer enters Full Name, Email Address, Phone Number, Password, and Confirm Password.
  2. System validates input formats (valid email, phone format, password strength).
  3. System verifies Email is unique.
  4. System hashes password using strong industry-standard password hashing algorithm.
  5. System creates Customer account record and initializes an empty Wishlist and Cart.
  6. System redirects Customer to Login or auto-authenticates and issues JWT access token + HTTP-only Refresh token.
* **Alternate / Exception Flows:**
  * *Email Already Registered:* System displays error "Email is already registered. Please log in."
  * *Validation Failure:* System displays inline field validation errors.
* **Validation Rules:** Email format, Password minimum 8 characters with required complexity.
* **Authorization:** Public access.
* **Business Rules Referenced:** `BR-003`, `FR-AUTH-001`, `FR-AUTH-002`.
* **Postconditions:** Active Customer record created in database.

---

### `CF-002` Customer Login
* **Actor:** Customer
* **Goal:** Authenticate to access personal profile, cart, saved addresses, order history, and checkout.
* **Preconditions:** Customer account exists.
* **Trigger:** Customer enters credentials on Login page and submits.
* **Main Success Flow:**
  1. Customer inputs Email and Password.
  2. System verifies credentials against hashed password.
  3. System validates Customer account status is Active.
  4. System generates JWT Access Token and sets HTTP-only Refresh Token cookie.
  5. System loads Customer's active cart and default delivery address.
  6. Customer is redirected to requested page or Storefront landing page.
* **Alternate / Exception Flows:**
  * *Invalid Credentials:* System displays "Invalid email or password."
  * *Account Suspended:* System displays "Account disabled. Please contact support."
* **Postconditions:** Valid session established; user identity attached to state.

---

### `CF-003` Logout / Session Handling
* **Actor:** Customer
* **Goal:** Terminate current session securely.
* **Preconditions:** Customer is logged in.
* **Trigger:** Customer clicks "Logout".
* **Main Success Flow:**
  1. Customer triggers Logout.
  2. System revokes the Refresh Token in the database.
  3. System clears HTTP-only cookie and local access token.
  4. Customer is redirected to Public Storefront landing page.
* **Postconditions:** Active tokens invalidated; user returned to guest state.

---

### `CF-004` Browse Products
* **Actor:** Customer / Guest
* **Goal:** Explore marketplace catalog listings.
* **Preconditions:** None.
* **Trigger:** User navigates to Category page, Brand page, or Catalog view.
* **Main Success Flow:**
  1. User selects a category or browses catalog.
  2. System queries active products belonging to approved and `Active` vendors (`BR-012`).
  3. System returns paginated product grid showing product image, name, price, discount tag, vendor name, rating average, and availability status.
  4. User views product listings.
* **Postconditions:** Products displayed using server-side pagination.

---

### `CF-005` Search Products
* **Actor:** Customer / Guest
* **Goal:** Find products by keyword, name, SKU, category, or brand.
* **Preconditions:** None.
* **Trigger:** User enters text in search bar and presses Enter or clicks Search button.
* **Main Success Flow:**
  1. User inputs query (e.g., "organic milk").
  2. System executes full-text search against product name, SKU, brand, category, and keywords.
  3. System filters out products from inactive or suspended vendors (`BR-012`).
  4. System logs valid search query into `search_logs` table (`BR-010`).
  5. System displays matching product grid.
* **Alternate Flows:**
  * *Zero Results Found:* System logs query to `search_logs` with `result_count = 0`, displays "No products found matching your query", and suggests related categories or popular products.

---

### `CF-006` Search Suggestions
* **Actor:** Customer / Guest
* **Goal:** View real-time search term suggestions while typing.
* **Preconditions:** Search input field focused.
* **Trigger:** User types characters into search bar.
* **Main Success Flow:**
  1. User types input (e.g., "app").
  2. **Frontend Debounce Rule:** Frontend waits approximately **300ms** after last keystroke before issuing API call (`FR-SEARCH-004`).
  3. Frontend sends `GET /api/v1/search/suggestions?prefix=app`.
  4. System returns list of top matching product names and search terms.
  5. Frontend displays dropdown suggestion panel below search bar.
  6. User clicks a suggestion, triggering full search execution.

---

### `CF-007` Search with Filters
* **Actor:** Customer / Guest
* **Goal:** Refine search/catalog results using specific criteria.
* **Trigger:** User applies filter controls (Category, Price Range, Brand, Rating, Discount, Availability, Nearby Distance).
* **Main Success Flow:**
  1. User adjusts filters (e.g., Price: $10-$50, Rating: 4+ stars, Distance: ≤ 5 km).
  2. System re-queries catalog applying combined filter predicates.
  3. System updates product grid dynamically.

---

### `CF-008` Search with Sorting
* **Actor:** Customer / Guest
* **Goal:** Order search/catalog results.
* **Trigger:** User selects option from Sort dropdown (Relevance, Price: Low-to-High, Price: High-to-Low, Rating, Newest, Proximity).
* **Main Success Flow:**
  1. User selects sort option.
  2. System orders matching active product records accordingly and updates UI grid.

---

### `CF-009` Nearby Vendor Discovery
* **Actor:** Customer / Guest
* **Goal:** Discover shops and available products near customer's geographical location.
* **Preconditions:** Customer address or location coordinates (Latitude/Longitude) available.
* **Main Success Flow:**
  1. User accesses "Nearby Shops" view.
  2. System retrieves user's current lat/long (from address book or location selector).
  3. System calculates geographical distance (Haversine formula) to approved active vendors.
  4. System filters vendors within selected radius (e.g., 5 km, 10 km).
  5. System presents list of nearby vendor store profiles with distance badges (e.g., "1.2 km away") and local product listings.

---

### `CF-010` View Vendor Store
* **Actor:** Customer / Guest
* **Goal:** View vendor store profile, operating hours, address, rating, and catalog.
* **Main Success Flow:**
  1. User clicks on Vendor shop name/logo.
  2. System loads public store profile (Logo, Cover Image, Description, Operating Hours, Address, Rating Avg, Contact info).
  3. System displays products sold exclusively by this vendor.

---

### `CF-011` View Product Details
* **Actor:** Customer / Guest
* **Goal:** View comprehensive product info, stock status, images, vendor info, and reviews.
* **Main Success Flow:**
  1. User clicks a product card.
  2. System checks product is `Active` and Vendor is `Active` (`BR-012`).
  3. System displays primary image, gallery thumbs, name, SKU, price, discount, available quantity status, vendor store card, and customer reviews list.

---

### `CF-012` Wishlist
* **Actor:** Customer
* **Goal:** Save products for future purchase.
* **Main Success Flow:**
  1. Customer clicks "Heart" / "Add to Wishlist" icon on product.
  2. System verifies Customer authentication.
  3. System adds item to Customer's wishlist.
  4. Customer can view wishlist, check availability, or move items to Cart.

---

### `CF-013` Add Product to Cart
* **Actor:** Customer
* **Goal:** Add product item and quantity to shopping cart.
* **Preconditions:** Product is `Active`, Vendor is `Active`, Available Stock > 0.
* **Main Success Flow:**
  1. Customer selects quantity and clicks "Add to Cart".
  2. System validates requested quantity against Available Stock (`BR-005`).
  3. System adds item to Customer's active Cart session (or updates quantity if item already exists).
  4. System updates cart icon item count badge in navbar.

---

### `CF-014` Multi-Vendor Cart
* **Actor:** Customer
* **Goal:** Review shopping cart containing products from multiple distinct vendors.
* **Main Success Flow:**
  1. Customer opens Cart view.
  2. System retrieves cart items and visually groups them by Vendor (e.g., Vendor A items section, Vendor B items section).
  3. System displays item subtotals per vendor, estimated shipping fees per vendor, applied coupon discounts, and overall cart total.
  4. Customer reviews grouped items before proceeding to checkout.

---

### `CF-015` Update / Remove Cart Items
* **Actor:** Customer
* **Goal:** Modify item quantities or remove items from cart.
* **Main Success Flow:**
  1. Customer changes quantity or clicks "Remove" on a cart item.
  2. If quantity updated: System validates new quantity against available stock.
  3. System updates item subtotal and overall cart totals dynamically.

---

### `CF-016` Checkout
* **Actor:** Customer
* **Goal:** Initiate purchase process for cart items.
* **Preconditions:** Customer is authenticated, cart is not empty.
* **Main Success Flow:**
  1. Customer clicks "Proceed to Checkout".
  2. System re-validates item stock availability, prices, active vendor statuses, and discounts (`BR-005`, `BR-012`).
  3. System directs Customer to Checkout multi-step flow (Address → Delivery Method → Payment).

---

### `CF-017` Address Selection / Management
* **Actor:** Customer
* **Goal:** Select or add delivery address for checkout.
* **Main Success Flow:**
  1. Customer selects an existing saved address or clicks "Add New Address".
  2. If adding new: Customer enters recipient name, phone number, street address, city, district, postal code, delivery notes, and map pin (lat/long).
  3. Customer confirms delivery address selection for current order.

---

### `CF-018` Delivery Method Selection
* **Actor:** Customer
* **Goal:** Select delivery options and review shipping charges per vendor.
* **Main Success Flow:**
  1. System calculates delivery fee per vendor based on location/distance parameters.
  2. Customer reviews vendor-grouped shipping charges and accepts delivery method.

---

### `CF-019` COD Checkout
* **Actor:** Customer
* **Goal:** Complete order placement selecting Cash on Delivery.
* **Main Success Flow:**
  1. Customer selects "Cash on Delivery (COD)" payment option.
  2. Customer inputs valid coupon code (optional). System validates coupon (`BR-008`).
  3. Customer clicks "Place Order".
  4. System executes atomic stock check (`BR-005`) and supports stock reservation (`BR-006`).
  5. System creates parent/main `Order` (#1000) and child `VendorOrder` records (#1000-A, #1000-B) subject to successful checkout validation (`BR-011`). The exact initial order status and state transition flow are finalized in detailed order-state and API design phases. Vendor fulfillment must strictly follow defined order authorization and state rules.
  6. System sends real-time order notifications to Customer, Vendor A, and Vendor B via SignalR (`FR-NOTIF-001`).
  7. Customer is redirected to Order Confirmation page (#1000).

---

### `CF-020` Online Payment Checkout
* **Actor:** Customer, Payment Gateway
* **Goal:** Complete order placement selecting online payment gateway.
* **Main Success Flow:**
  1. Customer selects "Online Payment" option.
  2. Customer clicks "Proceed to Pay".
  3. System re-validates stock (`BR-005`), creates parent `Order` (#1000) and child `VendorOrder` records (#1000-A, #1000-B) with unconfirmed payment status `Pending`. An online-payment order may exist in unconfirmed state before gateway verification, but an order must NOT become fulfillable by the vendor merely because the order record was created.
  4. System initiates payment session with selected online payment gateway (provider deferred) and redirects Customer to secure payment gateway interface.
  5. Customer completes payment card entry on payment gateway interface.
  6. Payment Gateway completes processing and sends asynchronous cryptographic webhook callback (`FR-PAY-002`, `BR-009`) to backend endpoint `POST /api/v1/payments/payment-webhook`.
  7. Backend verifies cryptographic webhook signature, marks `Payment` status as `Paid`, and updates `Order` status to `Confirmed`. Successful payment must be securely verified before the order is allowed to proceed into the vendor fulfillment lifecycle. Failed or cancelled payments must not authorize vendor fulfillment.
  8. Customer is redirected back to LocalMart Order Confirmation page.

---

### `CF-021` Payment Failure / Recovery
* **Actor:** Customer, Payment Gateway
* **Goal:** Handle failed online payment transactions gracefully without data corruption.
* **Main Success Flow:**
  1. Payment Gateway processing fails (e.g., insufficient funds, card declined).
  2. Payment Gateway notifies Customer and calls webhook with status `Failed`.
  3. System updates Payment record to `Failed`. Order remains unconfirmed and cannot be processed by vendors.
  4. System releases any temporary stock reservations held for the order.
  5. Customer is redirected to Payment Retry screen displaying error description and options to retry payment or select COD.

---

### `CF-022` Order Confirmation
* **Actor:** Customer
* **Goal:** View confirmed order details, order numbers, vendor breakdowns, and status.
* **Main Success Flow:**
  1. System displays Order Confirmation summary showing Main Order Number (#1000), delivery address, total amount paid/due, and vendor-split order cards (#1000-A, #1000-B).

---

### `CF-023` View Orders
* **Actor:** Customer
* **Goal:** View personal historical and active order listings.
* **Main Success Flow:**
  1. Customer opens "My Orders".
  2. System queries main orders belonging strictly to authenticated Customer ID (`BR-003`).
  3. System presents list of orders showing date, main order number, status, item thumbnail summaries, and total price.

---

### `CF-024` View Order Details
* **Actor:** Customer
* **Goal:** Inspect full details of a specific parent order and constituent vendor orders.
* **Main Success Flow:**
  1. Customer clicks on Order #1000.
  2. System verifies Customer ownership (`BR-003`).
  3. System displays parent order info, delivery address, payment method, payment status, vendor orders breakdown (#1000-A, #1000-B), item line prices, and delivery assignment status.

---

### `CF-025` Track Order Status
* **Actor:** Customer
* **Goal:** View live progress timeline of an active order.
* **Main Success Flow:**
  1. Customer opens tracking view for Order #1000.
  2. System displays visual status stepper: `Pending → Confirmed → Preparing → Ready for Pickup → Picked Up → Out for Delivery → Delivered`.
  3. Live status updates pushed automatically via SignalR hub (`FR-NOTIF-001`).

---

### `CF-026` Order Cancellation
* **Actor:** Customer
* **Goal:** Cancel an eligible order before vendor preparation starts.
* **Preconditions:** Order status is `Pending` or `Confirmed` prior to Vendor `Preparing` status.
* **Main Success Flow:**
  1. Customer clicks "Cancel Order" on Order #1000.
  2. System validates order state is eligible for cancellation.
  3. System updates Order and child VendorOrder statuses to `Cancelled`.
  4. System triggers inventory release logic, returning reserved stock to Available Stock.
  5. If online payment was completed: System initiates refund record processing.
  6. System notifies Vendor(s) of cancellation via SignalR.

---

### `CF-027` Receive Notifications
* **Actor:** Customer
* **Goal:** Receive real-time push and in-app alerts regarding order status changes.
* **Main Success Flow:**
  1. Business event occurs (e.g., Vendor updates order status to `Out for Delivery`).
  2. SignalR hub delivers notification to Customer's active connection.
  3. In-app toast notification appears and unread notification bell counter increments.

---

### `CF-028` Review / Rating
* **Actor:** Customer
* **Goal:** Submit a rating and comment for a purchased product.
* **Preconditions:** Customer completed purchase of product AND order status is `Delivered` (`BR-004`).
* **Main Success Flow:**
  1. Customer navigates to completed Order details or Product page and clicks "Write a Review".
  2. System verifies Customer purchase eligibility rule (`BR-004`).
  3. Customer selects Star Rating (1-5) and enters text review.
  4. System validates inputs and saves Review record.
  5. System recalculates product and vendor rating averages.

---

### `CF-029` Profile Management
* **Actor:** Customer
* **Goal:** Update personal contact details and change password.
* **Main Success Flow:**
  1. Customer opens Profile Settings.
  2. Customer updates Full Name, Phone Number, or changes Password (entering current password for verification).
  3. System validates and saves profile updates.

---

## 5. Vendor User Flows (`VF-001` to `VF-019`)

### `VF-001` Vendor Registration / Application
* **Actor:** Vendor applicant
* **Goal:** Submit a business application to become a verified seller on LocalMart.
* **Preconditions:** None.
* **Trigger:** Applicant clicks "Become a Vendor" on Storefront landing page.
* **Main Success Flow:**
  1. Applicant fills multi-step vendor application form:
     * **Owner/Contact:** Full Name, Email, Phone.
     * **Business Information:** Registered Shop Name, Business Type, Primary Category, Business Description.
     * **Location:** Physical Street Address, City, District, Latitude, Longitude (map pin).
     * **Verification Information:** Tax/Registration verification info as mandated by policy (exact document rules deferred to Section 21).
     * **Store Profile Draft:** Logo URL, Cover Image URL, Description, Operating Hours, Social Links.
     * **Payout Configuration:** Payout method selection, account provider reference.
     * **Terms Acceptance:** Agreement to vendor terms and privacy policy.
  2. System validates input data formats and email uniqueness.
  3. System creates a `VendorApplication` record with status `Pending`.
  4. System notifies Admins via SignalR of new pending application.
  5. System displays confirmation: "Application submitted successfully. Under review by Marketplace Administration."
* **Postconditions:** `VendorApplication` record created in `Pending` state. The applicant cannot list products, publish store listings, or receive/process customer orders until the application is reviewed and Approved by an Administrator (`BR-001`).

---

### `VF-002` Vendor Application Status
* **Actor:** Vendor applicant
* **Goal:** Check onboarding application approval progress.
* **Main Success Flow:**
  1. Applicant logs into Vendor Portal.
  2. System displays current application lifecycle status: `Pending → Under Review → Approved / Rejected / Suspended`.
  3. If `Under Review`: Displays "Admin review in progress."
  4. If `Rejected`: Displays rejection reason and resubmission options.
  5. If `Approved`: Application transitions to active `Vendor` selling status and redirects to Vendor Dashboard.

---

### `VF-003` Vendor Login
* **Actor:** Approved Vendor
* **Goal:** Authenticate to access vendor management dashboard.
* **Preconditions:** Vendor application has been Approved by an Administrator (`BR-001`).
* **Main Success Flow:**
  1. Vendor enters Email and Password.
  2. System verifies credentials.
  3. System checks Vendor account status (`Approved` and `Active`).
  4. System issues JWT access token and refresh cookie.
  5. System opens Vendor Dashboard.

---

### `VF-004` Vendor Store Profile
* **Actor:** Approved Vendor
* **Goal:** Maintain public shop information.
* **Main Success Flow:**
  1. Vendor edits Store Name, Logo, Cover Image, Description, Operating Hours, Phone, Social Links, or Map Location.
  2. System updates `StoreProfile` record. Public store page reflects changes immediately.

---

### `VF-005` Vendor Product Creation
* **Actor:** Approved Vendor
* **Goal:** Add a new product listing to vendor catalog.
* **Preconditions:** Vendor status is `Approved` and `Active` (`BR-001`).
* **Main Success Flow:**
  1. Vendor navigates to "Products" → "Add New Product".
  2. Vendor enters Name, SKU, Short/Long Description, Category ID, Brand ID, Base Price, Discount Price/Percentage, Initial Physical Stock Quantity, Low-Stock Threshold.
  3. System validates SKU uniqueness for vendor.
  4. System sets Product status to `Draft` or `Active`.
  5. Product is saved in database linked strictly to Vendor ID (`BR-002`).

---

### `VF-006` Product Image Management
* **Actor:** Approved Vendor
* **Goal:** Upload and manage product gallery media using Cloudinary.
* **Main Success Flow:**
  1. Vendor selects product and clicks "Upload Image".
  2. System uploads file to Cloudinary media storage.
  3. Cloudinary returns secure asset URL and image metadata.
  4. System saves `ProductImage` record linked to product and designates primary image.

---

### `VF-007` Product Update
* **Actor:** Approved Vendor
* **Goal:** Edit product price, description, category, or stock attributes.
* **Main Success Flow:**
  1. Vendor edits product attributes and saves.
  2. System verifies Vendor owns the target product (`BR-002`).
  3. System updates `Product` record.

---

### `VF-008` Product Activation / Deactivation
* **Actor:** Approved Vendor
* **Goal:** Change product availability status (`Draft`, `Active`, `Inactive`, `Out of Stock`).
* **Main Success Flow:**
  1. Vendor toggles product status switch (e.g., `Active` to `Inactive`).
  2. System updates product state. If `Inactive`, product is immediately hidden from public storefront (`BR-012`).

---

### `VF-009` Inventory Management
* **Actor:** Approved Vendor
* **Goal:** Adjust physical stock quantities and view reserved stock levels.
* **Main Success Flow:**
  1. Vendor views Inventory table displaying Product Name, Physical Stock, Reserved Stock, Available Stock for Sale (`Available = Physical - Reserved`).
  2. Vendor updates Physical Stock count (e.g., receives new shipment +50 units).
  3. System records `InventoryMovements` audit log entry detailing change.

---

### `VF-010` Low Stock Handling
* **Actor:** Approved Vendor
* **Goal:** Monitor and resolve low-stock warnings.
* **Main Success Flow:**
  1. Product available stock reaches low-stock threshold.
  2. System flags product card with "Low Stock Warning" badge and triggers vendor alert notification.
  3. Vendor updates inventory quantity to replenish stock.

---

### `VF-011` Vendor Order Viewing
* **Actor:** Approved Vendor
* **Goal:** View orders containing products sold by vendor.
* **Main Success Flow:**
  1. Vendor opens "Orders" tab.
  2. System queries child `VendorOrders` filtered strictly by Vendor ID (`BR-002`).
  3. Vendor views order list (#1000-A) displaying items, customer delivery notes, total vendor payable amount, and current fulfillment status. Vendor **cannot** view Vendor B's items (`BR-002`).

---

### `VF-012` Accept / Process Vendor Order
* **Actor:** Approved Vendor
* **Goal:** Acknowledge new vendor order assignment.
* **Preconditions:** Payment for order is verified (COD or Gateway Webhook verified).
* **Main Success Flow:**
  1. Vendor clicks "Accept Order" on new order #1000-A.
  2. System updates VendorOrder status to `Confirmed`.

---

### `VF-013` Preparing Order
* **Actor:** Approved Vendor
* **Goal:** Update fulfillment status while packing items.
* **Main Success Flow:**
  1. Vendor finishes packing products and clicks "Start Preparing".
  2. System updates VendorOrder status to `Preparing`.
  3. SignalR notifies Customer of `Preparing` status.

---

### `VF-014` Ready for Pickup
* **Actor:** Approved Vendor
* **Goal:** Flag order as prepared and ready for delivery pickup.
* **Main Success Flow:**
  1. Vendor completes packaging and clicks "Mark Ready for Pickup".
  2. System updates VendorOrder status to `Ready for Pickup`.
  3. System places order into Delivery Staff assignment pool (`FR-DEL-001`).

---

### `VF-015` Vendor Notifications
* **Actor:** Approved Vendor
* **Goal:** Receive real-time alerts for new orders, cancellations, and payouts.
* **Main Success Flow:**
  1. SignalR pushes live alert to Vendor dashboard upon event occurrence.

---

### `VF-016` Vendor Reviews
* **Actor:** Approved Vendor
* **Goal:** Monitor customer ratings and reviews for vendor products.
* **Main Success Flow:**
  1. Vendor accesses "Reviews" view to inspect product ratings and feedback.

---

### `VF-017` Vendor Analytics
* **Actor:** Approved Vendor
* **Goal:** Inspect store performance metrics.
* **Main Success Flow:**
  1. Vendor views analytics dashboard showing daily/weekly/monthly revenue, top-selling products, order completion rates, and average rating trends.

---

### `VF-018` Vendor Payouts
* **Actor:** Approved Vendor
* **Goal:** View payout history and pending settlement balances.
* **Main Success Flow:**
  1. Vendor opens "Payouts" tab.
  2. System displays total completed sales, platform commissions deducted (`BR-014`), net vendor payable balance, and historical payout status transactions (`Pending`, `Processing`, `Paid`).

---

### `VF-019` Vendor Settings
* **Actor:** Approved Vendor
* **Goal:** Configure account credentials and notification preferences.
* **Main Success Flow:**
  1. Vendor updates contact details or changes password.

---

## 6. Admin User Flows (`AF-001` to `AF-024`)

### `AF-001` Admin Authentication
* **Actor:** Marketplace Administrator
* **Goal:** Authenticate securely into administrative management panel.
* **Preconditions:** Admin account provisioned via controlled administrative setup (no public registration).
* **Main Success Flow:**
  1. Admin inputs credentials on secure Admin portal login.
  2. System verifies credentials, checks Admin role/permissions (`BR-007`), and issues Admin JWT token.
  3. Admin Dashboard loads.

---

### `AF-002` Admin Dashboard
* **Actor:** Administrator
* **Goal:** View marketplace-wide operational overview.
* **Main Success Flow:**
  1. System presents key metrics: Total Customers, Active Vendors, Pending Vendor Applications, Total Products, Total Orders, Platform Revenue, Pending Moderation Queue.

---

### `AF-003` Customer Management
* **Actor:** Administrator
* **Goal:** Manage registered customer accounts.
* **Main Success Flow:**
  1. Admin searches customer accounts, views customer profile, order history summary, and can activate/disable customer access.

---

### `AF-004` Vendor Application Review
* **Actor:** Administrator
* **Goal:** Inspect submitted vendor onboarding applications.
* **Main Success Flow:**
  1. Admin selects application from "Pending Applications" queue.
  2. System loads vendor owner details, business identity, physical address, lat/long location, store profile preview, payout references, and submitted verification details.

---

### `AF-005` Vendor Approval
* **Actor:** Administrator
* **Goal:** Approve vendor application to grant marketplace selling access.
* **Main Success Flow:**
  1. Admin clicks "Approve Vendor".
  2. System transitions `VendorApplication` status to `Approved` and creates/activates the selling `Vendor` record (`BR-001`).
  3. System activates vendor account permissions.
  4. System notifies Vendor via email/SignalR of application approval.

---

### `AF-006` Vendor Rejection
* **Actor:** Administrator
* **Goal:** Reject non-compliant vendor application.
* **Main Success Flow:**
  1. Admin enters rejection reason and clicks "Reject Application".
  2. System transitions `VendorApplication` status to `Rejected`.
  3. System notifies applicant of rejection reason.

---

### `AF-007` Vendor Suspension
* **Actor:** Administrator
* **Goal:** Suspend non-compliant or fraudulent active vendor.
* **Main Success Flow:**
  1. Admin clicks "Suspend Vendor" and inputs suspension reason (`BR-015`).
  2. System sets Vendor status to `Suspended`.
  3. System immediately hides vendor products from public storefront (`BR-012`) and blocks vendor from processing new orders.

---

### `AF-008` Vendor Verification Review
* **Actor:** Administrator
* **Goal:** Audit submitted vendor verification data against marketplace policy.
* **Main Success Flow:**
  1. Admin inspects verification records and marks verification status as Verified or Information Required.

---

### `AF-009` Category Management
* **Actor:** Administrator
* **Goal:** Create, update, or reorganize product category hierarchy.
* **Main Success Flow:**
  1. Admin creates Category (Name, Parent Category ID, Slug, Icon URL).
  2. System saves Category. Catalog navigation reflects new category tree.

---

### `AF-010` Brand Management
* **Actor:** Administrator
* **Goal:** Manage catalog brands.
* **Main Success Flow:**
  1. Admin adds or edits Brand entity (Name, Logo URL).

---

### `AF-011` Product Moderation
* **Actor:** Administrator
* **Goal:** Moderate product listings across all vendors.
* **Main Success Flow:**
  1. Admin searches products marketplace-wide.
  2. Admin can suspend non-compliant products (setting status to `Suspended`).

---

### `AF-012` Order Monitoring
* **Actor:** Administrator
* **Goal:** Supervise main orders and child vendor orders across marketplace.
* **Main Success Flow:**
  1. Admin views global Order monitor page displaying all parent Orders (#1000) and constituent VendorOrders (#1000-A, #1000-B), payment statuses, and fulfillment bottlenecks.

---

### `AF-013` Payment Monitoring
* **Actor:** Administrator
* **Goal:** Track payment transactions and gateway webhook verification logs.
* **Main Success Flow:**
  1. Admin views Payment logs, checking transaction IDs, gateway statuses, and webhook verification states (`BR-009`).

---

### `AF-014` Refund Monitoring
* **Actor:** Administrator
* **Goal:** Review and process order refunds.
* **Main Success Flow:**
  1. Admin inspects refund requests for cancelled/failed orders and processes refund log records.

---

### `AF-015` Coupon Management
* **Actor:** Administrator
* **Goal:** Create and manage platform promotional coupons.
* **Main Success Flow:**
  1. Admin creates Coupon: Code (e.g., `SAVE10`), Discount Type (Percentage/Fixed), Value, Min Order Spend, Max Discount Cap, Expiry Date, Usage Limits, Vendor/Category scope restrictions.
  2. System saves Coupon record for checkout validation (`BR-008`).

---

### `AF-016` Commission Management
* **Actor:** Administrator
* **Goal:** Configure platform commission rates.
* **Main Success Flow:**
  1. Admin sets global commission percentage (e.g., 10%) or vendor/category specific rates.
  2. System updates commission rules for future vendor order calculations (`BR-014`).

---

### `AF-017` Review / Rating Management
* **Actor:** Administrator
* **Goal:** Moderate customer product reviews.
* **Main Success Flow:**
  1. Admin inspects flagged reviews and can approve, flag, or delete inappropriate content.

---

### `AF-018` Search Analytics
* **Actor:** Administrator
* **Goal:** Analyze customer search demand and trending keywords.
* **Main Success Flow:**
  1. Admin opens Search Analytics dashboard.
  2. System aggregates `search_logs` data displaying top searched terms, query counts, and search trends over selected time periods (`BR-010`).

---

### `AF-019` Zero-Result Search Monitoring
* **Actor:** Administrator
* **Goal:** Identify catalog gaps by reviewing searches yielding zero results.
* **Main Success Flow:**
  1. Admin views "Zero-Result Searches" report displaying search terms that returned 0 product matches (e.g., "gluten-free bread" - 450 searches).
  2. Admin uses data to recruit vendors or request catalog additions.

---

### `AF-020` Vendor Performance Monitoring
* **Actor:** Administrator
* **Goal:** Evaluate vendor fulfillment efficiency, ratings, and cancellation rates.
* **Main Success Flow:**
  1. Admin inspects vendor performance tables comparing order volumes, fulfillment times, rating averages, and customer complaints.

---

### `AF-021` Reports
* **Actor:** Administrator
* **Goal:** Generate marketplace financial and operational reports.
* **Main Success Flow:**
  1. Admin selects report type (Sales Summary, Commission Revenue, Vendor Payouts, Order Volume) and date range. System generates report summary.

---

### `AF-022` Notification Management
* **Actor:** Administrator
* **Goal:** Send marketplace-wide announcements or system alerts.
* **Main Success Flow:**
  1. Admin broadcasts notification message to selected user roles via SignalR.

---

### `AF-023` Audit Log Review
* **Actor:** Administrator
* **Goal:** Inspect system administrative audit trail.
* **Main Success Flow:**
  1. Admin views `AuditLogs` table filtering by Actor ID, Action Type, Entity Name, or Timestamp (`BR-007`).

---

### `AF-024` System Settings
* **Actor:** Administrator
* **Goal:** Update platform global configuration settings.
* **Main Success Flow:**
  1. Admin configures system settings (support contacts, platform operational flags).

---

## 7. Delivery Staff User Flows (`DF-001` to `DF-009`)

### `DF-001` Delivery Staff Authentication
* **Actor:** Delivery Staff
* **Goal:** Log into delivery operational panel.
* **Preconditions:** Delivery staff account provisioned via authorized account setup.
* **Main Success Flow:**
  1. Delivery user inputs credentials on Delivery Login portal.
  2. System verifies credentials and issues Delivery Staff JWT token.

---

### `DF-002` View Assigned Deliveries
* **Actor:** Delivery Staff
* **Goal:** View queue of orders assigned for delivery.
* **Main Success Flow:**
  1. Delivery user opens Delivery Queue.
  2. System queries vendor orders in status `Ready for Pickup` assigned to or available for delivery user (`FR-DEL-001`).

---

### `DF-003` View Delivery Details
* **Actor:** Delivery Staff
* **Goal:** Access pickup location and customer delivery information.
* **Main Success Flow:**
  1. Delivery user selects Order #1000-A.
  2. System displays Vendor pickup address, Vendor phone, Customer delivery street address, Customer contact name, Customer phone, and delivery instructions (`FR-DEL-002`).

---

### `DF-004` Pickup Order
* **Actor:** Delivery Staff
* **Goal:** Confirm physical pickup of order items from vendor shop.
* **Main Success Flow:**
  1. Delivery user arrives at vendor location, collects packaged order #1000-A, and clicks "Confirm Pickup".
  2. System updates VendorOrder status to `Picked Up` (`BR-013`).
  3. SignalR notifies Customer of order pickup.

---

### `DF-005` Update Out-for-Delivery
* **Actor:** Delivery Staff
* **Goal:** Update status when transit to customer begins.
* **Main Success Flow:**
  1. Delivery user starts transit to customer address and clicks "Start Delivery".
  2. System updates VendorOrder status to `Out for Delivery` (`BR-013`).
  3. SignalR pushes notification to Customer.

---

### `DF-006` Mark Delivered
* **Actor:** Delivery Staff
* **Goal:** Complete order delivery upon customer handoff.
* **Main Success Flow:**
  1. Delivery user hands packaged order to customer and clicks "Mark Delivered".
  2. System updates VendorOrder status to `Delivered` and records delivery completion timestamp (`BR-013`).
  3. If COD order: System records cash collection status.
  4. Customer receives delivery confirmation notification and unlocks product review eligibility (`BR-004`).

---

### `DF-007` Failed Delivery
* **Actor:** Delivery Staff
* **Goal:** Report delivery failure (e.g., customer unreachable, invalid address).
* **Main Success Flow:**
  1. Delivery user selects reason (e.g., Customer Unreachable) and clicks "Report Failed Delivery".
  2. System updates status to `Failed Delivery` and alerts Support/Vendor.

---

### `DF-008` Delivery History
* **Actor:** Delivery Staff
* **Goal:** View completed past deliveries.
* **Main Success Flow:**
  1. Delivery user views historical log of completed delivery assignments.

---

### `DF-009` Delivery Notifications
* **Actor:** Delivery Staff
* **Goal:** Receive real-time assignment notifications.
* **Main Success Flow:**
  1. SignalR pushes alert when new order enters delivery assignment pool.

---

## 8. Multi-Vendor Order Flow

### 8.1 Detailed Scenario Example
Customer orders products from **Vendor A**, **Vendor B**, and **Vendor C** in a single checkout session:

```text
Cart Contents:
 ├── Vendor A: Product 1 ($20) + Product 2 ($30)  = $50
 ├── Vendor B: Product 3 ($40)                    = $40
 └── Vendor C: Product 4 ($10)                    = $10
─────────────────────────────────────────────────────────
Cart Subtotal                                     = $100
Shipping Charges: Vendor A ($5) + Vendor B ($5) + Vendor C ($5) = $15
Coupon Discount (NEWUSER 10%)                     = -$10
─────────────────────────────────────────────────────────
Grand Total                                       = $105
```

### 8.2 Execution Steps & State Transitions
1. **Checkout & Stock Revalidation:** System revalidates stock availability (`BR-005`) for Products 1, 2, 3, and 4 across Vendors A, B, C.
2. **Main Order Creation:** System creates **Parent Main Order #1000** ($105) tied to Customer ID, storing total amount, shipping total, overall status, and chosen payment method.
3. **Vendor Order Splitting (`BR-011`):** System automatically splits Main Order #1000 into three isolated child orders:
   * **Child VendorOrder #1000-A (Vendor A):** Subtotal $50 + Shipping $5 - Discount $5 = Payable $50. Status: `Pending`.
   * **Child VendorOrder #1000-B (Vendor B):** Subtotal $40 + Shipping $5 - Discount $4 = Payable $41. Status: `Pending`.
   * **Child VendorOrder #1000-C (Vendor C):** Subtotal $10 + Shipping $5 - Discount $1 = Payable $14. Status: `Pending`.
4. **Data Isolation Enforcement (`BR-002`, `BR-003`):**
   * **Customer View:** Views Main Order #1000 containing overall status, total $105, and grouped vendor cards for #1000-A, #1000-B, #1000-C.
   * **Vendor A View:** Sees ONLY VendorOrder #1000-A ($50). Vendor A cannot see items or revenue of Vendors B or C.
   * **Vendor B View:** Sees ONLY VendorOrder #1000-B ($41).
   * **Vendor C View:** Sees ONLY VendorOrder #1000-C ($14).
   * **Admin View:** Views global Main Order #1000 and all child orders #1000-A, B, C.
5. **Independent Vendor Fulfillment:**
   * Vendor A accepts #1000-A (after payment verification) → transitions to `Preparing` → `Ready for Pickup` → Pickup by Delivery Staff 1.
   * Vendor B accepts #1000-B → transitions to `Preparing` → `Ready for Pickup` → Pickup by Delivery Staff 2.
   * Vendor C accepts #1000-C → transitions to `Preparing` → `Ready for Pickup` → Pickup by Delivery Staff 3.
6. **Completion & Main Order Rollup:** When all child orders (#1000-A, B, C) reach `Delivered`, the parent Main Order #1000 status transitions to `Delivered`.

---

## 9. Inventory Business Flow

```text
Product Browse / Cart View
            │
            ▼
   [ Stock Check ] ◄── Validates Available Stock (Physical - Reserved)
            │
            ▼
Proceed to Checkout
            │
            ▼
  Revalidate Availability ──► Insufficient Stock? ──► Block Checkout & Alert
            │
            ▼
Place Order / Confirm
            │
            ▼
Inventory Protection / Reservation (BR-006)
(Stock transferred to Reserved Stock)
            │
    ┌───────┴───────┐
    ▼               ▼
Order Fulfilled   Order Cancelled
    │               │
    ▼               ▼
Sold Stock      Stock Reservation Released
(Physical ↓)    (Available Stock restored)
```

> **TECHNICAL DEFERRAL NOTICE:** Specific inventory reservation mechanics (such as exact reservation window timeouts, transactional locking strategies, background cleanup jobs, and database concurrency implementations) are intentionally deferred to Database Design, HLD, and LLD phases.

---

## 10. Payment Flow

### 10.1 Cash on Delivery (COD) Flow
```text
Customer Selects COD
          │
          ▼
Revalidate Stock & Coupons
          │
          ▼
Create Main Order (#1000) & Child Orders (#1000-A, B)
(Initial Order Status transition finalized in API/State Design Phase)
          │
          ▼
Vendors Process & Prepare Orders
          │
          ▼
Delivery Staff Delivers Packaged Order
          │
          ▼
Delivery Staff Collects Cash Payment
          │
          ▼
Delivery Staff Marks Order Delivered & Cash Collected
Payment Status: Paid
```

### 10.2 Online Payment Flow
```text
Customer Selects Online Payment
          │
          ▼
System Initiates Session with Selected Online Payment Gateway (Provider Deferred)
          │
          ▼
Customer Redirected to Payment Gateway Interface
          │
     ┌────┴────┐
     ▼         ▼
  Success    Failure
     │         │
     ▼         ▼
Gateway     Gateway Webhook Calls API
Webhook     Status: Failed
Status: Paid   │
     │         ▼
     │      Order Payment Status: Failed | Order Unconfirmed
     │      Customer Prompted to Retry / Select COD
     ▼
Payment Status Updated to Paid (BR-009)
Order Authorization Granted for Vendor Fulfillment
SignalR Notifies Customer & Vendors
```

> **CRITICAL FULFILLMENT PROTECTION RULE:** An online-payment order may exist in an unconfirmed state before gateway verification, but an order must NOT become fulfillable by the vendor merely because the order record was created. Successful payment must be securely verified via cryptographic webhook callback (`FR-PAY-002`, `BR-009`) before the order is allowed to proceed into the vendor fulfillment lifecycle. Failed or cancelled payments must not authorize vendor fulfillment. Selection of the exact online payment gateway provider (Stripe vs. suitable local gateway) remains a deferred technical decision.

---

## 11. Search & Suggestions Flow

```text
User Inputs Search Text in Search Field
                 │
                 ▼
     [ 300ms Frontend Debounce ] (FR-SEARCH-004)
                 │
                 ▼
  Call Suggestions API (GET /suggestions?prefix=...)
                 │
                 ▼
Display Dropdown Suggestions Panel
                 │
                 ▼
User Submits Search / Selects Suggestion
                 │
                 ▼
Backend Executes Full-Text Query & Filters Inactive Vendors (BR-012)
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
Results Found         Zero Results
      │                     │
      ▼                     ▼
Log Query to search_logs    Log Zero-Result Query to search_logs
Display Product Grid        Display "No Results" & Suggestions
```

---

## 12. Location-Aware Discovery Flow

```text
Customer Sets Location (Saved Address or Map Pin)
                       │
                       ▼
System Retrieves Lat / Long Coordinates
                       │
                       ▼
System Calculates Distance (Haversine Formula) to Active Vendors
                       │
                       ▼
Filter Vendors & Products within Distance Radius (e.g., ≤ 5 km)
                       │
                       ▼
Display Nearby Vendors with Distance Badges & Product Availability
```

> **SCOPE & TECHNICAL DEFERRAL NOTICE:** Live driver GPS tracking is strictly excluded from MVP. Selection of the specific Maps API provider remains deferred.

---

## 13. Review & Rating Eligibility Flow

```text
Customer Attempts to Submit Review for Product
                       │
                       ▼
System Checks Purchase Eligibility (BR-004)
Did Customer purchase Product AND is Order status Delivered?
                       │
             ┌─────────┴─────────┐
            Yes                  No
             │                   │
             ▼                   ▼
Display Review Form      Display Error: "Review eligible only
Customer Submits Rating  after order delivery is completed."
& Written Comment
             │
             ▼
Save Review & Recalculate Rating Averages
Admin Moderation Available (AF-017)
```

---

## 14. Coupon, Commission & Payout Flow

### 14.1 Coupon Validation Flow
1. Customer enters Coupon Code (e.g., `SAVE10`) at checkout.
2. System validates code against: Expiry Date, Active Status, Minimum Spend, Total Usage Limit, Per-Customer Usage Cap, and Vendor/Category scope (`BR-008`).
3. If valid: System applies discount to cart total. If invalid: System returns specific error message.

### 14.2 Commission Calculation Flow
1. VendorOrder completes.
2. System calculates platform commission based on active rules:
   $$\text{Commission Amount} = \text{Product Sale Amount} \times \text{Commission Percentage}$$
   $$\text{Vendor Payable Amount} = \text{Product Sale Amount} - \text{Commission Amount}$$
3. System records `Commission` entry and updates Vendor Payable ledger (`BR-014`).
4. **Deferred Financial Calculation Base Notice:** While the conceptual commission calculation formula is established, the exact financial calculation base is deferred to detailed API and financial design, including whether calculations apply to item price before discount, item price after discount, shipping fees, tax, platform/vendor-funded coupons, or refund adjustments.

### 14.3 Vendor Payout Flow
1. Admin inspects completed vendor transactions and approves payout settlement.
2. System logs `Payout` record updating status from `Pending` → `Processing` → `Paid`.

---

## 15. Real-Time Notification Flows

### 15.1 Notification Triggers & Matrix
| Event Trigger | Recipient Role | Delivery Channel | Message Payload |
|---|---|---|---|
| Vendor Application Submitted | Admin | SignalR + In-App | "New vendor application submitted by {ShopName}." |
| Vendor Application Approved | Vendor | SignalR + Email | "Your vendor application has been approved! Log in to set up store." |
| Customer Places Order | Vendor(s) | SignalR + In-App | "New order #{VendorOrderNo} received." |
| Order Status Changed | Customer | SignalR + In-App | "Order #{OrderNo} status updated to {Status}." |
| Low Stock Threshold Triggered | Vendor | SignalR + In-App | "Warning: Product {ProductName} stock is low ({Qty} remaining)." |
| Delivery Assigned | Delivery Staff | SignalR + In-App | "New delivery assigned: Order #{VendorOrderNo}." |

---

## 16. Consolidated Error & Exception Flows

| Error ID | Error Trigger Condition | System Handling & Recovery Path | User Message / Feedback |
|---|---|---|---|
| **EF-001** | Invalid Login Credentials | Rejects authentication attempt; logs failed login attempt. | "Invalid email or password." |
| **EF-002** | Unauthorized Role Access | Blocks API endpoint execution via RBAC middleware (`BR-007`). | HTTP 403 Forbidden: "Access Denied." |
| **EF-003** | Unapproved Vendor Action | Blocks listing products or processing orders (`BR-001`). | "Vendor account is pending approval." |
| **EF-004** | Vendor Suspended Action | Disables store visibility, catalog, and order endpoints (`BR-015`). | "Store account is suspended." |
| **EF-005** | Product Out of Stock | Re-validation fails during checkout; prevents order creation (`BR-005`). | "Item '{ProductName}' is out of stock." |
| **EF-006** | Price Changed Before Checkout | Cart re-validation detects price mismatch. | "Price for '{ProductName}' has changed. Cart updated." |
| **EF-007** | Invalid / Expired Coupon | Coupon validation fails expiry, min spend, or limit rules (`BR-008`). | "Coupon code is invalid or expired." |
| **EF-008** | Payment Gateway Failure | Gateway rejects card or webhook status returns `Failed`. | "Payment failed. Please retry or select COD." |
| **EF-009** | Payment Webhook Failure | Signature verification fails or callback drops. | Logs security alert; keeps payment `Pending` / unconfirmed. |
| **EF-010** | Review Ineligible | Customer attempts review without completed delivered order (`BR-004`). | "Review eligible only for delivered purchases." |
| **EF-011** | Delivery Failure | Delivery staff marks delivery unreachable or invalid address. | Updates status to `Failed Delivery`; notifies Support. |
| **EF-012** | Partial Multi-Vendor Issue | Vendor A prepares order, but Vendor B rejects or fails order. | Vendor A order proceeds; Vendor B order is cancelled/refunded. Customer notified.  <br>**Deferred Financial & Design Decisions:** Refund allocation logic, shipping fee recalculation, tax/discount recalculation, parent order status rollup for partial failure, vendor payable/commission impacts, and inventory release timing for the affected vendor order are explicitly deferred to Database, API Contract, and Low-Level Design phases. |

---

## 17. Authorization / Data Isolation Matrix

| Resource / System Area | Customer Role | Vendor Role | Admin Role | Delivery Staff Role |
|---|---|---|---|---|
| **Own Customer Profile** | Full Access | No Access | Read Only | No Access |
| **Public Product Catalog** | Read Only | Read Only | Read/Moderate | Read Only |
| **Own Vendor Store & Products** | No Access | Full Access | Read/Moderate | No Access |
| **Own Customer Cart & Wishlist** | Full Access | No Access | No Access | No Access |
| **Customer Orders (Parent)** | Own Orders Only | No Access | Global Read | No Access |
| **Vendor Orders (Child)** | Linked Parent Items | Own Vendor Items Only (`BR-002`) | Global Access | Assigned Deliveries |
| **Vendor Inventory** | No Access | Own Store Inventory | Read Only | No Access |
| **Customer Delivery Addresses** | Own Addresses Only | Pickup Info Only | Global Read | Assigned Contact Info |
| **Delivery Assignments** | Tracking Only | Pickup Status | Global Read | Assigned Queue |
| **Product Reviews** | Read / Create Eligible | View Store Reviews | Moderate / Delete | No Access |
| **Vendor Payouts & Commission** | No Access | Own Payout Ledger | Full Access | No Access |
| **Search Analytics (`search_logs`)** | No Access | No Access | Full Access | No Access |
| **Audit Logs (`AuditLogs`)** | No Access | No Access | Full Access | No Access |

---

## 18. Business Rule Traceability Mapping

| Rule ID | Business Rule Name | Primary Mapped User Flows & Use Cases |
|---|---|---|
| **BR-001** | Vendor Approval Requirement | `VF-001`, `VF-002`, `VF-003`, `VF-005`, `AF-004`, `AF-005`, `UC-VEND-001`, `UC-ADMIN-001` |
| **BR-002** | Vendor Data Isolation | `VF-004`, `VF-007`, `VF-009`, `VF-011`, `UC-VEND-003`, `UC-VEND-004` |
| **BR-003** | Customer Order Isolation | `CF-023`, `CF-024`, `CF-025`, `UC-CUST-008` |
| **BR-004** | Customer Review Eligibility | `CF-028`, `VF-016`, `AF-017`, `UC-CUST-010` |
| **BR-005** | Inventory Validation | `CF-013`, `CF-015`, `CF-016`, `CF-019`, `CF-020`, `UC-CUST-006` |
| **BR-006** | Inventory Reservation | `CF-019`, `CF-020`, `CF-026`, `VF-009`, `UC-CUST-007` |
| **BR-007** | Admin Access Enforcement | `AF-001` through `AF-024`, `UC-ADMIN-001` to `UC-ADMIN-006` |
| **BR-008** | Coupon Enforcement | `CF-019`, `CF-020`, `AF-015`, `UC-CUST-007` |
| **BR-009** | Payment Confirmation | `CF-020`, `CF-021`, `AF-013`, `UC-CUST-007` |
| **BR-010** | Search Logging | `CF-005`, `CF-006`, `AF-018`, `AF-019`, `UC-CUST-003` |
| **BR-011** | Multi-Vendor Order Splitting | `CF-014`, `CF-019`, `CF-020`, `VF-011`, `UC-CUST-007` |
| **BR-012** | Product Visibility Rule | `CF-004`, `CF-005`, `CF-011`, `VF-008`, `AF-007`, `UC-CUST-002` |
| **BR-013** | Delivery Authorization | `DF-003`, `DF-004`, `DF-005`, `DF-006`, `UC-DEL-002` |
| **BR-014** | Commission Calculation | `VF-018`, `AF-016`, `UC-ADMIN-004` |
| **BR-015** | Vendor Suspension | `AF-007`, `VF-002`, `UC-ADMIN-002` |

---

## 19. Use Case Catalog

| Use Case ID | Use Case Name | Primary Actor | Supporting Actor | Priority | Related FR IDs | Related BR IDs |
|---|---|---|---|---|---|---|
| **UC-CUST-001** | Register Customer Account | Customer | System | MVP | `FR-AUTH-001`, `FR-AUTH-002` | `BR-003` |
| **UC-CUST-002** | Search & Browse Products | Customer / Guest | System | MVP | `FR-SEARCH-001` to `004`, `FR-PROD-003` | `BR-010`, `BR-012` |
| **UC-CUST-003** | View Search Suggestions | Customer / Guest | System | MVP | `FR-SEARCH-003`, `FR-SEARCH-004` | `BR-010` |
| **UC-CUST-004** | Discover Nearby Vendors | Customer / Guest | Maps API | MVP | `FR-LOC-001`, `FR-LOC-002` | — |
| **UC-CUST-005** | Manage Multi-Vendor Cart | Customer | System | MVP | `FR-CART-001`, `FR-CART-002` | `BR-011` |
| **UC-CUST-006** | Manage Delivery Addresses | Customer | System | MVP | `FR-CUST-001`, `FR-CUST-002` | — |
| **UC-CUST-007** | Execute Checkout (COD / Online) | Customer | Payment Gateway | MVP | `FR-CART-003`, `FR-ORDER-001`, `FR-PAY-001` | `BR-005`, `BR-006`, `BR-008`, `BR-009`, `BR-011` |
| **UC-CUST-008** | Track Order Status | Customer | Notification Hub | MVP | `FR-CUST-004`, `FR-ORDER-002`, `FR-NOTIF-001` | `BR-003` |
| **UC-CUST-009** | Cancel Pending Order | Customer | System | MVP | `FR-CUST-005`, `FR-ORDER-003` | `BR-006` |
| **UC-CUST-010** | Submit Product Review | Customer | System | MVP | `FR-REVIEW-001` | `BR-004` |
| **UC-VEND-001** | Submit Vendor Application | Vendor Applicant | System | MVP | `FR-VEND-001`, `FR-VEND-002` | `BR-001` |
| **UC-VEND-002** | Manage Store Profile | Approved Vendor | Cloudinary | MVP | `FR-VEND-005` | `BR-002` |
| **UC-VEND-003** | Create & Edit Products | Approved Vendor | Cloudinary | MVP | `FR-PROD-001`, `FR-PROD-004` | `BR-002`, `BR-012` |
| **UC-VEND-004** | Manage Stock Inventory | Approved Vendor | System | MVP | `FR-INV-001` to `004` | `BR-002`, `BR-005`, `BR-006` |
| **UC-VEND-005** | Process Vendor Orders | Approved Vendor | Notification Hub | MVP | `FR-VEND-004`, `FR-ORDER-002` | `BR-002`, `BR-011` |
| **UC-VEND-006** | View Payouts & Analytics | Approved Vendor | System | MVP | `FR-VEND-006`, `FR-COMM-003` | `BR-002`, `BR-014` |
| **UC-ADMIN-001** | Approve / Reject Vendor | Administrator | Notification Hub | MVP | `FR-ADMIN-001`, `FR-VEND-002` | `BR-001` |
| **UC-ADMIN-002** | Suspend Vendor | Administrator | System | MVP | `FR-ADMIN-002` | `BR-012`, `BR-015` |
| **UC-ADMIN-003** | Manage Categories & Brands | Administrator | System | MVP | `FR-ADMIN-003` | — |
| **UC-ADMIN-004** | Configure Commissions & Coupons | Administrator | System | MVP | `FR-COMM-001`, `FR-COMM-002` | `BR-008`, `BR-014` |
| **UC-ADMIN-005** | Monitor Search Analytics | Administrator | System | MVP | `FR-ADMIN-003`, `FR-SEARCH-005` | `BR-010` |
| **UC-ADMIN-006** | Review Audit Logs | Administrator | System | MVP | `FR-AUDIT-001` | `BR-007` |
| **UC-DEL-001** | View Delivery Assignments | Delivery Staff | System | MVP | `FR-DEL-001`, `FR-DEL-002` | `BR-013` |
| **UC-DEL-002** | Update Delivery Status | Delivery Staff | Notification Hub | MVP | `FR-DEL-003` | `BR-013` |

---

## 20. Requirements Traceability

All 56 Functional Requirements (`FR-AUTH-001` to `FR-AUDIT-001`), 14 Non-Functional Requirements (`NFR-PERF-001` to `NFR-USA-001`), and 15 Business Rules (`BR-001` to `BR-015`) defined in [`docs/SRS.md`](file:///d:/new%20e%20commers/docs/SRS.md) are fully mapped to step-by-step User Flows (CF, VF, AF, DF) and Use Cases (UC).

---

## 21. Deferred Technical Decisions

The following technical implementation choices are explicitly deferred to subsequent design phases (Database Design, System Architecture HLD, Low-Level Design LLD, API Contracts):
1. **Exact Online Payment Provider:** Selection of specific online payment provider (Stripe vs. suitable local gateway) based on regional deployment.
2. **Maps API Provider:** Choice of mapping service (Google Maps API, Mapbox, OpenStreetMap) for lat/long geocoding and distance calculation rendering.
3. **Inventory Reservation Lifecycle Mechanics:** Transactional locks, exact reservation timeouts, background cleanup job configurations, and concurrency implementations.
4. **SignalR Connection & Group Design:** SignalR hub group management, reconnect policies, and JWT query-string authorization parameters.
5. **Exact Vendor Verification Document Rules:** Definition of specific business registration file formats per regional legal jurisdiction.
6. **Password Hashing Candidate Technology:** Choice of specific password hashing algorithm/library (BCrypt vs. ASP.NET Core Identity PasswordHasher).
7. **Deployment Architecture Details:** Cloud hosting environments, container orchestrations, and CI/CD pipelines.
8. **Commission Calculation Base Details:** Exact financial calculation base (pre/post discount item price, shipping, tax, coupon funding, refund adjustments).
9. **Partial Multi-Vendor Failure Mechanics:** Refund allocation, shipping recalculations, tax/discount adjustments, parent order status rollup rules, vendor payable impact, and inventory release timing for partial vendor cancellations.

---

## 22. MVP / Future / Out-of-Scope Scope Check

* **MVP Preserved:** YES. Focus remains strictly on core multi-vendor commerce loop.
* **Future Scope Preserved:** YES. AI semantic search (`pgvector`), AI recommendations, Redis, multi-branch, native mobile apps, live driver GPS tracking, and demand forecasting remain deferred to post-MVP versions.
* **Out-of-Scope Excluded:** YES. International shipping, crypto, automated warehouse robotics, ERP integrations, ad sponsorship marketplaces, regulated prescription sales, autonomous delivery drones, and corporate loyalty programs remain strictly excluded.

---

## 23. Quality & Consistency Verification

This document has been audited for internal consistency across all flows, matrices, error tables, and use cases, ensuring no invented business rules or unauthorized scope creep were introduced.

---

## 24. Quality Assurance & Browser Verification Rules

* **Current Phase Status:** Documentation-Only (`Browser Verification: N/A`).
* **Rule for Future Implementation Phases:**  
  Starting from Phase 14 (Implementation), every user-facing functional feature must undergo browser-based execution verification using Chrome prior to being marked completed:  
  `Code Implementation → Launch Application Server → Open Chrome → Perform User Journey → Verify Behavior → Record Verification`.
