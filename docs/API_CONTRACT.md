# LocalMart — API Contract & Specification

**Document Version:** 1.2 (Final Consistency Pass)  
**Phase:** 06 — API Contract & Specification  
**Status:** Approved Phase 06 Baseline  
**Date:** September 12, 2026  
**Target Platform:** ASP.NET Core 8.0 Web API (.NET 8 / C#)  
**Primary Source Document:** `LocalMart_BRD_v1.0(1).md`  
**Consolidated Reference:** `docs/BRD_BASELINE.md`  
**SRS Reference:** `docs/SRS.md`  
**User Flows Reference:** `docs/USER_FLOWS_AND_USE_CASES.md`  
**Use Case Specifications:** `docs/USE_CASE_SPECIFICATIONS.md`  
**Traceability Matrix Reference:** `docs/REQUIREMENTS_TRACEABILITY_MATRIX.md`  
**Database Design Reference:** `docs/DATABASE_DESIGN_AND_ERD.md`  
**Project:** LocalMart — Location-Aware Multi-Vendor E-Commerce Marketplace  

---

## 1. Document Control

### 1.1 Purpose
This document specifies the complete RESTful Web API Contract for **LocalMart**. It translates the approved business rules (`BR-001` through `BR-015`), 56 SRS functional requirements, 14 non-functional requirements, 81 user flows, 24 use case specifications, and the normalized 35-entity PostgreSQL schema (`docs/DATABASE_DESIGN_AND_ERD.md`) into a structured, secure, developer-ready HTTP API specification.

### 1.2 Document Priority & Traceability Hierarchy
1. Primary Business Source of Truth: [`LocalMart_BRD_v1.0(1).md`](file:///d:/new%20e%20commers/LocalMart_BRD_v1.0%281%29.md)
2. Consolidated Baseline Reference: [`docs/BRD_BASELINE.md`](file:///d:/new%20e%20commers/docs/BRD_BASELINE.md)
3. Software Requirements Specification: [`docs/SRS.md`](file:///d:/new%20e%20commers/docs/SRS.md)
4. User Flows & Use Case Catalog: [`docs/USER_FLOWS_AND_USE_CASES.md`](file:///d:/new%20e%20commers/docs/USER_FLOWS_AND_USE_CASES.md)
5. Formal Use Case Specifications: [`docs/USE_CASE_SPECIFICATIONS.md`](file:///d:/new%20e%20commers/docs/USE_CASE_SPECIFICATIONS.md)
6. Requirements Traceability Matrix: [`docs/REQUIREMENTS_TRACEABILITY_MATRIX.md`](file:///d:/new%20e%20commers/docs/REQUIREMENTS_TRACEABILITY_MATRIX.md)
7. Database Design & ERD: [`docs/DATABASE_DESIGN_AND_ERD.md`](file:///d:/new%20e%20commers/docs/DATABASE_DESIGN_AND_ERD.md)

### 1.3 Scope & Non-Goals
* **Included:** API baseline, RESTful resource conventions, authentication/authorization endpoints, request/response JSON contracts, validation rules, HTTP status code rules, error contracts (RFC 7807 Problem Details), pagination/filtering/sorting standards, vendor/customer isolation policies, role authorization matrix, idempotency rules, media upload signatures, and requirement traceability.
* **Explicit Non-Goals:** Writing C# ASP.NET Core controllers, MediatR command/query handlers, DTO classes, EF Core DbContext entities, SQL migrations, repository code, frontend API client code, or generating OpenAPI JSON/YAML artifacts. This phase is strict API contract documentation.

---

## 2. Purpose & Scope

The LocalMart Web API serves as the centralized backend service layer for all marketplace interactions. It provides secure HTTP endpoints for four distinct application client interfaces:
1. **Customer Web & Mobile Portal:** Product catalog discovery, cart management, checkout, order tracking, reviews, and profile management.
2. **Vendor Administration Portal:** Store profile management, catalog product management, stock inventory control, and multi-vendor split order fulfillment.
3. **Administrator Back-Office Portal:** Vendor application review & approval, catalog moderation, marketplace coupon creation, commission monitoring, vendor payouts, search analytics, and security audit logs.
4. **Delivery Staff Mobile Client:** Order delivery assignment acceptance, store pickup confirmation, and customer delivery OTP verification.

---

## 3. Source of Truth & Alignment

All API endpoints defined herein trace directly to approved business rules (`BR-001` to `BR-015`), SRS functional requirements (`FR-AUTH-001` to `FR-AUDIT-001`), and database entities (`docs/DATABASE_DESIGN_AND_ERD.md`). Technical conventions (e.g., JSON response envelopes, RFC 7807 error structures, query parameter naming) are classified as **Technical Design Decisions** supporting system quality without altering business rules.

---

## 4. API Architecture & Technology Baseline

* **Framework Baseline:** ASP.NET Core 8.0 Web API (.NET 8 / C#)
* **Architecture Pattern:** Clean Architecture with CQRS (MediatR pattern) and FluentValidation
* **Protocol & Format:** RESTful HTTP / JSON over HTTPS
* **Base Endpoint Route:** `/api/v1`
* **Authentication Engine:** JWT Bearer Tokens (Short-lived Access Tokens + Persistent Refresh Tokens)
* **Authorization Engine:** Role-Based Access Control (RBAC) + Fine-grained Permission Tokens (`FR-AUTH-004`)
* **Real-Time Transport (Planned):** ASP.NET Core SignalR Hub (`/hubs/notifications`) for real-time notification dispatch (scaling backplane and distributed architecture remain deferred)
* **Error Response Format:** RFC 7807 Problem Details Specification (Technical/System Quality Convention) (`NFR-REL-001`)
* **Database Mapping Target:** EF Core 8.0 accessing PostgreSQL 15+ / Supabase-Managed PostgreSQL

---

## 5. API Versioning Strategy

* **MVP URL Scheme:** `/api/v1/...`
* **Strategy:** Path-based versioning. All initial MVP endpoints are published under `/api/v1`.
* **Deprecation & Evolution:** Future non-breaking additions (e.g., adding optional fields) will remain within `/api/v1`. Breaking structural revisions will be introduced under `/api/v2` without breaking `/api/v1` clients.

---

## 6. API Conventions & Standards

1. **HTTP Verbs:**
   * `GET`: Retrieve resource or collection (Safe, Idempotent).
   * `POST`: Create resource or execute domain action (Non-idempotent unless Idempotency-Key supplied).
   * `PUT`: Replace resource or update complete state (Idempotent).
   * `PATCH`: Partial resource state update (Non-idempotent).
   * `DELETE`: Remove resource (Idempotent).
2. **Naming Conventions:**
   * Resource URLs: `kebab-case` plural nouns (e.g., `/api/v1/vendor-orders`, `/api/v1/store-profiles`).
   * Query Parameters: `camelCase` (e.g., `?page=1&pageSize=20&sortBy=price`).
   * Request/Response JSON Keys: `camelCase` (e.g., `orderNumber`, `unitPrice`).
   * Enum Values: `PascalCase` strings matching approved database/business domains:
     * Product Status: `"Draft"`, `"Active"`, `"Inactive"`, `"OutOfStock"`, `"Suspended"`.
     * Vendor Order Status: `"Pending"`, `"Confirmed"`, `"Preparing"`, `"ReadyForPickup"`, `"PickedUp"`, `"OutForDelivery"`, `"Delivered"`, `"Cancelled"`, `"Rejected"`, `"FailedDelivery"`, `"Refunded"`.
     * Delivery Status: `"Ready"`, `"Assigned"`, `"PickedUp"`, `"OutForDelivery"`, `"Delivered"`, `"FailedDelivery"`.
     * Payment Status: `"Pending"`, `"Processing"`, `"Paid"`, `"Failed"`, `"Refunded"`.
     * Payment Method: `"COD"`, `"Online"`.
   * Timestamps: ISO 8601 UTC string format (e.g., `"2026-09-12T18:45:00Z"`).
   * Identifiers: Standard UUID 36-character string format (e.g., `"3fa85f64-5717-4562-b3fc-2c963f66afa6"`).
3. **Currency & Monetary Amounts:**
   * All monetary amounts are represented as decimal values (e.g. `4.99`). Currency codes or symbols in examples (e.g., `4.99`) are illustrative sample values only. Multi-currency support remains out of scope.

---

## 7. Authentication & Authorization APIs

### 7.1 Customer Authentication

#### `POST /api/v1/auth/customer/register`
* **Purpose:** Public registration for new customer user accounts (`FR-AUTH-001`).
* **Authentication:** Public
* **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890"
  }
  ```
* **Validation Rules:** `email` required & valid format; `password` min 8 chars with uppercase, lowercase, digit, special char; `firstName` & `lastName` required (max 100 chars).
* **Success Response:** `201 Created`
  ```json
  {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "customerId": "8ab23f64-1234-4562-b3fc-2c963f66bbb2",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Customer",
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "refreshToken": "d9b23f64-5717-4562-b3fc-2c963f66ccc3",
    "expiresAt": "2026-09-12T19:45:00Z"
  }
  ```
* **Errors:** `400 Bad Request` (Validation failure), `409 Conflict` (Email already registered).

#### `POST /api/v1/auth/customer/login`
* **Purpose:** Authenticate customer credentials (`FR-AUTH-002`).
* **Authentication:** Public
* **Request Body:** `{"email": "customer@example.com", "password": "SecurePassword123!"}`
* **Success Response:** `200 OK` (Returns `accessToken`, `refreshToken`, profile details).
* **Errors:** `400 Bad Request`, `401 Unauthorized` (Invalid credentials or account suspended).

---

### 7.2 Vendor Application & Login

#### `POST /api/v1/vendors/applications`
* **Purpose:** Public vendor onboarding application submission (`BR-001`, `FR-VEND-001`, `VF-001`).
* **Authentication:** Public (or authenticated applicant user context)
* **User Identity & Lifecycle Rules:**
  1. The payload represents a pending vendor onboarding request. If submitted by an existing user, `applicantUserId` links their identity; otherwise, a pending applicant user record is established. Zero password fields exist in the application payload.
  2. Submitting an application creates a record in `vendor_applications` with status `'Pending'`.
  3. A pending application does NOT grant `Vendor` role or vendor portal selling access. Vendor access is granted strictly after an Administrator approves the application (`BR-001`). Exact underlying account provisioning mechanics remain implementation-level details.
* **Request Body:**
  ```json
  {
    "applicantUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "businessName": "Fresh Groceries Ltd",
    "businessRegistrationNumber": "BRN-998822",
    "taxIdentificationNumber": "TIN-112233",
    "contactPhone": "+1987654321",
    "contactEmail": "vendor@business.com",
    "verificationDocuments": [
      {
        "documentType": "BusinessLicense", // Illustrative sample document type
        "documentUrl": "https://res.cloudinary.com/localmart/docs/license.pdf"
      }
    ]
  }
  ```
* **Success Response:** `202 Accepted`
  ```json
  {
    "applicationId": "9fa85f64-5717-4562-b3fc-2c963f66ddd4",
    "status": "Pending",
    "submittedAt": "2026-09-12T18:45:00Z",
    "message": "Vendor application submitted successfully and is awaiting administrator review."
  }
  ```
* **Errors:** `400 Bad Request`, `409 Conflict` (Business registration or email already exists).

#### `GET /api/v1/vendors/applications/status`
* **Purpose:** Check status of a submitted vendor application (`VF-002`).
* **Authentication:** Authenticated applicant user session OR application reference ID + verified applicant email query.
* **Privacy Boundary:** Arbitrary public users cannot enumerate application details by email. Returns high-level application status only (`Pending`, `UnderReview`, `Approved`, `Rejected`). Sensitive business registration details, tax IDs, or document URLs are NEVER exposed (`NFR-SEC-003`).
* **Query Parameters:** `?applicationId={uuid}&email={string}`
* **Success Response:** `200 OK`
  ```json
  {
    "applicationId": "9fa85f64-5717-4562-b3fc-2c963f66ddd4",
    "businessName": "Fresh Groceries Ltd",
    "status": "Pending", // Pending, UnderReview, Approved, Rejected
    "rejectionReason": null,
    "submittedAt": "2026-09-12T18:45:00Z"
  }
  ```

#### `POST /api/v1/auth/vendor/login`
* **Purpose:** Authenticate approved vendor account (`FR-AUTH-002`, `BR-001`).
* **Authentication:** Public
* **Request Body:** Email & Password.
* **Success Response:** `200 OK` (Returns JWT with `Vendor` role, `vendorId`, and permissions).
* **Errors:** `401 Unauthorized` (Invalid credentials), `403 Forbidden` (Application still Pending/Rejected or Vendor Suspended under `BR-015`).

---

### 7.3 Admin & Delivery Staff Authentication

#### `POST /api/v1/auth/admin/login`
* **Purpose:** Administrative user login (`FR-AUTH-002`, `BR-007`). Public registration is strictly prohibited.
* **Authentication:** Public
* **Success Response:** `200 OK` (Returns JWT with `Administrator` role and administrative permissions).

#### `POST /api/v1/auth/delivery/login`
* **Purpose:** Delivery staff account login (`FR-AUTH-002`). Public registration is strictly prohibited (Admin provisioned only).
* **Authentication:** Public
* **Success Response:** `200 OK` (Returns JWT with `DeliveryStaff` role).

---

### 7.4 Token Management & Identity APIs

#### `POST /api/v1/auth/refresh-token`
* **Purpose:** Exchange persistent refresh token for a new short-lived JWT access token (`FR-AUTH-005`, `NFR-SEC-002`).
* **Authentication:** Public
* **Request Body:** `{"refreshToken": "d9b23f64-5717-4562-b3fc-2c963f66ccc3"}`
* **Success Response:** `200 OK` (Returns new `accessToken` & rotated `refreshToken`).

#### `POST /api/v1/auth/logout`
* **Purpose:** Revoke current refresh token session (`FR-AUTH-005`).
* **Authentication:** Required (Bearer Token)
* **Success Response:** `204 No Content`

#### `GET /api/v1/auth/me`
* **Purpose:** Retrieve current authenticated user profile, active roles, and granted permissions (`FR-AUTH-003`).
* **Authentication:** Required (Bearer Token)
* **Success Response:** `200 OK`

---

## 8. Customer API Contracts

### 8.1 Customer Profile & Addresses

#### `GET /api/v1/customers/me` & `PUT /api/v1/customers/me`
* **Authentication:** Required (`Customer` role)
* **Success Response:** `200 OK`

#### `GET /api/v1/addresses` & `POST /api/v1/addresses`
* **Authentication:** Required (`Customer` role)
* **Request Body (POST):**
  ```json
  {
    "addressType": "CustomerShipping",
    "streetAddress": "123 Main Street, Apt 4B",
    "city": "Metropolis",
    "stateProvince": "NY",
    "postalCode": "10001",
    "country": "LocalCountry",
    "latitude": 40.712776,
    "longitude": -74.005974,
    "isDefault": true
  }
  ```
* **Success Response:** `201 Created`

#### `PUT /api/v1/addresses/{id}` & `DELETE /api/v1/addresses/{id}`
* **Authentication:** Required (`Customer` role; Customer ownership enforced).

---

### 8.2 Products & Catalog Discovery

#### `GET /api/v1/products`
* **Purpose:** Browse active catalog products with filtering, location discovery, sorting, and pagination (`FR-PROD-004`, `FR-LOC-001`, `BR-012`).
* **Public Visibility Rules:**
  1. Vendor owning product must be approved and active (`vendors.status = 'Approved'`).
  2. Product status must be publicly active (`products.status = 'Active'`). Products in `Draft`, `Inactive`, `OutOfStock`, or `Suspended` are excluded from public catalog browsing.
  3. Available inventory stock must permit purchase (`inventories.quantity_available > 0`).
* **Authentication:** Public
* **Query Parameters:**
  * `page` (`int`, default: 1)
  * `pageSize` (`int`, default: 20, max: 100)
  * `categoryId` (`uuid`, optional)
  * `brandId` (`uuid`, optional)
  * `vendorId` (`uuid`, optional)
  * `minPrice` (`decimal`, optional)
  * `maxPrice` (`decimal`, optional)
  * `latitude` (`decimal`, optional for location discovery)
  * `longitude` (`decimal`, optional for location discovery)
  * `radiusKm` (`decimal`, default: 10.0)
  * `sortBy` (`string`: `price`, `rating`, `createdAt`, default: `createdAt`)
  * `sortDirection` (`string`: `asc`, `desc`, default: `desc`)
* **Success Response:** `200 OK`
  ```json
  {
    "items": [
      {
        "id": "11111111-2222-3333-4444-555555555555",
        "name": "Fresh Organic Whole Milk 1L",
        "slug": "fresh-organic-whole-milk-1l",
        "sku": "MILK-ORG-001",
        "price": 4.99,
        "discountPrice": 3.99,
        "status": "Active",
        "vendorId": "22222222-3333-4444-5555-666666666666",
        "vendorBusinessName": "Green Valley Dairy",
        "categoryName": "Dairy & Eggs",
        "primaryImageUrl": "https://res.cloudinary.com/localmart/image/upload/v1/milk.jpg",
        "inStock": true,
        "averageRating": 4.8,
        "reviewCount": 24
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 1,
    "totalPages": 1
  }
  ```

#### `GET /api/v1/products/{idOrSlug}`
* **Purpose:** Get detailed product specifications, media asset URLs, and store profile info (`FR-PROD-004`).
* **Authentication:** Public

#### `GET /api/v1/categories` & `GET /api/v1/brands`
* **Purpose:** Retrieve active catalog category hierarchy and brand directory.
* **Authentication:** Public

---

### 8.3 Shopping Cart & Wishlist

#### `GET /api/v1/cart`
* **Purpose:** Get active customer shopping cart grouped by vendor (`FR-CART-001`).
* **Authentication:** Required (`Customer` role)

#### `POST /api/v1/cart/items`
* **Purpose:** Add product item to cart with stock validation (`FR-CART-001`, `BR-005`).
* **Authentication:** Required (`Customer` role)
* **Request Body:** `{"productId": "uuid", "quantity": 2}`
* **Errors:** `400 Bad Request` (Stock validation failed under `BR-005`).

#### `PUT /api/v1/cart/items/{id}` & `DELETE /api/v1/cart/items/{id}` & `DELETE /api/v1/cart`
* **Purpose:** Update cart item quantity, remove item, or clear cart (`FR-CART-002`).

#### `GET /api/v1/wishlist` & `POST /api/v1/wishlist/items` & `DELETE /api/v1/wishlist/items/{productId}`
* **Purpose:** Customer wishlist operations (`FR-CUST-004`).

---

### 8.4 Checkout & Orders

#### `POST /api/v1/checkout/validate`
* **Purpose:** Re-validate cart items, inventory availability (`BR-005`), pricing, promo coupons (`BR-008`), and delivery address prior to order placement (`FR-CART-003`).
* **Authentication:** Required (`Customer` role)
* **Request Body:** `{"shippingAddressId": "uuid", "couponCode": "WELCOME10"}`
* **Success Response:** `200 OK`

#### `POST /api/v1/orders`
* **Purpose:** Place order, execute multi-vendor order splitting (`BR-011`), enforce stock availability validation (`BR-005`, `BR-006`), attach coupon usage (`BR-008`), and create parent order + vendor sub-orders (`FR-ORDER-001`).
* **Authentication:** Required (`Customer` role)
* **Headers:** `Idempotency-Key: {uuid}`
* **Inventory & Payment Fulfillment Protection Rules:**
  1. The API enforces stock availability validation and overselling prevention (`BR-005`, `BR-006`). Inventory reservation, release, concurrency control, locking, expiration and cleanup mechanics are deferred technical decisions.
  2. Payment method must use provider-neutral values: `"COD"` or `"Online"`.
  3. For `"Online"` payments, order placement creates parent order and vendor sub-orders in `Pending` state. Vendor fulfillment (`Preparing`) MUST NOT proceed until an authenticated payment webhook confirms `Paid` state (`BR-009`). Client-side payment claims are strictly rejected.
* **Request Body:**
  ```json
  {
    "shippingAddressId": "7fa85f64-5717-4562-b3fc-2c963f66a111",
    "paymentMethod": "Online", // COD or Online
    "couponCode": "WELCOME10"
  }
  ```
* **Success Response:** `201 Created`
  ```json
  {
    "orderId": "8fa85f64-5717-4562-b3fc-2c963f66b222",
    "orderNumber": "LM-20260912-9901",
    "totalAmount": 50.00,
    "discountAmount": 5.00,
    "netAmount": 45.00,
    "overallStatus": "Pending",
    "vendorOrders": [
      {
        "vendorOrderId": "9fa85f64-5717-4562-b3fc-2c963f66c333",
        "subOrderNumber": "LM-20260912-9901-V01",
        "vendorId": "22222222-3333-4444-5555-666666666666",
        "vendorBusinessName": "Green Valley Dairy",
        "subtotalAmount": 45.00,
        "status": "Pending"
      }
    ],
    "createdAt": "2026-09-12T18:45:00Z"
  }
  ```

#### `GET /api/v1/orders` & `GET /api/v1/orders/{id}`
* **Purpose:** List customer order history or view parent order details with sub-orders (`FR-ORDER-004`, `BR-003`).

#### `POST /api/v1/orders/{id}/cancel`
* **Purpose:** Cancel order prior to vendor processing (`FR-ORDER-004`). Inventory reservation release, concurrency control, and cleanup mechanics are deferred technical decisions.

---

### 8.5 Reviews & Ratings

#### `POST /api/v1/reviews`
* **Purpose:** Submit verified customer product review (`BR-004`, `FR-REVIEW-001`).
* **Authentication:** Required (`Customer` role)
* **Request Body:**
  ```json
  {
    "orderItemId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "productId": "11111111-2222-3333-4444-555555555555",
    "rating": 5,
    "comment": "Exceptional quality milk, delivered fresh!"
  }
  ```
* **Validation & Service Eligibility Rules:**
  1. Service layer validates: `Customer -> Order (customer_id match) -> VendorOrder (status = 'Delivered') -> OrderItem (product_id match)`.
  2. Database `UNIQUE(order_item_id)` constraint enforces structural 1:1 limit per purchased item, but application service tier must verify customer order ownership and delivery state (`BR-004`).
* **Success Response:** `201 Created`
* **Errors:** `400 Bad Request` (Rating out of range 1-5), `403 Forbidden` (Order item not delivered or owned by different customer).

#### `GET /api/v1/reviews/product/{productId}`
* **Purpose:** Retrieve published reviews and rating breakdown for a product (`FR-REVIEW-002`).
* **Authentication:** Public

---

## 9. Search APIs

#### `GET /api/v1/search`
* **Purpose:** Execute product catalog search across name, SKU, description, category, and brand (`FR-SEARCH-001`). Log query to `search_logs` for zero-result detection (`BR-010`).
* **Authentication:** Public
* **Supported MVP Query Parameters:**
  * `q` (`string`, required query term)
  * `categoryId` (`uuid`, optional)
  * `brandId` (`uuid`, optional)
  * `minPrice` (`decimal`, optional)
  * `maxPrice` (`decimal`, optional)
  * `latitude` / `longitude` / `radiusKm` (`decimal`, optional location filter)
  * `sortBy` (`string`: `relevance`, `priceAsc`, `priceDesc`, `rating`, default: `relevance`)
  * `page` (`int`, default: 1)
  * `pageSize` (`int`, default: 20)
* **Search Architecture Note:** Search operations execute against `products`, `categories`, and `brands` using PostgreSQL full-text search. `search_logs` supports analytics, zero-result analysis and suggestions; it is NOT the product search index engine. AI semantic search and `pgvector` are excluded from MVP.

#### `GET /api/v1/search/suggestions`
* **Purpose:** Fast search term auto-complete suggestions based on prefix (`FR-SEARCH-002`).
* **Authentication:** Public
* **Query Parameters:** `?prefix=mil` (Client debounce ~300ms).

---

## 10. Vendor API Contracts

All vendor operational endpoints require `Vendor` role and enforce vendor tenant data isolation (`BR-002`, `NFR-SEC-003`).

### 10.1 Store Profile Management

#### `GET /api/v1/vendor/store-profile` & `PUT /api/v1/vendor/store-profile`
* **Purpose:** Retrieve or update vendor storefront profile, banner/logo URL, description, and operating hours (`FR-VEND-004`).
* **Authentication:** Required (`Vendor` role)

---

### 10.2 Product Catalog Management

#### `GET /api/v1/vendor/products`
* **Purpose:** List catalog products owned by authenticated vendor (`FR-VEND-005`, `BR-002`).
* **Authentication:** Required (`Vendor` role)

#### `POST /api/v1/vendor/products`
* **Purpose:** Create new catalog product owned by vendor (`FR-PROD-001`, `BR-002`).
* **Authentication:** Required (`Vendor` role)
* **Request Body:**
  ```json
  {
    "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66a999",
    "brandId": "3fa85f64-5717-4562-b3fc-2c963f66b888",
    "name": "Organic Cheddar Cheese 250g",
    "description": "Aged sharp cheddar cheese made from organic cow milk.",
    "sku": "CHEESE-CHD-250",
    "price": 6.50,
    "discountPrice": 5.99,
    "status": "Active", // Draft, Active, Inactive, OutOfStock, Suspended
    "initialQuantity": 50,
    "lowStockThreshold": 10,
    "imageUrls": [
      {
        "imageUrl": "https://res.cloudinary.com/localmart/image/upload/v1/cheese.jpg",
        "cloudinaryPublicId": "cheese_01",
        "isPrimary": true
      }
    ]
  }
  ```
* **Success Response:** `201 Created`

#### `PUT /api/v1/vendor/products/{id}` & `PUT /api/v1/vendor/products/{id}/status`
* **Purpose:** Update vendor product specifications or status using the approved vocabulary (`Draft`, `Active`, `Inactive`, `OutOfStock`, `Suspended`) (`FR-PROD-002`).

---

### 10.3 Inventory Management

#### `GET /api/v1/vendor/inventory` & `PUT /api/v1/vendor/inventory/{productId}`
* **Purpose:** View inventory counts or replenish available stock (`FR-INV-003`, `FR-INV-004`).
* **Authentication:** Required (`Vendor` role)

---

### 10.4 Vendor Order Fulfillment

#### `GET /api/v1/vendor/orders` & `GET /api/v1/vendor/orders/{id}`
* **Purpose:** List or view vendor split sub-orders (`vendor_orders WHERE vendor_id = @CurrentVendorId`) (`FR-ORDER-002`, `BR-002`, `BR-011`).

#### `PUT /api/v1/vendor/orders/{id}/status`
* **Purpose:** Update vendor sub-order fulfillment state (`FR-ORDER-003`).
* **Approved Vendor Order Lifecycle:** `Pending` -> `Confirmed` -> `Preparing` -> `ReadyForPickup` -> `PickedUp` -> `OutForDelivery` -> `Delivered` (Exceptions: `Cancelled`, `Rejected`, `FailedDelivery`, `Refunded`).
* **Authentication:** Required (`Vendor` role)
* **Request Body:** `{"status": "Preparing"}` // Valid transitions: Confirmed, Preparing, ReadyForPickup
* **Success Response:** `200 OK`

---

## 11. Admin API Contracts

All administrative endpoints require `Administrator` role (`BR-007`).

### 11.1 Vendor Application Moderation

#### `GET /api/v1/admin/vendors/applications` & `GET /api/v1/admin/vendors/applications/{id}`
* **Purpose:** Inspect pending vendor onboarding applications and verification document metadata (`FR-VEND-002`, `BR-001`, `AF-004`).

#### `POST /api/v1/admin/vendors/applications/{id}/approve`
* **Purpose:** Approve vendor application. Generates active `vendors` record (`UNIQUE(application_id)`) and `store_profiles` (`BR-001`, `AF-005`).
* **Authentication:** Required (`Administrator` role, `vendors.approve` permission)
* **Request Body:** `{"commissionRate": 10.00}` // Illustrative admin-input sample; rate policy and financial calculation base remain deferred
* **Success Response:** `200 OK`

#### `POST /api/v1/admin/vendors/applications/{id}/reject`
* **Purpose:** Reject vendor application with reason (`AF-005`).

#### `PUT /api/v1/admin/vendors/{id}/status`
* **Purpose:** Suspend or reactivate vendor account (`BR-015`). Setting status to `Suspended` hides vendor products from search (`BR-012`).

---

### 11.2 Catalog Moderation & System Management

#### `PUT /api/v1/admin/products/{id}/status`
* **Purpose:** Admin moderation of catalog products (`Suspended`, `Inactive`) (`FR-PROD-003`).

#### `POST /api/v1/admin/categories` & `POST /api/v1/admin/brands`
* **Purpose:** Manage catalog categories and brands (`FR-PROD-003`).

---

### 11.3 Coupons, Commissions & Payouts

#### `GET /api/v1/admin/coupons` & `POST /api/v1/admin/coupons`
* **Purpose:** Manage promotional discount coupons (`BR-008`, `FR-COMM-001`).

#### `GET /api/v1/admin/commissions` & `GET /api/v1/admin/payouts` & `POST /api/v1/admin/payouts/process`
* **Purpose:** Audit commission ledger records (`BR-014`) and disburse vendor payouts (`FR-COMM-003`).

---

### 11.4 Search Analytics & Audit Logs

#### `GET /api/v1/admin/search-analytics` & `GET /api/v1/admin/audit-logs`
* **Purpose:** Inspect search logs (`BR-010`) and system security audit trail (`FR-AUDIT-001`).

---

## 12. Delivery Staff APIs

All delivery staff endpoints require `DeliveryStaff` role (`FR-DEL-001`).

#### `GET /api/v1/delivery/assignments` & `POST /api/v1/delivery/assignments/{id}/accept`
* **Purpose:** View assigned deliveries or accept assignment (`DF-001`, `DF-002`).

#### `POST /api/v1/delivery/assignments/{id}/pickup`
* **Purpose:** Confirm package pickup from vendor store (`DF-004`). Transitions status to `PickedUp`.
* **Approved Status Progression:**
  * `vendor_order.status`: `ReadyForPickup` -> `PickedUp` -> `OutForDelivery` -> `Delivered`.
  * `delivery.status`: `Ready` -> `Assigned` -> `PickedUp` -> `OutForDelivery` -> `Delivered`.
  * `delivery_assignment.assignment_status`: `Assigned` -> `Accepted` -> `Completed`.
* **Success Response:** `200 OK` `{"deliveryStatus": "PickedUp"}`

#### `POST /api/v1/delivery/assignments/{id}/complete`
* **Purpose:** Complete order delivery by verifying customer OTP code (`BR-013`, `FR-DEL-002`, `DF-006`).
* **Request Body:** `{"otpCode": "882194"}`
* **Success Response:** `200 OK` (Delivery status updated to `Delivered`).

---

## 13. Payment APIs

#### `POST /api/v1/payments/initiate`
* **Purpose:** Initiate online payment transaction reference for parent order (`BR-009`, `FR-PAY-001`).
* **Authentication:** Required (`Customer` role)
* **Request Body:** `{"parentOrderId": "uuid", "providerName": "Online"}` // Provider selection remains deferred

#### `POST /api/v1/payments/webhooks/confirm`
* **Purpose:** Provider-neutral payment confirmation webhook listener (`BR-009`, `FR-PAY-002`).
* **Authentication:** Gateway Signature Verification Header
* **Approved Business Payment Statuses:** `Pending`, `Processing`, `Paid`, `Failed`, `Refunded`.
* **Request Body:**
  ```json
  {
    "transactionReference": "tx_9988776655",
    "parentOrderId": "8fa85f64-5717-4562-b3fc-2c963f66b222",
    "status": "Paid",
    "amountCaptured": 45.00
  }
  ```
* **Success Response:** `200 OK`

#### `POST /api/v1/payments/refunds`
* **Purpose:** Process refund linked to parent payment and optional sub-order (`FR-PAY-004`).
* **Refund Ownership Rule:** If `vendorOrderId` is specified, it MUST belong to the parent order associated with `paymentId`. Cross-order refund references are strictly prohibited. Partial multi-vendor refund allocation mechanics remain deferred.

---

## 14. Coupon APIs

#### `POST /api/v1/coupons/validate`
* **Purpose:** Validate promo code eligibility, minimum order, expiry, and customer usage limits (`BR-008`).

---

## 15. Review APIs

#### `POST /api/v1/reviews` & `GET /api/v1/reviews/product/{productId}`
*(Detailed under Section 8.5).*

---

## 16. Notification APIs

#### `GET /api/v1/notifications` & `PUT /api/v1/notifications/{id}/read`
* **Purpose:** Retrieve persistent notification history or mark read state (`FR-NOTIF-001`).

---

## 17. Audit APIs

#### `GET /api/v1/admin/audit-logs`
*(Detailed under Section 11.4).*

---

## 18. Media APIs

#### `POST /api/v1/media/upload-signature`
* **Purpose:** Generate secure signed upload parameters/signature for direct client upload to the configured media provider (e.g. Cloudinary) (`FR-PROD-001`).
* **Authentication:** Required (`Vendor` or `Administrator` role)
* **Security Rule:** Endpoint returns upload signature tokens; API secrets are NEVER exposed.

---

## 19. Location APIs

#### `GET /api/v1/location/nearby-vendors`
* **Purpose:** Discover nearby vendor storefronts using latitude/longitude bounding box (`FR-LOC-001`).
* **Authentication:** Public
* **Query Parameters:** `?latitude=40.712776&longitude=-74.005974&radiusKm=10.0`
* **Deferred Infrastructure:** PostGIS spatial indexes, specific Maps API providers, and live driver GPS routing remain deferred.

---

## 20. Authorization Matrix

| Resource / Endpoint | Customer | Vendor | Admin | Delivery Staff | Public |
|---|---|---|---|---|---|
| `POST /api/v1/auth/customer/register` | — | — | — | — | **ALLOW** |
| `POST /api/v1/vendors/applications` | — | — | — | — | **ALLOW** |
| `GET /api/v1/products` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| `POST /api/v1/cart/items` | **ALLOW** | Denied | Denied | Denied | Denied |
| `POST /api/v1/orders` | **ALLOW** | Denied | Denied | Denied | Denied |
| `GET /api/v1/orders` | **Own Only** | Denied | All | Denied | Denied |
| `POST /api/v1/vendor/products` | Denied | **Own Store** | Admin Override | Denied | Denied |
| `GET /api/v1/vendor/orders` | Denied | **Own Split** | All | Denied | Denied |
| `POST /api/v1/admin/vendors/applications/{id}/approve` | Denied | Denied | **ALLOW** | Denied | Denied |
| `GET /api/v1/delivery/assignments` | Denied | Denied | All | **Assigned** | Denied |
| `POST /api/v1/reviews` | **Verified** | Denied | Moderation | Denied | Denied |

---

## 21. Pagination, Filtering & Sorting Standards

* **Standard Envelope:**
  ```json
  {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "totalCount": 100,
    "totalPages": 5
  }
  ```
* **Validation:** `page >= 1`, `pageSize` between 1 and 100 (Default: 20). Applied to pageable collections; small bounded lookups do not require pagination.

---

## 22. Error Response Contract (RFC 7807)

All non-2xx responses conform to **RFC 7807 Problem Details** (Technical/System Quality Convention) (`NFR-REL-001`):

```json
{
  "type": "https://localmart.com/errors/validation-error",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "Please refer to the errors property for additional details.",
  "instance": "/api/v1/cart/items",
  "traceId": "0HMVN87654321",
  "errors": {
    "quantity": ["Quantity must be greater than zero."],
    "productId": ["Requested product is out of stock."]
  }
}
```

---

## 23. Idempotency Specification

* **Header:** `Idempotency-Key: {UUID}`
* **Applicable Endpoints:** `POST /api/v1/orders`, `POST /api/v1/payments/initiate`, `POST /api/v1/payments/refunds`.
* **Behavior:** Standard `POST` requests without key execute normally. Requests supplying `Idempotency-Key` must not repeat the protected financial/order operation on duplicate submission. Idempotency key storage mechanism and retention policy are deferred technical decisions.

---

## 24. API Security Review

1. **JWT Signature & Rotation:** Access tokens expire in 15 minutes; refresh tokens persist securely (`NFR-SEC-002`).
2. **Tenant Data Isolation:** Vendor queries enforce `vendor_id` filter; Customer queries enforce `customer_id` filter (`BR-002`, `BR-003`).
3. **Sensitive Financial Protection:** Zero card numbers or CVV secrets are accepted or retained.
4. **Input Sanitization:** FluentValidation validates all DTOs before command execution (`NFR-MAINT-002`).

---

## 25. API Traceability Matrix

| API Endpoint | Business Rule(s) | SRS FR(s) | Formal Use Case(s) |
|---|---|---|---|
| `POST /api/v1/auth/customer/register` | — | `FR-AUTH-001` | `UC-CUST-001` |
| `POST /api/v1/vendors/applications` | `BR-001` | `FR-VEND-001` | `UC-VEND-001` |
| `POST /api/v1/admin/vendors/applications/{id}/approve` | `BR-001` | `FR-VEND-003` | `UC-ADMIN-003` |
| `GET /api/v1/products` | `BR-012` | `FR-PROD-004`, `FR-LOC-001` | `UC-CUST-003` |
| `POST /api/v1/cart/items` | `BR-005` | `FR-CART-001` | `UC-CUST-005` |
| `POST /api/v1/orders` | `BR-003`, `BR-005`, `BR-006`, `BR-008`, `BR-011` | `FR-ORDER-001` | `UC-CUST-008` |
| `POST /api/v1/payments/webhooks/confirm` | `BR-009` | `FR-PAY-002` | `UC-CUST-008` |
| `PUT /api/v1/vendor/orders/{id}/status` | `BR-002` | `FR-ORDER-003` | `UC-VEND-006` |
| `POST /api/v1/delivery/assignments/{id}/complete` | `BR-013` | `FR-DEL-002` | `UC-DEL-002` |
| `POST /api/v1/reviews` | `BR-004` | `FR-REVIEW-001` | `UC-CUST-010` |
| `GET /api/v1/search` | `BR-010` | `FR-SEARCH-001`, `FR-SEARCH-005` | `UC-CUST-003` |
| `GET /api/v1/admin/audit-logs` | `BR-007` | `FR-AUDIT-001` | `UC-ADMIN-006` |

---

## 26. Deferred Technical Decisions

The following technical implementation details remain explicitly deferred:
1. External payment provider selection (Stripe vs local gateway).
2. Maps API provider.
3. PostGIS spatial index/evaluation.
4. SignalR Redis backplane/scaling architecture.
5. Inventory hold timeout/background worker.
6. Password hashing algorithm parameters (`NFR-SEC-001`).
7. Commission calculation financial base.
8. Database connection pooling configuration.
9. Partial multi-vendor refund mechanics.
10. Vendor reapplication mechanics.
11. Jurisdiction-specific vendor verification rules.
12. PostgreSQL Row Level Security (RLS) policy mechanics.
13. Database deployment/replication topology.
14. Idempotency key storage/retention implementation.

---

## 27. Scope Protection Validation

The MVP API Contract explicitly excludes:
* AI semantic search (`pgvector`)
* AI recommendation engines
* Continuous driver live GPS streaming
* Multi-currency & crypto payments
* International shipping
* Multi-branch vendor management

---

## 28. Phase 06 Validation & Final Correction Notes

### 28.1 Applied Corrections & Audit Verification
1. **Vendor Application Credentials:** `applicantPassword` completely removed. Documented public application submission rules and pending application role boundaries (`BR-001`).
2. **Vendor Application Status Privacy:** Restricted status lookup to applicant context / reference + email combination. Sensitive details and documents are NEVER returned (`NFR-SEC-003`).
3. **Payment Method Terminology:** All occurrences of `OnlineGateway` replaced with `Online`. Approved payment methods are strictly `COD` and `Online`.
4. **Vendor Order Status Terminology:** Replaced all incorrect uses of `Processing` with `Preparing`. Approved lifecycle: `Pending`, `Confirmed`, `Preparing`, `ReadyForPickup`, `PickedUp`, `OutForDelivery`, `Delivered` (Exceptions: `Cancelled`, `Rejected`, `FailedDelivery`, `Refunded`).
5. **Delivery Status Terminology:** Replaced all uses of `InTransit` with `PickedUp` (pickup completion) or `OutForDelivery` (en route). Approved delivery lifecycle: `Ready`, `Assigned`, `PickedUp`, `OutForDelivery`, `Delivered` (Exception: `FailedDelivery`).
6. **Payment Status Terminology:** Replaced `Completed` with `Paid`. Approved payment statuses: `Pending`, `Processing`, `Paid`, `Failed`, `Refunded`.
7. **Canonical Admin Vendor Approval Endpoint:** Standardized ALL occurrences to `POST /api/v1/admin/vendors/applications/{id}/approve` (ZERO occurrences of `/admin/vendors/app/approve`).
8. **Product Status Terminology:** Standardized on `Draft`, `Active`, `Inactive`, `OutOfStock`, `Suspended`. ZERO occurrences of `Published` or `Archival` as product status.
9. **Public Product Visibility Rule:** Products visible/purchasable only when `vendors.status = 'Approved'`, `products.status = 'Active'`, and `inventories.quantity_available > 0`.
10. **Inventory Reservation Mechanics:** Preserved overselling prevention requirement (`BR-005`, `BR-006`) while explicitly marking exact reservation hold timing, locking, expiration, and cleanup as deferred technical decisions.
11. **Payment Fulfillment Protection:** Mandated that online payment orders remain `Pending` and MUST NOT enter vendor fulfillment (`Preparing`) until verified `Paid` webhook confirmation.
12. **Payment Provider Neutrality:** Provider names in requests labeled as configuration data; provider choice remains deferred.
13. **Refund Integrity:** Sub-order refunds validated to belong strictly to parent order associated with payment. Cross-order refunds prohibited.
14. **Commission Example Labeled:** `"commissionRate": 10.00` explicitly labeled as an illustrative admin input sample. Rate policy and financial calculation base remain deferred.
15. **Currency Neutrality:** Sample monetary values marked as illustrative. USD is NOT a fixed business requirement.
16. **Cloudinary Direct Upload Terminology:** Clarified as `signed upload parameters/signature for direct Cloudinary upload`. Secrets are NEVER exposed.
17. **Search Contract Completeness:** MVP search parameters explicitly listed (`q`, `categoryId`, `brandId`, `minPrice`, `maxPrice`, `latitude`, `longitude`, `radiusKm`, `sortBy`, `page`, `pageSize`). `search_logs` separate for analytics. AI/pgvector excluded.
18. **Location API Bounding Box:** Retained bounding box search while marking PostGIS, Maps API choice, and live GPS routing as deferred.
19. **Pagination Envelope Standard:** Standard envelope applied to pageable collections; bounded lookups do not force pagination.
20. **Idempotency Key Retention:** Added explicit deferred decision: "Idempotency key storage mechanism and retention policy are deferred technical decisions."
21. **RFC 7807 Classification:** Correctly classified as API/technical quality convention.
22. **SignalR Transport Classification:** Documented as current planned transport choice; Redis backplane remains deferred.
23. **Authorization Matrix Markdown Table:** Fully repaired with canonical endpoint and proper columns.
24. **Traceability Matrix Table:** Fully repaired with canonical endpoint and proper columns.
25. **Forbidden Term Audit:** Zero occurrences of `Published`, `Archival`, `Processing` (for VendorOrder status), `InTransit`, `Completed` (for Payment status), `OnlineGateway`, `applicantPassword`, or `/admin/vendors/app/approve`.

### 28.2 Confirmation of Zero Implementation Code
* **Code Changes:** `NONE` (Documentation correction pass only)
* **SQL / Migration Creation:** `NONE`
* **EF Core Entity Code:** `NONE`
* **OpenAPI File Generation:** `NONE`
* **Supabase / Frontend Code:** `NONE`

---

*End of Phase 06 — Final Consistency Pass API Contract Document.*
