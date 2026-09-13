# LocalMart — Formal Use Case Specifications

**Document Version:** 1.0  
**Phase:** 03 — Formal Use Case Specifications  
**Status:** Approved Phase 03 Baseline  
**Date:** September 12, 2026  
**Primary Source Document:** `LocalMart_BRD_v1.0(1).md`  
**Consolidated Reference:** `docs/BRD_BASELINE.md`  
**SRS Reference:** `docs/SRS.md`  
**User Flows Reference:** `docs/USER_FLOWS_AND_USE_CASES.md`  
**Project:** LocalMart — Location-Aware Multi-Vendor E-Commerce Marketplace  

---

## 1. Document Control

### 1.1 Purpose
This document provides the formal, detailed Use Case Specifications for **LocalMart**. It expands the 24 use cases defined in [`docs/USER_FLOWS_AND_USE_CASES.md`](file:///d:/new%20e%20commers/docs/USER_FLOWS_AND_USE_CASES.md) into complete, implementation-ready specifications. Each use case details the primary and supporting actors, preconditions, triggers, main success flows, alternate flows, exception flows, postconditions, business rules, functional and non-functional requirement traceability, authorization/data isolation constraints, external dependencies, and deferred technical decisions.

### 1.2 Document Priority & Traceability Hierarchy
1. Primary Source of Truth: [`LocalMart_BRD_v1.0(1).md`](file:///d:/new%20e%20commers/LocalMart_BRD_v1.0%281%29.md)
2. Baseline Reference: [`docs/BRD_BASELINE.md`](file:///d:/new%20e%20commers/docs/BRD_BASELINE.md)
3. Software Requirements Specification: [`docs/SRS.md`](file:///d:/new%20e%20commers/docs/SRS.md)
4. User Flows & Use Case Catalog: [`docs/USER_FLOWS_AND_USE_CASES.md`](file:///d:/new%20e%20commers/docs/USER_FLOWS_AND_USE_CASES.md)

---

## 2. Customer Use Case Specifications (`UC-CUST-001` to `UC-CUST-010`)

---

### Use Case: `UC-CUST-001` — Customer Registration

* **Use Case ID:** `UC-CUST-001`
* **Use Case Name:** Customer Registration
* **Primary Actor:** Customer
* **Supporting Actors / Systems:** System / Background Processes
* **Goal / Description:** Register a new customer account on LocalMart to enable catalog browsing, address management, cart persistence, checkout, order placement, tracking, and product reviews.
* **Preconditions:** User is unauthenticated.
* **Trigger:** Customer clicks "Register" or "Sign Up" on the storefront navigation bar.
* **Main Success Flow:**
  1. Customer enters Full Name, Email Address, Phone Number, Password, and Confirm Password into the registration form.
  2. System validates input data formats (email syntax, phone format, password strength).
  3. System verifies that the provided Email Address is unique in the database.
  4. System hashes the password using a strong, industry-standard password hashing algorithm (`NFR-SEC-001`).
  5. System creates an active `Customer` record, an empty `Cart`, and an empty `Wishlist`.
  6. System issues JWT access token and HTTP-only Refresh token cookie (`FR-AUTH-003`).
  7. System redirects Customer to the storefront home page with authenticated session active.
* **Alternative Flows:**
  * *Auto-Redirect to Login:* If Customer already possesses an account, Customer clicks "Log In" link and transitions to `UC-CUST-002`.
* **Exception Flows:**
  * *EF-1.1 Email Already Exists:* System detects email collision, halts registration, and displays error: "Email address is already registered. Please log in."
  * *EF-1.2 Validation Failure:* System detects invalid email syntax, weak password, or password mismatch, displaying inline field validation errors.
* **Postconditions:** Active Customer record persisted in database; session tokens issued.
* **Business Rules:** `BR-003`.
* **Functional Requirements Traceability:** `FR-AUTH-001`, `FR-AUTH-002`, `FR-AUTH-003`, `FR-CUST-001`.
* **Non-Functional Requirements:** `NFR-SEC-001`, `NFR-SEC-002`, `NFR-USA-001`.
* **Authorization & Data Isolation:** Publicly accessible endpoint. Created data is strictly bound to the authenticated Customer ID (`BR-003`).
* **External Dependencies:** None.
* **Deferred Decisions:** Selection of candidate password hashing implementation library (BCrypt vs ASP.NET Core Identity PasswordHasher).

---

### Use Case: `UC-CUST-002` — Customer Login

* **Use Case ID:** `UC-CUST-002`
* **Use Case Name:** Customer Login
* **Primary Actor:** Customer
* **Supporting Actors / Systems:** System / Background Processes
* **Goal / Description:** Authenticate an existing customer to access saved profile details, address book, cart, wishlist, and order tracking.
* **Preconditions:** Customer account has been created (`UC-CUST-001`).
* **Trigger:** Customer inputs credentials on Login page and submits form.
* **Main Success Flow:**
  1. Customer inputs Email Address and Password.
  2. System queries user record and verifies password against stored hash using industry-standard verification.
  3. System verifies Customer account status is `Active`.
  4. System generates stateless JWT access token and sets HTTP-only Refresh token cookie (`FR-AUTH-003`).
  5. System loads Customer's active cart and default delivery address.
  6. System redirects Customer to requested page or Storefront landing page.
* **Alternative Flows:**
  * *Remember Session / Refresh Token Extension:* Session is maintained transparently via refresh token rotation (`FR-AUTH-006`).
* **Exception Flows:**
  * *EF-2.1 Invalid Credentials:* System fails credential verification and displays generic error: "Invalid email or password."
  * *EF-2.2 Account Disabled:* System detects disabled account state and displays: "Account is disabled. Please contact customer support."
* **Postconditions:** Authenticated session established; JWT token issued.
* **Business Rules:** `BR-003`.
* **Functional Requirements Traceability:** `FR-AUTH-001`, `FR-AUTH-002`, `FR-AUTH-003`, `FR-AUTH-006`.
* **Non-Functional Requirements:** `NFR-SEC-001`, `NFR-SEC-002`, `NFR-PERF-002`.
* **Authorization & Data Isolation:** Authenticated user accesses only own profile and order data (`BR-003`).
* **External Dependencies:** None.
* **Deferred Decisions:** None.

---

### Use Case: `UC-CUST-003` — Browse/Search Products

* **Use Case ID:** `UC-CUST-003`
* **Use Case Name:** Browse / Search Products
* **Primary Actor:** Customer / Guest
* **Supporting Actors / Systems:** System / Background Processes, Maps Service
* **Goal / Description:** Explore product catalog, search by keyword/SKU/brand/category, filter by attributes, and view real-time search suggestions with 300ms frontend debounce.
* **Preconditions:** None.
* **Trigger:** User types query into search bar or navigates category/brand/nearby store links.
* **Main Success Flow (Search Suggestions & Full Search):**
  1. User types query characters (e.g., "org") into search input.
  2. Frontend applies **300ms debounce delay** before invoking API (`NFR-PERF-001`, `FR-SEARCH-004`).
  3. System returns real-time search suggestions via `GET /api/v1/search/suggestions?prefix=org` (`FR-SEARCH-003`).
  4. User submits full search query (or applies filters: Category, Price, Brand, Rating, Nearby Distance).
  5. System queries database filtering out products from inactive or suspended vendors (`BR-012`).
  6. System logs search query into `search_logs` table (`BR-010`, `FR-SEARCH-005`).
  7. System displays paginated grid of matching active products (`NFR-PERF-003`).
* **Alternative Flows:**
  * *Nearby Discovery Search:* User applies location filter. System calculates distance (Haversine formula) between user lat/long and active vendor lat/long, filtering products within selected radius (`FR-LOC-001`, `FR-LOC-002`).
* **Exception Flows:**
  * *EF-3.1 Zero Search Results:* Query returns 0 products. System logs zero-result query to `search_logs` (`BR-010`), displays "No products found matching your search", and presents popular categories.
* **Postconditions:** Search activity logged; filtered catalog grid rendered.
* **Business Rules:** `BR-010`, `BR-012`.
* **Functional Requirements Traceability:** `FR-PROD-003`, `FR-SEARCH-001` to `005`, `FR-LOC-001`, `FR-LOC-002`.
* **Non-Functional Requirements:** `NFR-PERF-001`, `NFR-PERF-002`, `NFR-PERF-003`, `NFR-USA-001`.
* **Authorization & Data Isolation:** Public access. Only active products of approved active vendors are displayed (`BR-012`).
* **External Dependencies:** Maps Service (distance calculations).
* **Deferred Decisions:** Maps API provider selection; search ranking scoring algorithm details.

---

### Use Case: `UC-CUST-004` — View Product Details

* **Use Case ID:** `UC-CUST-004`
* **Use Case Name:** View Product Details
* **Primary Actor:** Customer / Guest
* **Supporting Actors / Systems:** Cloudinary
* **Goal / Description:** View detailed product specification, primary and gallery images, price, discount, available stock status, vendor store profile link, and verified customer reviews.
* **Preconditions:** Target product exists in catalog.
* **Trigger:** User clicks on a product card.
* **Main Success Flow:**
  1. User selects product card.
  2. System checks product state is `Active` and Vendor state is `Active` (`BR-012`).
  3. System loads product details: Name, SKU, Long Description, Price, Discount, Stock availability status, primary/gallery image URLs from Cloudinary (`FR-PROD-004`), Vendor profile snippet, and approved customer reviews (`BR-004`).
  4. System displays Product Detail view.
* **Alternative Flows:**
  * *Wishlist Action:* Authenticated Customer clicks "Add to Wishlist" (`FR-CUST-003`).
* **Exception Flows:**
  * *EF-4.1 Product Inactive / Vendor Suspended:* Product is inactive or vendor is suspended (`BR-015`). System blocks access and displays: "Product is currently unavailable."
* **Postconditions:** Product details rendered; stock status displayed.
* **Business Rules:** `BR-004`, `BR-012`, `BR-015`.
* **Functional Requirements Traceability:** `FR-CUST-003`, `FR-PROD-001`, `FR-PROD-003`, `FR-PROD-004`, `FR-REVIEW-002`.
* **Non-Functional Requirements:** `NFR-USA-001`, `NFR-PERF-003`.
* **Authorization & Data Isolation:** Public read access for active products of active vendors (`BR-012`).
* **External Dependencies:** Cloudinary (image asset hosting).
* **Deferred Decisions:** None.

---

### Use Case: `UC-CUST-005` — Manage Cart

* **Use Case ID:** `UC-CUST-005`
* **Use Case Name:** Manage Cart
* **Primary Actor:** Customer
* **Supporting Actors / Systems:** System / Background Processes
* **Goal / Description:** Add products from single or multiple vendors to shopping cart, modify item quantities, remove items, and review vendor-grouped subtotals.
* **Preconditions:** Customer is viewing catalog or product page.
* **Trigger:** Customer clicks "Add to Cart" or modifies item quantity in cart view.
* **Main Success Flow:**
  1. Customer selects quantity and clicks "Add to Cart".
  2. System checks available stock (`Available Stock = Physical Current Stock - Reserved Stock`) (`BR-005`, `FR-INV-001`).
  3. System adds item to Customer's cart (or increments quantity).
  4. Customer views Cart page. System groups cart items visually by Vendor (`FR-CART-001`, `FR-CART-002`).
  5. System calculates vendor-specific subtotals, estimated shipping fees, and overall cart total.
* **Alternative Flows:**
  * *Quantity Update / Item Removal:* Customer adjusts quantity counter or clicks "Remove". System revalidates stock and updates totals dynamically (`FR-CART-002`).
* **Exception Flows:**
  * *EF-5.1 Insufficient Available Stock:* Requested quantity exceeds available stock. System blocks update and displays error: "Requested quantity exceeds available stock ({AvailableQty} remaining)."
* **Postconditions:** Cart state persisted and grouped by Vendor.
* **Business Rules:** `BR-005`, `BR-011`.
* **Functional Requirements Traceability:** `FR-CART-001`, `FR-CART-002`, `FR-INV-001`.
* **Non-Functional Requirements:** `NFR-USA-001`, `NFR-PERF-003`.
* **Authorization & Data Isolation:** Customer accesses strictly own cart (`BR-003`).
* **External Dependencies:** None.
* **Deferred Decisions:** None.

---

### Use Case: `UC-CUST-006` — Checkout

* **Use Case ID:** `UC-CUST-006`
* **Use Case Name:** Checkout
* **Primary Actor:** Customer
* **Supporting Actors / Systems:** System / Background Processes
* **Goal / Description:** Initiate multi-step order checkout, revalidate stock/pricing/coupons, select delivery address, review shipping fees, and select payment method.
* **Preconditions:** Customer is authenticated; Cart contains at least one item.
* **Trigger:** Customer clicks "Proceed to Checkout" on Cart view.
* **Main Success Flow:**
  1. Customer clicks "Proceed to Checkout".
  2. System re-validates item stock availability (`BR-005`), current product prices, active vendor statuses (`BR-012`), and active discounts.
  3. System prompts Customer to select/add delivery address (`UC-CUST-007`).
  4. System calculates vendor shipping fees based on distance/location.
  5. Customer applies optional promotional Coupon code (`BR-008`). System validates coupon spend thresholds, expiry, and usage caps (`FR-COMM-001`).
  6. Customer selects Payment Method: Cash on Delivery (COD) or Online Payment Gateway (`FR-PAY-001`).
  7. Customer reviews Order summary and clicks "Place Order" (initiating `UC-CUST-008`).
* **Alternative Flows:**
  * *Coupon Application:* Customer inputs valid coupon. System applies discount to cart order total (`BR-008`).
* **Exception Flows:**
  * *EF-6.1 Stock/Price Revalidation Failure:* Stock depleted or price changed during checkout. System updates cart items and prompts Customer to review modified totals (`BR-005`).
  * *EF-6.2 Invalid Coupon Code:* Coupon expired, spent below minimum, or usage cap reached (`BR-008`). System displays error: "Coupon code is invalid or expired."
* **Postconditions:** Checkout parameters revalidated and prepared for order placement.
* **Business Rules:** `BR-005`, `BR-008`, `BR-011`, `BR-012`.
* **Functional Requirements Traceability:** `FR-CART-003`, `FR-PAY-001`, `FR-COMM-001`, `FR-INV-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-PERF-003`.
* **Authorization & Data Isolation:** Customer accesses strictly own checkout session (`BR-003`).
* **External Dependencies:** Maps Service (distance-based shipping calculation).
* **Deferred Decisions:** Payment gateway provider selection; exact coupon funding split rules.

---

### Use Case: `UC-CUST-007` — Manage Addresses

* **Use Case ID:** `UC-CUST-007`
* **Use Case Name:** Manage Addresses
* **Primary Actor:** Customer
* **Supporting Actors / Systems:** Maps Service
* **Goal / Description:** Add, edit, remove, and set default delivery addresses in customer profile address book.
* **Preconditions:** Customer is authenticated.
* **Trigger:** Customer navigates to Profile Addresses or reaches Address step in Checkout.
* **Main Success Flow:**
  1. Customer clicks "Add New Address".
  2. Customer inputs Recipient Name, Phone Number, Address Line 1, City, District, Postal Code, Delivery Instructions, and Latitude/Longitude coordinates (via map pin/geocoding).
  3. System validates required fields and stores address in `Addresses` table linked to Customer ID.
  4. Customer optionally designates address as Default Delivery Address (`FR-CUST-002`).
* **Alternative Flows:**
  * *Edit / Delete Address:* Customer modifies existing address or deletes an unused address record.
* **Exception Flows:**
  * *EF-7.1 Missing Required Address Fields:* System highlights missing mandatory inputs.
* **Postconditions:** Address saved in Customer address book.
* **Business Rules:** `BR-003`.
* **Functional Requirements Traceability:** `FR-CUST-001`, `FR-CUST-002`, `FR-LOC-001`.
* **Non-Functional Requirements:** `NFR-USA-001`.
* **Authorization & Data Isolation:** Customer accesses strictly own address records (`BR-003`).
* **External Dependencies:** Maps Service (geocoding/map pin).
* **Deferred Decisions:** Maps API provider selection.

---

### Use Case: `UC-CUST-008` — Place Order

* **Use Case ID:** `UC-CUST-008`
* **Use Case Name:** Place Order
* **Primary Actor:** Customer
* **Supporting Actors / Systems:** Payment Gateway, Notification Hub (SignalR), Background Processes
* **Goal / Description:** Complete multi-vendor order placement, executing stock reservation, parent order creation, multi-vendor order splitting, and payment initiation.
* **Preconditions:** Checkout validation completed (`UC-CUST-006`).
* **Trigger:** Customer clicks "Place Order" / "Proceed to Pay".
* **Main Success Flow (COD Option):**
  1. Customer selects Cash on Delivery (COD).
  2. System executes final stock check (`BR-005`) and reserves inventory (`BR-006`, `FR-INV-002`).
  3. System creates parent Main `Order` (#1000) storing total amount, shipping charges, delivery address, and payment method COD.
  4. System automatically splits Main Order #1000 into isolated child `VendorOrder` records (#1000-A, #1000-B) for each vendor (`BR-011`, `FR-ORDER-001`).
  5. System sends real-time order notifications to Customer and vendors via SignalR (`FR-NOTIF-001`).
  6. Customer is redirected to Order Confirmation page (#1000).
* **Alternative Flows (Online Payment Option):**
  1. Customer selects Online Payment Gateway.
  2. System creates parent `Order` (#1000) and child `VendorOrder` records (#1000-A, #1000-B) with payment status `Pending`.
  3. **Payment Fulfillment Protection Rule:** An online-payment order may exist in unconfirmed state before gateway verification, but an order must **NOT** become fulfillable by vendors merely because the order record was created (`FR-PAY-002`, `BR-009`).
  4. System redirects Customer to secure payment gateway interface.
  5. Customer completes payment card entry on payment gateway.
  6. Payment Gateway sends cryptographic webhook callback (`POST /api/v1/payments/payment-webhook`).
  7. Backend verifies webhook signature, updates payment status to `Paid`, updates Order status to `Confirmed`, and authorizes vendor fulfillment (`BR-009`).
* **Exception Flows:**
  * *EF-8.1 Online Payment Failure / Cancellation:* Payment fails or customer cancels gateway transaction. Webhook sets payment status to `Failed`. Order remains unconfirmed and cannot be processed by vendors. System releases temporary stock reservations (`BR-006`) and prompts Customer to retry payment or select COD.
* **Postconditions:** Parent Order and split child VendorOrders created; stock reserved; notifications dispatched.
* **Business Rules:** `BR-005`, `BR-006`, `BR-009`, `BR-011`.
* **Functional Requirements Traceability:** `FR-ORDER-001`, `FR-ORDER-002`, `FR-PAY-001`, `FR-PAY-002`, `FR-INV-001`, `FR-INV-002`, `FR-NOTIF-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-SEC-004`, `NFR-PERF-002`.
* **Authorization & Data Isolation:** Customer sees unified parent Order (#1000). Vendors see ONLY their own child VendorOrders (#1000-A) (`BR-002`, `BR-003`).
* **External Dependencies:** Payment Gateway (webhook verification), SignalR (notifications).
* **Deferred Decisions:** Online payment gateway provider selection; exact inventory reservation timeout mechanics; partial multi-vendor failure financial refund mechanics.

---

### Use Case: `UC-CUST-009` — Track Order

* **Use Case ID:** `UC-CUST-009`
* **Use Case Name:** Track Order
* **Primary Actor:** Customer
* **Supporting Actors / Systems:** Notification Hub (SignalR)
* **Goal / Description:** View live status timeline and delivery progress of active customer orders.
* **Preconditions:** Order has been placed (`UC-CUST-008`).
* **Trigger:** Customer opens "My Orders" and selects an active Order (#1000).
* **Main Success Flow:**
  1. Customer opens Order Details for Order #1000.
  2. System verifies Customer ownership of Order #1000 (`BR-003`).
  3. System displays parent order details, delivery address, payment status, and vendor-split child orders (#1000-A, #1000-B).
  4. System renders live fulfillment status stepper for each vendor order: `Pending → Confirmed → Preparing → Ready for Pickup → Picked Up → Out for Delivery → Delivered`.
  5. Live status changes are pushed automatically to Customer UI via SignalR hub (`FR-NOTIF-001`).
* **Alternative Flows:**
  * *Cancel Order:* Customer clicks "Cancel Order" on eligible pending order prior to vendor preparation (`FR-CUST-005`). System updates status to `Cancelled` and releases reserved inventory.
* **Exception Flows:**
  * *EF-9.1 Unauthorized Order Access:* User attempts to view Order belonging to another customer (`BR-003`). System blocks access with HTTP 403 Forbidden.
* **Postconditions:** Live order status timeline rendered.
* **Business Rules:** `BR-003`.
* **Functional Requirements Traceability:** `FR-CUST-004`, `FR-CUST-005`, `FR-ORDER-002`, `FR-ORDER-004`, `FR-NOTIF-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-USA-001`.
* **Authorization & Data Isolation:** Restricted strictly to authenticated Customer owning the parent order (`BR-003`).
* **External Dependencies:** SignalR (real-time updates).
* **Deferred Decisions:** None.

---

### Use Case: `UC-CUST-010` — Submit Review

* **Use Case ID:** `UC-CUST-010`
* **Use Case Name:** Submit Review
* **Primary Actor:** Customer
* **Supporting Actors / Systems:** System / Background Processes
* **Goal / Description:** Submit a product star rating (1-5) and written comment for a product purchased and delivered to the customer.
* **Preconditions:** Customer is authenticated; order contains target product and is in `Delivered` status.
* **Trigger:** Customer clicks "Write a Review" on completed Order page or Product page.
* **Main Success Flow:**
  1. Customer selects star rating (1-5) and inputs text comment.
  2. System checks Purchase Eligibility Rule (`BR-004`): Verifies Customer has a confirmed order containing target product AND order status is `Delivered`.
  3. System saves `Review` record linked to Product ID, Customer ID, Vendor ID, and Order ID (`FR-REVIEW-001`).
  4. System recalculates average rating scores for the Product and Vendor Store (`FR-REVIEW-002`).
  5. System displays confirmation: "Thank you! Your review has been published."
* **Exception Flows:**
  * *EF-10.1 Ineligible Review Attempt:* Customer attempts review without a completed delivered purchase of product (`BR-004`). System blocks submission and displays: "Review eligible only for verified purchases after order delivery is completed."
* **Postconditions:** Review record saved; rating averages updated.
* **Business Rules:** `BR-004`.
* **Functional Requirements Traceability:** `FR-REVIEW-001`, `FR-REVIEW-002`, `FR-CUST-015`.
* **Non-Functional Requirements:** `NFR-USA-001`.
* **Authorization & Data Isolation:** Customer can only review products from own delivered orders (`BR-004`).
* **External Dependencies:** None.
* **Deferred Decisions:** None.

---

## 3. Vendor Use Case Specifications (`UC-VEND-001` to `UC-VEND-006`)

---

### Use Case: `UC-VEND-001` — Vendor Registration / Application

* **Use Case ID:** `UC-VEND-001`
* **Use Case Name:** Vendor Registration / Application
* **Primary Actor:** Vendor Applicant
* **Supporting Actors / Systems:** Administrator, Notification Hub (SignalR)
* **Goal / Description:** Submit a business application to become an approved selling vendor on LocalMart.
* **Preconditions:** None.
* **Trigger:** Applicant clicks "Become a Vendor" on Storefront landing page.
* **Main Success Flow:**
  1. Applicant fills multi-step vendor registration form:
     * **Owner / Contact Details:** Full Name, Business Email, Direct Phone Number.
     * **Business Identity:** Registered Shop Name, Business Type, Primary Category, Business Description.
     * **Location Details:** Physical Street Address, City, District, Latitude, Longitude (map pin).
     * **Verification Information:** Business tax/registration verification info as mandated by policy (`FR-VEND-001`).
     * **Store Profile Setup:** Store Logo URL, Cover Image URL, Description, Operating Hours, Social Links.
     * **Payout Configuration:** Payout method selection, provider account reference.
     * **Terms Acceptance:** Acceptance of vendor marketplace terms and privacy policy.
  2. System validates input data formats and email uniqueness.
  3. System creates a `VendorApplication` record with status `Pending` (`FR-VEND-002`).
  4. System notifies Administrators via SignalR of new pending application (`FR-NOTIF-001`).
  5. System displays confirmation: "Application submitted successfully. Under review by Marketplace Administration."
* **Postconditions:** `VendorApplication` created in `Pending` state. The applicant **cannot** list products, publish store listings, or receive/process customer orders until approved (`BR-001`).
* **Business Rules:** `BR-001`.
* **Functional Requirements Traceability:** `FR-VEND-001`, `FR-VEND-002`, `FR-AUTH-001`, `FR-NOTIF-001`.
* **Non-Functional Requirements:** `NFR-SEC-004`, `NFR-USA-001`.
* **Authorization & Data Isolation:** Public registration portal. Created application data is restricted to Applicant and Admins (`BR-001`).
* **External Dependencies:** SignalR (admin notification).
* **Deferred Decisions:** Exact jurisdiction-specific verification document rules.

---

### Use Case: `UC-VEND-002` — Vendor Approval / Onboarding

* **Use Case ID:** `UC-VEND-002`
* **Use Case Name:** Vendor Approval / Onboarding
* **Primary Actor:** Administrator
* **Supporting Actors / Systems:** Vendor Applicant, Notification Hub (SignalR)
* **Goal / Description:** Review pending vendor application and execute state transition (`Approve`, `Reject`, `Suspend`), granting approved vendors active marketplace selling privileges (`BR-001`).
* **Preconditions:** `VendorApplication` exists in `Pending` or `Under Review` status (`UC-VEND-001`).
* **Trigger:** Admin opens Vendor Verification Queue and selects an application.
* **Main Success Flow (Approval):**
  1. Admin inspects application details, business address, lat/long location, store profile draft, and verification data.
  2. Admin clicks "Approve Vendor".
  3. System transitions `VendorApplication` status to `Approved`.
  4. System creates/activates selling `Vendor` account record with status `Active` (`FR-VEND-002`, `FR-VEND-003`).
  5. System grants vendor role permissions (`BR-001`).
  6. System notifies Vendor via email and SignalR ("Your vendor application has been approved!").
* **Alternative Flows (Rejection / Suspension):**
  * *Application Rejection:* Admin enters rejection reason and clicks "Reject". System sets application status to `Rejected` and notifies applicant (`FR-ADMIN-001`).
  * *Vendor Suspension:* Admin suspends active vendor (`BR-015`). System sets Vendor status to `Suspended`, immediately hides vendor products from public storefront (`BR-012`), and blocks vendor order processing (`FR-ADMIN-002`).
* **Postconditions:** Application status updated; active Vendor record created/activated upon approval.
* **Business Rules:** `BR-001`, `BR-012`, `BR-015`.
* **Functional Requirements Traceability:** `FR-VEND-002`, `FR-VEND-003`, `FR-ADMIN-001`, `FR-ADMIN-002`, `FR-NOTIF-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-SEC-004`.
* **Authorization & Data Isolation:** Restricted strictly to authorized Marketplace Administrators (`BR-007`).
* **External Dependencies:** SignalR, Email Service.
* **Deferred Decisions:** None.

---

### Use Case: `UC-VEND-003` — Manage Store Profile

* **Use Case ID:** `UC-VEND-003`
* **Use Case Name:** Manage Store Profile
* **Primary Actor:** Approved Vendor
* **Supporting Actors / Systems:** Cloudinary, Maps Service
* **Goal / Description:** Update vendor public store information, store logo, cover photo, business description, operating hours, contact numbers, social links, and map pin location.
* **Preconditions:** Vendor account is `Approved` and `Active` (`BR-001`).
* **Trigger:** Vendor navigates to Store Profile settings in Vendor Portal.
* **Main Success Flow:**
  1. Vendor edits Store Name, Description, Operating Hours, Phone, Social Links, or Map Location.
  2. Vendor optionally uploads new Store Logo or Cover Image via Cloudinary integration (`FR-PROD-004`).
  3. System validates vendor ownership (`BR-002`) and updates `StoreProfile` record.
  4. Public store profile page reflects updates immediately.
* **Postconditions:** Store profile updated and published.
* **Business Rules:** `BR-001`, `BR-002`.
* **Functional Requirements Traceability:** `FR-VEND-005`, `FR-PROD-004`, `FR-LOC-001`.
* **Non-Functional Requirements:** `NFR-USA-001`.
* **Authorization & Data Isolation:** Vendor can access and update ONLY own store profile (`BR-002`).
* **External Dependencies:** Cloudinary (image hosting), Maps Service.
* **Deferred Decisions:** Maps API provider selection.

---

### Use Case: `UC-VEND-004` — Manage Products

* **Use Case ID:** `UC-VEND-004`
* **Use Case Name:** Manage Products
* **Primary Actor:** Approved Vendor
* **Supporting Actors / Systems:** Cloudinary
* **Goal / Description:** Create, edit, activate/deactivate, and upload images for products in the vendor's catalog.
* **Preconditions:** Vendor status is `Approved` and `Active` (`BR-001`).
* **Trigger:** Vendor accesses Product Management in Vendor Portal.
* **Main Success Flow (Product Creation & Image Upload):**
  1. Vendor clicks "Add Product".
  2. Vendor enters Name, SKU, Description, Category ID, Brand ID, Base Price, Discount Price/Percentage, Initial Stock Quantity, and Low-Stock Threshold (`FR-PROD-001`).
  3. System validates SKU uniqueness for vendor (`BR-002`).
  4. Vendor uploads product gallery images via Cloudinary (`FR-PROD-004`).
  5. Vendor sets product status (`Draft` or `Active`) (`FR-PROD-002`).
  6. System saves Product record linked strictly to Vendor ID (`BR-002`). Active products become visible on public storefront (`BR-012`).
* **Alternative Flows (Edit / Status Toggle):**
  * *Edit Product:* Vendor updates product price or details. System updates `Product` record (`FR-PROD-001`).
  * *Deactivate Product:* Vendor sets product status to `Inactive`. System immediately hides product from public catalog (`BR-012`).
* **Exception Flows:**
  * *EF-4.1 Duplicate SKU:* Vendor inputs SKU already assigned to another product in their store. System blocks saving and displays: "SKU must be unique within your store."
* **Postconditions:** Product catalog updated; image assets hosted on Cloudinary.
* **Business Rules:** `BR-001`, `BR-002`, `BR-012`.
* **Functional Requirements Traceability:** `FR-PROD-001`, `FR-PROD-002`, `FR-PROD-003`, `FR-PROD-004`, `FR-VEND-004`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-USA-001`.
* **Authorization & Data Isolation:** Vendor can create and modify ONLY own store products (`BR-002`).
* **External Dependencies:** Cloudinary (image management).
* **Deferred Decisions:** None.

---

### Use Case: `UC-VEND-005` — Manage Inventory

* **Use Case ID:** `UC-VEND-005`
* **Use Case Name:** Manage Inventory
* **Primary Actor:** Approved Vendor
* **Supporting Actors / Systems:** Notification Hub (SignalR), Background Processes
* **Goal / Description:** Update physical stock quantities, view reserved stock levels, inspect inventory movement audit logs, and respond to low-stock threshold alerts.
* **Preconditions:** Vendor account is `Approved` and `Active` (`BR-001`).
* **Trigger:** Vendor accesses Inventory Management view.
* **Main Success Flow:**
  1. Vendor views Inventory table displaying Product Name, Physical Stock, Reserved Stock, and Available Stock for Sale (`Available = Physical - Reserved`) (`FR-INV-001`).
  2. Vendor updates Physical Stock count (e.g., adds +50 units following stock replenishment).
  3. System records entry in `InventoryMovements` audit log capturing quantity change, reason, and timestamp (`FR-INV-003`).
  4. System updates Available Stock count.
* **Alternative Flows (Low Stock Warning Handling):**
  * *Low Stock Trigger:* When available stock falls to or below Low-Stock Threshold, system flags product with "Low Stock" badge and pushes alert notification via SignalR (`FR-INV-004`, `FR-NOTIF-001`).
* **Postconditions:** Inventory stock levels updated; movement audit log recorded.
* **Business Rules:** `BR-002`, `BR-005`, `BR-006`.
* **Functional Requirements Traceability:** `FR-INV-001`, `FR-INV-002`, `FR-INV-003`, `FR-INV-004`, `FR-NOTIF-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-PERF-003`.
* **Authorization & Data Isolation:** Vendor accesses and modifies ONLY own store inventory (`BR-002`).
* **External Dependencies:** SignalR (low stock notifications).
* **Deferred Decisions:** Inventory reservation timeout mechanics; locking strategies.

---

### Use Case: `UC-VEND-006` — Manage Vendor Orders

* **Use Case ID:** `UC-VEND-006`
* **Use Case Name:** Manage Vendor Orders
* **Primary Actor:** Approved Vendor
* **Supporting Actors / Systems:** Notification Hub (SignalR)
* **Goal / Description:** View assigned child vendor orders (`VendorOrders`), process order preparation, update status transitions (`Confirmed → Preparing → Ready for Pickup`), and track vendor payouts.
* **Preconditions:** Customer order containing vendor products has been placed and payment is verified (`UC-CUST-008`).
* **Trigger:** New vendor order notification arrives or Vendor opens Orders panel.
* **Main Success Flow:**
  1. Vendor opens Orders panel. System queries child `VendorOrders` filtered strictly by Vendor ID (`BR-002`).
  2. Vendor selects child VendorOrder #1000-A ($50). Vendor views ordered line items, quantities, customer delivery notes, and net vendor payable amount. Vendor **cannot** view items or revenue of other vendors (`BR-002`).
  3. Vendor clicks "Accept Order". System updates VendorOrder status to `Confirmed`.
  4. Vendor packs items and clicks "Start Preparing". System updates status to `Preparing` (`FR-ORDER-002`).
  5. Vendor completes packaging and clicks "Mark Ready for Pickup". System updates status to `Ready for Pickup` and places order into Delivery Staff assignment pool (`FR-DEL-001`).
  6. System pushes real-time status notifications to Customer via SignalR (`FR-NOTIF-001`).
* **Alternative Flows (Payout Ledger Viewing):**
  * *View Payouts:* Vendor accesses "Payouts" view to inspect completed order earnings, platform commission deductions (`BR-014`), and historical payout status (`Pending`, `Processing`, `Paid`) (`FR-COMM-003`).
* **Exception Flows:**
  * *EF-6.1 Unverified Online Payment:* Vendor attempts order processing before online payment is verified by webhook (`BR-009`). System blocks action and displays: "Order payment verification pending."
* **Postconditions:** VendorOrder fulfillment status updated; SignalR alerts dispatched.
* **Business Rules:** `BR-001`, `BR-002`, `BR-009`, `BR-011`, `BR-014`.
* **Functional Requirements Traceability:** `FR-ORDER-001`, `FR-ORDER-002`, `FR-VEND-004`, `FR-COMM-002`, `FR-COMM-003`, `FR-NOTIF-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-PERF-003`.
* **Authorization & Data Isolation:** Vendor can view and process ONLY own child VendorOrders (#1000-A) (`BR-002`).
* **External Dependencies:** SignalR (notifications).
* **Deferred Decisions:** Partial multi-vendor failure financial refund mechanics; commission calculation base details.

---

## 4. Administrator Use Case Specifications (`UC-ADMIN-001` to `UC-ADMIN-006`)

---

### Use Case: `UC-ADMIN-001` — Admin Authentication

* **Use Case ID:** `UC-ADMIN-001`
* **Use Case Name:** Admin Authentication
* **Primary Actor:** Administrator
* **Supporting Actors / Systems:** System / Background Processes
* **Goal / Description:** Authenticate securely into administrative supervision portal using controlled administrative account credentials.
* **Preconditions:** Admin account provisioned via controlled administrative setup (no public registration).
* **Trigger:** Admin enters credentials on Admin Portal login screen.
* **Main Success Flow:**
  1. Admin inputs Email Address and Password.
  2. System verifies credentials against hashed password and checks Admin role/permission claims (`BR-007`).
  3. System issues stateless Admin JWT access token (`FR-AUTH-003`).
  4. System redirects Administrator to Admin Dashboard.
* **Exception Flows:**
  * *EF-1.1 Invalid Credentials / Missing Admin Role:* System rejects login attempt, logs audit event (`BR-007`), and displays: "Invalid administrative credentials."
* **Postconditions:** Admin authenticated session established.
* **Business Rules:** `BR-007`.
* **Functional Requirements Traceability:** `FR-AUTH-001`, `FR-AUTH-003`, `FR-AUTH-004`, `FR-AUDIT-001`.
* **Non-Functional Requirements:** `NFR-SEC-001`, `NFR-SEC-002`, `NFR-SEC-004`.
* **Authorization & Data Isolation:** Restricted strictly to authorized Administrators (`BR-007`).
* **External Dependencies:** None.
* **Deferred Decisions:** None.

---

### Use Case: `UC-ADMIN-002` — Manage Customers

* **Use Case ID:** `UC-ADMIN-002`
* **Use Case Name:** Manage Customers
* **Primary Actor:** Administrator
* **Supporting Actors / Systems:** System / Background Processes
* **Goal / Description:** Search, inspect, and manage registered customer accounts, order summaries, and account status flags.
* **Preconditions:** Admin is authenticated (`UC-ADMIN-001`).
* **Trigger:** Admin accesses Customer Management view.
* **Main Success Flow:**
  1. Admin searches customer accounts by Name, Email, or Phone.
  2. System displays customer profile summary, total orders placed, and account status (`Active` / `Disabled`).
  3. Admin can toggle account status (e.g., disable abusive customer account).
  4. System records audit log entry in `AuditLogs` table (`BR-007`, `FR-AUDIT-001`).
* **Postconditions:** Customer account status updated; audit record created.
* **Business Rules:** `BR-007`.
* **Functional Requirements Traceability:** `FR-ADMIN-003`, `FR-AUDIT-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-USA-001`.
* **Authorization & Data Isolation:** Global administrative read/update access (`BR-007`).
* **External Dependencies:** None.
* **Deferred Decisions:** None.

---

### Use Case: `UC-ADMIN-003` — Manage Vendors

* **Use Case ID:** `UC-ADMIN-003`
* **Use Case Name:** Manage Vendors
* **Primary Actor:** Administrator
* **Supporting Actors / Systems:** Notification Hub (SignalR)
* **Goal / Description:** Audit vendor applications, execute onboarding approvals/rejections (`BR-001`), suspend non-compliant active vendors (`BR-015`), and monitor vendor performance.
* **Preconditions:** Admin is authenticated (`UC-ADMIN-001`).
* **Trigger:** Admin accesses Vendor Applications Queue or Vendor Management view.
* **Main Success Flow (Approval):**
  1. Admin inspects pending `VendorApplication` (details, lat/long location, store profile draft, verification info).
  2. Admin clicks "Approve Vendor".
  3. System sets application status to `Approved` and creates/activates selling `Vendor` account (`BR-001`, `FR-ADMIN-001`).
  4. System notifies applicant via email/SignalR.
* **Alternative Flows (Suspension):**
  * *Suspend Vendor:* Admin suspends non-compliant vendor (`BR-015`). System sets Vendor status to `Suspended`, immediately hides vendor products from public storefront (`BR-012`), and blocks new order fulfillment (`FR-ADMIN-002`). System logs audit entry (`FR-AUDIT-001`).
* **Postconditions:** Vendor onboarding status or selling state updated; audit record logged.
* **Business Rules:** `BR-001`, `BR-007`, `BR-012`, `BR-015`.
* **Functional Requirements Traceability:** `FR-ADMIN-001`, `FR-ADMIN-002`, `FR-VEND-002`, `FR-AUDIT-001`, `FR-NOTIF-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-SEC-004`.
* **Authorization & Data Isolation:** Restricted strictly to Administrators (`BR-007`).
* **External Dependencies:** SignalR (notifications).
* **Deferred Decisions:** Exact verification document rules per regional jurisdiction.

---

### Use Case: `UC-ADMIN-004` — Manage Products / Categories / Brands

* **Use Case ID:** `UC-ADMIN-004`
* **Use Case Name:** Manage Products / Categories / Brands
* **Primary Actor:** Administrator
* **Supporting Actors / Systems:** System / Background Processes
* **Goal / Description:** Perform category and brand CRUD operations, organize catalog taxonomy, and moderate marketplace product listings (`FR-ADMIN-003`).
* **Preconditions:** Admin is authenticated (`UC-ADMIN-001`).
* **Trigger:** Admin accesses Category, Brand, or Product Moderation views.
* **Main Success Flow (Category / Brand CRUD):**
  1. Admin creates or updates Category (Name, Parent Category ID, Slug, Icon URL) or Brand (Name, Logo URL).
  2. System validates input taxonomy data and saves record. Catalog browsing updates immediately.
* **Alternative Flows (Product Moderation):**
  * *Product Moderation:* Admin inspects product listing and flags non-compliant product. System sets product status to `Suspended` (`FR-ADMIN-003`). Product is hidden from public catalog (`BR-012`).
* **Postconditions:** Category/Brand taxonomy updated; non-compliant products suspended.
* **Business Rules:** `BR-007`, `BR-012`.
* **Functional Requirements Traceability:** `FR-ADMIN-003`, `FR-PROD-003`, `FR-AUDIT-001`.
* **Non-Functional Requirements:** `NFR-USA-001`.
* **Authorization & Data Isolation:** Global administrative read/update access (`BR-007`).
* **External Dependencies:** None.
* **Deferred Decisions:** None.

---

### Use Case: `UC-ADMIN-005` — Monitor Orders / Payments

* **Use Case ID:** `UC-ADMIN-005`
* **Use Case Name:** Monitor Orders / Payments
* **Primary Actor:** Administrator
* **Supporting Actors / Systems:** Payment Gateway
* **Goal / Description:** Supervise marketplace parent orders, child vendor orders, payment statuses, gateway webhooks, and refund logs.
* **Preconditions:** Admin is authenticated (`UC-ADMIN-001`).
* **Trigger:** Admin opens Order & Payment Monitoring dashboard.
* **Main Success Flow:**
  1. Admin views global Order Monitor displaying all parent Orders (#1000) and constituent VendorOrders (#1000-A, #1000-B).
  2. Admin inspects payment status (`Pending`, `Paid`, `Failed`, `Refunded`) and verifies gateway webhook cryptographic logs (`BR-009`).
  3. Admin can process refund audit logs for failed or cancelled orders.
* **Postconditions:** Order/payment statuses monitored; refund transactions logged.
* **Business Rules:** `BR-007`, `BR-009`, `BR-011`.
* **Functional Requirements Traceability:** `FR-ADMIN-003`, `FR-PAY-002`, `FR-PAY-003`, `FR-AUDIT-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-SEC-004`.
* **Authorization & Data Isolation:** Global administrative visibility across all marketplace transactions (`BR-007`).
* **External Dependencies:** Payment Gateway (webhook verification logs).
* **Deferred Decisions:** Partial multi-vendor failure financial refund mechanics.

---

### Use Case: `UC-ADMIN-006` — Manage Coupons / Commission / Payouts

* **Use Case ID:** `UC-ADMIN-006`
* **Use Case Name:** Manage Coupons / Commission / Payouts
* **Primary Actor:** Administrator
* **Supporting Actors / Systems:** System / Background Processes
* **Goal / Description:** Configure platform commission rates (`BR-014`), create promotional coupons (`BR-008`), analyze search analytics (`BR-010`), and audit system logs.
* **Preconditions:** Admin is authenticated (`UC-ADMIN-001`).
* **Trigger:** Admin opens Commission, Coupon, Search Analytics, or Audit Logs management.
* **Main Success Flow (Commission & Coupon Setup):**
  1. Admin configures platform commission rates (global %, vendor-specific %, category-specific %) (`FR-COMM-002`).
  2. Admin creates promotional Coupon: Code, Discount Type, Value, Min Spend, Max Discount Cap, Expiry Date, Usage Limits, Scope (`BR-008`, `FR-COMM-001`).
  3. System saves Coupon and Commission rules for checkout enforcement.
* **Alternative Flows (Search Analytics & Audit Logs):**
  * *Search Analytics:* Admin inspects top searched terms and zero-result search queries from `search_logs` (`BR-010`, `FR-SEARCH-005`).
  * *Audit Log Review:* Admin inspects `AuditLogs` table filtering by Actor ID, Action, Entity, or Timestamp (`BR-007`, `FR-AUDIT-001`).
* **Postconditions:** Commission and Coupon rules configured; search/audit data rendered.
* **Business Rules:** `BR-007`, `BR-008`, `BR-010`, `BR-014`.
* **Functional Requirements Traceability:** `FR-COMM-001`, `FR-COMM-002`, `FR-SEARCH-005`, `FR-ADMIN-003`, `FR-AUDIT-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-USA-001`.
* **Authorization & Data Isolation:** Restricted strictly to Administrators (`BR-007`).
* **External Dependencies:** None.
* **Deferred Decisions:** Commission calculation base details (pre/post discount, tax, shipping).

---

## 5. Delivery Staff Use Case Specifications (`UC-DEL-001` to `UC-DEL-002`)

---

### Use Case: `UC-DEL-001` — View Delivery Assignments

* **Use Case ID:** `UC-DEL-001`
* **Use Case Name:** View Delivery Assignments
* **Primary Actor:** Delivery Staff
* **Supporting Actors / Systems:** System / Background Processes
* **Goal / Description:** Authenticate into delivery portal and view assigned delivery queue for orders in `Ready for Pickup` status.
* **Preconditions:** Delivery staff account provisioned via authorized account setup.
* **Trigger:** Delivery user logs in and opens Delivery Queue.
* **Main Success Flow:**
  1. Delivery user inputs credentials and logs in (`FR-DEL-001`).
  2. System queries vendor orders in status `Ready for Pickup` assigned to or available for delivery user (`FR-DEL-001`).
  3. Delivery user selects Order #1000-A.
  4. System displays Vendor pickup address, Vendor phone, Customer delivery street address, Customer contact name, Customer phone, and delivery instructions (`FR-DEL-002`).
* **Exception Flows:**
  * *EF-1.1 Delivery Account Disabled:* System blocks login attempt.
* **Postconditions:** Assigned delivery details rendered.
* **Business Rules:** `BR-013`.
* **Functional Requirements Traceability:** `FR-DEL-001`, `FR-DEL-002`, `FR-AUTH-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-USA-001`.
* **Authorization & Data Isolation:** Delivery staff can view details ONLY for assigned delivery orders (`BR-013`).
* **External Dependencies:** None.
* **Deferred Decisions:** None.

---

### Use Case: `UC-DEL-002` — Update Delivery Status

* **Use Case ID:** `UC-DEL-002`
* **Use Case Name:** Update Delivery Status
* **Primary Actor:** Delivery Staff
* **Supporting Actors / Systems:** Notification Hub (SignalR)
* **Goal / Description:** Update delivery status transitions (`Picked Up → Out for Delivery → Delivered / Failed Delivery`) during physical order pickup and customer handoff.
* **Preconditions:** Order #1000-A is assigned to delivery user and in `Ready for Pickup` status (`UC-DEL-001`).
* **Trigger:** Delivery user clicks status update button in Delivery Mobile/Web App.
* **Main Success Flow:**
  1. Delivery user arrives at vendor location, collects packaged order #1000-A, and clicks "Confirm Pickup". System updates status to `Picked Up` (`BR-013`, `FR-DEL-003`).
  2. Delivery user starts transit to customer address and clicks "Start Delivery". System updates status to `Out for Delivery` (`FR-DEL-003`).
  3. Delivery user hands package to customer and clicks "Mark Delivered". System updates status to `Delivered` and records completion timestamp (`FR-DEL-003`).
  4. If COD order: System records cash collection confirmation.
  5. System notifies Customer via SignalR (`FR-NOTIF-001`) and unlocks product review eligibility for Customer (`BR-004`).
* **Alternative Flows (Failed Delivery):**
  * *Report Failed Delivery:* Customer is unreachable or address invalid. Delivery user selects reason and clicks "Report Failed Delivery". System sets status to `Failed Delivery` and alerts Support/Vendor (`FR-DEL-003`).
* **Postconditions:** Order delivery status updated; completion recorded; review eligibility unlocked upon delivery.
* **Business Rules:** `BR-004`, `BR-013`.
* **Functional Requirements Traceability:** `FR-DEL-003`, `FR-REVIEW-001`, `FR-NOTIF-001`.
* **Non-Functional Requirements:** `NFR-SEC-003`, `NFR-USA-001`.
* **Authorization & Data Isolation:** Only authorized delivery staff or automated handlers can update delivery statuses (`BR-013`).
* **External Dependencies:** SignalR (real-time notification delivery).
* **Deferred Decisions:** Live driver GPS tracking is strictly excluded from MVP.

---

## 6. Cross-Use-Case Requirements & Traceability Matrices

### 6.1 Use Case → Business Rules (BR) Traceability Matrix

| Business Rule ID & Name | Mapped Formal Use Cases |
|---|---|
| **BR-001** Vendor Approval Requirement | `UC-VEND-001`, `UC-VEND-002`, `UC-ADMIN-003` |
| **BR-002** Vendor Data Isolation | `UC-VEND-003`, `UC-VEND-004`, `UC-VEND-005`, `UC-VEND-006` |
| **BR-003** Customer Order Isolation | `UC-CUST-001`, `UC-CUST-002`, `UC-CUST-007`, `UC-CUST-008`, `UC-CUST-009` |
| **BR-004** Customer Review Eligibility | `UC-CUST-010`, `UC-DEL-002` |
| **BR-005** Inventory Validation | `UC-CUST-005`, `UC-CUST-006`, `UC-CUST-008`, `UC-VEND-005` |
| **BR-006** Inventory Reservation | `UC-CUST-008`, `UC-CUST-009`, `UC-VEND-005` |
| **BR-007** Admin Access Enforcement | `UC-ADMIN-001` through `UC-ADMIN-006` |
| **BR-008** Coupon Enforcement | `UC-CUST-006`, `UC-CUST-008`, `UC-ADMIN-006` |
| **BR-009** Payment Confirmation | `UC-CUST-008`, `UC-VEND-006`, `UC-ADMIN-005` |
| **BR-010** Search Logging | `UC-CUST-003`, `UC-ADMIN-006` |
| **BR-011** Multi-Vendor Order Splitting | `UC-CUST-005`, `UC-CUST-006`, `UC-CUST-008`, `UC-VEND-006`, `UC-ADMIN-005` |
| **BR-012** Product Visibility Rule | `UC-CUST-003`, `UC-CUST-004`, `UC-VEND-004`, `UC-ADMIN-003`, `UC-ADMIN-004` |
| **BR-013** Delivery Authorization | `UC-DEL-001`, `UC-DEL-002` |
| **BR-014** Commission Calculation | `UC-VEND-006`, `UC-ADMIN-006` |
| **BR-015** Vendor Suspension | `UC-VEND-002`, `UC-ADMIN-003` |

---

### 6.2 Use Case → Functional Requirements (FR) Traceability Matrix

| SRS FR Module | SRS Functional Requirement IDs | Mapped Formal Use Cases |
|---|---|---|
| **Authentication & Authorization** | `FR-AUTH-001` to `FR-AUTH-006` | `UC-CUST-001`, `UC-CUST-002`, `UC-VEND-001`, `UC-ADMIN-001`, `UC-DEL-001` |
| **Customer Capabilities** | `FR-CUST-001` to `FR-CUST-005` | `UC-CUST-001`, `UC-CUST-006`, `UC-CUST-007`, `UC-CUST-009` |
| **Vendor Onboarding & Management** | `FR-VEND-001` to `FR-VEND-006` | `UC-VEND-001`, `UC-VEND-002`, `UC-VEND-003`, `UC-VEND-004`, `UC-VEND-006` |
| **Product Catalog & Media** | `FR-PROD-001` to `FR-PROD-004` | `UC-CUST-003`, `UC-CUST-004`, `UC-VEND-003`, `UC-VEND-004`, `UC-ADMIN-004` |
| **Search & Discovery** | `FR-SEARCH-001` to `FR-SEARCH-005` | `UC-CUST-003`, `UC-ADMIN-006` |
| **Inventory Control** | `FR-INV-001` to `FR-INV-004` | `UC-CUST-005`, `UC-CUST-006`, `UC-CUST-008`, `UC-VEND-005` |
| **Cart & Multi-Vendor Checkout** | `FR-CART-001` to `FR-CART-003` | `UC-CUST-005`, `UC-CUST-006` |
| **Order Management & Splitting** | `FR-ORDER-001` to `FR-ORDER-004` | `UC-CUST-008`, `UC-CUST-009`, `UC-VEND-006`, `UC-ADMIN-005` |
| **Payments & Webhooks** | `FR-PAY-001` to `FR-PAY-004` | `UC-CUST-006`, `UC-CUST-008`, `UC-ADMIN-005` |
| **Delivery Workflow** | `FR-DEL-001` to `FR-DEL-003` | `UC-DEL-001`, `UC-DEL-002` |
| **Reviews & Moderation** | `FR-REVIEW-001` to `FR-REVIEW-003` | `UC-CUST-010`, `UC-VEND-006`, `UC-ADMIN-004` |
| **Coupons & Commissions** | `FR-COMM-001` to `FR-COMM-003` | `UC-CUST-006`, `UC-VEND-006`, `UC-ADMIN-006` |
| **Admin Governance & Auditing** | `FR-ADMIN-001` to `FR-ADMIN-003`, `FR-AUDIT-001` | `UC-ADMIN-001` to `UC-ADMIN-006` |
| **Real-Time Notifications** | `FR-NOTIF-001` | `UC-CUST-008`, `UC-CUST-009`, `UC-VEND-001`, `UC-VEND-005`, `UC-DEL-002` |
| **Location-Aware Discovery** | `FR-LOC-001`, `FR-LOC-002` | `UC-CUST-003`, `UC-CUST-007`, `UC-VEND-003` |

---

### 6.3 Use Case → Non-Functional Requirements (NFR) Traceability Matrix

| SRS NFR Category | SRS Non-Functional Requirement IDs | Mapped Formal Use Cases |
|---|---|---|
| **Performance & Debounce** | `NFR-PERF-001`, `NFR-PERF-002`, `NFR-PERF-003` | `UC-CUST-002`, `UC-CUST-003`, `UC-CUST-004`, `UC-CUST-005`, `UC-VEND-005` |
| **Security & Cryptography** | `NFR-SEC-001`, `NFR-SEC-002`, `NFR-SEC-003`, `NFR-SEC-004` | `UC-CUST-001`, `UC-CUST-002`, `UC-CUST-008`, `UC-VEND-002`, `UC-ADMIN-001` |
| **Scalability & Architecture** | `NFR-SCAL-001`, `NFR-SCAL-002` | `UC-CUST-003`, `UC-CUST-008` |
| **Availability & Reliability** | `NFR-AVAIL-001`, `NFR-REL-001` | All Use Cases |
| **Maintainability & Quality** | `NFR-MAINT-001`, `NFR-MAINT-002` | All Use Cases |
| **Usability & Responsiveness** | `NFR-USA-001` | All User-Facing Use Cases |

---

## 7. Consolidated Deferred Technical Decisions Index

The following 9 technical decisions remain explicitly deferred to downstream design documentation phases (Database Design, System Architecture HLD, Low-Level Design LLD, API Contracts):
1. **Exact Online Payment Provider:** Selection of specific online payment provider (Stripe vs. suitable local gateway) based on regional deployment.
2. **Maps API Provider:** Choice of mapping service (Google Maps API, Mapbox, OpenStreetMap) for lat/long geocoding and distance calculation rendering.
3. **Inventory Reservation Lifecycle Mechanics:** Transactional locks, exact reservation timeouts, background cleanup job configurations, and concurrency implementations.
4. **SignalR Connection & Group Design:** SignalR hub group management, reconnect policies, and JWT query-string authorization parameters.
5. **Exact Vendor Verification Document Rules:** Definition of specific business registration file formats per regional legal jurisdiction.
6. **Password Hashing Candidate Selection:** Selection of exact hashing library/algorithm (BCrypt vs. ASP.NET Core Identity PasswordHasher) during technical security design.
7. **Deployment Architecture Details:** Cloud hosting environments, container orchestrations, and CI/CD pipelines.
8. **Commission Calculation Base Details:** Exact financial calculation base (pre/post discount item price, shipping, tax, coupon funding, refund adjustments).
9. **Partial Multi-Vendor Failure Mechanics:** Refund allocation, shipping recalculations, tax/discount adjustments, parent order status rollup rules, vendor payable impact, and inventory release timing for partial vendor cancellations.

---

## 8. MVP / Future / Out-of-Scope Verification Matrix

* **MVP Scope Preserved:** YES. All 24 formal use cases map strictly to core commerce requirements.
* **Future Scope Preserved:** YES. Post-MVP features (AI semantic search via `pgvector`, AI recommendations, Redis caching, multi-branch vendor accounts, native mobile apps, demand forecasting, live driver GPS tracking) are strictly preserved in Future Scope.
* **Out-of-Scope Prescluded:** YES. Excluded capabilities (international shipping, cryptocurrency payments, automated warehouse robotics, ERP integrations, ad marketplaces, prescription sales, autonomous delivery drones, corporate loyalty programs) are strictly preserved as Out-of-Scope.

---

## 9. Quality Assurance & Browser Verification Rules

* **Current Phase Status:** Documentation-Only (`Browser Verification: N/A`).
* **Rule for Future Implementation Phases:**  
  Starting from Phase 14 (Implementation), every user-facing functional feature must undergo browser-based execution verification using Chrome prior to being marked completed:  
  `Code Implementation → Launch Application Server → Open Chrome → Perform User Journey → Verify Behavior → Record Verification`.
