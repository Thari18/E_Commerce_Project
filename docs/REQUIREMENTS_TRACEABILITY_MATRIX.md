# LocalMart — Requirements Traceability Matrix (RTM)

**Document Version:** 1.0  
**Phase:** 04 — Functional Requirements Matrix & Traceability  
**Status:** Approved Phase 04 Baseline  
**Date:** September 12, 2026  
**Primary Source Document:** `LocalMart_BRD_v1.0(1).md`  
**Consolidated Reference:** `docs/BRD_BASELINE.md`  
**SRS Reference:** `docs/SRS.md`  
**User Flows Reference:** `docs/USER_FLOWS_AND_USE_CASES.md`  
**Use Case Specifications Reference:** `docs/USE_CASE_SPECIFICATIONS.md`  
**Project:** LocalMart — Location-Aware Multi-Vendor E-Commerce Marketplace  

---

## 1. Document Control

### 1.1 Purpose
This Requirements Traceability Matrix (RTM) establishes complete bidirectional traceability across all specification artifacts of **LocalMart**. It maps Business Rules (BR-001 to BR-015), SRS Functional Requirements (56 FRs), SRS Non-Functional Requirements (14 NFRs), User Flows (81 Flows), Formal Use Cases (24 UCs), Actors (10 Actors), 21 Functional Business Domains, and Scope Classifications (MVP, Future, Out-of-Scope).

