# LocalMart — BRD Baseline & Source-of-Truth Lock

**Document Version:** 1.1 (Cleanup Applied)  
**Baseline Date:** September 12, 2026  
**Status:** APPROVED & LOCKED BASELINE  
**Primary Source of Truth:** `LocalMart_BRD_v1.0(1).md`  
**Consolidated Reference Document:** `docs/BRD_BASELINE.md`  
**Project:** LocalMart — Location-Aware Multi-Vendor E-Commerce Marketplace  

---

> **IMPORTANT SOURCE-OF-TRUTH NOTICE:**  
> The original LocalMart Business Requirements Document ([`LocalMart_BRD_v1.0(1).md`](file:///d:/new%20e%20commers/LocalMart_BRD_v1.0%281%29.md)) remains the **primary and authoritative business source of truth** for this project.  
> This baseline document (`docs/BRD_BASELINE.md`) serves as a **consolidated baseline and reference document** to summarize and lock approved requirements for downstream documentation phases. It does not replace or alter the original BRD, nor does it claim to be a literal 1:1 replacement for every section of the BRD.

---

## 1. Executive Summary & Project Identity

### 1.1 Project Identity
* **Project Name:** LocalMart
* **Project Type:** Location-Aware Multi-Vendor E-Commerce Marketplace
* **Business Model:** Hyperlocal multi-vendor digital marketplace connecting local retail shops, independent businesses, and service providers with nearby customers within a unified platform.
* **Target Users:** 
  1. **Customers:** Local shoppers searching for nearby products, local shops, and convenient delivery.
  2. **Vendors:** Independent business owners, local shop managers, and sellers requiring inventory, product, and order management tools.
  3. **Delivery Staff:** Operational delivery personnel managing order pickups, transit, and customer handoffs.
  4. **Marketplace Administrators:** Platform operators monitoring marketplace activities, approving vendors, moderating listings, configuring commissions/coupons, and reviewing system analytics.

### 1.2 Main Marketplace Concept
LocalMart provides a centralized digital marketplace that enables customers to discover products across multiple local vendors, perform location-aware discovery, add products from different sellers into a single multi-vendor shopping cart, checkout seamlessly, and receive status-tracked deliveries. The platform manages vendor onboarding/approval workflows, order splitting across vendors, inventory reservations, search suggestions with search logging, and role/permission-isolated controls.

### 1.3 Project Objectives
* **Primary Objectives:**
  1. Centralize local commerce discovery for customers and independent vendors.
  2. Support multi-vendor shopping carts with parent order and vendor-specific order splitting.
  3. Enforce vendor business registration, verification, and administrator approval workflows.
  4. Provide inventory-aware purchasing and stock validation.
  5. Support transparent order fulfillment and delivery tracking workflows.
  6. Enable Cash on Delivery (COD) and secure online payment processing.
  7. Capture search and sales analytics (including zero-result tracking and suggestion logs) to measure customer demand.
  8. Deliver real-time notifications for critical business and order events.
  9. Establish a Clean Architecture foundation in ASP.NET Core and Angular prepared for future AI and multi-branch expansions.
* **Secondary Objectives:**
  * Eliminate manual order processing over messaging apps (WhatsApp, phone calls, spreadsheets).
  * Improve digital visibility and sales reach for local brick-and-mortar shops.
  * Elevate customer shopping convenience through location-based distance calculations and search suggestions.

---

## 2. User Roles & Capabilities

### 2.1 Customer
* **Responsibilities:** Discover products/shops, manage personal cart and wishlist, place orders, complete payments, track delivery status, and review eligible purchases.
* **Capabilities:**
  * Account registration, authentication, profile management, and delivery address management.
  * Location-aware product and vendor browsing, category filtering, keyword searching, and real-time search suggestions.
  * Adding products from multiple vendors into a single cart.
  * Order placement, coupon application, choosing COD or online payment methods.
  * Viewing main order status lifecycle and tracking delivery assignments.
  * Submitting ratings and written reviews on completed, eligible orders.

### 2.2 Vendor
* **Responsibilities:** Register business entity, submit verification documentation, manage store profile, manage product catalog, maintain stock levels, process vendor orders, and configure payout settings.
* **Capabilities:**
  * Vendor registration and application status tracking (`Pending`, `Under Review`, `Approved`, `Rejected`, `Suspended`).
  * Maintaining public store profile (logo, cover image, business description, operating hours, social links, location/map pin).
  * Product management (creating, updating, image management via Cloudinary, low-stock threshold configuration, price/discount settings).
  * Inventory management (viewing current stock and managing availability).
  * Vendor-isolated order processing (viewing only own vendor orders, updating preparation states).
  * Viewing vendor dashboard metrics (sales analytics, top products, pending payouts, average rating).

### 2.3 Delivery Staff
* **Responsibilities:** Accept and view delivery assignments, pick up orders from vendors, update fulfillment status during transit, hand off orders to customers, and complete delivery records.
* **Capabilities:**
  * Delivery staff authentication and assigned delivery queue viewing.
  * Accessing customer delivery addresses, contact details, and delivery instructions.
  * Updating delivery lifecycle statuses (`Picked Up`, `Out for Delivery`, `Delivered`, `Failed Delivery`).
  * Viewing historical delivery logs.

### 2.4 Marketplace Administrator
* **Responsibilities:** Supervise marketplace ecosystem, perform vendor onboarding reviews, manage categories/brands, moderate products and reviews, configure commissions/coupons, analyze search trends, and audit platform security.
* **Capabilities:**
  * Admin dashboard overview (total revenue, active vendors, orders, pending reviews/applications).
  * Vendor application verification and state transitions (Approve/Reject/Suspend).
  * Category and Brand CRUD operations.
  * Catalog moderation (suspending non-compliant products).
  * Marketplace-wide order and payment monitoring.
  * Commission configuration (global percentage, vendor-specific, category-specific).
  * Coupon lifecycle management and promotional restrictions.
  * Review moderation (approving/rejecting/flagging reviews).
  * Search analytics (top searches, zero-result queries) and system audit log inspection.

---

## 3. Core Business Scope

The approved functional baseline for LocalMart encompasses:

| Functional Area | Scope Description |
|---|---|
| **Identity & Authentication** | Customer registration/login, Vendor application submission, Admin authentication, Delivery staff login, JWT access tokens, Refresh token rotation, Role-Based Access Control (RBAC), and Permission-based authorization. |
| **Catalog & Discovery** | Product browsing, category browsing, brand filtering, product detail views, store profiles, price/discount filters, nearby vendor discovery based on lat/long distance calculations. |
| **Search & Suggestions** | Keyword search (name, SKU, brand, category), search suggestions API with **300ms frontend debounce**, search activity logging (`search_logs`), and zero-result tracking. |
| **Cart & Wishlist** | Customer shopping cart supporting multi-vendor products, item quantity modifications, item price/stock revalidation, estimated delivery charges, wishlist creation, and item transfers. |
| **Checkout & Address** | Address book management (default address, lat/long, delivery notes), cart checkout summary, coupon code validation, delivery method selection, and stock re-check. |
| **Orders & Multi-Vendor Splitting** | Parent/Main order creation upon checkout, automatic order splitting into isolated vendor-specific orders, vendor-restricted order visibility, and order lifecycle tracking. |
| **Inventory Control** | Real-time stock validation, stock tracking, reserved stock management during checkout/confirmation, low-stock alerts, and stock adjustment history. |
| **Payments** | Cash on Delivery (COD), online payment gateway integration (Stripe / suitable local gateway), webhook confirmation, payment state management, and refund processing. |
| **Fulfillment & Delivery** | Order preparation workflow, delivery assignment to delivery staff, status updates (`Ready for Pickup`, `Picked Up`, `Out for Delivery`, `Delivered`), and customer order tracking. |
| **Reviews & Ratings** | Verification of purchase eligibility prior to review submission, star ratings, text comments, product/vendor rating aggregations, and admin moderation. |
| **Promotions & Payouts** | Coupon code enforcement (min spend, max discount, expiry, usage caps), platform commission calculations, vendor payable amounts, and payout transaction tracking. |
| **Notifications** | Event-driven real-time notifications for customers, vendors, delivery staff, and admins via SignalR. |
| **Admin & Governance** | Vendor application review, document verification, catalog/product moderation, commission rules, review moderation, search analytics, and audit logging. |

---

## 4. Vendor Registration & Approval Baseline

### 4.1 Required Vendor Registration Information
1. **Owner / Contact:** Full name, business email address, direct phone number.
2. **Business Identity:** Registered shop name, business type, primary category, business description, business registration details.
3. **Location Details:** Complete physical street address, city, district, latitude, longitude, and map pin location.
4. **Verification Documentation:** Business verification information as mandated by legal policy (strictly avoiding unnecessary sensitive identity documents).
5. **Store Profile Setup:** Store logo URL, cover image URL, store description, daily opening/closing hours, social links, contact numbers.
6. **Payout Configuration:** Payout method selection and payment provider account reference (direct raw bank credentials or credit cards MUST NOT be stored in the database).
7. **Terms & Agreements:** Explicit acceptance of vendor marketplace agreement, terms of service, and privacy policy.

### 4.2 Vendor Approval Workflow & State Rules
```text
Vendor Application Submitted
            │
            ▼
     [ PENDING ]
            │
            ▼
   [ UNDER REVIEW ] ◄── Admin Inspects Verification Info & Documents
        │       │
  Approve       Reject
    │               │
    ▼               ▼
[ APPROVED ]    [ REJECTED ]
    │
    ▼
(Active Vendor) ──► Admin Action ──► [ SUSPENDED ]
```

* **Mandatory BRD Rule (BR-001):** **A vendor must not sell products or receive customer orders until the vendor account is approved and active.**
* Vendors may register and submit business information, but their products cannot be publicly purchased until the vendor status is Approved and Active.

---

## 5. Customer Purchase & Fulfillment Workflow

### 5.1 End-to-End Customer Purchase Journey
```text
Landing Page / Discovery
            │
            ▼
Search / Browse / Nearby Shops
            │
            ▼
Search Suggestions (300ms Debounce)
            │
            ▼
Product Details View
            │
            ▼
Add Product to Cart (Multi-Vendor items supported)
            │
            ▼
View Multi-Vendor Cart
            │
            ▼
Proceed to Checkout
            │
            ▼
Select Address & Delivery Method
            │
            ▼
Apply Coupon & Select Payment (COD or Online)
            │
            ▼
System Revalidates Stock, Pricing, & Coupons
            │
            ▼
Main Order Created (#1000)
            │
  ┌─────────┴─────────┐
  ▼                   ▼
Vendor A Order      Vendor B Order
(#1000-A)           (#1000-B)
  │                   │
  ▼                   ▼
Confirmed           Confirmed
  │                   │
  ▼                   ▼
Preparing           Preparing
  │                   │
  └─────────┬─────────┘
            │
            ▼
     Ready for Pickup
            │
            ▼
    Delivery Assigned
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
  Customer Leaves Review (Eligible Purchases Only)
```

---

## 6. Multi-Vendor Order & Isolation Model

### 6.1 Parent vs. Vendor Order Architecture
When a customer purchases products belonging to multiple vendors in a single checkout session:
1. The platform generates one single **Parent / Main Order** (e.g., `#1000`) representing the complete transaction for the customer.
2. The platform automatically splits the checkout into distinct **Vendor-Specific Orders** (e.g., `#1000-A` for Vendor A, `#1000-B` for Vendor B).
3. **Data Isolation Enforcement:**
   * **Customer:** Views the unified Main Order and overall delivery status.
   * **Vendor A:** Has access ONLY to Vendor Order `#1000-A` and its specific line items. Vendor A cannot view Vendor B's items, revenue, or customer interaction notes.
   * **Vendor B:** Has access ONLY to Vendor Order `#1000-B`.
   * **Admin:** Retains global visibility over the Main Order and all constituent Vendor Orders.

### 6.2 Order Totals & Revalidation
* The sum of sub-totals, vendor-specific shipping fees, and allocated discounts across all Vendor Orders must equal the Main Order total.
* Before confirming order creation, the system executes stock validation across every vendor line item.

---

## 7. Product & Inventory Business Rules

### 7.1 Product Fields & Lifecycle States
* **Product Attributes:** Product Name, SKU, Long/Short Description, Category ID, Brand ID, Vendor ID, Base Price, Discount Price/Percentage, Image URLs (Primary + Gallery), Stock Quantity, Low-Stock Threshold, Rating Aggregate, Status, Created Date, Updated Date.
* **Product Lifecycle States:**
  * `Draft`: Under creation by vendor, hidden from public.
  * `Active`: Approved, in stock, visible for purchase.
  * `Inactive`: Temporarily disabled by vendor.
  * `Out of Stock`: Available stock reaches 0, visible but non-purchasable.
  * `Suspended`: Flagged or hidden by Admin due to compliance issues.

### 7.2 Inventory Calculations & Validation
* **Core BRD Rules:**
  * **BR-005 (Inventory Validation):** The system must validate available stock before confirming any order.
  * **BR-006 (Inventory Reservation):** Where required, inventory should be reserved during the checkout/order-confirmation process to prevent overselling.
* **Design Note on Stock Lifecycle:** Specific stock transition mechanics (such as exact reservation windows during checkout, decrementing triggers upon payment/confirmation, and release triggers upon cancellation) are technical/business decisions to be finalized in later SRS, Database Design, and LLD phases rather than permanently locked BRD business rules.
* **Product Visibility Rule (BR-012):** **Only active products belonging to active vendors can be publicly purchased.**

---

## 8. Search & Search Suggestions Baseline

### 8.1 Search Capabilities
* Multi-attribute search across Product Name, SKU, Brand, Category, and Description keywords.
* Filtering by price range, brand, category, rating, discount, and location proximity (nearby).
* Sorting by Relevance, Price (Low-to-High / High-to-Low), Rating, Newest, and Proximity.

### 8.2 Real-Time Suggestions & Debounce Rule
* Real-time search suggestions endpoint (`GET /api/v1/search/suggestions?prefix={term}`).
* **Frontend Debounce Rule:** The frontend UI must implement a **300ms debounce delay** on search input fields before issuing API requests to prevent server flooding.
* **Search Activity Logging:** Valid search queries are saved into the `search_logs` table (capturing `user_id` [nullable], `search_term`, and `searched_at`).
* **Zero-Result Tracking:** Searches returning zero product matches are flagged for admin catalog analysis.

---

## 9. Payments, Commissions & Payouts

### 9.1 Payment Baseline
* **Supported Payment Options:**
  1. Cash on Delivery (COD)
  2. Online Payment Gateway (Stripe / suitable local gateway)
* **Payment States:** `Pending` → `Processing` → `Paid` / `Failed` → `Refunded`
* **Payment Security:** Raw payment card numbers or bank credentials MUST NOT be stored. Online payment confirmation relies strictly on cryptographic payment gateway callbacks and webhooks.

### 9.2 Commission Model & Vendor Payouts
* **Commission Calculation:** Platform commission is calculated according to active marketplace commission rules ($\text{Vendor Payable Amount} = \text{Product Sale Amount} - \text{Platform Commission Amount}$).
* Commission rates are configurable globally, per-category, or per-vendor by administrators.
* Payout records track transaction history, payout statuses (`Pending`, `Processing`, `Paid`), and provider references.

---

## 10. Order & Delivery Lifecycle States

### 10.1 Order Status Transitions
```text
  [ PENDING ] ──► [ CONFIRMED ] ──► [ PREPARING ] ──► [ READY FOR PICKUP ]
       │                                                     │
       ▼                                                     ▼
  [ CANCELLED ] / [ REJECTED ]                         [ PICKED UP ]
                                                             │
                                                             ▼
                                                    [ OUT FOR DELIVERY ]
                                                             │
                                                             ▼
                                                       [ DELIVERED ]
```

### 10.2 Delivery Staff Assignments
* When an order reaches `Ready for Pickup`, it enters the delivery assignment pool.
* Delivery staff accept assignments, perform pickup at the vendor shop location, update status to `Picked Up`, transition to `Out for Delivery` during transit, and mark `Delivered` upon customer handoff.

---

## 11. Reviews & Moderation Rules

* **Eligibility Rule (BR-004):** **A customer may only submit a product rating and review if they have completed a qualifying purchase of that product.**
* Review structure: Star Rating (1-5), Written Comment, Order ID, Product ID, Vendor ID, Created Timestamp.
* Moderation: Admins can flag, hide, or moderate inappropriate reviews.

---

## 12. Security Baseline

1. **Authentication:** JWT access tokens for stateless authorization paired with HTTP-only Refresh Tokens for session extension.
2. **Authorization:** Role-Based Access Control (`Customer`, `Vendor`, `Delivery`, `Admin`) combined with granular permission checks.
3. **Data Isolation:** Rigid database-level and query-level isolation ensuring Vendors only see their own store data and Customers only see their own profile/order data.
4. **Data Protection:** Passwords hashed using Strong Password Hashing (e.g., BCrypt / ASP.NET Core Identity PasswordHasher).
5. **API & File Security:** Strict input validation via FluentValidation, content-type file upload validation, and secret key separation in environment configuration.
6. **Audit Trail:** Comprehensive `AuditLogs` capturing administrative actions (vendor approval/rejection, price overrides, commission updates, review moderation).

---

## 13. Non-Functional Requirements (NFRs)

* **Performance:** Frontend debouncing (300ms), server-side pagination for product/order lists, optimized query execution avoiding unnecessary database queries.
* **Scalability:** Clean Architecture separation allowing independent scaling of API, database, and background SignalR hubs; database indexing on SKU, vendor_id, category_id, lat/long.
* **Availability:** Graceful exception handling middleware, health check endpoints (`/health`), structured logging (Serilog or equivalent structured logging framework).
* **Usability:** Responsive UI tailored for desktop and mobile browsers, intuitive multi-step checkout, clear order state feedback.

---

## 14. Technology Baseline & Architecture

```text
               ┌────────────────────────────────────────┐
               │           Angular Frontend             │
               │  TypeScript | Tailwind CSS | Signals   │
               └───────────────────┬────────────────────┘
                                   │
                           REST APIs / SignalR
                                   │
               ┌───────────────────▼────────────────────┐
               │       ASP.NET Core Web API (.NET 8)    │
               │  Clean Architecture | CQRS | MediatR   │
               └───────────────────┬────────────────────┘
                                   │
               ┌───────────────────▼────────────────────┐
               │         Supabase PostgreSQL            │
               │  Managed Database Infrastructure       │
               └────────────────────────────────────────┘

External Integrations:
  ├── Cloudinary (Product / Vendor Media Management)
  ├── Stripe / Local Payment Gateway (Payment Processing)
  ├── Maps API (Geocoding & Distance Calculation)
  └── MCP (Controlled Developer Tooling & Context Integration)
```

### Architectural Clarification on Supabase:
> **CRITICAL ARCHITECTURAL LOCK:** Supabase serves purely as the **managed PostgreSQL database and backend infrastructure provider**. Supabase does NOT replace the ASP.NET Core application API layer. All business logic, CQRS handlers, authorization, order splitting, and domain rules reside exclusively within the ASP.NET Core application.

---

## 15. Scope Definition: MVP vs. Future Scope

### 15.1 MVP Scope (Included in Initial Release)
* **Customer:** Browsing, search, search suggestions (300ms debounce), multi-vendor cart, wishlist, address management, checkout, COD/online payment, order tracking, review submission.
* **Vendor:** Application submission, document upload, store profile, product management, Cloudinary image upload, inventory tracking, vendor-isolated order processing, basic sales dashboard.
* **Admin:** Dashboard, vendor approval/verification review, category/brand management, product moderation, order/payment monitoring, commission setup, coupon management, review moderation, search analytics, audit logs.
* **Delivery:** Delivery staff login, assignment queue, status updates (`Picked Up`, `Out for Delivery`, `Delivered`).
* **Platform:** ASP.NET Core .NET 8, Clean Architecture, CQRS, PostgreSQL via Supabase, Cloudinary, SignalR notifications, JWT + Refresh tokens, xUnit testing.

### 15.2 Future Scope (Explicitly Excluded from MVP)
* **Version 2.0:** Multi-branch vendor support, branch-specific inventory (`ProductBranchStock`), Redis caching, background job queues, vendor promotional campaigns.
* **Version 3.0 (AI & Intelligent Marketplace):** AI semantic search using `pgvector` embeddings, AI personalized recommendation engine, AI demand forecasting, advanced fraud detection.
* **Mobile Applications:** Dedicated iOS/Android native mobile applications, mobile push notifications, full live driver GPS tracking map routing.

---

## 16. Out-of-Scope Items

The following features are **strictly out of scope** for LocalMart and will NOT be implemented:
* International shipping & multi-currency conversion.
* Cryptocurrency payment gateways.
* Advanced automated warehouse robotics or full ERP integrations.
* Advertising / sponsored listings marketplace.
* Medical prescription selling or regulated healthcare products.
* Autonomous delivery (drones / robots).
* Complex multi-tier corporate loyalty programs.

---

## 17. Consolidated Business Rules Index

| Rule ID | Rule Name | Description |
|---|---|---|
| **BR-001** | Vendor Approval Requirement | A vendor cannot sell products or process orders until approved and activated by an Admin. |
| **BR-002** | Vendor Data Isolation | Vendors can access and modify only their own store, products, inventory, orders, and payouts. |
| **BR-003** | Customer Order Isolation | Customers can view only their own placed orders and addresses. |
| **BR-004** | Customer Review Eligibility | Reviews can only be submitted by customers who completed a purchase of the specific product. |
| **BR-005** | Inventory Validation | The system must validate available stock before confirming any order. |
| **BR-006** | Inventory Reservation | Where required, inventory should be reserved during the checkout/order-confirmation process to prevent overselling. |
| **BR-007** | Admin Access Enforcement | Administrative endpoints require verified Admin credentials and permissions. |
| **BR-008** | Coupon Enforcement | Coupons are validated against expiration, usage caps, minimum spend, and category/vendor restrictions. |
| **BR-009** | Payment Confirmation | Online orders are marked paid only upon verified payment gateway webhook callback. |
| **BR-010** | Search Logging | All valid search queries are logged to `search_logs` for business analytics. |
| **BR-011** | Multi-Vendor Order Splitting | Multi-vendor checkouts split parent orders into isolated vendor-specific order records. |
| **BR-012** | Product Visibility Rule | Only Active products from Approved and Active vendors are publicly listed. |
| **BR-013** | Delivery Authorization | Delivery status updates are restricted to authorized delivery staff or automated handlers. |
| **BR-014** | Commission Calculation | System automatically calculates and deducts platform commission from vendor payouts. |
| **BR-015** | Vendor Suspension | Suspended vendor stores immediately lose public visibility and order processing access. |

---

## 18. Main Data Entities Summary

### Current MVP Entities
* **Identity & Security:** `Users`, `Roles`, `Permissions`, `UserRoles`, `RolePermissions`, `RefreshTokens`
* **Customer & Vendor:** `Customers`, `Vendors`, `VendorApplications`, `VendorVerificationRecords`, `Addresses`, `StoreProfiles`
* **Catalog:** `Categories`, `Brands`, `Products`, `ProductImages`, `ProductVariants`
* **Inventory:** `Inventory`, `InventoryMovements`
* **Shopping:** `Carts`, `CartItems`, `Wishlists`, `WishlistItems`
* **Orders & Payments:** `Orders` (Parent), `OrderItems`, `VendorOrders`, `Payments`, `Refunds`
* **Delivery:** `Deliveries`, `DeliveryAssignments`
* **Promotions & Commercial:** `Coupons`, `CouponUsages`, `Commissions`, `Payouts`
* **Engagement:** `Reviews`, `Ratings`, `Notifications`
* **Analytics & Governance:** `SearchLogs`, `AuditLogs`

### Future Entities (Not in MVP)
* `Branches`, `ProductBranchStock`, `SearchEmbeddings`, `Recommendations`, `DemandForecasts`

---

## 19. API Baseline Endpoint Structure

* `/api/v1/auth` (Register, Login, Refresh, Logout)
* `/api/v1/products` (Catalog browsing, detail views, product search)
* `/api/v1/categories` (Category hierarchy)
* `/api/v1/brands` (Brand listings)
* `/api/v1/vendors` (Vendor store profiles, registration submission)
* `/api/v1/cart` (Cart item management)
* `/api/v1/wishlist` (Wishlist items)
* `/api/v1/addresses` (Customer delivery address management)
* `/api/v1/orders` (Checkout, order status, order history)
* `/api/v1/payments` (Payment processing, webhooks, refunds)
* `/api/v1/deliveries` (Delivery staff assignments & updates)
* `/api/v1/reviews` (Review creation & listing)
* `/api/v1/coupons` (Coupon validation)
* `/api/v1/notifications` (Notification management)
* `/api/v1/search` (Search suggestions, trend endpoints)
* `/api/v1/admin` (Admin management, approvals, moderation, audit logs)

---

## 20. Documentation Roadmap

1. **BRD Baseline & Source-of-Truth Lock** `[COMPLETED]`
2. **SRS — Software Requirements Specification** `[NEXT PHASE]`
3. Detailed User Flows
4. Use Case Specification
5. Functional Requirements Matrix
6. Database Design / ERD
7. API Contract
8. System Architecture / HLD
9. Low-Level Design / Module Design
10. UI/UX Specification
11. Security Requirements
12. Testing / QA Strategy
13. DevOps / Deployment Plan
14. Development Roadmap
15. Sprint Plan

---

## 21. Baseline Lock Rules

1. The original BRD (`LocalMart_BRD_v1.0(1).md`) is the primary business source of truth.
2. `docs/BRD_BASELINE.md` serves as the consolidated baseline reference document.
3. All subsequent engineering documentation (SRS, Architecture, API Contracts) must trace back to the BRD and this baseline.
4. All future implementation code must trace back to approved documentation.
5. No new business features or scope expansions may be introduced without explicit approval.
6. Requirements ambiguities must be formally raised as Open Decisions rather than silently resolved.
7. Future-scope roadmap items must not be prematurely implemented during MVP phases.
8. Technical choices must not alter underlying business rules without stakeholders' sign-off.
9. If technical bottlenecks demand a business rule modification, raise it for formal review.
10. A feature shall not be declared complete merely because code exists—verification standards apply.

---

## 22. Future Technical Decisions

This section captures technical implementation choices and design details that are deferred to later documentation phases (SRS, Architecture, LLD, Database Design, API Contract) and do NOT introduce new business features or alter BRD scope:

* **Exact Payment Gateway Provider:** Selecting the specific online payment provider (Stripe vs. suitable local gateway) based on deployment region, supported currencies, transaction fees, compliance, and business needs.
* **Maps API Provider:** Choosing the specific mapping service provider (Google Maps API, Mapbox, OpenStreetMap) for lat/long geocoding, distance calculations, and map pin rendering.
* **Notification Implementation Details:** Specifying delivery mechanisms and handlers for email, SMS, and SignalR real-time hubs.
* **Inventory Reservation Lifecycle:** Finalizing exact transactional mechanics for stock reservation timing during checkout, decrementing triggers upon payment/confirmation, locking strategies, and cancellation release timeouts.
* **Search Ranking & Suggestions Implementation:** Specifying exact database indexing structures, full-text search query strategies, and suggestion ranking algorithms.
* **Exact Vendor Verification Document Rules:** Defining specific business registration document types required based on local legal and business policy.
* **SignalR Authentication & Connection Design:** Defining hub authentication, connection management, group authorization, and automatic reconnection strategies.
* **Deployment Architecture:** Finalizing cloud hosting environments, container orchestrations, GitHub Actions CI/CD pipelines, and secret management tools.

---

## 23. Browser Verification Rule for Future Implementation Phases

* **Current Phase Status:** Documentation-Only (`Browser Verification: N/A`)
* **Rule for All Future Implementation Phases:**  
  Every user-facing functional release must adhere to the execution flow:  
  `Code Implementation → Launch Server → Open Browser → Perform Real User Flow → Verify UI Behavior → Record Verification`  
  No feature will be marked as "completed" based solely on unit tests or raw source code existence.
