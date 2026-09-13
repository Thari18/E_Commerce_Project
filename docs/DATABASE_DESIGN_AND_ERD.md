# LocalMart — Database Design & Entity Relationship Diagram (ERD)

**Document Version:** 1.1 (Controlled Correction Pass)  
**Phase:** 05 — Database Design & ERD  
**Status:** Approved Phase 05 Baseline  
**Date:** September 12, 2026  
**Target Platform:** PostgreSQL 15+ / Supabase-managed PostgreSQL  
**Primary Source Document:** `LocalMart_BRD_v1.0(1).md`  
**Consolidated Reference:** `docs/BRD_BASELINE.md`  
**SRS Reference:** `docs/SRS.md`  
**User Flows Reference:** `docs/USER_FLOWS_AND_USE_CASES.md`  
**Use Case Specifications:** `docs/USE_CASE_SPECIFICATIONS.md`  
**Traceability Matrix Reference:** `docs/REQUIREMENTS_TRACEABILITY_MATRIX.md`  
**Project:** LocalMart — Location-Aware Multi-Vendor E-Commerce Marketplace  

---

## 1. Database Document Control

### 1.1 Purpose
This document provides the formal logical and physical database design specification for **LocalMart**. It translates the approved business rules (BR-001 through BR-015), functional requirements (56 FRs), non-functional requirements (14 NFRs), user flows (81 Flows), and formal use cases (24 UCs) into a normalized, robust, highly performant PostgreSQL schema design.

### 1.2 Target Database Platform
* **Database Management System:** PostgreSQL 15+ (Hosted on Supabase Managed PostgreSQL or standard Cloud PostgreSQL).
* **ORM Mapping Target:** EF Core 9.0 (ASP.NET Core 9.0 Web API backend).
* **Spatial Extensions:** Standard `DECIMAL(10,8)` / `DECIMAL(11,8)` for Latitude/Longitude in MVP. PostGIS extension evaluation deferred.
* **Text Search:** PostgreSQL Native Full-Text Search (`tsvector` / `tsquery`). pgvector AI search deferred to Future phase.