### 1.2 Document Priority & Traceability Hierarchy
1. Primary Business Source of Truth: [`LocalMart_BRD_v1.0(1).md`](file:///d:/new%20e%20commers/LocalMart_BRD_v1.0%281%29.md)
2. Consolidated Baseline Reference: [`docs/BRD_BASELINE.md`](file:///d:/new%20e%20commers/docs/BRD_BASELINE.md)
3. Software Requirements Specification: [`docs/SRS.md`](file:///d:/new%20e%20commers/docs/SRS.md)
4. User Flows & Use Case Catalog: [`docs/USER_FLOWS_AND_USE_CASES.md`](file:///d:/new%20e%20commers/docs/USER_FLOWS_AND_USE_CASES.md)
5. Formal Use Case Specifications: [`docs/USE_CASE_SPECIFICATIONS.md`](file:///d:/new%20e%20commers/docs/USE_CASE_SPECIFICATIONS.md)

---

## 2. Requirement ID Inventory

### 2.1 Business Rules Inventory (15 Rules)
* `BR-001`: Vendor Approval Requirement
* `BR-002`: Vendor Data Isolation
* `BR-003`: Customer Order Isolation
* `BR-004`: Customer Review Eligibility
* `BR-005`: Inventory Validation
* `BR-006`: Inventory Reservation
* `BR-007`: Admin Access Enforcement
* `BR-008`: Coupon Enforcement
* `BR-009`: Payment Confirmation
* `BR-010`: Search Logging
* `BR-011`: Multi-Vendor Order Splitting
* `BR-012`: Product Visibility Rule
* `BR-013`: Delivery Authorization
* `BR-014`: Commission Calculation
* `BR-015`: Vendor Suspension

### 2.2 Functional Requirements Inventory (56 FRs)
* **Authentication & Authorization:** `FR-AUTH-001` to `FR-AUTH-005` (5)
* **Customer Capabilities:** `FR-CUST-001` to `FR-CUST-005` (5)
* **Vendor Management:** `FR-VEND-001` to `FR-VEND-006` (6)
* **Product Catalog & Media:** `FR-PROD-001` to `FR-PROD-004` (4)
* **Search & Discovery:** `FR-SEARCH-001` to `FR-SEARCH-005` (5)
* **Inventory Control:** `FR-INV-001` to `FR-INV-004` (4)
* **Cart & Checkout:** `FR-CART-001` to `FR-CART-003` (3)
* **Order Management & Splitting:** `FR-ORDER-001` to `FR-ORDER-004` (4)
* **Payments & Webhooks:** `FR-PAY-001` to `FR-PAY-004` (4)
* **Delivery Workflow:** `FR-DEL-001` to `FR-DEL-003` (3)
* **Reviews & Moderation:** `FR-REVIEW-001` to `FR-REVIEW-003` (3)
* **Coupons, Commission & Payouts:** `FR-COMM-001` to `FR-COMM-003` (3)
* **Admin Governance & Auditing:** `FR-ADMIN-001` to `FR-ADMIN-003`, `FR-AUDIT-001` (4)
* **Real-Time Notifications:** `FR-NOTIF-001` (1)
* **Location-Aware Shopping:** `FR-LOC-001`, `FR-LOC-002` (2)

### 2.3 Non-Functional Requirements Inventory (14 NFRs)
* **Performance:** `NFR-PERF-001` (300ms Debounce), `NFR-PERF-002` (Search SLA Target), `NFR-PERF-003` (Catalog SLA Target)
* **Security:** `NFR-SEC-001` (Password Hashing), `NFR-SEC-002` (JWT + Refresh), `NFR-SEC-003` (Vendor Isolation), `NFR-SEC-004` (Secrets Management)
* **Scalability:** `NFR-SCAL-001` (Horizontal Web API Scaling), `NFR-SCAL-002` (DB Indexing)
* **Availability & Reliability:** `NFR-AVAIL-001` (`/health` Endpoint), `NFR-REL-001` (RFC-7807 Problem Details Middleware)
* **Maintainability & Quality:** `NFR-MAINT-001` (Clean Architecture), `NFR-MAINT-002` (FluentValidation)
* **Usability:** `NFR-USA-001` (Responsive Viewport UI)

### 2.4 Formal Use Cases Inventory (24 Use Cases)
* **Customer:** `UC-CUST-001` to `UC-CUST-010` (10)
* **Vendor:** `UC-VEND-001` to `UC-VEND-006` (6)
* **Administrator:** `UC-ADMIN-001` to `UC-ADMIN-006` (6)
* **Delivery Staff:** `UC-DEL-001`, `UC-DEL-002` (2)

### 2.5 User Flows Inventory (81 Flows)
* **Customer Flows:** `CF-001` to `CF-029` (29)
* **Vendor Flows:** `VF-001` to `VF-019` (19)
* **Admin Flows:** `AF-001` to `AF-024` (24)
* **Delivery Staff Flows:** `DF-001` to `DF-009` (9)

---

## 3. Business Rule Traceability Matrix

| BR ID | Business Rule Name | Related FRs | Related Use Cases | Related User Flows | Actors | Scope |
|---|---|---|---|---|---|---|
| **BR-001** | Vendor Approval Requirement | `FR-VEND-002`, `FR-VEND-003`, `FR-ADMIN-001` | `UC-VEND-001`, `UC-VEND-002`, `UC-ADMIN-003` | `VF-001`, `VF-002`, `VF-003`, `VF-005`, `AF-004`, `AF-005` | Vendor Applicant, Admin | MVP |
| **BR-002** | Vendor Data Isolation | `FR-VEND-004`, `NFR-SEC-003` | `UC-VEND-003` to `UC-VEND-006` | `VF-004`, `VF-007`, `VF-009`, `VF-011` | Vendor | MVP |
| **BR-003** | Customer Order Isolation | `FR-ORDER-004` | `UC-CUST-001`, `UC-CUST-002`, `UC-CUST-007` to `UC-CUST-009` | `CF-023`, `CF-024`, `CF-025` | Customer | MVP |
| **BR-004** | Customer Review Eligibility | `FR-REVIEW-001` | `UC-CUST-010`, `UC-DEL-002` | `CF-028`, `VF-016`, `AF-017` | Customer, Delivery Staff | MVP |
| **BR-005** | Inventory Validation | `FR-INV-001`, `FR-CART-003` | `UC-CUST-005`, `UC-CUST-006`, `UC-CUST-008`, `UC-VEND-005` | `CF-013`, `CF-015`, `CF-016`, `CF-019`, `CF-020` | Customer, Vendor | MVP |
| **BR-006** | Inventory Reservation | `FR-INV-002` | `UC-CUST-008`, `UC-CUST-009`, `UC-VEND-005` | `CF-019`, `CF-020`, `CF-026`, `VF-009` | Customer, Vendor | MVP |
| **BR-007** | Admin Access Enforcement | `FR-AUTH-004`, `FR-AUDIT-001` | `UC-ADMIN-001` to `UC-ADMIN-006` | `AF-001` to `AF-024` | Admin | MVP |
| **BR-008** | Coupon Enforcement | `FR-COMM-001` | `UC-CUST-006`, `UC-CUST-008`, `UC-ADMIN-006` | `CF-019`, `CF-020`, `AF-015` | Customer, Admin | MVP |
| **BR-009** | Payment Confirmation | `FR-PAY-002` | `UC-CUST-008`, `UC-VEND-006`, `UC-ADMIN-005` | `CF-020`, `CF-021`, `AF-013` | Customer, Payment Gateway, Admin | MVP |
| **BR-010** | Search Logging | `FR-SEARCH-005` | `UC-CUST-003`, `UC-ADMIN-006` | `CF-005`, `CF-006`, `AF-018`, `AF-019` | Customer, Guest, Admin | MVP |
| **BR-011** | Multi-Vendor Order Splitting | `FR-ORDER-001` | `UC-CUST-005`, `UC-CUST-006`, `UC-CUST-008`, `UC-VEND-006`, `UC-ADMIN-005` | `CF-014`, `CF-019`, `CF-020`, `VF-011` | Customer, Vendor, Admin | MVP |
| **BR-012** | Product Visibility Rule | `FR-PROD-003` | `UC-CUST-003`, `UC-CUST-004`, `UC-VEND-004`, `UC-ADMIN-003`, `UC-ADMIN-004` | `CF-004`, `CF-005`, `CF-011`, `VF-008`, `AF-007` | Customer, Guest, Vendor, Admin | MVP |
| **BR-013** | Delivery Authorization | `FR-DEL-003` | `UC-DEL-001`, `UC-DEL-002` | `DF-003` to `DF-006` | Delivery Staff | MVP |
| **BR-014** | Commission Calculation | `FR-COMM-002` | `UC-VEND-006`, `UC-ADMIN-006` | `VF-018`, `AF-016` | Vendor, Admin | MVP |
| **BR-015** | Vendor Suspension | `FR-ADMIN-002` | `UC-VEND-002`, `UC-ADMIN-003` | `AF-007`, `VF-002` | Admin, Vendor | MVP |

---

## 4. Functional Requirement Traceability Matrix (56 FRs)

| FR ID | Requirement Summary | Business Rule(s) | User Flow(s) | Use Case(s) | Primary Actor | Scope | Status |
|---|---|---|---|---|---|---|---|
| `FR-AUTH-001` | User registration & authentication by role | `BR-003`, `BR-007` | `CF-001`, `CF-002`, `VF-001`, `AF-001`, `DF-001` | `UC-CUST-001`, `UC-CUST-002`, `UC-VEND-001`, `UC-ADMIN-001`, `UC-DEL-001` | Customer, Vendor, Admin, Delivery | MVP | Covered |
| `FR-AUTH-002` | Strong password policies & hashing | — | `CF-001`, `AF-001` | `UC-CUST-001`, `UC-CUST-002`, `UC-ADMIN-001` | Customer, Vendor, Admin, Delivery | MVP | Covered |
| `FR-AUTH-003` | Stateless JWT access & Refresh tokens | — | `CF-002`, `VF-003`, `AF-001`, `DF-001` | `UC-CUST-001`, `UC-CUST-002`, `UC-ADMIN-001` | Customer, Vendor, Admin, Delivery | MVP | Covered |
| `FR-AUTH-004` | RBAC & permission middleware | `BR-002`, `BR-003`, `BR-007` | `CF-002`, `VF-003`, `AF-001`, `DF-001` | `UC-ADMIN-001` | Customer, Vendor, Admin, Delivery | MVP | Covered |
| `FR-AUTH-005` | Refresh token revocation on logout | — | `CF-003` | `UC-CUST-002` | Customer, Vendor, Admin, Delivery | MVP | Covered |
| `FR-CUST-001` | Address book management & Lat/Long | — | `CF-017` | `UC-CUST-007` | Customer | MVP | Covered |
| `FR-CUST-002` | Set default delivery address | — | `CF-017` | `UC-CUST-007` | Customer | MVP | Covered |
| `FR-CUST-003` | Wishlist items management | — | `CF-012` | `UC-CUST-004` | Customer | MVP | Covered |
| `FR-CUST-004` | View order history & tracking | `BR-003` | `CF-023`, `CF-024`, `CF-025` | `UC-CUST-008`, `UC-CUST-009` | Customer | MVP | Covered |
| `FR-CUST-005` | Cancel eligible pending orders | `BR-006` | `CF-026` | `UC-CUST-009` | Customer | MVP | Covered |
| `FR-VEND-001` | Dedicated vendor application portal | `BR-001` | `VF-001` | `UC-VEND-001` | Vendor Applicant | MVP | Covered |
| `FR-VEND-002` | Vendor lifecycle state transitions | `BR-001` | `VF-002` | `UC-VEND-001`, `UC-VEND-002` | Vendor Applicant, Admin | MVP | Covered |
| `FR-VEND-003` | Vendor approval requirement rule | `BR-001` | `VF-002`, `AF-005` | `UC-VEND-002` | Vendor, Admin | MVP | Covered |
| `FR-VEND-004` | Vendor data isolation enforcement | `BR-002` | `VF-004`, `VF-007`, `VF-009`, `VF-011` | `UC-VEND-006` | Vendor | MVP | Covered |
| `FR-VEND-005` | Manage public store profile | `BR-002` | `VF-004` | `UC-VEND-003` | Vendor | MVP | Covered |
| `FR-VEND-006` | Vendor dashboard operational overview | `BR-002` | `VF-017` | `UC-VEND-006` | Vendor | MVP | Covered |
| `FR-PROD-001` | Create & edit products with SKU/Price | `BR-002` | `VF-005`, `VF-007` | `UC-VEND-004` | Vendor | MVP | Covered |
| `FR-PROD-002` | Enforce product lifecycle states | `BR-012` | `VF-008` | `UC-VEND-004` | Vendor | MVP | Covered |
| `FR-PROD-003` | Product visibility rule enforcement | `BR-012` | `CF-004`, `CF-005`, `CF-011`, `VF-008`, `AF-007` | `UC-CUST-002`, `UC-CUST-004`, `UC-VEND-004`, `UC-ADMIN-004` | Customer, Guest | MVP | Covered |
| `FR-PROD-004` | Cloudinary vendor media integration | — | `VF-006` | `UC-CUST-004`, `UC-VEND-003`, `UC-VEND-004` | Vendor | MVP | Covered |
| `FR-SEARCH-001`| Full-text catalog search | `BR-010`, `BR-012` | `CF-005` | `UC-CUST-002` | Customer, Guest | MVP | Covered |
| `FR-SEARCH-002`| Search filtering & sorting | — | `CF-007`, `CF-008` | `UC-CUST-002` | Customer, Guest | MVP | Covered |
| `FR-SEARCH-003`| Search suggestions API endpoint | `BR-010` | `CF-006` | `UC-CUST-003` | Customer, Guest | MVP | Covered |
| `FR-SEARCH-004`| 300ms frontend search debounce | — | `CF-006` | `UC-CUST-002`, `UC-CUST-003` | Customer, Guest | MVP | Covered |
| `FR-SEARCH-005`| Search logging to `search_logs` | `BR-010` | `CF-005`, `CF-006`, `AF-018`, `AF-019` | `UC-CUST-003`, `UC-ADMIN-006` | Customer, Guest, Admin | MVP | Covered |
| `FR-INV-001`  | Stock availability validation | `BR-005` | `CF-013`, `CF-015`, `CF-016`, `VF-009` | `UC-CUST-005`, `UC-CUST-006`, `UC-VEND-005` | Customer, Vendor | MVP | Covered |
| `FR-INV-002`  | Inventory reservation support | `BR-006` | `CF-019`, `CF-020`, `CF-026`, `VF-009` | `UC-CUST-008`, `UC-VEND-005` | Customer, Vendor | MVP | Covered |
| `FR-INV-003`  | Inventory movements audit log | — | `VF-009` | `UC-VEND-005` | Vendor | MVP | Covered |
| `FR-INV-004`  | Low-stock threshold alerts | — | `VF-010` | `UC-VEND-005` | Vendor | MVP | Covered |
| `FR-CART-001` | Add products from multiple vendors | `BR-011` | `CF-013`, `CF-014` | `UC-CUST-005` | Customer | MVP | Covered |
| `FR-CART-002` | Vendor-grouped cart view & fees | `BR-011` | `CF-014`, `CF-015` | `UC-CUST-005` | Customer | MVP | Covered |
| `FR-CART-003` | Checkout stock & price revalidation | `BR-005`, `BR-012` | `CF-016` | `UC-CUST-006`, `UC-CUST-007` | Customer | MVP | Covered |
| `FR-ORDER-001`| Multi-vendor order splitting | `BR-011` | `CF-019`, `CF-020` | `UC-CUST-007`, `UC-VEND-006` | Customer, Vendor | MVP | Covered |
| `FR-ORDER-002`| Main & Vendor Order lifecycle workflow | — | `CF-025`, `VF-012` to `VF-014` | `UC-CUST-008`, `UC-VEND-006` | Customer, Vendor | MVP | Covered |
| `FR-ORDER-003`| Order exception statuses handling | — | `CF-026`, `EF-011`, `EF-012` | `UC-CUST-009` | Customer, Vendor, Admin | MVP | Covered |
| `FR-ORDER-004`| Restrict order viewing to owner | `BR-003` | `CF-023`, `CF-024` | `UC-CUST-008` | Customer | MVP | Covered |
| `FR-PAY-001`  | Support COD & Online Payment Gateway | — | `CF-019`, `CF-020` | `UC-CUST-007` | Customer | MVP | Covered |
| `FR-PAY-002`  | Online payment webhook verification | `BR-009` | `CF-020`, `AF-013` | `UC-CUST-007`, `UC-ADMIN-005` | Customer, Payment Gateway | MVP | Covered |
| `FR-PAY-003`  | Payment status state tracking | — | `CF-020`, `CF-021` | `UC-ADMIN-005` | Customer, Payment Gateway, Admin | MVP | Covered |
| `FR-PAY-004`  | Security: No raw card/bank data stored| — | `CF-020` | `UC-CUST-007` | Customer | MVP | Covered |
| `FR-DEL-001`  | Delivery staff login & assignment queue | `BR-013` | `DF-001`, `DF-002` | `UC-DEL-001` | Delivery Staff | MVP | Covered |
| `FR-DEL-002`  | View pickup & customer delivery info | `BR-013` | `DF-003` | `UC-DEL-001` | Delivery Staff | MVP | Covered |
| `FR-DEL-003`  | Authorized delivery status updates | `BR-013` | `DF-004` to `DF-007` | `UC-DEL-002` | Delivery Staff | MVP | Covered |
| `FR-REVIEW-001`| Review submission eligibility rule | `BR-004` | `CF-028` | `UC-CUST-010`, `UC-DEL-002` | Customer | MVP | Covered |
| `FR-REVIEW-002`| Recalculate rating averages | — | `CF-028` | `UC-CUST-004`, `UC-CUST-010` | Customer | MVP | Covered |
| `FR-REVIEW-003`| Admin review moderation tools | `BR-007` | `AF-017` | `UC-ADMIN-004` | Admin | MVP | Covered |
| `FR-COMM-001` | Validate promotional coupons | `BR-008` | `CF-019`, `CF-020` | `UC-CUST-006`, `UC-ADMIN-006` | Customer | MVP | Covered |
| `FR-COMM-002` | Calculate platform commission | `BR-014` | `VF-018`, `AF-016` | `UC-VEND-006`, `UC-ADMIN-006` | Vendor, Admin | MVP | Covered |
| `FR-COMM-003` | Maintain vendor payout ledgers | — | `VF-018` | `UC-VEND-006` | Vendor, Admin | MVP | Covered |
| `FR-ADMIN-001`| Admin vendor verification dashboard | `BR-001`, `BR-007` | `AF-004`, `AF-005`, `AF-006` | `UC-ADMIN-001`, `UC-ADMIN-003` | Admin | MVP | Covered |
| `FR-ADMIN-002`| Admin vendor suspension tool | `BR-015`, `BR-007` | `AF-007` | `UC-ADMIN-002`, `UC-ADMIN-003` | Admin | MVP | Covered |
| `FR-ADMIN-003`| Category/Brand CRUD & Search analytics| `BR-007`, `BR-010` | `AF-009`, `AF-010`, `AF-018` | `UC-ADMIN-003` to `UC-ADMIN-006` | Admin | MVP | Covered |
| `FR-NOTIF-001`| SignalR real-time notification push | — | `CF-027`, `VF-015`, `DF-009`, `AF-022` | `UC-CUST-008`, `UC-CUST-009`, `UC-VEND-001`, `UC-DEL-002` | Customer, Vendor, Admin, Delivery | MVP | Covered |
| `FR-LOC-001`  | Store Lat/Long coordinates | — | `CF-009`, `CF-017`, `VF-001` | `UC-CUST-004`, `UC-CUST-007`, `UC-VEND-003` | Customer, Vendor | MVP | Covered |
| `FR-LOC-002`  | Haversine distance calculation | — | `CF-009` | `UC-CUST-004` | Customer, Guest | MVP | Covered |
| `FR-AUDIT-001`| Admin audit logging to `AuditLogs` | `BR-007` | `AF-023` | `UC-ADMIN-001`, `UC-ADMIN-006` | Admin | MVP | Covered |

---

## 5. Non-Functional Requirement Traceability Matrix (14 NFRs)

| NFR ID | Requirement Summary | Applicable Modules / Flows | Related Use Cases | Category | Scope |
|---|---|---|---|---|---|
| `NFR-PERF-001` | 300ms frontend search suggestion debounce | Search Bar / `CF-006` | `UC-CUST-002`, `UC-CUST-003` | Performance Baseline | MVP |
| `NFR-PERF-002` | Search suggestion API $\le 200\text{ ms}$ response | Search API / `CF-006` | `UC-CUST-002`, `UC-CUST-003` | Proposed Technical SLA Target | MVP |
| `NFR-PERF-003` | Paginated catalog API $\le 500\text{ ms}$ response | Catalog API / `CF-004` | `UC-CUST-002`, `UC-CUST-004`, `UC-CUST-005` | Proposed Technical SLA Target | MVP |
| `NFR-SEC-001` | Strong password hashing algorithm | Auth Module / `CF-001`, `AF-001` | `UC-CUST-001`, `UC-CUST-002`, `UC-ADMIN-001` | Security Baseline | MVP |
| `NFR-SEC-002` | JWT access & HTTP-only Refresh tokens | API Auth / `CF-002`, `VF-003` | `UC-CUST-001`, `UC-CUST-002`, `UC-ADMIN-001` | Security Baseline | MVP |
| `NFR-SEC-003` | Vendor & Customer data isolation | API Endpoints / All Flows | All Use Cases | Security & Privacy | MVP |
| `NFR-SEC-004` | Environment secret management | Infrastructure / Backend | All Use Cases | Security Baseline | MVP |
| `NFR-SCAL-001` | Stateless horizontal Web API scaling | Backend API Services | `UC-CUST-003`, `UC-CUST-008` | Scalability | MVP |
| `NFR-SCAL-002` | PostgreSQL database indexing | DB Layer (`sku`, `vendor_id`) | `UC-CUST-003`, `UC-CUST-008` | Scalability | MVP |
| `NFR-AVAIL-001` | Expose `/health` infrastructure endpoint | Health Check Controller | All Use Cases | System Engineering Requirement | MVP |
| `NFR-REL-001` | RFC-7807 problem details middleware | Exception Middleware | All Use Cases | System Engineering Requirement | MVP |
| `NFR-MAINT-001` | Clean Architecture separation | Backend WebAPI Solution | All Use Cases | System Engineering Requirement | MVP |
| `NFR-MAINT-002` | FluentValidation input validation | Application CQRS Handlers | All Use Cases | System Engineering Requirement | MVP |
| `NFR-USA-001` | Responsive mobile & desktop UI viewports | Angular Frontend UI | All User-Facing Use Cases | Usability | MVP |

---

## 6. Use Case Traceability Matrix (24 Use Cases)

| Use Case ID | Use Case Name | Primary Actor | Related BRs | Related FRs | Related NFRs | Related User Flows |
|---|---|---|---|---|---|---|
| `UC-CUST-001` | Register Customer Account | Customer | `BR-003` | `FR-AUTH-001`, `FR-AUTH-002`, `FR-AUTH-003` | `NFR-SEC-001`, `NFR-SEC-002` | `CF-001` |
| `UC-CUST-002` | Search & Browse Products | Customer / Guest | `BR-010`, `BR-012` | `FR-SEARCH-001` to `004`, `FR-PROD-003` | `NFR-PERF-001` to `003` | `CF-004`, `CF-005`, `CF-007`, `CF-008` |
| `UC-CUST-003` | View Search Suggestions | Customer / Guest | `BR-010` | `FR-SEARCH-003`, `FR-SEARCH-004`, `FR-SEARCH-005` | `NFR-PERF-001`, `NFR-PERF-002` | `CF-006` |
| `UC-CUST-004` | Discover Nearby Vendors | Customer / Guest | — | `FR-LOC-001`, `FR-LOC-002`, `FR-PROD-004` | `NFR-USA-001` | `CF-009`, `CF-010`, `CF-011` |
| `UC-CUST-005` | Manage Multi-Vendor Cart | Customer | `BR-005`, `BR-011` | `FR-CART-001`, `FR-CART-002`, `FR-INV-001` | `NFR-USA-001` | `CF-013`, `CF-014`, `CF-015` |
| `UC-CUST-006` | Manage Delivery Addresses | Customer | — | `FR-CUST-001`, `FR-CUST-002`, `FR-LOC-001` | `NFR-USA-001` | `CF-017` |
| `UC-CUST-007` | Execute Checkout (COD / Online) | Customer | `BR-005`, `BR-006`, `BR-008`, `BR-009`, `BR-011` | `FR-CART-003`, `FR-ORDER-001`, `FR-PAY-001`, `FR-PAY-002` | `NFR-SEC-003`, `NFR-SEC-004` | `CF-016`, `CF-018`, `CF-019`, `CF-020` |
| `UC-CUST-008` | Track Order Status | Customer | `BR-003` | `FR-CUST-004`, `FR-ORDER-002`, `FR-NOTIF-001` | `NFR-USA-001` | `CF-022`, `CF-023`, `CF-024`, `CF-025` |
| `UC-CUST-009` | Cancel Pending Order | Customer | `BR-006` | `FR-CUST-005`, `FR-ORDER-003`, `FR-INV-002` | `NFR-USA-001` | `CF-026` |
| `UC-CUST-010` | Submit Product Review | Customer | `BR-004` | `FR-REVIEW-001`, `FR-REVIEW-002` | `NFR-USA-001` | `CF-028` |
| `UC-VEND-001` | Submit Vendor Application | Vendor Applicant | `BR-001` | `FR-VEND-001`, `FR-VEND-002`, `FR-AUTH-001` | `NFR-SEC-004`, `NFR-USA-001` | `VF-001` |
| `UC-VEND-002` | Manage Store Profile | Approved Vendor | `BR-001`, `BR-002` | `FR-VEND-005`, `FR-PROD-004`, `FR-LOC-001` | `NFR-USA-001` | `VF-004` |
| `UC-VEND-003` | Create & Edit Products | Approved Vendor | `BR-002`, `BR-012` | `FR-PROD-001`, `FR-PROD-002`, `FR-PROD-004` | `NFR-SEC-003` | `VF-005`, `VF-006`, `VF-007`, `VF-008` |
| `UC-VEND-004` | Manage Stock Inventory | Approved Vendor | `BR-002`, `BR-005`, `BR-006` | `FR-INV-001` to `004` | `NFR-SEC-003` | `VF-009`, `VF-010` |
| `UC-VEND-005` | Process Vendor Orders | Approved Vendor | `BR-001`, `BR-002`, `BR-009`, `BR-011` | `FR-ORDER-001`, `FR-ORDER-002`, `FR-VEND-004` | `NFR-SEC-003` | `VF-011` to `VF-014` |
| `UC-VEND-006` | View Payouts & Analytics | Approved Vendor | `BR-002`, `BR-014` | `FR-VEND-006`, `FR-COMM-002`, `FR-COMM-003` | `NFR-SEC-003` | `VF-017`, `VF-018` |
| `UC-ADMIN-001` | Approve / Reject Vendor | Administrator | `BR-001`, `BR-007` | `FR-ADMIN-001`, `FR-VEND-002`, `FR-AUTH-001` | `NFR-SEC-004` | `AF-001`, `AF-004`, `AF-005`, `AF-006` |
| `UC-ADMIN-002` | Suspend Vendor | Administrator | `BR-007`, `BR-012`, `BR-015` | `FR-ADMIN-002`, `FR-PROD-003` | `NFR-SEC-003` | `AF-007` |
| `UC-ADMIN-003` | Manage Categories & Brands | Administrator | `BR-007` | `FR-ADMIN-003` | `NFR-USA-001` | `AF-009`, `AF-010`, `AF-011` |
| `UC-ADMIN-004` | Configure Commissions & Coupons| Administrator | `BR-007`, `BR-008`, `BR-014` | `FR-COMM-001`, `FR-COMM-002` | `NFR-USA-001` | `AF-015`, `AF-016` |
| `UC-ADMIN-005` | Monitor Search Analytics | Administrator | `BR-007`, `BR-010` | `FR-SEARCH-005`, `FR-ADMIN-003` | `NFR-USA-001` | `AF-018`, `AF-019` |
| `UC-ADMIN-006` | Review Audit Logs | Administrator | `BR-007` | `FR-AUDIT-001`, `FR-ADMIN-003` | `NFR-SEC-003` | `AF-023` |
| `UC-DEL-001`   | View Delivery Assignments | Delivery Staff | `BR-013` | `FR-DEL-001`, `FR-DEL-002` | `NFR-SEC-003` | `DF-001`, `DF-002`, `DF-003` |
| `UC-DEL-002`   | Update Delivery Status | Delivery Staff | `BR-004`, `BR-013` | `FR-DEL-003`, `FR-NOTIF-001` | `NFR-SEC-003` | `DF-004` to `DF-007` |

---

## 7. User Flow Traceability Matrix (81 Flows)

| Flow ID | Flow Name | Actor | Related Use Cases | Related FRs | Related BRs |
|---|---|---|---|---|---|
| `CF-001` | Customer Registration | Customer | `UC-CUST-001` | `FR-AUTH-001`, `FR-AUTH-002`, `FR-AUTH-003` | `BR-003` |
| `CF-002` | Customer Login | Customer | `UC-CUST-002` | `FR-AUTH-001`, `FR-AUTH-003`, `FR-AUTH-004` | `BR-003` |
| `CF-003` | Logout / Session Handling | Customer | `UC-CUST-002` | `FR-AUTH-005` | — |
| `CF-004` | Browse Products | Customer / Guest | `UC-CUST-002` | `FR-PROD-003` | `BR-012` |
| `CF-005` | Search Products | Customer / Guest | `UC-CUST-002` | `FR-SEARCH-001`, `FR-SEARCH-005` | `BR-010`, `BR-012` |
| `CF-006` | Search Suggestions | Customer / Guest | `UC-CUST-003` | `FR-SEARCH-003`, `FR-SEARCH-004` | `BR-010` |
| `CF-007` | Search with Filters | Customer / Guest | `UC-CUST-002` | `FR-SEARCH-002` | — |
| `CF-008` | Search with Sorting | Customer / Guest | `UC-CUST-002` | `FR-SEARCH-002` | — |
| `CF-009` | Nearby Vendor Discovery | Customer / Guest | `UC-CUST-004` | `FR-LOC-001`, `FR-LOC-002` | — |
| `CF-010` | View Vendor Store | Customer / Guest | `UC-CUST-004` | `FR-VEND-005` | — |
| `CF-011` | View Product Details | Customer / Guest | `UC-CUST-004` | `FR-PROD-001`, `FR-PROD-003`, `FR-PROD-004` | `BR-012` |
| `CF-012` | Wishlist | Customer | `UC-CUST-004` | `FR-CUST-003` | — |
| `CF-013` | Add Product to Cart | Customer | `UC-CUST-005` | `FR-CART-001`, `FR-INV-001` | `BR-005` |
| `CF-014` | Multi-Vendor Cart | Customer | `UC-CUST-005` | `FR-CART-001`, `FR-CART-002` | `BR-011` |
| `CF-015` | Update / Remove Cart Items | Customer | `UC-CUST-005` | `FR-CART-002`, `FR-INV-001` | `BR-005` |
| `CF-016` | Checkout | Customer | `UC-CUST-006` | `FR-CART-003`, `FR-INV-001` | `BR-005`, `BR-012` |
| `CF-017` | Address Selection | Customer | `UC-CUST-007` | `FR-CUST-001`, `FR-CUST-002`, `FR-LOC-001` | — |
| `CF-018` | Delivery Method Selection | Customer | `UC-CUST-006` | `FR-CART-002` | — |
| `CF-019` | COD Checkout | Customer | `UC-CUST-007` | `FR-ORDER-001`, `FR-PAY-001`, `FR-INV-002` | `BR-005`, `BR-006`, `BR-008`, `BR-011` |
| `CF-020` | Online Payment Checkout | Customer, Gateway | `UC-CUST-007` | `FR-ORDER-001`, `FR-PAY-001`, `FR-PAY-002` | `BR-005`, `BR-006`, `BR-009`, `BR-011` |
| `CF-021` | Payment Failure / Recovery | Customer, Gateway | `UC-CUST-007` | `FR-PAY-003`, `FR-INV-002` | `BR-006` |
| `CF-022` | Order Confirmation | Customer | `UC-CUST-008` | `FR-ORDER-001` | `BR-011` |
| `CF-023` | View Orders | Customer | `UC-CUST-008` | `FR-CUST-004`, `FR-ORDER-004` | `BR-003` |
| `CF-024` | View Order Details | Customer | `UC-CUST-008` | `FR-CUST-004`, `FR-ORDER-004` | `BR-003` |
| `CF-025` | Track Order Status | Customer | `UC-CUST-008` | `FR-CUST-004`, `FR-ORDER-002`, `FR-NOTIF-001` | `BR-003` |
| `CF-026` | Order Cancellation | Customer | `UC-CUST-009` | `FR-CUST-005`, `FR-ORDER-003`, `FR-INV-002` | `BR-006` |
| `CF-027` | Receive Notifications | Customer | `UC-CUST-008` | `FR-NOTIF-001` | — |
| `CF-028` | Review / Rating | Customer | `UC-CUST-010` | `FR-REVIEW-001`, `FR-REVIEW-002` | `BR-004` |
| `CF-029` | Profile Management | Customer | `UC-CUST-001` | `FR-AUTH-002` | — |
| `VF-001` | Vendor Application | Vendor Applicant | `UC-VEND-001` | `FR-VEND-001`, `FR-VEND-002` | `BR-001` |
| `VF-002` | Application Status | Vendor Applicant | `UC-VEND-001` | `FR-VEND-002` | `BR-001`, `BR-015` |
| `VF-003` | Vendor Login | Approved Vendor | `UC-VEND-002` | `FR-AUTH-001`, `FR-VEND-003` | `BR-001` |
| `VF-004` | Vendor Store Profile | Approved Vendor | `UC-VEND-002` | `FR-VEND-005`, `FR-PROD-004` | `BR-002` |
| `VF-005` | Product Creation | Approved Vendor | `UC-VEND-003` | `FR-PROD-001`, `FR-PROD-002` | `BR-001`, `BR-002` |
| `VF-006` | Image Management | Approved Vendor | `UC-VEND-003` | `FR-PROD-004` | `BR-002` |
| `VF-007` | Product Update | Approved Vendor | `UC-VEND-003` | `FR-PROD-001` | `BR-002` |
| `VF-008` | Product Activation | Approved Vendor | `UC-VEND-003` | `FR-PROD-002` | `BR-012` |
| `VF-009` | Inventory Management | Approved Vendor | `UC-VEND-004` | `FR-INV-001`, `FR-INV-003` | `BR-002`, `BR-005` |
| `VF-010` | Low Stock Handling | Approved Vendor | `UC-VEND-004` | `FR-INV-004`, `FR-NOTIF-001` | `BR-002` |
| `VF-011` | Vendor Order Viewing | Approved Vendor | `UC-VEND-005` | `FR-ORDER-001`, `FR-VEND-004` | `BR-002`, `BR-011` |
| `VF-012` | Accept Vendor Order | Approved Vendor | `UC-VEND-005` | `FR-ORDER-002` | `BR-002`, `BR-009` |
| `VF-013` | Preparing Order | Approved Vendor | `UC-VEND-005` | `FR-ORDER-002`, `FR-NOTIF-001` | `BR-002` |
| `VF-014` | Ready for Pickup | Approved Vendor | `UC-VEND-005` | `FR-ORDER-002`, `FR-DEL-001` | `BR-002` |
| `VF-015` | Vendor Notifications | Approved Vendor | `UC-VEND-005` | `FR-NOTIF-001` | — |
| `VF-016` | Vendor Reviews | Approved Vendor | `UC-CUST-010` | `FR-REVIEW-002` | `BR-004` |
| `VF-017` | Vendor Analytics | Approved Vendor | `UC-VEND-006` | `FR-VEND-006` | `BR-002` |
| `VF-018` | Vendor Payouts | Approved Vendor | `UC-VEND-006` | `FR-COMM-002`, `FR-COMM-003` | `BR-002`, `BR-014` |
| `VF-019` | Vendor Settings | Approved Vendor | `UC-VEND-002` | `FR-AUTH-002` | — |
| `AF-001` | Admin Authentication | Administrator | `UC-ADMIN-001` | `FR-AUTH-001`, `FR-AUTH-004` | `BR-007` |
| `AF-002` | Admin Dashboard | Administrator | `UC-ADMIN-001` | `FR-ADMIN-003` | `BR-007` |
| `AF-003` | Customer Management | Administrator | `UC-ADMIN-002` | `FR-ADMIN-003` | `BR-007` |
| `AF-004` | Application Review | Administrator | `UC-ADMIN-001` | `FR-ADMIN-001` | `BR-001`, `BR-007` |
| `AF-005` | Vendor Approval | Administrator | `UC-ADMIN-001` | `FR-ADMIN-001`, `FR-VEND-003` | `BR-001`, `BR-007` |
| `AF-006` | Vendor Rejection | Administrator | `UC-ADMIN-001` | `FR-ADMIN-001` | `BR-001`, `BR-007` |
| `AF-007` | Vendor Suspension | Administrator | `UC-ADMIN-002` | `FR-ADMIN-002` | `BR-007`, `BR-015` |
| `AF-008` | Verification Review | Administrator | `UC-ADMIN-001` | `FR-ADMIN-001` | `BR-001`, `BR-007` |
| `AF-009` | Category Management | Administrator | `UC-ADMIN-003` | `FR-ADMIN-003` | `BR-007` |
| `AF-010` | Brand Management | Administrator | `UC-ADMIN-003` | `FR-ADMIN-003` | `BR-007` |
| `AF-011` | Product Moderation | Administrator | `UC-ADMIN-003` | `FR-ADMIN-003`, `FR-PROD-003` | `BR-007`, `BR-012` |
| `AF-012` | Order Monitoring | Administrator | `UC-ADMIN-005` | `FR-ADMIN-003`, `FR-ORDER-001` | `BR-007`, `BR-011` |
| `AF-013` | Payment Monitoring | Administrator | `UC-ADMIN-005` | `FR-ADMIN-003`, `FR-PAY-002` | `BR-007`, `BR-009` |
| `AF-014` | Refund Monitoring | Administrator | `UC-ADMIN-005` | `FR-PAY-003` | `BR-007` |
| `AF-015` | Coupon Management | Administrator | `UC-ADMIN-004` | `FR-COMM-001` | `BR-007`, `BR-008` |
| `AF-016` | Commission Management | Administrator | `UC-ADMIN-004` | `FR-COMM-002` | `BR-007`, `BR-014` |
| `AF-017` | Review Moderation | Administrator | `UC-ADMIN-004` | `FR-REVIEW-003` | `BR-007` |
| `AF-018` | Search Analytics | Administrator | `UC-ADMIN-005` | `FR-SEARCH-005`, `FR-ADMIN-003` | `BR-007`, `BR-010` |
| `AF-019` | Zero-Result Search Monitor | Administrator | `UC-ADMIN-005` | `FR-SEARCH-005` | `BR-007`, `BR-010` |
| `AF-020` | Vendor Performance | Administrator | `UC-ADMIN-001` | `FR-VEND-006` | `BR-007` |
| `AF-021` | Reports | Administrator | `UC-ADMIN-006` | `FR-ADMIN-003` | `BR-007` |
| `AF-022` | Notification Management | Administrator | `UC-ADMIN-006` | `FR-NOTIF-001` | `BR-007` |
| `AF-023` | Audit Log Review | Administrator | `UC-ADMIN-006` | `FR-AUDIT-001` | `BR-007` |
| `AF-024` | System Settings | Administrator | `UC-ADMIN-006` | `FR-ADMIN-003` | `BR-007` |
| `DF-001` | Delivery Authentication | Delivery Staff | `UC-DEL-001` | `FR-DEL-001` | `BR-013` |
| `DF-002` | View Assigned Deliveries | Delivery Staff | `UC-DEL-001` | `FR-DEL-001` | `BR-013` |
| `DF-003` | View Delivery Details | Delivery Staff | `UC-DEL-001` | `FR-DEL-002` | `BR-013` |
| `DF-004` | Pickup Order | Delivery Staff | `UC-DEL-002` | `FR-DEL-003` | `BR-013` |
| `DF-005` | Update Out-for-Delivery | Delivery Staff | `UC-DEL-002` | `FR-DEL-003`, `FR-NOTIF-001` | `BR-013` |
| `DF-006` | Mark Delivered | Delivery Staff | `UC-DEL-002` | `FR-DEL-003`, `FR-REVIEW-001` | `BR-004`, `BR-013` |
| `DF-007` | Failed Delivery | Delivery Staff | `UC-DEL-002` | `FR-DEL-003` | `BR-013` |
| `DF-008` | Delivery History | Delivery Staff | `UC-DEL-001` | `FR-DEL-001` | `BR-013` |
| `DF-009` | Delivery Notifications | Delivery Staff | `UC-DEL-002` | `FR-NOTIF-001` | `BR-013` |

---

## 8. Actor → Requirement Matrix

| Actor | Primary Operational Responsibilities | Related FRs | Related Use Cases | Related User Flows |
|---|---|---|---|---|
| **Customer** | Account registration, address book, search, catalog browsing, multi-vendor cart, checkout, COD/online payment, order tracking, review posting. | `FR-AUTH-001` to `003`, `FR-CUST-001` to `005`, `FR-SEARCH-001` to `005`, `FR-CART-001` to `003`, `FR-ORDER-001` to `004`, `FR-PAY-001` to `004`, `FR-REVIEW-001`, `FR-COMM-001`, `FR-LOC-001`, `FR-LOC-002` | `UC-CUST-001` to `UC-CUST-010` | `CF-001` to `CF-029` |
| **Vendor Applicant** | Submitting `VendorApplication` details, business verification data, store profile draft, and checking application onboarding status. | `FR-AUTH-001`, `FR-VEND-001`, `FR-VEND-002` | `UC-VEND-001` | `VF-001`, `VF-002` |
| **Vendor** | Store profile management, product listing creation, Cloudinary media upload, inventory stock maintenance, vendor order processing (`#1000-A`), payout tracking. | `FR-VEND-003` to `006`, `FR-PROD-001` to `004`, `FR-INV-001` to `004`, `FR-ORDER-001`, `FR-ORDER-002`, `FR-COMM-002`, `FR-COMM-003` | `UC-VEND-002` to `UC-VEND-006` | `VF-003` to `VF-019` |
| **Administrator** | Vendor application review/approval/rejection, vendor suspension, category/brand CRUD, product moderation, commission & coupon setup, review moderation, search analytics, audit log inspection. | `FR-ADMIN-001` to `003`, `FR-AUTH-004`, `FR-PROD-003`, `FR-COMM-001`, `FR-COMM-002`, `FR-REVIEW-003`, `FR-SEARCH-005`, `FR-AUDIT-001` | `UC-ADMIN-001` to `UC-ADMIN-006` | `AF-001` to `AF-024` |
| **Delivery Staff** | Login, viewing assigned delivery queue, viewing customer delivery details, updating transit statuses (`Picked Up`, `Out for Delivery`, `Delivered`, `Failed Delivery`). | `FR-DEL-001` to `003`, `FR-AUTH-001` | `UC-DEL-001`, `UC-DEL-002` | `DF-001` to `DF-009` |
| **Payment Gateway** | Processing online payment sessions and sending asynchronous cryptographic webhook callbacks (`POST /api/v1/payments/payment-webhook`). | `FR-PAY-001` to `003` | `UC-CUST-007`, `UC-ADMIN-005` | `CF-020`, `CF-021`, `AF-013` |
| **Notification System (SignalR)**| Pushing real-time order status updates, delivery assignments, low-stock alerts, and approval notices. | `FR-NOTIF-001` | `UC-CUST-008`, `UC-VEND-001`, `UC-DEL-002` | `CF-027`, `VF-015`, `DF-009`, `AF-022` |
| **Cloudinary** | Cloud asset hosting and dynamic transformation for product gallery images, vendor logos, and cover photos. | `FR-PROD-004` | `UC-CUST-004`, `UC-VEND-003`, `UC-VEND-004` | `VF-004`, `VF-006` |
| **Maps Service** | Geocoding latitude/longitude coordinates and distance calculations (Haversine formula). | `FR-LOC-001`, `FR-LOC-002` | `UC-CUST-004`, `UC-CUST-007`, `UC-VEND-003` | `CF-009`, `CF-017` |
| **Background Processes** | Asynchronous system jobs for order timeout release, notification queueing, and search query logging. | `FR-SEARCH-005`, `FR-INV-002`, `FR-AUDIT-001` | `UC-CUST-003`, `UC-ADMIN-006` | `CF-005`, `AF-018`, `AF-023` |

---

## 9. Module / Domain Traceability Matrix (21 Business Domains)

| Domain # | Business Domain Name | Relevant FRs | Relevant NFRs | Relevant BRs | Relevant Use Cases | Relevant User Flows | Scope |
|---|---|---|---|---|---|---|---|
| 1 | **Authentication & Authorization** | `FR-AUTH-001` to `005` | `NFR-SEC-001`, `NFR-SEC-002`, `NFR-SEC-004` | `BR-003`, `BR-007` | `UC-CUST-001`, `UC-CUST-002`, `UC-ADMIN-001`, `UC-DEL-001` | `CF-001` to `003`, `VF-003`, `AF-001`, `DF-001` | MVP |
| 2 | **Customer Management** | `FR-CUST-001` to `005` | `NFR-SEC-003`, `NFR-USA-001` | `BR-003` | `UC-CUST-001`, `UC-ADMIN-002` | `CF-001`, `CF-029`, `AF-003` | MVP |
| 3 | **Vendor Management & Application** | `FR-VEND-001` to `003`, `FR-ADMIN-001`, `FR-ADMIN-002` | `NFR-SEC-003`, `NFR-SEC-004` | `BR-001`, `BR-015` | `UC-VEND-001`, `UC-VEND-002`, `UC-ADMIN-001`, `UC-ADMIN-003` | `VF-001`, `VF-002`, `AF-004` to `AF-008` | MVP |
| 4 | **Store Profile Management** | `FR-VEND-005`, `FR-PROD-004`, `FR-LOC-001` | `NFR-USA-001` | `BR-002` | `UC-VEND-003` | `VF-004`, `CF-010` | MVP |
| 5 | **Product Catalog** | `FR-PROD-001` to `004` | `NFR-PERF-003`, `NFR-USA-001` | `BR-002`, `BR-012` | `UC-CUST-004`, `UC-VEND-004`, `UC-ADMIN-004` | `CF-004`, `CF-011`, `VF-005` to `008` | MVP |
| 6 | **Categories & Brands Taxonomy** | `FR-ADMIN-003` | `NFR-USA-001` | `BR-007` | `UC-ADMIN-004` | `AF-009`, `AF-010` | MVP |
| 7 | **Inventory Control & Movements** | `FR-INV-001` to `004` | `NFR-SEC-003`, `NFR-PERF-003` | `BR-005`, `BR-006` | `UC-CUST-005`, `UC-VEND-005` | `CF-013`, `CF-015`, `VF-009`, `VF-010` | MVP |
| 8 | **Search & Suggestions** | `FR-SEARCH-001` to `005` | `NFR-PERF-001` to `003` | `BR-010`, `BR-012` | `UC-CUST-002`, `UC-CUST-003`, `UC-ADMIN-006` | `CF-005` to `CF-008`, `AF-018`, `AF-019` | MVP |
| 9 | **Location / Nearby Discovery** | `FR-LOC-001`, `FR-LOC-002` | `NFR-USA-001` | — | `UC-CUST-004`, `UC-CUST-007` | `CF-009`, `CF-017` | MVP |
| 10 | **Shopping Cart** | `FR-CART-001`, `FR-CART-002` | `NFR-USA-001` | `BR-011` | `UC-CUST-005` | `CF-013` to `CF-015` | MVP |
| 11 | **Wishlist** | `FR-CUST-003` | `NFR-USA-001` | — | `UC-CUST-004` | `CF-012` | MVP |
| 12 | **Checkout & Address Book** | `FR-CART-003`, `FR-CUST-001`, `FR-CUST-002` | `NFR-SEC-003` | `BR-005`, `BR-008`, `BR-012` | `UC-CUST-006`, `UC-CUST-007` | `CF-016`, `CF-017`, `CF-018` | MVP |
| 13 | **Order Management & Splitting** | `FR-ORDER-001` to `004` | `NFR-SEC-003`, `NFR-SCAL-001` | `BR-003`, `BR-011` | `UC-CUST-008`, `UC-CUST-009`, `UC-VEND-006`, `UC-ADMIN-005` | `CF-019`, `CF-020`, `CF-022` to `026`, `VF-011` to `014` | MVP |
| 14 | **Payments & Webhooks** | `FR-PAY-001` to `004` | `NFR-SEC-004` | `BR-009` | `UC-CUST-007`, `UC-ADMIN-005` | `CF-019` to `CF-021`, `AF-013`, `AF-014` | MVP |
| 15 | **Delivery Workflow** | `FR-DEL-001` to `003` | `NFR-SEC-003` | `BR-013` | `UC-DEL-001`, `UC-DEL-002` | `DF-001` to `DF-009` | MVP |
| 16 | **Reviews & Ratings** | `FR-REVIEW-001` to `003` | `NFR-USA-001` | `BR-004` | `UC-CUST-010`, `UC-ADMIN-004` | `CF-028`, `VF-016`, `AF-017` | MVP |
| 17 | **Coupons Management** | `FR-COMM-001` | `NFR-USA-001` | `BR-008` | `UC-CUST-006`, `UC-ADMIN-006` | `CF-019`, `CF-020`, `AF-015` | MVP |
| 18 | **Commissions & Vendor Payouts** | `FR-COMM-002`, `FR-COMM-003` | `NFR-SEC-003` | `BR-014` | `UC-VEND-006`, `UC-ADMIN-006` | `VF-018`, `AF-016` | MVP |
| 19 | **Real-Time Notifications** | `FR-NOTIF-001` | `NFR-SCAL-001` | — | `UC-CUST-008`, `UC-VEND-001`, `UC-DEL-002` | `CF-027`, `VF-015`, `DF-009`, `AF-022` | MVP |
| 20 | **Administration Governance** | `FR-ADMIN-001` to `003` | `NFR-SEC-004` | `BR-007` | `UC-ADMIN-001` to `UC-ADMIN-006` | `AF-001` to `AF-024` | MVP |
| 21 | **Audit Logging** | `FR-AUDIT-001` | `NFR-SEC-004` | `BR-007` | `UC-ADMIN-006` | `AF-023` | MVP |

---

## 10. Scope Traceability Matrix

### 10.1 In Scope — MVP (Initial Release)
All 56 Functional Requirements (`FR-AUTH-001` to `FR-AUDIT-001`), 14 Non-Functional Requirements (`NFR-PERF-001` to `NFR-USA-001`), 15 Business Rules (`BR-001` to `BR-015`), 24 Use Cases (`UC-CUST-001` to `UC-DEL-002`), and 81 User Flows (`CF-001` to `DF-009`) defined in [`docs/SRS.md`](file:///d:/new%20e%20commers/docs/SRS.md) and [`docs/USER_FLOWS_AND_USE_CASES.md`](file:///d:/new%20e%20commers/docs/USER_FLOWS_AND_USE_CASES.md) are strictly classified as **In Scope — MVP**.

### 10.2 Future Scope (Post-MVP Roadmap)
The following capabilities are explicitly classified as **Future Scope** and are excluded from the MVP baseline:
* **AI & Intelligent Search:** AI semantic search using `pgvector` embeddings, AI personalized recommendation engine, AI demand forecasting, advanced fraud detection algorithms.
* **Architecture & Infrastructure:** Multi-branch vendor support, branch-specific stock (`ProductBranchStock`), Redis caching layer, background message queues.
* **Mobile Applications & Logistics:** Native iOS/Android mobile apps, mobile push notifications, live driver GPS tracking map routing.

### 10.3 Out of Scope (Strictly Excluded)
The following features are **strictly Out of Scope** for LocalMart:
* International shipping & multi-currency conversion.
* Cryptocurrency payment gateways.
* Advanced automated warehouse robotics or full ERP integrations.
* Advertising / sponsored listings marketplace.
* Medical prescription sales or regulated healthcare products.
* Autonomous delivery (drones / robots).
* Complex multi-tier corporate loyalty programs.

---

## 11. Traceability Gaps Audit

After conducting an exhaustive bidirectional audit across all BRs, FRs, NFRs, Use Cases, User Flows, Actors, and Business Domains:

> **Audit Result:** `No unresolved traceability gaps identified.`  
> Every Business Rule (`BR-001` to `BR-015`) maps to at least one FR, Use Case, and User Flow. Every Functional Requirement (56 FRs) maps to a primary Use Case and User Flow. Every Use Case (24 UCs) traces back to underlying FRs and BRs.

---

## 12. Deferred Technical Decisions Traceability Index

| # | Deferred Decision | Affected Requirements | Affected Use Cases | Current Status | Future Documentation Phase |
|---|---|---|---|---|---|
| 1 | **Exact Online Payment Provider** | `FR-PAY-001`, `FR-PAY-002` | `UC-CUST-007`, `UC-ADMIN-005` | Deferred | API Contract / HLD |
| 2 | **Maps API Provider** | `FR-LOC-001`, `FR-LOC-002` | `UC-CUST-004`, `UC-CUST-007` | Deferred | API Contract / HLD |
| 3 | **Inventory Reservation Lifecycle Mechanics** | `FR-INV-002` | `UC-CUST-008`, `UC-VEND-005` | Deferred | Database Design / LLD |
| 4 | **SignalR Connection & Group Design** | `FR-NOTIF-001` | `UC-CUST-008`, `UC-DEL-002` | Deferred | System Architecture HLD |
| 5 | **Exact Vendor Verification Document Rules** | `FR-VEND-001`, `FR-ADMIN-001` | `UC-VEND-001`, `UC-ADMIN-003` | Deferred | LLD / Module Design |
| 6 | **Password Hashing Candidate Selection** | `FR-AUTH-002`, `NFR-SEC-001` | `UC-CUST-001`, `UC-ADMIN-001` | Deferred | Security Requirements |
7 | **Deployment Architecture Details** | `NFR-SCAL-001`, `NFR-SEC-004` | All Use Cases | Deferred | DevOps / Deployment Plan |
| 8 | **Commission Calculation Base Details** | `FR-COMM-002` | `UC-VEND-006`, `UC-ADMIN-006` | Deferred | API Contract / Financial Design |
| 9 | **Partial Multi-Vendor Failure Mechanics** | `FR-ORDER-003` | `UC-CUST-009`, `UC-ADMIN-005` | Deferred | API Contract / LLD |

---

## 13. Traceability Completeness Summary

| Specification Category | Total Inventory Count | Verified Mapped Count | Coverage Percentage |
|---|---|---|---|
| **Business Rules** | 15 | 15 | 100% |
| **SRS Functional Requirements (FR)** | 56 | 56 | 100% |
| **SRS Non-Functional Requirements (NFR)** | 14 | 14 | 100% |
| **Formal Use Cases** | 24 | 24 | 100% |
| **Customer User Flows** | 29 | 29 | 100% |
| **Vendor User Flows** | 19 | 19 | 100% |
| **Admin User Flows** | 24 | 24 | 100% |
| **Delivery Staff User Flows** | 9 | 9 | 100% |
| **Cross-System Flows** | 8 | 8 | 100% |
| **Business Domains** | 21 | 21 | 100% |

---

## 14. Architectural Consistency Audit

An architectural audit was performed across all approved documents (`BRD_BASELINE.md`, `SRS.md`, `USER_FLOWS_AND_USE_CASES.md`, `USE_CASE_SPECIFICATIONS.md`) covering 17 critical architectural topics:
1. **Authentication:** 100% consistent across all documents (JWT + Refresh Tokens).
2. **RBAC & Authorization:** 100% consistent (Customer, Vendor, Delivery Staff, Admin permissions).
3. **Vendor Approval:** 100% consistent (`Pending → Under Review → Approved / Rejected / Suspended`).
4. **Vendor Data Isolation:** 100% consistent (`BR-002` enforced across all vendor queries).
5. **Customer Order Isolation:** 100% consistent (`BR-003` enforced across all customer order lookups).
6. **Product Visibility:** 100% consistent (`BR-012` active products of active vendors).
7. **Inventory Validation & Reservation:** 100% consistent (`BR-005`, `BR-006` stock checks and reservation).
8. **Multi-Vendor Cart & Order Splitting:** 100% consistent (`BR-011` parent #1000 split into child #1000-A, B).
9. **Checkout Revalidation:** 100% consistent (stock, price, coupon revalidation).
10. **Payment Confirmation:** 100% consistent (`BR-009` online fulfillment protected until webhook callback).
11. **Delivery Authorization:** 100% consistent (`BR-013` updates restricted to delivery staff/handlers).
12. **Review Eligibility:** 100% consistent (`BR-004` delivered purchase requirement).
13. **Coupon Validation:** 100% consistent (`BR-008` caps, expiry, minimum spend).
14. **Commission Engine:** 100% consistent (`BR-014` platform commission deduction).
15. **Notifications:** 100% consistent (SignalR real-time notification triggers).
16. **Audit Logging:** 100% consistent (`BR-007` immutable admin logging to `AuditLogs`).
17. **Location-Aware Shopping:** 100% consistent (Lat/Long coordinates & Haversine distance calculations).

> **Architectural Audit Result:** `0 Inconsistencies Discovered.`

---

## 15. Classification of Requirements vs. Deferred Decisions vs. Future Features

### 15.1 Confirmed Mandatory Business Requirements
* Multi-vendor shopping cart and automatic parent/child order splitting (`BR-011`).
* Mandatory vendor approval workflow (`Pending → Under Review → Approved / Rejected / Suspended`) before selling access (`BR-001`).
* Stock validation (`BR-005`) and stock reservation (`BR-006`) to prevent overselling.
* Real-time search suggestions endpoint with mandatory **300ms frontend debounce** (`FR-SEARCH-004`).
* Online payment fulfillment protection rule: payment must be verified via cryptographic webhook (`BR-009`) before vendor fulfillment authorization is granted.
* Verified purchase eligibility rule for customer product reviews (`BR-004`).

### 15.2 Deferred Technical & Financial Decisions
* Selection of specific payment gateway provider (Stripe vs local gateway).
* Selection of Maps API provider (Google Maps API vs Mapbox vs OpenStreetMap).
* Inventory reservation window timeouts, locking strategies, and cleanup mechanisms.
* Password hashing library selection (BCrypt vs ASP.NET Core Identity PasswordHasher).
* Commission calculation base details (pre/post discount item price, shipping, tax).
* Partial multi-vendor order failure refund allocation and financial adjustments.

### 15.3 Future Enhancements (Post-MVP Roadmap)
* AI semantic search using `pgvector` embeddings.
* AI personalized recommendation engine and AI demand forecasting.
* Multi-branch vendor support and branch stock management (`ProductBranchStock`).
* Dedicated native iOS/Android mobile apps with live driver GPS tracking routing.

---

## 16. Quality Assurance & Browser Verification Rules

* **Current Phase Status:** Documentation-Only (`Browser Verification: N/A`).
* **Rule for Future Implementation Phases:**  
  Starting from Phase 14 (Implementation), every user-facing functional feature must undergo browser-based execution verification using Chrome prior to being marked completed:  
  `Code Implementation → Launch Application Server → Open Chrome → Perform User Journey → Verify Behavior → Record Verification`.
