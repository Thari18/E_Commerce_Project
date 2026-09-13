# LocalMart — Software Requirements Specification (SRS)

**Document Version:** 1.1 (Correction Pass Applied)  
**Status:** Approved SRS Baseline  
**Date:** September 12, 2026  
**Primary Source Document:** `LocalMart_BRD_v1.0(1).md`  
**Consolidated Reference:** `docs/BRD_BASELINE.md`  
**Project:** LocalMart — Location-Aware Multi-Vendor E-Commerce Marketplace  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the functional, non-functional, security, data, and behavioral software requirements for **LocalMart**, a location-aware, multi-vendor e-commerce marketplace. The document translates business requirements defined in the primary source document ([`LocalMart_BRD_v1.0(1).md`](file:///d:/new%20e%20commers/LocalMart_BRD_v1.0%281%29.md)) and consolidated in [`docs/BRD_BASELINE.md`](file:///d:/new%20e%20commers/docs/BRD_BASELINE.md) into precise, testable software specifications for design, development, and testing phases.

### 1.2 Scope
LocalMart provides a digital platform connecting local brick-and-mortar retail businesses with nearby customers. The software system encompasses:
* Customer registration, catalog browsing, location-aware search, search suggestions with debounce, shopping cart management, address book, multi-vendor order checkout, payment integration (COD & Online payment gateway), order status tracking, and product reviews.
* Vendor application onboarding, business verification information submission, store profile management, catalog management, inventory tracking, vendor-isolated order fulfillment, and sales analytics.
* Delivery staff authentication, assignment viewing, pickup, and status updates (`Picked Up`, `Out for Delivery`, `Delivered`).
* Administrator supervision including vendor onboarding approval, product moderation, category/brand CRUD, commission configuration, coupon management, review moderation, search analytics, and audit logging.

### 1.3 Project Overview
LocalMart is engineered as a modern, decoupled web application using an Angular frontend, an ASP.NET Core Web API (.NET 8) backend implementing Clean Architecture and CQRS, and Supabase managed PostgreSQL infrastructure. 

### 1.4 Intended Audience
This SRS is intended for:
* **System Architects & Lead Developers:** To guide high-level and low-level software architecture, data modeling, API contract definition, and system module implementation.
* **Quality Assurance & Test Engineers:** To author test cases, test matrices, and automated validation suites based on verifiable functional (FR) and non-functional (NFR) requirement IDs.
* **Project Managers & Business Analysts:** To verify requirement traceability and enforce MVP boundaries.

### 1.5 Definitions, Acronyms, and Abbreviations
| Term / Acronym | Definition |
|---|---|
| **BRD** | Business Requirements Document |
| **SRS** | Software Requirements Specification |
| **MVP** | Minimum Viable Product |
| **CQRS** | Command Query Responsibility Segregation |
| **RBAC** | Role-Based Access Control |
| **SKU** | Stock Keeping Unit |
| **COD** | Cash on Delivery |
| **JWT** | JSON Web Token |
| **NFR** | Non-Functional Requirement |
| **FR** | Functional Requirement |

### 1.6 References
1. Primary Source of Truth: [`LocalMart_BRD_v1.0(1).md`](file:///d:/new%20e%20commers/LocalMart_BRD_v1.0%281%29.md)
2. Baseline Reference Document: [`docs/BRD_BASELINE.md`](file:///d:/new%20e%20commers/docs/BRD_BASELINE.md)

---

## 2. Product Overview

### 2.1 Marketplace Concept & High-Level Architecture
LocalMart is a hyperlocal e-commerce ecosystem designed to bridge physical retail stores with digital shoppers. The system employs a decoupled, service-oriented web architecture:
* **Frontend Layer:** Angular (v17+) application built with TypeScript, Tailwind CSS, Angular Signals for reactive UI state, and RxJS for stream handling.
* **Backend Application API Layer:** ASP.NET Core Web API (.NET 8) using C#, structured under Clean Architecture principles with CQRS (MediatR), FluentValidation, and EF Core.
* **Database & Infrastructure Layer:** Supabase managed PostgreSQL.
  > **ARCHITECTURAL REQUIREMENT:** Supabase serves exclusively as the managed database and storage infrastructure provider. The ASP.NET Core Web API remains the central business logic and authorization engine.
* **External Services:** Cloudinary (media storage & transformation), Payment Gateways (Stripe / suitable local gateway), Maps API (Geocoding & distance calculations), and SignalR (real-time notifications).

### 2.2 User Roles Overview
1. **Customer:** End-user purchasing products from local vendors via public self-registration.
2. **Vendor:** Local merchant submitting a business application for marketplace onboarding.
3. **Delivery Staff:** Operational worker accessing system via authorized account provisioning.
4. **Marketplace Administrator:** Governance role managing platform rules and administrative account provisioning.

### 2.3 MVP Boundary Summary
The MVP release focuses on establishing the complete core commerce loop: customer registration, vendor application/approval, product catalog management, location-aware search, multi-vendor cart checkout, order splitting, COD/Online payment processing, delivery status workflow, product reviews, and basic admin oversight. Future features (AI search, recommendations, multi-branch, mobile apps, live driver GPS) are explicitly deferred.

---

## 3. User Roles & Permission Matrix

### 3.1 Role Capabilities & Access Control
| User Role | Account Provisioning | Accessible Systems & Views | Authorized Data Actions | Unauthorized Actions |
|---|---|---|---|---|
| **Customer** | Public Self-Registration | Public Storefront, Search, Cart, Checkout, Address Book, Customer Orders, Wishlist, Notifications. | Create/Edit own profile & addresses, manage own cart/wishlist, place orders, view own order tracking, submit reviews for delivered items. | Access vendor dashboard, process orders, access administrative APIs, view other customers' orders or data. |
| **Vendor** | Vendor Application Submission | Vendor Onboarding View, Application Status, Vendor Dashboard, Store Profile, Catalog, Inventory, Vendor Orders, Analytics. | Update own store profile, create/edit own products & images, view current inventory, process own assigned vendor orders (`#1000-A`). | Modify products of other vendors, view order details of other vendors in a multi-vendor cart, approve vendor applications, modify global commission settings. |
| **Delivery Staff** | Authorized Provisioning | Delivery Staff Login, Assigned Deliveries List, Delivery Detail View, Delivery History. | View assigned delivery details (customer address, phone, vendor pickup point), update order delivery status (`Picked Up`, `Out for Delivery`, `Delivered`). | Access store inventory, alter product prices, view vendor payouts, modify customer cart or payment parameters. |
| **Administrator** | Controlled Provisioning | Admin Dashboard, Vendor Verification Queue, Category/Brand Management, Product Moderation, Order/Payment Monitor, Commission & Coupon Setup, Review Moderation, Search Analytics, Audit Logs. | Approve/Reject/Suspend vendors, create/edit categories & brands, suspend non-compliant products, configure platform commission rates, moderate reviews, inspect system audit logs. | Place customer orders via admin identity, alter payment provider credentials directly inside API databases. |

---

## 4. System Functional Requirements

### 4.1 Module Functional Requirements Index
Functional requirements are uniquely identified using structured codes:
`FR-AUTH-*`, `FR-CUST-*`, `FR-VEND-*`, `FR-ADMIN-*`, `FR-PROD-*`, `FR-SEARCH-*`, `FR-CART-*`, `FR-ORDER-*`, `FR-PAY-*`, `FR-DEL-*`, `FR-REVIEW-*`, `FR-NOTIF-*`, `FR-COMM-*`.

---

## 5. Authentication & Authorization Requirements (`FR-AUTH-*`)

#### `FR-AUTH-001`
**Requirement:** The system shall support authentication using email and password for all authorized user types while distinguishing account creation mechanisms according to user role:
* **Customers:** Public self-registration and personal account management.
* **Vendors:** Public vendor application submission and onboarding tracking (`Pending → Under Review → Approved / Rejected / Suspended`).
* **Delivery Staff:** Authentication and access via authorized operational account provisioning.
* **Administrators:** Authentication and access via controlled, secure administrative account provisioning.  
**Priority:** MVP  
**Source:** BRD Section 9, Section 10.1, Section 33; Baseline Section 2.1, Section 12  

#### `FR-AUTH-002`
**Requirement:** The system shall enforce strong password security policies (minimum 8 characters, requiring uppercase, lowercase, numbers, and special characters) and hash user passwords using strong, industry-standard password hashing algorithms. Candidate implementation options (such as BCrypt or ASP.NET Core Identity PasswordHasher) shall be evaluated and finalized during technical security design.  
**Priority:** MVP  
**Source:** BRD Section 33, Section 46; Baseline Section 12  

#### `FR-AUTH-003`
**Requirement:** Upon successful authentication, the system shall issue stateless JWT access tokens for authorization alongside HTTP-only Refresh Tokens for session maintenance.  
**Priority:** MVP  
**Source:** BRD Section 33, Section 36.1; Baseline Section 12  

#### `FR-AUTH-004`
**Requirement:** The system shall enforce Role-Based Access Control (RBAC) and Permission-based authorization middleware on all protected API endpoints (`/api/v1/*`).  
**Priority:** MVP  
**Source:** BRD Section 33, Section 35 (BR-002, BR-003, BR-007); Baseline Section 12  

#### `FR-AUTH-005`
**Requirement:** The system shall provide a token revocation/logout mechanism that invalidates active refresh tokens upon user request.  
**Priority:** MVP  
**Source:** BRD Section 33, Section 36.1  

---

## 6. Customer Functional Requirements (`FR-CUST-*`)

#### `FR-CUST-001`
**Requirement:** The system shall enable customers to manage multiple delivery addresses including recipient name, phone number, address line, city, district, postal code, delivery notes, and latitude/longitude coordinates.  
**Priority:** MVP  
**Source:** BRD Section 21; Baseline Section 3  

#### `FR-CUST-002`
**Requirement:** The system shall allow customers to mark one delivery address as their default delivery address.  
**Priority:** MVP  
**Source:** BRD Section 21  

#### `FR-CUST-003`
**Requirement:** The system shall provide customers with a personal wishlist to save favorite products, view availability status, and transfer items into their active shopping cart.  
**Priority:** MVP  
**Source:** BRD Section 20; Baseline Section 3  

#### `FR-CUST-004`
**Requirement:** The system shall allow customers to view their complete order history and track the status of active main orders and vendor delivery updates.  
**Priority:** MVP  
**Source:** BRD Section 24; Baseline Section 5  

#### `FR-CUST-005`
**Requirement:** The system shall allow customers to cancel eligible pending orders prior to vendor order confirmation.  
**Priority:** MVP  
**Source:** BRD Section 4.1, Section 24.2  

---

## 7. Vendor Functional Requirements (`FR-VEND-*`)

#### `FR-VEND-001`
**Requirement:** The system shall provide a dedicated vendor registration portal collecting owner contact details, business identity, physical street address, city, district, latitude/longitude location, business verification information, store profile details (logo/cover image URLs, description, operating hours, social links), payout configuration references, and terms acceptance. Detailed verification document requirements and jurisdiction-specific rules remain deferred to technical design (Section 27).  
**Priority:** MVP  
**Source:** BRD Section 10.1; Baseline Section 4.1  

#### `FR-VEND-002`
**Requirement:** The system shall enforce the vendor lifecycle states: `Pending → Under Review → Approved / Rejected / Suspended`.  
**Priority:** MVP  
**Source:** BRD Section 10.2; Baseline Section 4.2  

#### `FR-VEND-003`
**Requirement:** System Enforced Rule (BR-001): The system shall strictly prevent a vendor from selling products or receiving customer orders until their vendor application account is Approved and Active.  
**Priority:** MVP  
**Source:** BRD Section 10.2, Section 35 (BR-001); Baseline Section 4.2  

#### `FR-VEND-004`
**Requirement:** System Enforced Rule (BR-002): The system shall enforce rigid vendor data isolation, ensuring vendors can access and modify only their own store profile, catalog, inventory, vendor-specific orders (`VendorOrders`), reviews, and payout records.  
**Priority:** MVP  
**Source:** BRD Section 35 (BR-002); Baseline Section 6.1  

#### `FR-VEND-005`
**Requirement:** The system shall allow vendors to manage their public store profile including logo, cover photo, description, operating hours, store contact details, and social links.  
**Priority:** MVP  
**Source:** BRD Section 11; Baseline Section 4.1  

#### `FR-VEND-006`
**Requirement:** The system shall provide vendors with an operational dashboard displaying total sales revenue, total order count, pending order queue, low-stock product alerts, pending payouts, and store rating average.  
**Priority:** MVP  
**Source:** BRD Section 30; Baseline Section 2.2  

---

## 8. Product & Catalog Requirements (`FR-PROD-*`)

#### `FR-PROD-001`
**Requirement:** The system shall allow approved vendors to create, edit, and manage products with attributes: Name, SKU, Short/Long Description, Category, Brand, Base Price, Discount Price/Percentage, Available Quantity, Low-Stock Threshold, Images, and Status.  
**Priority:** MVP  
**Source:** BRD Section 12; Baseline Section 7.1  

#### `FR-PROD-002`
**Requirement:** The system shall enforce product lifecycle states: `Draft`, `Active`, `Inactive`, `Out of Stock`, `Suspended`.  
**Priority:** MVP  
**Source:** BRD Section 12.1; Baseline Section 7.1  

#### `FR-PROD-003`
**Requirement:** System Enforced Rule (BR-012): The system shall ensure that only active products belonging to approved and active vendors are visible for public purchase on the marketplace.  
**Priority:** MVP  
**Source:** BRD Section 12.1, Section 35 (BR-012); Baseline Section 7.2  

#### `FR-PROD-004`
**Requirement:** The system shall integrate with Cloudinary for vendor media uploads, supporting multiple product images, primary image designation, vendor logos, and cover photo validation/optimization.  
**Priority:** MVP  
**Source:** BRD Section 13, Section 38.4; Baseline Section 3  

---

## 9. Search & Discovery Requirements (`FR-SEARCH-*`)

#### `FR-SEARCH-001`
**Requirement:** The system shall provide product search querying product name, SKU, brand name, category name, and keyword descriptions.  
**Priority:** MVP  
**Source:** BRD Section 16.1; Baseline Section 8.1  

#### `FR-SEARCH-002`
**Requirement:** The system shall support catalog search filtering (by category, price range, brand, rating, discount percentage, availability, and location distance) and sorting (by relevance, price low-to-high, price high-to-low, rating, newest, and proximity).  
**Priority:** MVP  
**Source:** BRD Section 16.2, Section 16.3; Baseline Section 8.1  

#### `FR-SEARCH-003`
**Requirement:** The system shall provide a search suggestions API endpoint (`GET /api/v1/search/suggestions?prefix={term}`) returning matching terms.  
**Priority:** MVP  
**Source:** BRD Section 17.2; Baseline Section 8.2  

#### `FR-SEARCH-004`
**Requirement:** The frontend application shall enforce an approximate **300ms debounce delay** on search suggestion inputs before triggering backend API requests.  
**Priority:** MVP  
**Source:** BRD Section 17.3; Baseline Section 8.2  

#### `FR-SEARCH-005`
**Requirement:** System Enforced Rule (BR-010): The system shall record valid customer search queries into a `search_logs` table (capturing `user_id` [nullable], `search_term`, and `searched_at`) and log queries yielding zero results for administrative analytics.  
**Priority:** MVP  
**Source:** BRD Section 17.1, Section 18, Section 35 (BR-010); Baseline Section 8.2  

---

## 10. Inventory Requirements (`FR-INV-*`)

#### `FR-INV-001`
**Requirement:** System Enforced Rule (BR-005): The system shall validate available inventory stock before confirming any customer order.  
**Priority:** MVP  
**Source:** BRD Section 14, Section 35 (BR-005); Baseline Section 7.2  

#### `FR-INV-002`
**Requirement:** System Enforced Rule (BR-006): The system shall prevent overselling and support inventory stock reservation where required during the checkout and order fulfillment lifecycle.  
**Design Note on Deferred Mechanics:** Specific inventory reservation lifecycle mechanics (including exact reservation window timing, automatic reservation release timeouts, transactional locking strategies, background cleanup mechanisms, and concurrency control implementations) are explicitly deferred to later Database Design, System Architecture (HLD), and Low-Level Design (LLD) phases rather than permanently locked SRS business rules.  
**Priority:** MVP  
**Source:** BRD Section 14, Section 35 (BR-006); Baseline Section 7.2  

#### `FR-INV-003`
**Requirement:** The system shall record inventory adjustments and movements in an `InventoryMovements` log capturing change quantity, reason, order reference, and timestamp.  
**Priority:** MVP  
**Source:** BRD Section 14; Baseline Section 7.1  

#### `FR-INV-004`
**Requirement:** The system shall generate low-stock alert notifications to vendors when a product's available stock falls at or below its defined low-stock threshold.  
**Priority:** MVP  
**Source:** BRD Section 14, Section 29.2; Baseline Section 3  

---

## 11. Cart & Checkout Requirements (`FR-CART-*`)

#### `FR-CART-001`
**Requirement:** The system shall allow customers to add products from multiple distinct vendors into a single unified shopping cart.  
**Priority:** MVP  
**Source:** BRD Section 15; Baseline Section 6.1  

#### `FR-CART-002`
**Requirement:** The system shall visually group cart items by vendor and display item subtotals, vendor-specific shipping fees, valid coupon discounts, and overall cart total.  
**Priority:** MVP  
**Source:** BRD Section 15, Section 19; Baseline Section 3  

#### `FR-CART-003`
**Requirement:** During checkout, the system shall revalidate product stock availability, product prices, active discounts, coupon eligibility, and delivery address coverage prior to final order confirmation.  
**Priority:** MVP  
**Source:** BRD Section 19, Section 22; Baseline Section 3  

---

## 12. Order Management Requirements (`FR-ORDER-*`)

#### `FR-ORDER-001`
**Requirement:** System Enforced Rule (BR-011): When a customer completes checkout containing products from multiple vendors, the system shall create one parent/main `Order` record and automatically split the purchase into distinct child `VendorOrder` records for each respective vendor.  
**Priority:** MVP  
**Source:** BRD Section 15, Section 35 (BR-011); Baseline Section 6.1  

#### `FR-ORDER-002`
**Requirement:** The system shall enforce the main order and vendor order status workflow transitions: `Pending → Confirmed → Preparing → Ready for Pickup → Picked Up → Out for Delivery → Delivered`.  
**Priority:** MVP  
**Source:** BRD Section 24.1; Baseline Section 10.1  

#### `FR-ORDER-003`
**Requirement:** The system shall support order exception statuses: `Cancelled`, `Rejected`, `Failed Delivery`, `Refunded`.  
**Priority:** MVP  
**Source:** BRD Section 24.2; Baseline Section 10.1  

#### `FR-ORDER-004`
**Requirement:** System Enforced Rule (BR-003): The system shall restrict customers to viewing only their own placed orders and tracking data.  
**Priority:** MVP  
**Source:** BRD Section 35 (BR-003); Baseline Section 6.1  

---

## 13. Payment Requirements (`FR-PAY-*`)

#### `FR-PAY-001`
**Requirement:** The system shall support Cash on Delivery (COD) and selected online payment gateway integration (Stripe or suitable regional/local payment gateway).  
**Priority:** MVP  
**Source:** BRD Section 23, Section 38.5; Baseline Section 9.1  

#### `FR-PAY-002`
**Requirement:** System Enforced Rule (BR-009): The system shall mark an online order as successfully paid only upon receiving verified cryptographic webhook/callback confirmation from the payment provider.  
**Priority:** MVP  
**Source:** BRD Section 23, Section 35 (BR-009); Baseline Section 9.1  

#### `FR-PAY-003`
**Requirement:** The system shall track payment lifecycle states: `Pending → Processing → Paid / Failed → Refunded`.  
**Priority:** MVP  
**Source:** BRD Section 23; Baseline Section 9.1  

#### `FR-PAY-004`
**Requirement:** Security Rule: The system shall NOT collect or store raw payment card numbers, CVVs, or sensitive financial account credentials within the application database.  
**Priority:** MVP  
**Source:** BRD Section 10.1, Section 23; Baseline Section 9.1  

---

## 14. Delivery Staff Requirements (`FR-DEL-*`)

#### `FR-DEL-001`
**Requirement:** The system shall allow authorized delivery staff to log in and view a queue of order delivery assignments marked `Ready for Pickup`.  
**Priority:** MVP  
**Source:** BRD Section 6.4, Section 25; Baseline Section 2.3  

#### `FR-DEL-002`
**Requirement:** The system shall allow delivery staff to view customer delivery address, contact name, phone number, vendor pickup location, and delivery instructions for their assigned orders.  
**Priority:** MVP  
**Source:** BRD Section 25; Baseline Section 2.3  

#### `FR-DEL-003`
**Requirement:** System Enforced Rule (BR-013): Only authorized delivery staff or automated delivery handlers shall be permitted to update delivery statuses (`Picked Up`, `Out for Delivery`, `Delivered`, `Failed Delivery`).  
**Priority:** MVP  
**Source:** BRD Section 25, Section 35 (BR-013); Baseline Section 10.2  

---

## 15. Reviews & Ratings Requirements (`FR-REVIEW-*`)

#### `FR-REVIEW-001`
**Requirement:** System Enforced Rule (BR-004): The system shall permit a customer to submit a product star rating (1-5) and written review ONLY after the customer has completed a purchase of that product and the order status is `Delivered`.  
**Priority:** MVP  
**Source:** BRD Section 26, Section 35 (BR-004); Baseline Section 11  

#### `FR-REVIEW-002`
**Requirement:** The system shall compute aggregate rating scores and review counts for products and vendor stores.  
**Priority:** MVP  
**Source:** BRD Section 26; Baseline Section 11  

#### `FR-REVIEW-003`
**Requirement:** The system shall provide administrators with review moderation tools to flag, hide, or delete inappropriate review entries.  
**Priority:** MVP  
**Source:** BRD Section 26; Baseline Section 11  

---

## 16. Coupon, Commission & Payout Requirements (`FR-COMM-*`)

#### `FR-COMM-001`
**Requirement:** System Enforced Rule (BR-008): The system shall validate promotional coupons against expiration date, total usage limit, per-customer usage cap, minimum order spend, maximum discount cap, and vendor/category scope restrictions before applying discounts to a cart.  
**Priority:** MVP  
**Source:** BRD Section 27, Section 35 (BR-008); Baseline Section 3  

#### `FR-COMM-002`
**Requirement:** System Enforced Rule (BR-014): The system shall calculate platform commission on completed vendor orders based on active marketplace commission rules ($\text{Vendor Payable} = \text{Product Sale} - \text{Commission}$).  
**Priority:** MVP  
**Source:** BRD Section 28, Section 35 (BR-014); Baseline Section 9.2  

#### `FR-COMM-003`
**Requirement:** The system shall maintain vendor payout ledgers tracking historical payouts, pending payout amounts, payout status (`Pending`, `Processing`, `Paid`), and provider references.  
**Priority:** MVP  
**Source:** BRD Section 28; Baseline Section 9.2  

---

## 17. Admin Governance & Management Requirements (`FR-ADMIN-*`)

#### `FR-ADMIN-001`
**Requirement:** The system shall provide administrators with a vendor verification dashboard to inspect registration details, review submitted verification information, and execute state transitions (`Approve`, `Reject`, `Suspend`).  
**Priority:** MVP  
**Source:** BRD Section 10.2, Section 31; Baseline Section 2.4  

#### `FR-ADMIN-002`
**Requirement:** System Enforced Rule (BR-015): The system shall allow admins to suspend non-compliant vendors, immediately disabling their public store visibility, product listings, and order processing capabilities.  
**Priority:** MVP  
**Source:** BRD Section 35 (BR-015); Baseline Section 4.2  

#### `FR-ADMIN-003`
**Requirement:** The system shall allow admins to perform CRUD operations on categories and brands, manage catalog moderation, configure platform commission percentages, set up global coupons, view search analytics, and inspect audit logs.  
**Priority:** MVP  
**Source:** BRD Section 31; Baseline Section 2.4  

---

## 18. Real-Time Notification Requirements (`FR-NOTIF-*`)

#### `FR-NOTIF-001`
**Requirement:** The system shall utilize SignalR real-time hubs to push notifications for critical business events:
* **Customer:** Order status updates (`Confirmed`, `Preparing`, `Out for Delivery`, `Delivered`), payment status updates.
* **Vendor:** New vendor order placed, order cancellation alerts, low-stock threshold triggers, vendor application approval/rejection.
* **Delivery Staff:** New delivery assignment, assignment cancellation.
* **Admin:** New vendor application submitted, payment issue alert.  
**Priority:** MVP  
**Source:** BRD Section 29, Section 38.8; Baseline Section 3  

---

## 19. Location-Aware Requirements (`FR-LOC-*`)

#### `FR-LOC-001`
**Requirement:** The system shall store latitude and longitude geographical coordinates for vendor store profiles and customer delivery addresses.  
**Priority:** MVP  
**Source:** BRD Section 10.1, Section 21, Section 32; Baseline Section 4.1  

#### `FR-LOC-002`
**Requirement:** The system shall perform distance calculations (e.g., Haversine formula) to filter and rank nearby vendors and products based on customer location proximity.  
**Priority:** MVP  
**Source:** BRD Section 32, Section 38.7; Baseline Section 3  

---

## 20. Audit & Logging Requirements (`FR-AUDIT-*`)

#### `FR-AUDIT-001`
**Requirement:** System Enforced Rule (BR-007, BR-010): The system shall log administrative and sensitive operational actions into an `AuditLogs` table capturing actor ID, action type, target entity ID, old/new values, timestamp, and IP address.  
**Priority:** MVP  
**Source:** BRD Section 34; Baseline Section 12  

---

## 21. Non-Functional Requirements (NFRs)

### 21.1 Performance (`NFR-PERF-*`)
* **`NFR-PERF-001` (BRD Baseline Requirement):** Frontend UI search input fields shall enforce an approximate **300ms debounce delay** prior to issuing search suggestion API requests to prevent server flooding.
* **`NFR-PERF-002` (Proposed Technical Target):** Search suggestion API endpoints (`GET /api/v1/search/suggestions`) should aim for a proposed technical response benchmark of $\le 200\text{ ms}$ under normal operational load (to be validated during technical performance testing).
* **`NFR-PERF-003` (Proposed Technical Target):** Paginated catalog browsing API endpoints should aim for a proposed technical response benchmark of $\le 500\text{ ms}$ (to be validated during technical performance testing).

### 21.2 Security (`NFR-SEC-*`)
* **`NFR-SEC-001`:** User passwords must be hashed using strong, industry-standard password hashing algorithms (candidate implementation technologies such as BCrypt or ASP.NET Core Identity PasswordHasher to be finalized in technical security design).
* **`NFR-SEC-002`:** All protected endpoints must validate JWT access tokens; session refresh must require HTTP-only secure refresh tokens.
* **`NFR-SEC-003`:** Strict vendor data isolation must be enforced at API and database query levels.
* **`NFR-SEC-004`:** Application secrets and connection strings must be injected via environment configuration outside source control.

### 21.3 Scalability (`NFR-SCAL-*`)
* **`NFR-SCAL-001`:** The backend architecture (ASP.NET Core Web API with CQRS) shall support horizontal stateless scaling behind a load balancer.
* **`NFR-SCAL-002`:** PostgreSQL database tables must maintain index coverage on primary lookups (`sku`, `vendor_id`, `category_id`, `lat`/`long`).

### 21.4 Availability & Reliability (`NFR-AVAIL-*`, `NFR-REL-*`)
* **`NFR-AVAIL-001` (System Engineering Requirement):** The Web API shall expose a `/health` endpoint reporting database and external infrastructure connectivity health.
* **`NFR-REL-001` (System Engineering Requirement):** Global exception middleware shall catch unhandled errors, record structured logs, and return standardized RFC-7807 problem details responses without leaking internal stack traces.

### 21.5 Maintainability & System Quality (`NFR-MAINT-*`)
* **`NFR-MAINT-001` (System Engineering Requirement):** The backend application shall adhere to Clean Architecture separation (Domain, Application, Infrastructure, WebAPI) and utilize a structured logging framework (candidate library such as Serilog to be finalized in technical design).
* **`NFR-MAINT-002` (System Engineering Requirement):** All command/query inputs shall be validated using FluentValidation before handler execution.

### 21.6 Usability (`NFR-USA-*`)
* **`NFR-USA-001`:** The Angular frontend shall be responsive and usable across mobile, tablet, and desktop viewports.

---

## 22. Logical Data Model & Entity Specifications

The SRS specifies logical data entities. Physical ERD and DDL scripts belong to the Database Design Phase.

```text
Identity & Access Domain
 ├── Users (Id, Email, PasswordHash, Phone, Role, IsActive, CreatedAt)
 ├── Roles (Id, RoleName)
 ├── Permissions (Id, PermissionName)
 ├── UserRoles / RolePermissions
 └── RefreshTokens (Id, UserId, Token, Expiry, RevokedAt)

Customer & Vendor Domain
 ├── Customers (Id, UserId, FullName, DefaultAddressId)
 ├── Vendors (Id, UserId, StoreName, BusinessType, CategoryId, Status, CommissionRate)
 ├── VendorApplications (Id, VendorId, BusinessDetails, VerificationDocs, Status, AdminNotes)
 ├── Addresses (Id, CustomerId, RecipientName, Phone, AddressLine, City, District, PostalCode, Lat, Long)
 └── StoreProfiles (Id, VendorId, LogoUrl, CoverUrl, Description, OpeningHours, Lat, Long, RatingAvg)

Catalog & Inventory Domain
 ├── Categories (Id, CategoryName, ParentCategoryId)
 ├── Brands (Id, BrandName)
 ├── Products (Id, VendorId, CategoryId, BrandId, Name, SKU, Price, Discount, Status, StockQty, LowStockThreshold)
 ├── ProductImages (Id, ProductId, ImageUrl, IsPrimary)
 ├── Inventory (Id, ProductId, PhysicalStock, ReservedStock)
 └── InventoryMovements (Id, ProductId, ChangeQty, MovementType, ReferenceId, CreatedAt)

Shopping & Order Domain
 ├── Carts (Id, CustomerId, UpdatedAt)
 ├── CartItems (Id, CartId, ProductId, VendorId, Quantity, UnitPrice)
 ├── Wishlists / WishlistItems
 ├── Orders [Main] (Id, OrderNumber, CustomerId, TotalAmount, PaymentMethod, Status, DeliveryAddress, CreatedAt)
 ├── VendorOrders [Child] (Id, MainOrderId, VendorId, VendorOrderNumber, SubTotal, CommissionAmount, VendorPayable, Status)
 └── OrderItems (Id, VendorOrderId, ProductId, Quantity, UnitPrice, LineTotal)

Payment & Delivery Domain
 ├── Payments (Id, MainOrderId, Amount, PaymentProvider, TransactionRef, Status, WebhookVerified)
 ├── Refunds (Id, PaymentId, Amount, Reason, Status)
 ├── Deliveries (Id, VendorOrderId, DeliveryStaffId, Status, PickupTime, DeliveredTime)
 └── DeliveryAssignments (Id, DeliveryId, AssignedAt, Status)

Promotions, Reviews & Governance Domain
 ├── Coupons (Id, Code, DiscountType, Value, MinSpend, MaxDiscount, ExpiryDate, UsageLimit, Scope)
 ├── Commissions (Id, ScopeType, ScopeId, Percentage)
 ├── Payouts (Id, VendorId, Amount, Status, TransactionRef, ProcessedAt)
 ├── Reviews (Id, ProductId, VendorId, CustomerId, OrderId, Rating, Comment, Status)
 ├── SearchLogs (Id, UserId, SearchTerm, ResultCount, SearchedAt)
 └── AuditLogs (Id, ActorUserId, Action, EntityName, EntityId, OldValues, NewValues, Timestamp)
```

---

## 23. API Baseline Blueprint

All endpoints follow versioned REST standards (`/api/v1/*`):
* `/api/v1/auth`: `POST /register`, `POST /login`, `POST /refresh-token`, `POST /logout`
* `/api/v1/products`: `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`
* `/api/v1/categories`: `GET /`, `POST /`, `PUT /{id}`
* `/api/v1/brands`: `GET /`, `POST /`
* `/api/v1/vendors`: `POST /apply`, `GET /profile`, `PUT /profile`, `GET /dashboard`
* `/api/v1/cart`: `GET /`, `POST /items`, `PUT /items/{id}`, `DELETE /items/{id}`
* `/api/v1/wishlist`: `GET /`, `POST /items`, `DELETE /items/{id}`
* `/api/v1/addresses`: `GET /`, `POST /`, `PUT /{id}`, `DELETE /{id}`
* `/api/v1/orders`: `POST /checkout`, `GET /`, `GET /{id}`, `PUT /{id}/cancel`
* `/api/v1/payments`: `POST /process`, `POST /payment-webhook`, `GET /status/{id}`
* `/api/v1/deliveries`: `GET /assignments`, `PUT /{id}/status`
* `/api/v1/reviews`: `POST /`, `GET /product/{productId}`
* `/api/v1/coupons`: `POST /validate`
* `/api/v1/notifications`: `GET /`, `PUT /{id}/read`
* `/api/v1/search`: `GET /`, `GET /suggestions`
* `/api/v1/admin`: `GET /vendor-applications`, `PUT /vendor-applications/{id}/approve`, `PUT /products/{id}/moderate`, `GET /audit-logs`, `GET /search-analytics`

---

## 24. Consolidated Business Rules Traceability Index

| Rule ID | Name | Core Business Definition | SRS Requirement Coverage |
|---|---|---|---|
| **BR-001** | Vendor Approval Requirement | A vendor cannot sell products or process orders until approved and activated by an Admin. | `FR-VEND-002`, `FR-VEND-003` |
| **BR-002** | Vendor Data Isolation | Vendors can access and modify only their own store, products, inventory, orders, and payouts. | `FR-VEND-004`, `NFR-SEC-003` |
| **BR-003** | Customer Order Isolation | Customers can view only their own placed orders and addresses. | `FR-ORDER-004` |
| **BR-004** | Customer Review Eligibility | Reviews can only be submitted by customers who completed a purchase of the specific product. | `FR-REVIEW-001` |
| **BR-005** | Inventory Validation | The system must validate available stock before confirming any order. | `FR-INV-001`, `FR-CART-003` |
| **BR-006** | Inventory Reservation | Where required, inventory should be reserved during checkout/order confirmation to prevent overselling. | `FR-INV-002` |
| **BR-007** | Admin Access Enforcement | Administrative endpoints require verified Admin credentials and permissions. | `FR-AUTH-004`, `FR-AUDIT-001` |
| **BR-008** | Coupon Enforcement | Coupons are validated against expiration, usage caps, minimum spend, and category/vendor restrictions. | `FR-COMM-001` |
| **BR-009** | Payment Confirmation | Online orders are marked paid only upon verified payment gateway webhook callback. | `FR-PAY-002` |
| **BR-010** | Search Logging | All valid search queries are logged to `search_logs` for business analytics. | `FR-SEARCH-005`, `FR-AUDIT-001` |
| **BR-011** | Multi-Vendor Order Splitting | Multi-vendor checkouts split parent orders into isolated vendor-specific order records. | `FR-ORDER-001` |
| **BR-012** | Product Visibility Rule | Only Active products from Approved and Active vendors are publicly listed. | `FR-PROD-003` |
| **BR-013** | Delivery Authorization | Delivery status updates are restricted to authorized delivery staff or automated handlers. | `FR-DEL-003` |
| **BR-014** | Commission Calculation | System automatically calculates and deducts platform commission from vendor payouts. | `FR-COMM-002` |
| **BR-015** | Vendor Suspension | Suspended vendor stores immediately lose public visibility and order processing access. | `FR-ADMIN-002` |

---

## 25. Scope Boundary Matrix

### 25.1 In Scope — MVP
* Customer authentication (self-registration), address management, location-aware search, 300ms search suggestion debounce, multi-vendor cart, wishlist, address checkout, Cash on Delivery (COD) and selected online payment gateway integration (Stripe or suitable regional/local gateway), order tracking, and review posting.
* Vendor application onboarding, verification information submission, store profile setup, product catalog management, Cloudinary media integration, inventory tracking, vendor-isolated order processing, and dashboard analytics.
* Delivery staff login (authorized provisioning), delivery assignment queue, and status updates (`Picked Up`, `Out for Delivery`, `Delivered`).
* Admin dashboard (controlled provisioning), vendor approval workflow, catalog/brand management, product moderation, commission setup, coupon management, review moderation, search analytics, and audit logging.
* ASP.NET Core .NET 8 Web API, CQRS (MediatR), PostgreSQL via Supabase, Cloudinary, SignalR hubs, xUnit backend testing.

### 25.2 Future Scope (Post-MVP Roadmap)
* Version 2.0: Multi-branch vendor support, branch stock management (`ProductBranchStock`), Redis caching layer, background job queues.
* Version 3.0: AI semantic search (`pgvector` embeddings), AI personalized recommendations, AI demand forecasting.
* Mobile Platform: Native iOS/Android apps, mobile push notifications, live driver GPS tracking map routing.

### 25.3 Out of Scope (Strictly Excluded)
* International shipping, multi-currency conversion, cryptocurrency payment methods, automated warehouse robotics, ERP integrations, ad sponsorship marketplaces, regulated prescription sales, autonomous delivery drones, and multi-tier corporate loyalty programs.

---

## 26. Requirements Traceability Matrix

| BRD Feature Area | SRS Functional Requirements | Status |
|---|---|---|
| Identity & Authentication | `FR-AUTH-001`, `FR-AUTH-002`, `FR-AUTH-003`, `FR-AUTH-004`, `FR-AUTH-005` | Covered |
| Customer Capabilities | `FR-CUST-001`, `FR-CUST-002`, `FR-CUST-003`, `FR-CUST-004`, `FR-CUST-005` | Covered |
| Vendor Onboarding & Management | `FR-VEND-001`, `FR-VEND-002`, `FR-VEND-003`, `FR-VEND-004`, `FR-VEND-005`, `FR-VEND-006` | Covered |
| Product Catalog & Media | `FR-PROD-001`, `FR-PROD-002`, `FR-PROD-003`, `FR-PROD-004` | Covered |
| Search & Suggestions | `FR-SEARCH-001`, `FR-SEARCH-002`, `FR-SEARCH-003`, `FR-SEARCH-004`, `FR-SEARCH-005` | Covered |
| Inventory Control | `FR-INV-001`, `FR-INV-002`, `FR-INV-003`, `FR-INV-004` | Covered |
| Cart & Checkout | `FR-CART-001`, `FR-CART-002`, `FR-CART-003` | Covered |
| Order Management & Splitting | `FR-ORDER-001`, `FR-ORDER-002`, `FR-ORDER-003`, `FR-ORDER-004` | Covered |
| Payments & Webhooks | `FR-PAY-001`, `FR-PAY-002`, `FR-PAY-003`, `FR-PAY-004` | Covered |
| Delivery Workflow | `FR-DEL-001`, `FR-DEL-002`, `FR-DEL-003` | Covered |
| Reviews & Moderation | `FR-REVIEW-001`, `FR-REVIEW-002`, `FR-REVIEW-003` | Covered |
| Coupons & Commissions | `FR-COMM-001`, `FR-COMM-002`, `FR-COMM-003` | Covered |
| Admin Governance & Auditing | `FR-ADMIN-001`, `FR-ADMIN-002`, `FR-ADMIN-003`, `FR-AUDIT-001` | Covered |
| Notifications & SignalR | `FR-NOTIF-001` | Covered |
| Location-Aware Shopping | `FR-LOC-001`, `FR-LOC-002` | Covered |

---

## 27. Open Questions & Deferred Technical Decisions

The following technical and architectural decisions do not alter business scope and are explicitly deferred to subsequent design documentation phases:
1. **Exact Payment Provider:** Selection of specific online payment provider (Stripe vs local gateway) based on regional deployment.
2. **Maps API Provider:** Choice of mapping service (Google Maps API, Mapbox, OpenStreetMap) for lat/long geocoding and rendering.
3. **Inventory Reservation Lifecycle Mechanics:** Transactional locks, exact reservation timeouts, background cleanup job configurations, and concurrency implementations.
4. **SignalR Connection & Group Design:** SignalR hub group management, reconnect policies, and JWT query-string authorization parameters.
5. **Exact Vendor Verification Document Rules:** Definition of specific business registration file formats per regional legal jurisdiction.
6. **Password Hashing Candidate Selection:** Selection of exact hashing library/algorithm (BCrypt vs ASP.NET Core Identity PasswordHasher) during technical security design.
7. **Deployment Architecture Details:** Finalizing Cloud Infrastructure, container orchestration configurations, and CI/CD pipelines.

---

## 28. Quality Assurance & Browser Verification Rules

* **Current Phase Status:** Documentation-Only (`Browser Verification: N/A`).
* **Rule for Future Implementation Phases:**  
  Starting from Phase 14 (Implementation), every user-facing functional feature must undergo browser-based execution verification using Chrome prior to being marked completed:  
  `Code Implementation → Launch Application Server → Open Chrome → Perform User Journey → Verify Behavior → Record Verification`.