### 1.3 Document Priority & Traceability Hierarchy
1. Primary Business Source of Truth: [`LocalMart_BRD_v1.0(1).md`](file:///d:/new%20e%20commers/LocalMart_BRD_v1.0%281%29.md)
2. Consolidated Baseline Reference: [`docs/BRD_BASELINE.md`](file:///d:/new%20e%20commers/docs/BRD_BASELINE.md)
3. Software Requirements Specification: [`docs/SRS.md`](file:///d:/new%20e%20commers/docs/SRS.md)
4. User Flows & Use Case Catalog: [`docs/USER_FLOWS_AND_USE_CASES.md`](file:///d:/new%20e%20commers/docs/USER_FLOWS_AND_USE_CASES.md)
5. Formal Use Case Specifications: [`docs/USE_CASE_SPECIFICATIONS.md`](file:///d:/new%20e%20commers/docs/USE_CASE_SPECIFICATIONS.md)
6. Requirements Traceability Matrix: [`docs/REQUIREMENTS_TRACEABILITY_MATRIX.md`](file:///d:/new%20e%20commers/docs/REQUIREMENTS_TRACEABILITY_MATRIX.md)

### 1.4 Scope & Non-Goals
* **Included:** Entity definitions, column specifications, data types, primary/foreign keys, constraints, default values, index strategies, data isolation policies, relationships, ERD diagram in Mermaid format, traceability matrix, normalization analysis, and correction log.
* **Explicit Non-Goals:** Writing executable SQL DDL migration files, creating EF Core `DbContext` code, executing database seeds, or configuring live Supabase project settings. This phase is strict documentation.

---

## 2. Database Design Principles

1. **Relational Integrity & 3NF Normalization:** All transactional structures are strictly designed to Third Normal Form (3NF) to eliminate data redundancy and anomalies. Limited denormalization (e.g., historical price snapshots in order items) is applied only where required by business immutability rules.
2. **Strict Foreign Key Referential Integrity:** All relationships enforce strict Foreign Key constraints (`ON DELETE RESTRICT` or `ON DELETE CASCADE` where parent lifecycle strictly owns child lifecycle).
3. **Vendor & Customer Data Isolation:** Database keys natively enforce tenant isolation (e.g., `vendor_id` on vendor resources; `customer_id` on customer resources) to ensure software queries can strictly enforce isolation (`BR-002`, `BR-003`, `NFR-SEC-003`).
4. **Auditability & Temporal Tracking:** All core transactional tables include `created_at` (UTC timestamp) and `updated_at` (UTC timestamp). Critical administrative and security tables record actor identity (`created_by`, `updated_by`) and event state diffs.
5. **Constraint-Driven Integrity:** Enforce data constraints at the PostgreSQL database level using `NOT NULL`, `UNIQUE`, `CHECK`, and enum validations alongside application-level FluentValidation (`NFR-MAINT-002`).
6. **Performance & Index Optimization:** High-frequency access pathways (SKU lookup, product category search, location boundary filtering, customer orders, vendor order lists) are backed by targeted B-Tree and Composite indexes.
7. **No Sensitive Financial Credentials Storage:** Absolutely no raw payment card numbers, CVVs, or bank secrets are stored in the database. Only external gateway transaction references (`payment_intent_id`, `transaction_reference`) are retained.
8. **Extensibility for Future Enhancements:** Table structures accommodate future multi-branch extensions, spatial PostGIS indexing, vector embeddings (`pgvector`), and AI recommendation models without requiring destructive schema rewrites.

---

## 3. Domain / Entity Inventory

| Domain | Entity Name | Table Name | Status | Justification / Notes |
|---|---|---|---|---|
| **Identity & Access** | `User` | `users` | **MVP** | Central identity record for all actors (Customer, Vendor Applicant, Vendor, Admin, Delivery Staff). |
| **Identity & Access** | `Role` | `roles` | **MVP** | Pre-defined system roles (`Customer`, `Vendor`, `Administrator`, `DeliveryStaff`). |
| **Identity & Access** | `Permission` | `permissions` | **MVP** | Granular permission tokens for role-based permission checks (`FR-AUTH-004`). |
| **Identity & Access** | `UserRole` | `user_roles` | **MVP** | Many-to-many junction binding users to roles (RBAC). |
| **Identity & Access** | `RolePermission` | `role_permissions` | **MVP** | Many-to-many junction binding roles to permissions (`FR-AUTH-004`). |
| **Identity & Access** | `RefreshToken` | `refresh_tokens` | **MVP** | Secure JWT refresh token persistence (`NFR-SEC-002`). |
| **Customer / Vendor** | `Customer` | `customers` | **MVP** | Profile details specific to customer accounts linked 1:1 to `User`. |
| **Customer / Vendor** | `Vendor` | `vendors` | **MVP** | Approved selling entity linked 1:1 to approved `VendorApplication` and `User`. |
| **Customer / Vendor** | `VendorApplication` | `vendor_applications` | **MVP** | Onboarding registration submissions awaiting admin review (`BR-001`). |
| **Customer / Vendor** | `VendorVerificationRecord` | `vendor_verification_records` | **MVP** | Document submissions and verification metadata for vendor background checks. |
| **Customer / Vendor** | `Address` | `addresses` | **MVP** | Customer shipping addresses and vendor store locations with Lat/Long coords. |
| **Customer / Vendor** | `StoreProfile` | `store_profiles` | **MVP** | Public store details, banner/logo media URLs, business hours, and operational status. |
| **Catalog** | `Category` | `categories` | **MVP** | Hierarchical catalog categories with parent-child support. |
| **Catalog** | `Brand` | `brands` | **MVP** | Product brand directory. |
| **Catalog** | `Product` | `products` | **MVP** | Central product catalog items created by vendors (`BR-012`). |
| **Catalog** | `ProductImage` | `product_images` | **MVP** | Cloudinary image metadata and URL references per product. |
| **Catalog** | `ProductVariant` | `product_variants` | **Deferred** | Multi-attribute product variants (size/color). MVP utilizes base SKU per Product (`FR-PROD-001`). |
| **Inventory** | `Inventory` | `inventories` | **MVP** | Real-time stock counts, reserved stock, and threshold levels per product (`BR-005`, `BR-006`). |
| **Inventory** | `InventoryMovement` | `inventory_movements` | **MVP** | Audit trail of all stock additions, reservations, deductions, and cancellations. |
| **Shopping** | `Cart` | `carts` | **MVP** | Active customer shopping cart container. |
| **Shopping** | `CartItem` | `cart_items` | **MVP** | Cart items referencing products, quantities, and vendor groupings (`FR-CART-001`). |
| **Shopping** | `Wishlist` | `wishlists` | **MVP** | Customer wishlist container. |
| **Shopping** | `WishlistItem` | `wishlist_items` | **MVP** | Products saved for future purchase (`FR-CUST-004`). |
| **Orders & Payments** | `Order` | `orders` | **MVP** | Customer parent order capturing checkout total, customer ID, and delivery address (`BR-011`). |
| **Orders & Payments** | `VendorOrder` | `vendor_orders` | **MVP** | Vendor-specific sub-order split from parent order (`BR-011`, `BR-002`). |
| **Orders & Payments** | `OrderItem` | `order_items` | **MVP** | Individual line items belonging strictly to a `VendorOrder`. |
| **Orders & Payments** | `Payment` | `payments` | **MVP** | Financial payment transactions (COD / Online), status, and gateway references (`BR-009`). Belongs to parent `orders`. |
| **Orders & Payments** | `Refund` | `refunds` | **MVP** | Refund transaction records linked to parent payment and optional vendor sub-order. |
| **Delivery** | `Delivery` | `deliveries` | **MVP** | Physical delivery lifecycle tracking linked to a `VendorOrder`. |
| **Delivery** | `DeliveryAssignment` | `delivery_assignments` | **MVP** | Assignment of delivery staff to active delivery instances (`FR-DEL-001`). |
| **Promotions / Finance** | `Coupon` | `coupons` | **MVP** | Promotional codes, percentage/fixed discounts, and validity criteria (`BR-008`). |
| **Promotions / Finance** | `CouponUsage` | `coupon_usages` | **MVP** | Customer and order coupon execution tracking. |
| **Promotions / Finance** | `Commission` | `commissions` | **MVP** | Platform marketplace commission calculation ledger (`BR-014`). |
| **Promotions / Finance** | `Payout` | `payouts` | **MVP** | Vendor payout execution records and financial clearance logs. |
| **Engagement** | `Review` | `reviews` | **MVP** | Verified customer product and vendor reviews (`BR-004`). |
| **Engagement** | `Notification` | `notifications` | **MVP** | System notifications persist for Customer, Vendor, Admin, and Delivery Staff. |
| **Search / Audit** | `SearchLog` | `search_logs` | **MVP** | Search query tracking, result counts, zero-result identification (`BR-010`). |
| **Search / Audit** | `AuditLog` | `audit_logs` | **MVP** | System audit trail for security events, admin actions, and state modifications (`FR-AUDIT-001`). |

---

## 4. Entity Specifications

All primary keys use PostgreSQL `UUID` (`gen_random_uuid()`) for global uniqueness and security against sequential enumeration attacks. Timestamps use `TIMESTAMPTZ` (UTC).

### 4.1 Identity & Access Domain

#### 4.1.1 `users`
* **Purpose:** Primary identity directory for all human actors accessing LocalMart.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `email` (`VARCHAR(255)`, NOT NULL, Unique)
  * `password_hash` (`VARCHAR(255)`, NOT NULL)
  * `first_name` (`VARCHAR(100)`, NOT NULL)
  * `last_name` (`VARCHAR(100)`, NOT NULL)
  * `phone_number` (`VARCHAR(20)`, NULL)
  * `is_active` (`BOOLEAN`, NOT NULL, Default: `true`)
  * `email_verified` (`BOOLEAN`, NOT NULL, Default: `false`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `UNIQUE(email)`, `CHECK(length(email) >= 5)`
* **Indexes:** `idx_users_email` (B-Tree Unique)
* **Security & Isolation:** Base auth table. `password_hash` stores BCrypt/Argon2 hash (`NFR-SEC-001`).

#### 4.1.2 `roles`
* **Purpose:** System role definitions (`Customer`, `Vendor`, `Administrator`, `DeliveryStaff`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `name` (`VARCHAR(50)`, NOT NULL, Unique)
  * `description` (`VARCHAR(255)`, NULL)
* **Constraints:** `UNIQUE(name)`

#### 4.1.3 `permissions` [MVP]
* **Purpose:** Granular permission action tokens enabling RBAC permission authorization (`FR-AUTH-004`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `name` (`VARCHAR(100)`, NOT NULL, Unique) -- e.g. 'vendors.approve', 'products.create', 'orders.read'
  * `module` (`VARCHAR(50)`, NOT NULL) -- e.g. 'VendorManagement', 'Catalog', 'Orders'
  * `description` (`VARCHAR(255)`, NULL)
* **Constraints:** `UNIQUE(name)`
* **Indexes:** `idx_permissions_name` (B-Tree Unique), `idx_permissions_module` (B-Tree)

#### 4.1.4 `user_roles`
* **Purpose:** Junction table assigning roles to users.
* **Primary Key:** Composite `(user_id, role_id)`
* **Columns:**
  * `user_id` (`UUID`, NOT NULL, FK -> `users(id)` ON DELETE CASCADE)
  * `role_id` (`UUID`, NOT NULL, FK -> `roles(id)` ON DELETE CASCADE)
  * `assigned_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)

#### 4.1.5 `role_permissions` [MVP]
* **Purpose:** Junction table mapping granular permissions to system roles (`FR-AUTH-004`).
* **Primary Key:** Composite `(role_id, permission_id)`
* **Columns:**
  * `role_id` (`UUID`, NOT NULL, FK -> `roles(id)` ON DELETE CASCADE)
  * `permission_id` (`UUID`, NOT NULL, FK -> `permissions(id)` ON DELETE CASCADE)
  * `assigned_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)

#### 4.1.6 `refresh_tokens`
* **Purpose:** Persistent refresh tokens for JWT authentication sessions (`NFR-SEC-002`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `user_id` (`UUID`, NOT NULL, FK -> `users(id)` ON DELETE CASCADE)
  * `token_hash` (`VARCHAR(255)`, NOT NULL, Unique)
  * `expires_at` (`TIMESTAMPTZ`, NOT NULL)
  * `is_revoked` (`BOOLEAN`, NOT NULL, Default: `false`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Indexes:** `idx_refresh_tokens_user` (B-Tree), `idx_refresh_tokens_hash` (B-Tree Unique)

---

### 4.2 Customer & Vendor Management Domain

#### 4.2.1 `customers`
* **Purpose:** Customer profile extension table.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `user_id` (`UUID`, NOT NULL, Unique, FK -> `users(id)` ON DELETE CASCADE)
  * `preferred_language` (`VARCHAR(10)`, NOT NULL, Default: `'en'`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Indexes:** `idx_customers_user_id` (B-Tree Unique)
* **Security & Isolation:** Customer order isolation enforced via `customer_id` filter (`BR-003`).

#### 4.2.2 `vendor_applications`
* **Purpose:** Onboarding applications submitted by prospective vendors awaiting admin review (`BR-001`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `applicant_user_id` (`UUID`, NOT NULL, FK -> `users(id)` ON DELETE RESTRICT)
  * `business_name` (`VARCHAR(150)`, NOT NULL)
  * `business_registration_number` (`VARCHAR(100)`, NOT NULL)
  * `tax_identification_number` (`VARCHAR(100)`, NULL)
  * `contact_phone` (`VARCHAR(20)`, NOT NULL)
  * `contact_email` (`VARCHAR(255)`, NOT NULL)
  * `status` (`VARCHAR(30)`, NOT NULL, Default: `'Pending'`) -- Pending, UnderReview, Approved, Rejected
  * `rejection_reason` (`TEXT`, NULL)
  * `reviewed_by_admin_id` (`UUID`, NULL, FK -> `users(id)` ON DELETE SET NULL)
  * `submitted_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `reviewed_at` (`TIMESTAMPTZ`, NULL)
* **Constraints:** `CHECK(status IN ('Pending', 'UnderReview', 'Approved', 'Rejected'))`
* **Indexes:** `idx_vendor_app_status` (B-Tree), `idx_vendor_app_applicant` (B-Tree)

#### 4.2.3 `vendors`
* **Purpose:** Approved vendor account directory. Created strictly upon application approval (`BR-001`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `user_id` (`UUID`, NOT NULL, Unique, FK -> `users(id)` ON DELETE RESTRICT)
  * `application_id` (`UUID`, NOT NULL, Unique, FK -> `vendor_applications(id)` ON DELETE RESTRICT) -- Prevents duplicate vendor accounts per application
  * `business_name` (`VARCHAR(150)`, NOT NULL)
  * `slug` (`VARCHAR(160)`, NOT NULL, Unique)
  * `status` (`VARCHAR(30)`, NOT NULL, Default: `'Approved'`) -- Approved, Suspended, Inactive
  * `commission_rate` (`DECIMAL(5,2)`, NOT NULL, Default: `10.00`)
  * `approved_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `UNIQUE(application_id)`, `UNIQUE(user_id)`, `CHECK(status IN ('Approved', 'Suspended', 'Inactive'))`, `CHECK(commission_rate >= 0.00 AND commission_rate <= 100.00)`
* **Indexes:** `idx_vendors_user` (B-Tree Unique), `idx_vendors_app` (B-Tree Unique), `idx_vendors_status` (B-Tree), `idx_vendors_slug` (B-Tree Unique)
* **Lifecycle & Duplicate Prevention Rules:**
  1. `UNIQUE(application_id)` guarantees one vendor application can produce at most one `vendors` record.
  2. `UNIQUE(user_id)` guarantees one user account can own at most one active vendor business.
  3. Rejection sets application status to `'Rejected'` with `rejection_reason`; no `vendors` or `store_profiles` record is generated.
  4. Vendor suspension updates `vendors.status` to `'Suspended'`, which preserves audit logs while hiding products from catalog search (`BR-012`).

#### 4.2.4 `vendor_verification_records`
* **Purpose:** Supporting verification document metadata attached to vendor applications.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `application_id` (`UUID`, NOT NULL, FK -> `vendor_applications(id)` ON DELETE CASCADE)
  * `document_type` (`VARCHAR(50)`, NOT NULL)
  * `document_url` (`VARCHAR(500)`, NOT NULL)
  * `verified_state` (`VARCHAR(30)`, NOT NULL, Default: `'Unverified'`)
  * `uploaded_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)

#### 4.2.5 `store_profiles`
* **Purpose:** Public store storefront metadata owned by an approved vendor.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `vendor_id` (`UUID`, NOT NULL, Unique, FK -> `vendors(id)` ON DELETE CASCADE)
  * `store_name` (`VARCHAR(150)`, NOT NULL)
  * `description` (`TEXT`, NULL)
  * `logo_url` (`VARCHAR(500)`, NULL)
  * `banner_url` (`VARCHAR(500)`, NULL)
  * `address_id` (`UUID`, NULL, FK -> `addresses(id)` ON DELETE SET NULL)
  * `is_open` (`BOOLEAN`, NOT NULL, Default: `true`)
  * `opening_hours_json` (`JSONB`, NULL)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Indexes:** `idx_store_profiles_vendor` (B-Tree Unique)

#### 4.2.6 `addresses`
* **Purpose:** Physical addresses for customer deliveries and store storefront locations.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `user_id` (`UUID`, NULL, FK -> `users(id)` ON DELETE CASCADE)
  * `address_type` (`VARCHAR(30)`, NOT NULL) -- CustomerShipping, VendorStore, DeliveryHub
  * `street_address` (`VARCHAR(255)`, NOT NULL)
  * `city` (`VARCHAR(100)`, NOT NULL)
  * `state_province` (`VARCHAR(100)`, NOT NULL)
  * `postal_code` (`VARCHAR(20)`, NOT NULL)
  * `country` (`VARCHAR(100)`, NOT NULL, Default: `'LocalCountry'`)
  * `latitude` (`DECIMAL(10,8)`, NULL)
  * `longitude` (`DECIMAL(11,8)`, NULL)
  * `is_default` (`BOOLEAN`, NOT NULL, Default: `false`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Indexes:** `idx_addresses_user` (B-Tree), `idx_addresses_lat_long` (B-Tree Composite)

---

### 4.3 Catalog Domain

#### 4.3.1 `categories`
* **Purpose:** Product category catalog hierarchy.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `parent_category_id` (`UUID`, NULL, FK -> `categories(id)` ON DELETE RESTRICT)
  * `name` (`VARCHAR(100)`, NOT NULL)
  * `slug` (`VARCHAR(110)`, NOT NULL, Unique)
  * `icon_url` (`VARCHAR(500)`, NULL)
  * `is_active` (`BOOLEAN`, NOT NULL, Default: `true`)
  * `display_order` (`INT`, NOT NULL, Default: `0`)
* **Indexes:** `idx_categories_slug` (B-Tree Unique), `idx_categories_parent` (B-Tree)

#### 4.3.2 `brands`
* **Purpose:** Brand directory.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `name` (`VARCHAR(100)`, NOT NULL, Unique)
  * `slug` (`VARCHAR(110)`, NOT NULL, Unique)
  * `logo_url` (`VARCHAR(500)`, NULL)
  * `is_active` (`BOOLEAN`, NOT NULL, Default: `true`)

#### 4.3.3 `products`
* **Purpose:** Central product catalog. Strict vendor ownership (`BR-002`, `BR-012`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `vendor_id` (`UUID`, NOT NULL, FK -> `vendors(id)` ON DELETE RESTRICT)
  * `category_id` (`UUID`, NOT NULL, FK -> `categories(id)` ON DELETE RESTRICT)
  * `brand_id` (`UUID`, NULL, FK -> `brands(id)` ON DELETE SET NULL)
  * `name` (`VARCHAR(200)`, NOT NULL)
  * `slug` (`VARCHAR(220)`, NOT NULL, Unique)
  * `description` (`TEXT`, NOT NULL)
  * `sku` (`VARCHAR(100)`, NOT NULL, Unique)
  * `price` (`DECIMAL(12,2)`, NOT NULL)
  * `discount_price` (`DECIMAL(12,2)`, NULL)
  * `status` (`VARCHAR(30)`, NOT NULL, Default: `'Draft'`) -- Draft, Published, Archival, Suspended
  * `is_active` (`BOOLEAN`, NOT NULL, Default: `true`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `CHECK(price >= 0.00)`, `CHECK(discount_price IS NULL OR discount_price <= price)`, `CHECK(status IN ('Draft', 'Published', 'Archival', 'Suspended'))`
* **Indexes & Search Strategy:**
  * `idx_products_vendor` (B-Tree): Vendor catalog queries and isolation (`VF-007`).
  * `idx_products_category` (B-Tree): Category catalog browsing (`CF-008`).
  * `idx_products_sku` (B-Tree Unique): Direct SKU lookup.
  * `idx_products_search` (PostgreSQL Full-Text Search GIN Index): Native PostgreSQL `to_tsvector('english', name || ' ' || description)` execution (`FR-SEARCH-001`). Search operations execute against `products`, `categories`, and `brands`—NOT against `search_logs`.

#### 4.3.4 `product_images`
* **Purpose:** Cloudinary media asset URLs attached to products.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `product_id` (`UUID`, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  * `image_url` (`VARCHAR(500)`, NOT NULL)
  * `cloudinary_public_id` (`VARCHAR(255)`, NULL)
  * `display_order` (`INT`, NOT NULL, Default: `0`)
  * `is_primary` (`BOOLEAN`, NOT NULL, Default: `false`)
* **Indexes:** `idx_product_images_product` (B-Tree)

---

### 4.4 Inventory Domain

#### 4.4.1 `inventories`
* **Purpose:** Product inventory control supporting stock validation and reservation (`BR-005`, `BR-006`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `product_id` (`UUID`, NOT NULL, Unique, FK -> `products(id)` ON DELETE CASCADE)
  * `quantity_available` (`INT`, NOT NULL, Default: `0`) -- Stock available for NEW purchases
  * `quantity_reserved` (`INT`, NOT NULL, Default: `0`) -- Stock temporarily held for unconfirmed active checkout orders
  * `low_stock_threshold` (`INT`, NOT NULL, Default: `5`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `CHECK(quantity_available >= 0)`, `CHECK(quantity_reserved >= 0)`, `CHECK(low_stock_threshold >= 0)`
* **Indexes:** `idx_inventories_product` (B-Tree Unique)
* **Inventory Quantity Semantics & Non-Double-Counting Rules:**
  1. `quantity_available`: Exact unreserved stock available for new customer orders.
  2. `quantity_reserved`: Exact stock held for active pending checkout reservations.
  3. **Total On-Hand Physical Stock:** Defined as `(quantity_available + quantity_reserved)`.
  4. **Reservation Action (`BR-006`):** Decrements `quantity_available` and increments `quantity_reserved`. This prevents double-counting.
  5. **Payment Confirmation Action (`BR-009`):** Decrements `quantity_reserved` (consuming reserved stock) and logs an `OrderDeduction` movement.
  6. **Cancellation Action:** Decrements `quantity_reserved` and increments `quantity_available`.

#### 4.4.2 `inventory_movements`
* **Purpose:** Audit log of all inventory adjustments (Restock, CheckoutReservation, OrderDeduction, CancellationRelease, ManualAdjustment).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `inventory_id` (`UUID`, NOT NULL, FK -> `inventories(id)` ON DELETE CASCADE)
  * `movement_type` (`VARCHAR(40)`, NOT NULL) -- Restock, Reservation, Deduction, Release, Adjustment
  * `quantity_change` (`INT`, NOT NULL)
  * `reference_order_id` (`UUID`, NULL)
  * `performed_by_user_id` (`UUID`, NULL, FK -> `users(id)` ON DELETE SET NULL)
  * `notes` (`VARCHAR(255)`, NULL)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Indexes:** `idx_inv_movements_inv` (B-Tree)

---

### 4.5 Shopping Domain

#### 4.5.1 `carts`
* **Purpose:** Active customer shopping cart container (`FR-CART-001`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `customer_id` (`UUID`, NOT NULL, Unique, FK -> `customers(id)` ON DELETE CASCADE)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)

#### 4.5.2 `cart_items`
* **Purpose:** Products contained in customer shopping cart.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `cart_id` (`UUID`, NOT NULL, FK -> `carts(id)` ON DELETE CASCADE)
  * `product_id` (`UUID`, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  * `quantity` (`INT`, NOT NULL, Default: `1`)
  * `added_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `CHECK(quantity > 0)`, `UNIQUE(cart_id, product_id)`
* **Indexes:** `idx_cart_items_cart` (B-Tree)

#### 4.5.3 `wishlists`
* **Purpose:** Customer wishlist container (`FR-CUST-004`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `customer_id` (`UUID`, NOT NULL, Unique, FK -> `customers(id)` ON DELETE CASCADE)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)

#### 4.5.4 `wishlist_items`
* **Purpose:** Individual products saved in customer wishlist.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `wishlist_id` (`UUID`, NOT NULL, FK -> `wishlists(id)` ON DELETE CASCADE)
  * `product_id` (`UUID`, NOT NULL, FK -> `products(id)` ON DELETE CASCADE)
  * `added_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `UNIQUE(wishlist_id, product_id)`

---

### 4.6 Orders & Payments Domain

#### 4.6.1 `orders` (Parent Order)
* **Purpose:** Top-level customer order entity representing customer checkout transaction (`BR-003`, `BR-011`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `order_number` (`VARCHAR(50)`, NOT NULL, Unique)
  * `customer_id` (`UUID`, NOT NULL, FK -> `customers(id)` ON DELETE RESTRICT)
  * `shipping_address_id` (`UUID`, NOT NULL, FK -> `addresses(id)` ON DELETE RESTRICT)
  * `total_amount` (`DECIMAL(12,2)`, NOT NULL)
  * `discount_amount` (`DECIMAL(12,2)`, NOT NULL, Default: `0.00`)
  * `net_amount` (`DECIMAL(12,2)`, NOT NULL)
  * `overall_status` (`VARCHAR(40)`, NOT NULL, Default: `'Pending'`) -- Pending, Confirmed, InFulfillment, Completed, Cancelled
  * `coupon_id` (`UUID`, NULL, FK -> `coupons(id)` ON DELETE SET NULL)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `CHECK(total_amount >= 0.00)`, `CHECK(net_amount >= 0.00)`
* **Indexes:** `idx_orders_customer` (B-Tree), `idx_orders_number` (B-Tree Unique), `idx_orders_status` (B-Tree)

#### 4.6.2 `vendor_orders` (Vendor Sub-Order)
* **Purpose:** Multi-vendor split order representing items purchased from a specific vendor (`BR-002`, `BR-011`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `parent_order_id` (`UUID`, NOT NULL, FK -> `orders(id)` ON DELETE RESTRICT)
  * `vendor_id` (`UUID`, NOT NULL, FK -> `vendors(id)` ON DELETE RESTRICT)
  * `sub_order_number` (`VARCHAR(60)`, NOT NULL, Unique)
  * `subtotal_amount` (`DECIMAL(12,2)`, NOT NULL)
  * `commission_amount` (`DECIMAL(12,2)`, NOT NULL, Default: `0.00`) -- BR-014
  * `vendor_payout_amount` (`DECIMAL(12,2)`, NOT NULL, Default: `0.00`)
  * `status` (`VARCHAR(40)`, NOT NULL, Default: `'Pending'`) -- Pending, Processing, ReadyForPickup, OutForDelivery, Delivered, Cancelled
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `CHECK(subtotal_amount >= 0.00)`, `CHECK(status IN ('Pending', 'Processing', 'ReadyForPickup', 'OutForDelivery', 'Delivered', 'Cancelled'))`
* **Indexes:** `idx_vendor_orders_vendor` (B-Tree), `idx_vendor_orders_parent` (B-Tree), `idx_vendor_orders_status` (B-Tree)

#### 4.6.3 `order_items`
* **Purpose:** Individual line items strictly attached to a `vendor_orders` record.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `vendor_order_id` (`UUID`, NOT NULL, FK -> `vendor_orders(id)` ON DELETE CASCADE)
  * `product_id` (`UUID`, NOT NULL, FK -> `products(id)` ON DELETE RESTRICT)
  * `product_name_snapshot` (`VARCHAR(200)`, NOT NULL)
  * `sku_snapshot` (`VARCHAR(100)`, NOT NULL)
  * `unit_price` (`DECIMAL(12,2)`, NOT NULL)
  * `quantity` (`INT`, NOT NULL)
  * `line_total` (`DECIMAL(12,2)`, NOT NULL)
* **Constraints:** `CHECK(quantity > 0)`, `CHECK(unit_price >= 0.00)`, `CHECK(line_total >= 0.00)`
* **Indexes:** `idx_order_items_vorder` (B-Tree), `idx_order_items_product` (B-Tree)

#### 4.6.4 `payments`
* **Purpose:** Financial payment transaction attached strictly to the parent `orders` record (`BR-009`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `parent_order_id` (`UUID`, NOT NULL, FK -> `orders(id)` ON DELETE RESTRICT)
  * `payment_method` (`VARCHAR(30)`, NOT NULL) -- COD, CreditCard, DebitCard, OnlineGateway
  * `provider_name` (`VARCHAR(50)`, NOT NULL) -- e.g. CashOnDelivery, ExternalPaymentProvider
  * `transaction_reference` (`VARCHAR(255)`, NULL) -- External gateway transaction identifier
  * `amount` (`DECIMAL(12,2)`, NOT NULL)
  * `currency` (`VARCHAR(10)`, NOT NULL, Default: `'USD'`)
  * `status` (`VARCHAR(30)`, NOT NULL, Default: `'Pending'`) -- Pending, Authorized, Completed, Failed, Refunded
  * `payment_captured_at` (`TIMESTAMPTZ`, NULL)
  * `failure_reason` (`TEXT`, NULL)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `CHECK(status IN ('Pending', 'Authorized', 'Completed', 'Failed', 'Refunded'))`
* **Indexes:** `idx_payments_order` (B-Tree), `idx_payments_tx_ref` (B-Tree)
* **Payment Ownership Rules:**
  1. The customer places a single payment for the parent `orders` record (`parent_order_id`).
  2. Multi-vendor order splits do NOT duplicate parent payment records. Individual vendor earnings are tracked at the `vendor_orders` sub-order tier via `commissions` and `vendor_payout_amount`.
  3. Absolutely no raw payment card numbers, CVVs, or financial credentials are stored.

#### 4.6.5 `refunds`
* **Purpose:** Financial refund transaction tracking.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `payment_id` (`UUID`, NOT NULL, FK -> `payments(id)` ON DELETE RESTRICT) -- Linked to parent order payment
  * `vendor_order_id` (`UUID`, NULL, FK -> `vendor_orders(id)` ON DELETE RESTRICT) -- Optional link for vendor-specific partial refunds
  * `refund_amount` (`DECIMAL(12,2)`, NOT NULL)
  * `reason` (`TEXT`, NOT NULL)
  * `status` (`VARCHAR(30)`, NOT NULL, Default: `'Pending'`) -- Pending, Processed, Failed
  * `gateway_refund_reference` (`VARCHAR(255)`, NULL)
  * `processed_at` (`TIMESTAMPTZ`, NULL)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)

---

### 4.7 Delivery Domain

#### 4.7.1 `deliveries`
* **Purpose:** Physical fulfillment tracking for each `vendor_order` (`BR-013`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `vendor_order_id` (`UUID`, NOT NULL, Unique, FK -> `vendor_orders(id)` ON DELETE RESTRICT)
  * `pickup_address_id` (`UUID`, NOT NULL, FK -> `addresses(id)` ON DELETE RESTRICT)
  * `delivery_address_id` (`UUID`, NOT NULL, FK -> `addresses(id)` ON DELETE RESTRICT)
  * `status` (`VARCHAR(40)`, NOT NULL, Default: `'Unassigned'`) -- Unassigned, Assigned, PickedUp, InTransit, Delivered, Failed
  * `otp_code_hash` (`VARCHAR(255)`, NULL) -- Secure delivery verification code hash (`BR-013`)
  * `delivered_at` (`TIMESTAMPTZ`, NULL)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `CHECK(status IN ('Unassigned', 'Assigned', 'PickedUp', 'InTransit', 'Delivered', 'Failed'))`
* **Indexes:** `idx_deliveries_vorder` (B-Tree Unique), `idx_deliveries_status` (B-Tree)

#### 4.7.2 `delivery_assignments`
* **Purpose:** Assignment records linking delivery staff members to deliveries (`FR-DEL-001`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `delivery_id` (`UUID`, NOT NULL, FK -> `deliveries(id)` ON DELETE CASCADE)
  * `delivery_staff_user_id` (`UUID`, NOT NULL, FK -> `users(id)` ON DELETE RESTRICT)
  * `assignment_status` (`VARCHAR(30)`, NOT NULL, Default: `'Assigned'`) -- Assigned, Accepted, Rejected, Completed
  * `assigned_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
  * `completed_at` (`TIMESTAMPTZ`, NULL)
* **Indexes:** `idx_del_assign_staff` (B-Tree), `idx_del_assign_delivery` (B-Tree)

---

### 4.8 Promotions & Finance Domain

#### 4.8.1 `coupons`
* **Purpose:** Marketplace promotional discount rules (`BR-008`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `code` (`VARCHAR(50)`, NOT NULL, Unique)
  * `discount_type` (`VARCHAR(20)`, NOT NULL) -- Percentage, FixedAmount
  * `discount_value` (`DECIMAL(12,2)`, NOT NULL)
  * `minimum_order_amount` (`DECIMAL(12,2)`, NOT NULL, Default: `0.00`)
  * `max_discount_amount` (`DECIMAL(12,2)`, NULL)
  * `valid_from` (`TIMESTAMPTZ`, NOT NULL)
  * `valid_to` (`TIMESTAMPTZ`, NOT NULL)
  * `usage_limit_per_coupon` (`INT`, NULL)
  * `usage_limit_per_customer` (`INT`, NOT NULL, Default: `1`)
  * `is_active` (`BOOLEAN`, NOT NULL, Default: `true`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `UNIQUE(code)`, `CHECK(discount_value > 0.00)`
* **Indexes:** `idx_coupons_code` (B-Tree Unique)

#### 4.8.2 `coupon_usages`
* **Purpose:** Audit record tracking coupon redemption.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `coupon_id` (`UUID`, NOT NULL, FK -> `coupons(id)` ON DELETE RESTRICT)
  * `customer_id` (`UUID`, NOT NULL, FK -> `customers(id)` ON DELETE RESTRICT)
  * `parent_order_id` (`UUID`, NOT NULL, Unique, FK -> `orders(id)` ON DELETE CASCADE)
  * `discount_applied` (`DECIMAL(12,2)`, NOT NULL)
  * `used_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)

#### 4.8.3 `commissions`
* **Purpose:** Platform commission records calculated per vendor order (`BR-014`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `vendor_order_id` (`UUID`, NOT NULL, Unique, FK -> `vendor_orders(id)` ON DELETE RESTRICT)
  * `vendor_id` (`UUID`, NOT NULL, FK -> `vendors(id)` ON DELETE RESTRICT)
  * `gross_amount` (`DECIMAL(12,2)`, NOT NULL)
  * `commission_rate` (`DECIMAL(5,2)`, NOT NULL)
  * `commission_amount` (`DECIMAL(12,2)`, NOT NULL)
  * `net_vendor_payable` (`DECIMAL(12,2)`, NOT NULL)
  * `calculated_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)

#### 4.8.4 `payouts`
* **Purpose:** Financial payout releases to vendors.
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `vendor_id` (`UUID`, NOT NULL, FK -> `vendors(id)` ON DELETE RESTRICT)
  * `payout_reference` (`VARCHAR(100)`, NOT NULL, Unique)
  * `amount` (`DECIMAL(12,2)`, NOT NULL)
  * `status` (`VARCHAR(30)`, NOT NULL, Default: `'Processing'`) -- Processing, Completed, Failed
  * `processed_by_admin_id` (`UUID`, NULL, FK -> `users(id)` ON DELETE SET NULL)
  * `paid_at` (`TIMESTAMPTZ`, NULL)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)

---

### 4.9 Engagement Domain

#### 4.9.1 `reviews`
* **Purpose:** Verified customer reviews for products and vendors (`BR-004`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `customer_id` (`UUID`, NOT NULL, FK -> `customers(id)` ON DELETE RESTRICT)
  * `product_id` (`UUID`, NOT NULL, FK -> `products(id)` ON DELETE RESTRICT)
  * `order_item_id` (`UUID`, NOT NULL, Unique, FK -> `order_items(id)` ON DELETE RESTRICT) -- Enforces structural 1:1 limit per line item
  * `rating` (`INT`, NOT NULL)
  * `comment` (`TEXT`, NULL)
  * `is_published` (`BOOLEAN`, NOT NULL, Default: `true`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Constraints:** `CHECK(rating >= 1 AND rating <= 5)`, `UNIQUE(order_item_id)`
* **Indexes:** `idx_reviews_product` (B-Tree), `idx_reviews_customer` (B-Tree)
* **Review Integrity & Eligibility Verification Rules:**
  1. `UNIQUE(order_item_id)` constraint enforces structural uniqueness (at most 1 review per purchased line item).
  2. Database FKs alone do NOT guarantee customer ownership or delivery status. Complete eligibility validation:
     `Customer -> Order (customer_id match) -> VendorOrder (status = 'Delivered') -> OrderItem (product_id match) -> Review`
     is enforced by the **Application / Service Tier** prior to record insertion (`BR-004`).

---

### 4.10 Search & Audit Domain

#### 4.10.1 `search_logs`
* **Purpose:** Log search query terms for zero-result detection and demand analytics (`BR-010`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `search_term` (`VARCHAR(255)`, NOT NULL)
  * `normalized_term` (`VARCHAR(255)`, NOT NULL)
  * `user_id` (`UUID`, NULL, FK -> `users(id)` ON DELETE SET NULL)
  * `result_count` (`INT`, NOT NULL, Default: `0`)
  * `search_latitude` (`DECIMAL(10,8)`, NULL)
  * `search_longitude` (`DECIMAL(11,8)`, NULL)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Indexes:** `idx_search_logs_term` (B-Tree), `idx_search_logs_results` (B-Tree)
* **Search Architecture Separation Note:** `search_logs` records search telemetry; it is NOT the product search index engine. Catalog product search executes against `products`, `categories`, and `brands` using PostgreSQL full-text search.

#### 4.10.2 `audit_logs`
* **Purpose:** Security and administrative action audit trail (`FR-AUDIT-001`).
* **Primary Key:** `id` (`UUID`, Default: `gen_random_uuid()`)
* **Columns:**
  * `id` (`UUID`, NOT NULL, PK)
  * `actor_user_id` (`UUID`, NULL, FK -> `users(id)` ON DELETE SET NULL)
  * `action` (`VARCHAR(100)`, NOT NULL)
  * `entity_name` (`VARCHAR(100)`, NOT NULL)
  * `entity_id` (`UUID`, NULL)
  * `old_values_json` (`JSONB`, NULL)
  * `new_values_json` (`JSONB`, NULL)
  * `ip_address` (`VARCHAR(45)`, NULL)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, Default: `NOW()`)
* **Indexes:** `idx_audit_logs_actor` (B-Tree), `idx_audit_logs_entity` (B-Tree Composite)

---

## 5. Relationships

| Parent Entity | Child Entity | Foreign Key | Cardinality | Optionality | Delete Behavior | Business Meaning |
|---|---|---|---|---|---|---|
| `users` | `customers` | `user_id` | 1 : 1 | Optional | `CASCADE` | User profile customer details. |
| `users` | `vendors` | `user_id` | 1 : 1 | Optional | `RESTRICT` | User identity owning approved vendor account. |
| `roles` | `user_roles` | `role_id` | 1 : N | Mandatory | `CASCADE` | System role binding to users. |
| `users` | `user_roles` | `user_id` | 1 : N | Mandatory | `CASCADE` | User assigned roles. |
| `roles` | `role_permissions` | `role_id` | 1 : N | Mandatory | `CASCADE` | System role binding to permissions (`FR-AUTH-004`). |
| `permissions` | `role_permissions` | `permission_id` | 1 : N | Mandatory | `CASCADE` | Granular permission assigned to role. |
| `users` | `vendor_applications` | `applicant_user_id` | 1 : N | Mandatory | `RESTRICT` | Applicant user submitting vendor registration. |
| `vendor_applications` | `vendors` | `application_id` | 1 : 1 | Optional | `RESTRICT` | Approved application generating active vendor account (`BR-001`). |
| `vendors` | `store_profiles` | `vendor_id` | 1 : 1 | Mandatory | `CASCADE` | Public store storefront profile owned by vendor. |
| `vendors` | `products` | `vendor_id` | 1 : N | Mandatory | `RESTRICT` | Catalog products owned by vendor (`BR-002`, `BR-012`). |
| `categories` | `products` | `category_id` | 1 : N | Mandatory | `RESTRICT` | Product catalog classification. |
| `categories` | `categories` | `parent_category_id` | 1 : N | Optional | `RESTRICT` | Parent-child hierarchical category structure. |
| `brands` | `products` | `brand_id` | 1 : N | Optional | `SET NULL` | Product brand metadata association. |
| `products` | `product_images` | `product_id` | 1 : N | Optional | `CASCADE` | Cloudinary media assets attached to product. |
| `products` | `inventories` | `product_id` | 1 : 1 | Mandatory | `CASCADE` | Inventory stock record backing catalog item (`BR-005`). |
| `customers` | `carts` | `customer_id` | 1 : 1 | Mandatory | `CASCADE` | Active customer shopping cart container. |
| `carts` | `cart_items` | `cart_id` | 1 : N | Mandatory | `CASCADE` | Line items added to shopping cart. |
| `customers` | `orders` | `customer_id` | 1 : N | Mandatory | `RESTRICT` | Customer parent orders (`BR-003`). |
| `orders` | `vendor_orders` | `parent_order_id` | 1 : N | Mandatory | `RESTRICT` | Multi-vendor order split sub-orders (`BR-011`). |
| `vendors` | `vendor_orders` | `vendor_id` | 1 : N | Mandatory | `RESTRICT` | Vendor sub-orders owned by specific vendor (`BR-002`). |
| `vendor_orders` | `order_items` | `vendor_order_id` | 1 : N | Mandatory | `CASCADE` | Line items belonging to specific vendor order. |
| `orders` | `payments` | `parent_order_id` | 1 : N | Mandatory | `RESTRICT` | Checkout payment transactions attached to parent order (`BR-009`). |
| `payments` | `refunds` | `payment_id` | 1 : N | Optional | `RESTRICT` | Financial refunds linked to parent payment. |
| `vendor_orders` | `deliveries` | `vendor_order_id` | 1 : 1 | Mandatory | `RESTRICT` | Delivery fulfillment workflow tracking (`BR-013`). |
| `deliveries` | `delivery_assignments` | `delivery_id` | 1 : N | Optional | `CASCADE` | Delivery staff assignment records. |
| `customers` | `reviews` | `customer_id` | 1 : N | Mandatory | `RESTRICT` | Verified product customer review (`BR-004`). |
| `order_items` | `reviews` | `order_item_id` | 1 : 1 | Optional | `RESTRICT` | Verified purchased line item enabling customer review (`BR-004`). |
| `vendor_orders` | `commissions` | `vendor_order_id` | 1 : 1 | Mandatory | `RESTRICT` | Platform commission calculation ledger (`BR-014`). |
| `vendors` | `payouts` | `vendor_id` | 1 : N | Optional | `RESTRICT` | Financial payout records to vendor. |

---

## 6. Multi-Vendor Order Data Model

The multi-vendor order model implements **BR-011 (Multi-Vendor Order Splitting)** and **BR-002 (Vendor Data Isolation)** through a two-tiered hierarchy:

```
Customer
   │
   ▼
[ orders ] (Parent Order)
   ├── total_amount, customer_id, shipping_address_id, overall_status
   ├──► [ payments ] (Parent Payment Transaction)
   │
   ├──► [ vendor_orders ] (Vendor Sub-Order A: Vendor 1)
   │       ├── subtotal_amount, commission_amount, status
   │       └──► [ order_items ] (Line Items for Vendor 1 Products)
   │
   └──► [ vendor_orders ] (Vendor Sub-Order B: Vendor 2)
           ├── subtotal_amount, commission_amount, status
           └──► [ order_items ] (Line Items for Vendor 2 Products)
```

### Key Architectural Isolation Rules:
1. **Single Checkout Experience:** Customer places one transaction resulting in one `orders` (Parent Order) record and one attached `payments` record.
2. **Deterministic Splitting:** Cart items are grouped by `products.vendor_id`. A separate `vendor_orders` sub-order is created for each distinct vendor.
3. **Data Isolation:** Vendor portals query strictly against `vendor_orders WHERE vendor_id = @CurrentVendorId`. A vendor can only inspect their sub-orders and line items (`BR-002`).
4. **Independent Lifecycle Tracking:** Each `vendor_orders` sub-order maintains independent fulfillment states (`Processing`, `ReadyForPickup`, `OutForDelivery`, `Delivered`).

---

## 7. Inventory Data Model

The inventory data model enforces **BR-005 (Inventory Validation)** and **BR-006 (Inventory Reservation)**:

```
[ products ] ── 1:1 ──► [ inventories ] ── 1:N ──► [ inventory_movements ]
                           ├── quantity_available     ├── movement_type (Reservation/Deduction)
                           ├── quantity_reserved      ├── quantity_change
                           └── low_stock_threshold    └── reference_order_id
```

### Core Operations:
* **Stock Validation (`BR-005`):** `inventories.quantity_available` must be `>= requested_quantity`.
* **Stock Reservation (`BR-006`):** Upon checkout initiation, stock is reserved by decrementing `quantity_available` and incrementing `quantity_reserved`.
* **Stock Consumption (`BR-009`):** Upon payment confirmation, `quantity_reserved` is decremented and `inventory_movements` records an `OrderDeduction`.
* **Stock Release:** Upon order cancellation, `quantity_reserved` is decremented and `quantity_available` is incremented.

### Deferred Technical Decisions:
* Reservation expiration timeout, DB pessimistic/optimistic locking strategy, and background worker concurrency implementation remain **Deferred Technical Design Decisions**.

---

## 8. Payment & Refund Data Model

Supporting **BR-009 (Payment Confirmation)** across Cash-on-Delivery (COD) and Online Payment methods:

```
[ orders ] (Parent Order)
   │
   ├──► [ payments ]
   │       ├── payment_method ('COD', 'OnlineGateway')
   │       ├── provider_name ('CashOnDelivery', 'ExternalGateway')
   │       ├── transaction_reference ('pi_3MtwB2Lkd...')
   │       ├── status ('Pending', 'Completed', 'Failed')
   │       └── amount
   │
   └──► [ refunds ] (Linked via payment_id and optional vendor_order_id)
           ├── refund_amount, status, reason
           └── gateway_refund_reference
```

### Security & PCI-DSS Compliance:
* **No Raw Financial Credentials:** No credit card numbers, CVVs, expiration dates, or bank tokens are stored in the database.
* **Provider Independence:** Payment gateway choice is abstracted via `provider_name` and `transaction_reference`. Hardcoding specific payment providers remains deferred.

---

## 9. Vendor Onboarding Data Model

Enforcing **BR-001 (Vendor Approval Requirement)**:

```
[ users ] (Applicant Identity)
   │
   ▼
[ vendor_applications ]
   ├── status: 'Pending' ──► 'UnderReview' ──► 'Approved' / 'Rejected'
   │                                                │
   ├──► [ vendor_verification_records ]            │ (Upon Admin Approval)
   │       └── document_url                         ▼
   │                                           [ vendors ] (Active Vendor Account)
   │                                                │
   │                                                ▼
   └─────────────────────────────────────────► [ store_profiles ]
```

### Lifecycle Rules:
1. **Applicant Submission:** Vendor applicant submits `vendor_applications` with status `'Pending'`. No selling access is granted.
2. **Admin Review (`AF-004`):** If approved, admin updates application status to `'Approved'`, creating the 1:1 `vendors` record (`UNIQUE(application_id)`) and corresponding `store_profiles`.
3. **Rejection:** Rejection sets status to `'Rejected'` with `rejection_reason`; no `vendors` record is created.
4. **Suspension:** If admin suspends a vendor (`BR-015`), `vendors.status` is set to `'Suspended'`, hiding their products (`BR-012`).

---

## 10. Product & Media Data Model

Enforcing **BR-012 (Product Visibility Rule)**:

```
[ categories ] ──┐
                 ├──► [ products ] ── 1:N ──► [ product_images ]
[ brands ] ──────┘       ├── vendor_id            ├── image_url (Cloudinary)
                         ├── status ('Published') └── is_primary
                         └── is_active (true)
```

### Media Storage Architecture:
* Binary image files are uploaded directly to Cloudinary. PostgreSQL stores only secure metadata (`image_url`, `cloudinary_public_id`, `is_primary`, `display_order`).

---

## 11. Location Data Model

Supporting location-aware discovery and delivery fulfillment:

```
[ addresses ]
   ├── user_id (Nullable for anonymous / linked to user)
   ├── street_address, city, state_province, postal_code
   ├── latitude (DECIMAL 10,8)
   └── longitude (DECIMAL 11,8)
```

### Location Design Notes:
* Standard `DECIMAL(10,8)` for latitude and `DECIMAL(11,8)` for longitude provide sub-meter accuracy without requiring spatial GIS database overhead for MVP.
* PostGIS spatial indexing extension evaluation remains a **Deferred Technical Design Decision**.

---

## 12. Search Log Data Model

Enforcing **BR-010 (Search Logging)**:

```
[ search_logs ]
   ├── search_term ('fresh organic milk')
   ├── normalized_term ('fresh organic milk')
   ├── result_count (0 -> Zero result detection)
   ├── user_id (Nullable)
   └── created_at (TIMESTAMPTZ)
```

### Search Architecture Separation:
* `search_logs` is used exclusively for analytics and zero-result tracking (`BR-010`).
* Catalog product search executes against `products`, `categories`, and `brands` using native PostgreSQL full-text search (`tsvector` / GIN index).

---

## 13. Coupon / Commission / Payout Data Model

Enforcing **BR-008 (Coupon Enforcement)** and **BR-014 (Commission Calculation)**:

```
[ coupons ] ── 1:N ──► [ coupon_usages ] ──► [ orders ]
                                                 │
                                                 ▼
[ vendors ] ── 1:N ──► [ vendor_orders ] ── 1:1 ──► [ commissions ]
     │                                                    │
     └───────────────── 1:N ──► [ payouts ] ──────────────┘
```

---

## 14. Review & Rating Data Model

Enforcing **BR-004 (Customer Review Eligibility)**:

```
[ customers ] ──┐
                ├──► [ reviews ] ◄── 1:1 ── [ order_items ] (Verified Purchase Limit)
[ products ] ───┘       ├── rating (1 to 5)
                        └── comment
```

### Review Integrity:
* `UNIQUE(order_item_id)` constraint enforces structural uniqueness (at most 1 review per purchased line item).
* Complete eligibility verification (`Customer -> Order -> VendorOrder -> OrderItem`) and delivery confirmation is enforced by the **Application / Service Tier** prior to insertion.

---

## 15. Notification Data Model

Supporting persistent system notifications across all 4 actor types (`FR-NOTIF-001`):

```
[ users ] ── 1:N ──► [ notifications ]
                       ├── recipient_user_id
                       ├── category ('OrderUpdate', 'VendorApproval', 'DeliveryAssignment')
                       ├── reference_entity_type ('Order')
                       ├── reference_entity_id (UUID)
                       └── is_read (BOOLEAN)
```

---

## 16. Audit Log Data Model

Enforcing **FR-AUDIT-001 (Security & Governance Auditing)**:

```
[ audit_logs ]
   ├── actor_user_id
   ├── action ('VendorApplicationApproved', 'ProductSuspended')
   ├── entity_name ('VendorApplication')
   ├── entity_id (UUID)
   ├── old_values_json (JSONB snapshot)
   ├── new_values_json (JSONB snapshot)
   ├── ip_address
   └── created_at
```

---

## 17. Security & Data Isolation

### 17.1 Vendor Data Isolation (BR-002, NFR-SEC-003)
* Every vendor resource (`products`, `vendor_orders`, `store_profiles`, `commissions`, `payouts`) contains explicit `vendor_id` FK attributes. Web API queries append strict tenant filter `WHERE vendor_id = @CurrentVendorId`.

### 17.2 Customer Order Isolation (BR-003)
* Customer queries strictly enforce `WHERE customer_id = @CurrentCustomerId`.

### 17.3 Database Level Row Level Security (RLS)
* PostgreSQL RLS evaluation for Supabase integration is marked as a **Deferred Technical Design Decision**. Primary isolation is enforced at the ASP.NET Core API application tier via contextual queries.

---

## 18. Indexing Strategy

| Table Name | Index Name | Type | Index Columns | Purpose / Business Rationale |
|---|---|---|---|---|
| `users` | `idx_users_email` | B-Tree Unique | `email` | Fast user login & uniqueness enforcement. |
| `permissions` | `idx_permissions_name` | B-Tree Unique | `name` | Fast permission token lookup (`FR-AUTH-004`). |
| `refresh_tokens` | `idx_refresh_tokens_hash` | B-Tree Unique | `token_hash` | Fast token validation during JWT refresh. |
| `vendor_applications` | `idx_vendor_app_status` | B-Tree | `status` | Admin filtering for pending applications (`AF-004`). |
| `vendors` | `idx_vendors_slug` | B-Tree Unique | `slug` | Public vendor store URL lookup. |
| `vendors` | `idx_vendors_app` | B-Tree Unique | `application_id` | Guarantees single vendor per approved application. |
| `products` | `idx_products_vendor` | B-Tree | `vendor_id` | Fast vendor catalog filtering & isolation (`VF-007`). |
| `products` | `idx_products_category` | B-Tree | `category_id` | Customer category browsing (`CF-008`). |
| `products` | `idx_products_sku` | B-Tree Unique | `sku` | Product SKU lookup & uniqueness. |
| `products` | `idx_products_search` | GIN | `to_tsvector('english', name \|\| ' ' \|\| description)` | Native full-text search query execution (`FR-SEARCH-001`). |
| `orders` | `idx_orders_customer` | B-Tree | `customer_id` | Fast customer order history retrieval (`CF-023`). |
| `vendor_orders` | `idx_vendor_orders_vendor` | B-Tree | `vendor_id` | Fast vendor sub-order filtering & isolation (`VF-011`). |
| `deliveries` | `idx_deliveries_status` | B-Tree | `status` | Delivery staff active assignment matching (`DF-001`). |

---

## 19. Constraints & Data Integrity

1. **Uniqueness Constraints:** `users(email)`, `permissions(name)`, `vendors(slug)`, `vendors(application_id)`, `vendors(user_id)`, `products(slug)`, `products(sku)`, `categories(slug)`, `orders(order_number)`, `vendor_orders(sub_order_number)`, `coupons(code)`, `reviews(order_item_id)`, `inventories(product_id)`.
2. **Numeric Check Constraints:** `products.price >= 0.00`, `inventories.quantity_available >= 0`, `inventories.quantity_reserved >= 0`, `vendors.commission_rate BETWEEN 0.00 AND 100.00`, `reviews.rating BETWEEN 1 AND 5`, `order_items.quantity > 0`.
3. **Status Enumeration Constraints:** `vendor_applications.status IN ('Pending', 'UnderReview', 'Approved', 'Rejected')`, `vendors.status IN ('Approved', 'Suspended', 'Inactive')`, `products.status IN ('Draft', 'Published', 'Archival', 'Suspended')`, `vendor_orders.status IN ('Pending', 'Processing', 'ReadyForPickup', 'OutForDelivery', 'Delivered', 'Cancelled')`, `deliveries.status IN ('Unassigned', 'Assigned', 'PickedUp', 'InTransit', 'Delivered', 'Failed')`.

---

## 20. Entity Relationship Diagram (ERD)

```mermaid
erDiagram

    users ||--o| customers : "has profile"
    users ||--o| vendors : "owns vendor account"
    users ||--oN user_roles : "assigned"
    roles ||--oN user_roles : "defines"
    roles ||--oN role_permissions : "grants"
    permissions ||--oN role_permissions : "included in"
    users ||--oN refresh_tokens : "authenticates"
    users ||--oN vendor_applications : "submits"

    vendor_applications ||--o| vendors : "approved to"
    vendor_applications ||--oN vendor_verification_records : "attaches"
    vendors ||--o| store_profiles : "manages"
    users ||--oN addresses : "maintains"

    vendors ||--oN products : "owns"
    categories ||--oN products : "classifies"
    categories ||--oN categories : "parent of"
    brands ||--oN products : "brands"
    products ||--oN product_images : "contains"
    products ||--o| inventories : "backed by"
    inventories ||--oN inventory_movements : "logs"

    customers ||--o| carts : "owns"
    carts ||--oN cart_items : "contains"
    products ||--oN cart_items : "added as"

    customers ||--o| wishlists : "owns"
    wishlists ||--oN wishlist_items : "contains"
    products ||--oN wishlist_items : "saved as"

    customers ||--oN orders : "places"
    coupons ||--oN orders : "applied to"
    orders ||--oN vendor_orders : "splits into"
    vendors ||--oN vendor_orders : "receives"
    vendor_orders ||--oN order_items : "contains"
    products ||--oN order_items : "purchased as"

    orders ||--oN payments : "funded by"
    payments ||--oN refunds : "refunded by"

    vendor_orders ||--o| deliveries : "fulfilled by"
    deliveries ||--oN delivery_assignments : "assigned to"
    users ||--oN delivery_assignments : "executed by"

    vendor_orders ||--o| commissions : "incurs"
    vendors ||--oN payout : "disbursed to"

    customers ||--oN reviews : "writes"
    products ||--oN reviews : "rated in"
    order_items ||--o| reviews : "verified by"

    users ||--oN notifications : "notified via"
    users ||--oN audit_logs : "audited in"
    users ||--oN search_logs : "searches logged in"
```

---

## 21. Normalization Review

* **3NF Validation:** All non-key columns strictly depend on the primary key.
* **Justified Denormalization:**
  1. `order_items.product_name_snapshot` & `unit_price`: Preserves financial immutability when vendor updates catalog price/title in the future.
  2. `vendor_orders.subtotal_amount` & `commission_amount`: Aggregated total cached at sub-order level to prevent expensive dynamic subquery re-calculations during vendor dashboard rendering (`NFR-PERF-003`).

---

## 22. Future Extensibility

1. **Multi-Branch Support:** Schema accommodates future `branches` and `branch_inventories` linked to `vendors`.
2. **AI & Vector Embeddings:** `products` can be extended with a `pgvector` column (`embedding vector(1536)`).
3. **Live GPS Driver Tracking:** `deliveries` table can link to a future `driver_location_logs` table.

---

## 23. Deferred Database Design Decisions

The following technical decisions remain explicitly deferred for future architecture/LLD phases:

1. **Inventory Reservation Expiration Timeout & Cleanup Mechanics:** Locking strategy (optimistic vs pessimistic) and automated cleanup job for expired holds.
2. **Exact Payment Provider:** Specific payment gateway selection (Stripe vs local provider).
3. **Maps API Provider & PostGIS Extension:** Evaluation of PostGIS vs standard PostgreSQL decimal lat/long.
4. **SignalR Connection State & Group Persistence:** In-memory Redis vs DB notification backing.
5. **Commission Calculation Financial Base:** Pre-vs-post discount basis, tax/shipping commission eligibility.
6. **Partial Multi-Vendor Order Refund Mechanics:** Financial rules for partial multi-vendor order failures.
7. **Password Hashing Algorithm Choice:** Argon2id vs BCrypt parameters (`NFR-SEC-001`).
8. **Deployment Architecture & Database Replication:** Supabase Managed Postgres vs AWS RDS Multi-AZ topology.
9. **Jurisdiction-Specific Vendor Verification Documents:** Regional legal compliance document requirements.
10. **PostgreSQL Row Level Security (RLS) Policy Mechanics:** Direct Supabase RLS vs ASP.NET Core API application-level tenancy.
11. **Database Connection Pooling Architecture:** PgBouncer vs EF Core internal connection pool sizing.
12. **Vendor Reapplication Mechanics:** Whether rejected vendors submit a new application record or update an existing application record.

---

## 24. Requirements Traceability

| Entity Name | Primary Business Rule(s) | Primary FR(s) | Primary Use Case(s) | Business Domain |
|---|---|---|---|---|
| `users`, `roles`, `permissions`, `user_roles`, `role_permissions` | `BR-007` | `FR-AUTH-001` to `FR-AUTH-005` | `UC-CUST-001`, `UC-ADMIN-001` | Identity & Access |
| `vendor_applications`, `vendors` | `BR-001`, `BR-015` | `FR-VEND-001` to `FR-VEND-003` | `UC-VEND-001`, `UC-ADMIN-003` | Vendor Management |
| `store_profiles`, `addresses` | `BR-002` | `FR-VEND-004`, `FR-LOC-001` | `UC-VEND-003`, `UC-CUST-003` | Customer / Vendor |
| `categories`, `brands`, `products` | `BR-012` | `FR-PROD-001` to `FR-PROD-004` | `UC-VEND-004`, `UC-CUST-004` | Catalog |
| `inventories`, `inventory_movements` | `BR-005`, `BR-006` | `FR-INV-001` to `FR-INV-004` | `UC-VEND-005`, `UC-CUST-008` | Inventory |
| `carts`, `cart_items` | `BR-005` | `FR-CART-001` to `FR-CART-003` | `UC-CUST-005`, `UC-CUST-006` | Shopping |
| `orders`, `vendor_orders`, `order_items` | `BR-002`, `BR-003`, `BR-011` | `FR-ORDER-001` to `FR-ORDER-004` | `UC-CUST-008`, `UC-VEND-006` | Orders |
| `payments`, `refunds` | `BR-009` | `FR-PAY-001` to `FR-PAY-004` | `UC-CUST-008`, `UC-ADMIN-005` | Payments |
| `deliveries`, `delivery_assignments` | `BR-013` | `FR-DEL-001` to `FR-DEL-003` | `UC-DEL-001`, `UC-DEL-002` | Delivery |
| `coupons`, `coupon_usages` | `BR-008` | `FR-COMM-001` | `UC-CUST-006`, `UC-ADMIN-006` | Promotions / Finance |
| `commissions`, `payouts` | `BR-014` | `FR-COMM-002`, `FR-COMM-003` | `UC-ADMIN-005`, `UC-VEND-006` | Promotions / Finance |
| `reviews` | `BR-004` | `FR-REVIEW-001` to `FR-REVIEW-003` | `UC-CUST-010` | Engagement |
| `notifications` | — | `FR-NOTIF-001` | `UC-CUST-009`, `UC-VEND-006` | Engagement |
| `search_logs` | `BR-010` | `FR-SEARCH-005` | `UC-CUST-003` | Search / Audit |
| `audit_logs` | `BR-007` | `FR-AUDIT-001` | `UC-ADMIN-001` to `UC-ADMIN-006` | Audit |

---

## 25. Database Design Risks / Open Questions

1. **Inventory Concurrency Risk:** High contention on popular products during checkout requires robust isolation (evaluated during LLD).
2. **Financial Rounding Consistency:** Multicurrency and fractional percentage commission calculations must use standard bankers' rounding.
3. **Audit Log Table Growth:** High transactional throughput will rapidly expand `audit_logs` and `search_logs`, requiring partitioning in Future phases.

---

## 26. Database Design Validation Checklist

| Item | Validation Criteria | Verification Status |
|---|---|---|
| 1 | RBAC permissions classification (`permissions`, `role_permissions`) is consistent with SRS (`FR-AUTH-004`). | **VERIFIED (MVP)** |
| 2 | Review ownership cannot be falsely claimed from `order_item_id` alone; application-layer eligibility pipeline specified. | **VERIFIED** |
| 3 | VendorApplication → Vendor lifecycle & duplicate prevention (`UNIQUE(application_id)`, `UNIQUE(user_id)`) clarified. | **VERIFIED** |
| 4 | Payment ownership (`payments` attached strictly to parent `orders`) is unambiguous. | **VERIFIED** |
| 5 | Product search (PostgreSQL `tsvector` GIN on catalog) is separated from search logging (`search_logs`). | **VERIFIED** |
| 6 | Inventory quantity semantics (`quantity_available` vs `quantity_reserved`) avoid double-counting. | **VERIFIED** |
| 7 | Product variants (`product_variants`) remain Deferred/Future as MVP SRS uses base SKU per product. | **VERIFIED** |
| 8 | All 15 Business Rules (`BR-001` to `BR-015`) are represented. | **VERIFIED** |
| 9 | All 56 Functional Requirements (FRs) have schema persistence support. | **VERIFIED** |
| 10 | All 24 formal Use Cases (UCs) have backing data structures. | **VERIFIED** |
| 11 | Vendor data isolation (`vendor_id` filters, `BR-002`) is represented. | **VERIFIED** |
| 12 | Customer order isolation (`customer_id` filters, `BR-003`) is represented. | **VERIFIED** |
| 13 | Multi-vendor order splitting (`orders` -> `vendor_orders`, `BR-011`) is represented. | **VERIFIED** |
| 14 | Payment confirmation tracking (`payments`, `BR-009`) is represented. | **VERIFIED** |
| 15 | Inventory stock validation & reservation (`inventories`, `BR-005`, `BR-006`) are represented. | **VERIFIED** |
| 16 | Persistent notifications across 4 actors (`notifications`) are represented. | **VERIFIED** |
| 17 | Future scope features (pgvector, live GPS, multi-branch) have NOT been prematurely implemented. | **VERIFIED** |

---

## 27. Phase 05 Correction Notes

### 27.1 Issues Identified & Corrections Applied
1. **RBAC / Permissions Reclassification:** Reclassified `permissions` and `role_permissions` from Deferred to **MVP** to align strictly with SRS `FR-AUTH-004` (permission-based authorization and least privilege).
2. **Review Ownership & Eligibility Clarification:** Explicitly documented that while `reviews.order_item_id` provides structural 1:1 uniqueness, complete eligibility verification (`Customer -> Order -> VendorOrder -> OrderItem` + `Delivered` status) is enforced at the **Application / Service Tier** prior to Insertion (`BR-004`).
3. **Vendor Application Lifecycle & Duplicate Prevention:** Clarified that `vendors.application_id` has a `UNIQUE` constraint preventing duplicate vendor generation per application. Added rejection and suspension rules, and marked reapplication mechanics as a deferred decision.
4. **Unambiguous Payment Ownership:** Clarified that `payments` records belong strictly to the parent `orders` record (`parent_order_id`). Sub-order vendor amounts are tracked via `commissions` and `vendor_orders`.
5. **Product Search vs Search Logs Separation:** Explicitly separated PostgreSQL catalog full-text search (`products`, `categories`, `brands` with GIN index) from telemetry logging (`search_logs`).
6. **Inventory Quantity Semantics:** Defined `quantity_available` as unreserved stock for new orders and `quantity_reserved` as held stock for unconfirmed orders, establishing total physical stock as `(quantity_available + quantity_reserved)` to eliminate double-counting.
7. **Product Variants Scope Confirmation:** Confirmed `product_variants` remains **Deferred / Future** as MVP SRS (`FR-PROD-001`) relies on base SKU per Product.

### 27.2 Decisions Still Deferred
* Reservation hold expiration timeout & lock cleanup mechanics.
* Exact payment provider selection (Stripe vs local provider).
* Maps API provider & PostGIS spatial extension evaluation.
* SignalR connection state & group persistence store.
* Commission calculation financial base details.
* Partial multi-vendor order refund mechanics.
* Password hashing algorithm parameters (`NFR-SEC-001`).
* Deployment architecture & database replication topology.
* Jurisdiction-specific vendor verification document rules.
* PostgreSQL Row Level Security (RLS) policy mechanics.
* Database connection pooling architecture.
* Vendor reapplication mechanics.

### 27.3 Confirmation of Zero Code Execution
* **Code Changes:** `NONE`
* **SQL / Migration Creation:** `NONE`
* **EF Core Entity Generation:** `NONE`
* **Supabase Live Configuration:** `NONE`

---

*End of Phase 05 — Controlled Correction Pass Document.*
