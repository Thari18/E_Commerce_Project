# LocalMart — Business Requirements Document (BRD)

**Document Version:** 1.0  
**Status:** Draft / Baseline  
**Project:** LocalMart — Location-Aware Multi-Vendor E-Commerce Marketplace  
**Document Type:** Business Requirements Document  
**Prepared For:** Academic / Portfolio / Production-Oriented Project Planning

---

## 1. Executive Summary

LocalMart is a location-aware, multi-vendor e-commerce marketplace that connects customers with local shops and independent businesses through a single digital platform.

Customers can discover nearby products and vendors, search and filter products, compare available options, add products from multiple vendors to a cart, place orders, make payments, track delivery progress, and submit reviews.

Vendors can register their businesses, submit verification information, wait for administrator approval, create and manage products, maintain inventory, receive and process orders, manage their store profile, and view sales analytics.

Administrators control and monitor the marketplace, including customers, vendors, products, categories, orders, payments, commissions, coupons, reviews, reports, search analytics, audit logs, and system configuration.

Delivery staff support the operational delivery workflow by receiving assignments, picking up orders, updating delivery status, and completing deliveries.

The main differentiators of LocalMart are:

- Multi-vendor commerce
- Local / nearby shopping
- Vendor approval and verification
- Multi-vendor cart and order splitting
- Inventory-aware purchasing
- Real-time order notifications
- Search suggestions and search analytics
- Delivery workflow
- Role- and permission-based security
- Architecture prepared for future AI-powered search and recommendations

---

# 2. Business Problem

Many local businesses currently depend on WhatsApp, Facebook, phone calls, spreadsheets, or manual processes to manage online sales.

This creates several business problems:

1. Customers cannot easily discover products from multiple local shops in one place.
2. Product availability is often unclear or outdated.
3. Vendors have limited tools for inventory and order management.
4. Orders are frequently handled manually.
5. Customers have limited visibility into order and delivery status.
6. Administrators lack centralized marketplace-wide visibility.
7. Search behavior and customer demand are difficult to measure.
8. Delivery coordination is often disconnected from ordering.
9. Small businesses may not have the technical resources to build their own e-commerce systems.

LocalMart addresses these problems by providing one centralized marketplace for local commerce.

---

# 3. Business Objectives

## 3.1 Primary Objectives

1. Provide a centralized digital marketplace for local vendors.
2. Allow customers to discover and purchase products from multiple vendors.
3. Provide vendors with tools to manage products, inventory, orders, and store information.
4. Provide administrators with centralized marketplace management.
5. Provide transparent order and delivery tracking.
6. Support secure online payments and Cash on Delivery.
7. Capture search and sales analytics to understand customer demand.
8. Support real-time notifications for important business events.
9. Build a scalable and maintainable architecture suitable for future growth.
10. Provide a foundation for future AI-powered search and recommendation features.

## 3.2 Secondary Objectives

- Improve the digital presence of local businesses.
- Reduce manual order processing.
- Improve customer shopping experience.
- Increase vendor visibility.
- Improve inventory accuracy.
- Improve marketplace operational visibility.
- Support data-driven business decisions.

---

# 4. Project Scope

## 4.1 In Scope

### Customer

- Registration and login
- Product browsing
- Product search
- Search suggestions
- Category browsing
- Product filtering and sorting
- Vendor/store browsing
- Nearby vendor/product discovery
- Product details
- Shopping cart
- Multi-vendor cart
- Wishlist
- Checkout
- Address management
- Payment
- Cash on Delivery
- Order history
- Order tracking
- Order cancellation where applicable
- Reviews and ratings
- Notifications
- Customer profile

### Vendor

- Vendor registration
- Business verification information submission
- Vendor approval / rejection workflow
- Shop profile management
- Product management
- Product image management
- Inventory management
- Order management
- Sales analytics
- Vendor notifications
- Review viewing
- Vendor settings
- Payout configuration

### Administrator

- Admin dashboard
- Customer management
- Vendor management
- Vendor approval / rejection
- Vendor verification review
- Category management
- Brand management
- Product moderation
- Order monitoring
- Payment monitoring
- Commission configuration
- Coupon management
- Review moderation
- Reports and analytics
- Search analytics
- Audit logs
- System settings

### Delivery Staff

- Delivery staff login
- Assigned deliveries
- Delivery assignment viewing
- Order pickup
- Delivery status updates
- Customer delivery information
- Delivery history

### Platform

- Authentication
- Role-based authorization
- Permission-based authorization
- Search logging
- Search suggestions
- Real-time notifications
- Audit logging
- Reporting
- Image/media management
- Payment integration
- Location-aware discovery
- API documentation
- Health checks
- Structured logging

---

# 5. Out of Scope — Initial Release

The following features are intentionally excluded from the initial release:

- International shipping
- Multi-currency support
- Cryptocurrency payments
- Advanced warehouse robotics
- Full ERP functionality
- Advertising marketplace
- Social media platform
- Medical prescription sales
- Fully autonomous delivery
- Complex loyalty ecosystem
- Advanced AI demand forecasting
- Advanced AI recommendation engine
- Full live driver GPS tracking
- Dedicated mobile applications

These features may be considered in future versions.

---

# 6. User Roles

## 6.1 Customer

A customer uses LocalMart to discover and purchase products.

### Responsibilities

- Browse products and vendors
- Search for products
- Manage cart and wishlist
- Manage delivery addresses
- Place orders
- Make payments
- Track orders
- Receive notifications
- Submit eligible reviews

---

## 6.2 Vendor

A vendor represents a local shop or business selling products through LocalMart.

### Responsibilities

- Register the business
- Submit verification information
- Maintain shop information
- Manage products
- Manage product images
- Maintain inventory
- Process assigned orders
- View sales analytics
- Configure payout information
- Monitor reviews

A vendor cannot sell products until the vendor application is approved.

---

## 6.3 Administrator

The administrator controls and supervises the marketplace.

### Responsibilities

- Approve or reject vendors
- Review vendor verification information
- Manage users
- Manage categories and brands
- Moderate products
- Monitor orders and payments
- Configure commissions
- Manage coupons
- Moderate reviews
- Review analytics and reports
- Monitor search trends
- Manage system configuration
- Review audit logs

---

## 6.4 Delivery Staff

Delivery staff handle operational delivery tasks.

### Responsibilities

- View assigned deliveries
- Accept or acknowledge assignments where applicable
- Pick up orders
- Update delivery status
- View customer delivery information
- Complete deliveries
- View delivery history

---

# 7. High-Level Business Flow

```text
Customer
   |
   v
Landing Page
   |
   v
Search / Browse / Nearby Shopping
   |
   v
Product Details
   |
   v
Add to Cart
   |
   v
Multi-Vendor Cart
   |
   v
Checkout
   |
   v
Address + Delivery Method
   |
   v
Payment / Cash on Delivery
   |
   v
Main Order Created
   |
   +--------------------+
   |                    |
   v                    v
Vendor A Order       Vendor B Order
   |                    |
   v                    v
Confirmed            Confirmed
   |                    |
   v                    v
Preparing            Preparing
   |                    |
   +---------+----------+
             |
             v
       Ready for Pickup
             |
             v
      Delivery Assignment
             |
             v
          Picked Up
             |
             v
      Out for Delivery
             |
             v
          Delivered
             |
             v
      Customer Review
```

---

# 8. Landing Page Requirements

The landing page is the public entry point to LocalMart.

## 8.1 Required Sections

1. Navigation bar
2. LocalMart logo / branding
3. Search box
4. Login
5. Customer registration
6. Shopping cart
7. Hero section
8. Product categories
9. Popular products
10. Nearby / local shops
11. Best deals
12. Featured products
13. How LocalMart Works
14. Become a Vendor section
15. Footer

## 8.2 Vendor Call-to-Action

The landing page should contain a clear vendor CTA:

> **Are you a business owner? Start selling on LocalMart.**

Button:

> **Become a Vendor**

The button opens the vendor registration and application flow.

---

# 9. Customer Registration

Customers should be able to create an account using:

- Full name
- Email address
- Phone number
- Password
- Confirm password

After successful registration, the customer can access customer-specific features.

---

# 10. Vendor Registration, Verification and Approval

Vendor registration is separate from normal customer registration because vendors represent businesses and require marketplace approval.

## 10.1 Vendor Registration Information

### 1. Owner / Contact

- Owner or contact person name
- Email address
- Phone number

### 2. Business

- Business / shop name
- Business type
- Business category
- Business description
- Business registration details where applicable

### 3. Location

- Full business address
- City
- District
- Latitude
- Longitude
- Map location where supported

### 4. Verification

- Business verification information
- Business registration information where applicable
- Verification documents where required by business policy

> The system should collect only the verification information required by the marketplace's business and legal policy. Sensitive identity or financial documents should not be requested unnecessarily.

### 5. Store Profile

- Store logo
- Cover image
- Store description
- Opening hours
- Social media links
- Contact information

### 6. Payout

- Payout configuration
- Supported payout method
- Provider/account reference required for settlement

> Raw bank credentials, card numbers, passwords, or other unnecessary financial secrets must not be stored directly in the application database. Where possible, a payment provider's secure onboarding mechanism should be used.

### 7. Terms

- Vendor agreement
- Marketplace terms
- Privacy policy acknowledgement
- Vendor policy acceptance

---

## 10.2 Vendor Approval Workflow

```text
Vendor Registration
        |
        v
Application Submitted
        |
        v
Pending Approval
        |
        v
Admin Review
     /       \
    /         \
Approve       Reject
   |
   v
Active Vendor
   |
   v
Vendor Dashboard
```

Possible future state:

```text
Pending
Under Review
Approved
Rejected
Suspended
```

A vendor must not create publicly sellable products or receive customer orders until the vendor is approved and active.

---

# 11. Vendor Store Profile

An approved vendor can maintain a public store profile.

## Store Profile Information

- Store name
- Logo
- Cover image
- Business category
- Description
- Address
- City / district
- Map location
- Opening hours
- Contact information
- Social links
- Store status
- Rating

Customers can use the store profile to discover products sold by that vendor.

---

# 12. Product Requirements

Each product should support:

- Product name
- SKU
- Description
- Category
- Brand
- Vendor
- Price
- Discount
- Product images
- Available quantity
- Low-stock threshold
- Product status
- Rating
- Created date
- Updated date

## 12.1 Product Status

```text
Draft
Active
Inactive
Out of Stock
Suspended
```

Only eligible products with `Active` status should be available for customer purchase.

---

# 13. Product Image / Media Requirements

Vendors should be able to upload product images.

Media requirements:

- Multiple product images
- Primary product image
- Vendor logo
- Store cover image
- Image validation
- Image optimization
- Appropriate file size/type restrictions

Cloudinary is recommended for product and vendor media management.

---

# 14. Inventory Requirements

Inventory should track:

- Available quantity
- Reserved quantity
- Sold quantity
- Low-stock threshold
- Stock movements
- Stock adjustment history

Example:

```text
Physical/Current Stock = 20
Reserved Stock         = 3
Available for Sale     = 17
```

The system must validate inventory before confirming an order.

Inventory should be updated safely when orders are placed, cancelled, fulfilled, or otherwise change stock responsibility.

---

# 15. Multi-Vendor Cart

A customer may add products from multiple vendors to one cart.

Example:

```text
Cart

Vendor A
 ├── Product A
 └── Product B

Vendor B
 ├── Product C
 └── Product D
```

During checkout, the system creates one parent/main order and separate vendor-specific order records.

```text
Main Order #1001

 ├── Vendor Order #1001-A
 └── Vendor Order #1001-B
```

### Business Rules

- Customers see the complete parent order.
- Each vendor sees only their own vendor order.
- Vendor A cannot access Vendor B's order items.
- Order totals must remain consistent between the parent order and vendor orders.
- Inventory must be validated for each vendor order.

---

# 16. Search Requirements

LocalMart should provide a fast product discovery experience.

## 16.1 Basic Search

Customers can search by:

- Product name
- SKU
- Brand
- Category
- Keyword

## 16.2 Filters

Supported filters may include:

- Category
- Price range
- Brand
- Rating
- Availability
- Vendor
- Discount
- Nearby / distance
- Location availability

## 16.3 Sorting

Possible sorting options:

- Relevance
- Price: Low to High
- Price: High to Low
- Rating
- Newest
- Discount
- Nearby

---

# 17. Search Suggestions

The system should provide real-time search suggestions while the customer types.

## 17.1 Search Logs

A `search_logs` table should record valid search activity.

Suggested structure:

```text
search_logs
-----------
id
user_id          nullable
search_term
searched_at
```

Example:

```text
iphone 15
iphone 15
nike shoes
iphone 15
wireless mouse
```

The search log can be used to identify frequently searched terms.

## 17.2 Suggestions API

```http
GET /api/v1/search/suggestions?prefix=iph
```

Example response:

```json
[
  "iphone 15",
  "iphone 15 pro",
  "iphone charger"
]
```

## 17.3 Frontend Debounce

The frontend should use approximately **300 ms debounce** before requesting search suggestions.

```text
User types
    |
    v
Wait 300 ms
    |
    v
Has typing stopped?
    |
   Yes
    |
    v
Call Suggestions API
    |
    v
Display Suggestions
```

This reduces unnecessary API requests.

---

# 18. Search Analytics

Search logs should support business analytics.

Example:

```text
Top Searches

1. iphone 15        1,240
2. samsung s25        980
3. nike shoes         745
4. laptop             621
5. wireless mouse     510
```

The system may also identify:

- Searches with zero results
- Most searched categories
- Search frequency over time
- Search-to-product-click behavior in future versions

Search analytics can help administrators understand customer demand and identify catalog gaps.

---

# 19. Shopping Cart

Customers can:

- Add products
- Remove products
- Change quantity
- View item subtotal
- View vendor grouping
- Apply eligible coupons
- View estimated delivery charges
- View total amount
- Continue to checkout

The system must revalidate product availability and pricing before order confirmation.

---

# 20. Wishlist

Customers can:

- Add products to wishlist
- Remove products
- View wishlist
- Move products to cart
- Identify unavailable products

---

# 21. Address Management

Customers should be able to:

- Add delivery addresses
- Edit addresses
- Delete addresses
- Set a default address
- Select an address during checkout

An address may contain:

- Recipient name
- Phone number
- Address line
- City
- District
- Postal code where applicable
- Delivery instructions
- Latitude / longitude where supported

---

# 22. Checkout

Checkout should contain:

1. Cart review
2. Vendor order summary
3. Delivery address
4. Delivery method
5. Delivery charge
6. Coupon
7. Payment method
8. Order summary
9. Order confirmation

Before final confirmation, the system should revalidate:

- Product availability
- Product price
- Discount
- Coupon validity
- Delivery availability
- Order totals

---

# 23. Payment Requirements

Supported payment methods may include:

- Cash on Delivery
- Online card / payment gateway
- Appropriate local payment gateway where required

## Payment Status

```text
Pending
Processing
Paid
Failed
Refunded
```

Payment information must not expose or unnecessarily store sensitive payment credentials.

Online payment confirmation should rely on the payment provider's secure confirmation mechanism, such as verified callbacks/webhooks where applicable.

---

# 24. Order Management

## 24.1 Main Order Lifecycle

```text
Pending
   |
   v
Confirmed
   |
   v
Preparing
   |
   v
Ready for Pickup
   |
   v
Picked Up
   |
   v
Out for Delivery
   |
   v
Delivered
```

## 24.2 Exception States

```text
Cancelled
Rejected
Failed Delivery
Refunded
```

State transitions must be controlled by business rules and user permissions.

---

# 25. Delivery Management

Delivery staff should receive delivery assignments for eligible orders.

## Delivery Workflow

```text
Order Ready
    |
    v
Delivery Assigned
    |
    v
Picked Up
    |
    v
Out for Delivery
    |
    v
Delivered
```

Customers should be able to view the current delivery status.

Future versions may support:

- Map routing
- Estimated arrival time
- Driver location
- Live tracking

---

# 26. Reviews and Ratings

Only eligible customers who have completed a qualifying purchase should be allowed to review a product.

A review may contain:

- Rating
- Comment
- Review date
- Order reference
- Product reference
- Vendor reference

LocalMart may support:

- Product rating
- Vendor/store rating

Administrators can moderate inappropriate reviews.

---

# 27. Coupons and Discounts

Coupons should support:

- Coupon code
- Discount type
- Percentage or fixed amount
- Minimum order value
- Maximum discount
- Start date
- Expiry date
- Usage limit
- Per-customer usage limit
- Vendor restrictions
- Category restrictions
- Product restrictions
- Active/inactive status

Example:

```text
NEWUSER
10% OFF
Minimum Order: LKR 2,000
Maximum Discount: LKR 1,000
```

---

# 28. Commission and Payout Requirements

Because LocalMart is a multi-vendor marketplace, the platform may collect a commission from vendor sales.

The commission model should support:

- Platform commission percentage
- Vendor-specific commission where required
- Category-specific commission where required
- Order-level commission calculation
- Vendor payable amount
- Payout status
- Payout history

Example:

```text
Product Sale        LKR 10,000
Platform Commission LKR 1,000
Vendor Amount       LKR 9,000
```

Actual commission rules should be configurable by authorized administrators.

---

# 29. Notifications

Notifications should be generated for important business events.

## 29.1 Customer

- Registration / account events
- Order placed
- Order confirmed
- Order prepared
- Ready for pickup
- Out for delivery
- Delivered
- Payment status
- Cancellation / refund
- Promotional notifications where enabled

## 29.2 Vendor

- Vendor approval / rejection
- New order
- Order cancellation
- Low stock
- Payment / payout updates
- Important marketplace announcements

## 29.3 Delivery Staff

- New delivery assignment
- Assignment changes
- Cancellation
- Delivery instructions

## 29.4 Admin

- New vendor registration
- Verification pending
- Payment issue
- System alerts
- Operational alerts

Real-time application notifications may use SignalR.

---

# 30. Vendor Dashboard

The vendor dashboard should provide an operational overview.

## Key Metrics

```text
Total Orders
Total Sales
Total Revenue
Pending Orders
Low Stock Products
Average Rating
Pending Payouts
```

## Vendor Navigation

```text
Dashboard
Products
Inventory
Orders
Reviews
Analytics
Notifications
Store Profile
Payouts
Settings
```

---

# 31. Admin Dashboard

The admin dashboard should provide marketplace-wide visibility.

## Key Metrics

```text
Total Customers
Total Vendors
Total Products
Total Orders
Total Revenue
Pending Vendor Applications
Pending Reviews
Pending Payments
```

## Analytics

- Daily sales
- Weekly sales
- Monthly sales
- Top products
- Top vendors
- Order status distribution
- Cancellation rate
- Payment status
- Search trends
- Zero-result searches
- Vendor performance

---

# 32. Location-Aware Shopping

Location awareness is one of LocalMart's main differentiators.

Customers may be able to:

- Discover nearby vendors
- Find products available from nearby vendors
- Filter vendors by distance
- View vendor distance
- View local availability
- View estimated delivery availability

High-level flow:

```text
Customer Location
       |
       v
Nearby Vendors
       |
       v
Available Products
       |
       v
Delivery Availability
       |
       v
Customer Order
```

The initial implementation may use latitude/longitude and distance calculations.

Advanced map and live-location features can be introduced progressively.

---

# 33. Authentication and Authorization

The platform should use secure authentication and authorization.

## Requirements

- Customer authentication
- Vendor authentication
- Admin authentication
- Delivery staff authentication
- JWT-based authentication
- Refresh-token based session management
- Role-based authorization
- Permission-based authorization
- Secure password hashing
- Account status validation
- Protected API endpoints

## Role Isolation

```text
Customer
  → Own profile
  → Own cart
  → Own orders
  → Eligible reviews

Vendor
  → Own store
  → Own products
  → Own inventory
  → Own vendor orders
  → Own analytics

Delivery Staff
  → Assigned deliveries
  → Delivery history

Admin
  → Authorized marketplace management
```

---

# 34. Audit Logging

Important administrative and business operations should be auditable.

Audit logs may capture:

- Actor/user
- Action
- Entity type
- Entity identifier
- Previous value where appropriate
- New value where appropriate
- Timestamp
- IP/device information where appropriate and lawful

Examples:

```text
Admin approved vendor
Admin suspended product
Vendor updated product price
Admin changed commission
Admin rejected review
```

---

# 35. Business Rules

## BR-001 Vendor Approval

A vendor cannot sell products until the vendor account is approved and active.

## BR-002 Vendor Isolation

A vendor can access and modify only their own store, products, inventory, orders, reviews, and analytics within their permissions.

## BR-003 Customer Order Isolation

A customer can view only their own orders.

## BR-004 Customer Review Eligibility

A customer can review a product only after completing a qualifying purchase.

## BR-005 Inventory Validation

The system must validate stock before confirming an order.

## BR-006 Inventory Reservation

Where required, inventory should be reserved during the checkout/order-confirmation process to prevent overselling.

## BR-007 Admin Access

Administrative operations require appropriate administrative permissions.

## BR-008 Coupon Validation

Coupons must be validated against expiry, usage limits, minimum order value, and applicable scope.

## BR-009 Payment Confirmation

An online order should not be considered successfully paid until the payment provider confirms the transaction.

## BR-010 Search Logging

Valid product searches should be logged for analytics, subject to applicable privacy requirements.

## BR-011 Multi-Vendor Order Splitting

A multi-vendor cart must generate vendor-specific order records while retaining a parent/main order reference.

## BR-012 Product Visibility

Only active and eligible products from active vendors should be publicly purchasable.

## BR-013 Delivery Status

Only authorized delivery users or system processes may update delivery statuses.

## BR-014 Commission Calculation

Commission must be calculated according to the active marketplace commission rules.

## BR-015 Vendor Suspension

A suspended vendor must not accept new customer orders or publish new sellable products until reactivated.

---

# 36. Functional Requirements

## 36.1 Authentication

**FR-AUTH-001:** The system shall allow customers to register.

**FR-AUTH-002:** The system shall allow vendors to submit registration applications.

**FR-AUTH-003:** The system shall allow authorized users to log in securely.

**FR-AUTH-004:** The system shall support role-based authorization.

**FR-AUTH-005:** The system shall support permission-based authorization.

**FR-AUTH-006:** The system shall support refresh-token based sessions where applicable.

**FR-AUTH-007:** The system shall securely hash user passwords.

---

## 36.2 Customer

**FR-CUS-001:** Customer shall browse products.

**FR-CUS-002:** Customer shall search products.

**FR-CUS-003:** Customer shall receive search suggestions.

**FR-CUS-004:** Customer shall filter and sort products.

**FR-CUS-005:** Customer shall browse vendor stores.

**FR-CUS-006:** Customer shall discover nearby vendors/products where location functionality is enabled.

**FR-CUS-007:** Customer shall manage cart items.

**FR-CUS-008:** Customer shall manage wishlist items.

**FR-CUS-009:** Customer shall manage delivery addresses.

**FR-CUS-010:** Customer shall place orders.

**FR-CUS-011:** Customer shall make supported payments.

**FR-CUS-012:** Customer shall view order history.

**FR-CUS-013:** Customer shall track order status.

**FR-CUS-014:** Customer shall cancel eligible orders.

**FR-CUS-015:** Customer shall submit eligible reviews.

**FR-CUS-016:** Customer shall receive notifications.

---

## 36.3 Vendor

**FR-VEN-001:** Vendor shall submit registration information.

**FR-VEN-002:** Vendor shall submit required verification information.

**FR-VEN-003:** Vendor shall view application status.

**FR-VEN-004:** Approved vendor shall manage shop information.

**FR-VEN-005:** Approved vendor shall create products.

**FR-VEN-006:** Vendor shall update product information.

**FR-VEN-007:** Vendor shall manage product images.

**FR-VEN-008:** Vendor shall manage inventory.

**FR-VEN-009:** Vendor shall view assigned vendor orders.

**FR-VEN-010:** Vendor shall process assigned orders.

**FR-VEN-011:** Vendor shall view sales analytics.

**FR-VEN-012:** Vendor shall view reviews.

**FR-VEN-013:** Vendor shall configure payout information through supported secure mechanisms.

**FR-VEN-014:** Vendor shall receive notifications.

---

## 36.4 Admin

**FR-ADM-001:** Admin shall approve or reject vendor applications.

**FR-ADM-002:** Admin shall review vendor verification information.

**FR-ADM-003:** Admin shall manage customers.

**FR-ADM-004:** Admin shall manage vendors.

**FR-ADM-005:** Admin shall manage categories and brands.

**FR-ADM-006:** Admin shall moderate products.

**FR-ADM-007:** Admin shall monitor orders.

**FR-ADM-008:** Admin shall monitor payments.

**FR-ADM-009:** Admin shall configure commissions.

**FR-ADM-010:** Admin shall manage coupons.

**FR-ADM-011:** Admin shall moderate reviews.

**FR-ADM-012:** Admin shall view marketplace analytics.

**FR-ADM-013:** Admin shall view search analytics.

**FR-ADM-014:** Admin shall maintain audit records.

**FR-ADM-015:** Admin shall manage system settings.

---

## 36.5 Delivery

**FR-DEL-001:** Delivery staff shall securely log in.

**FR-DEL-002:** Delivery staff shall view assigned deliveries.

**FR-DEL-003:** Delivery staff shall view eligible customer delivery information.

**FR-DEL-004:** Delivery staff shall update delivery status.

**FR-DEL-005:** Delivery staff shall view delivery history.

**FR-DEL-006:** The system shall notify delivery staff about relevant assignments.

---

# 37. Non-Functional Requirements

## 37.1 Performance

- Search suggestions should respond quickly under normal load.
- Product listings should use pagination.
- Frequently requested data should be cacheable where appropriate.
- Frontend search requests should use debounce.
- APIs should avoid unnecessary database queries.
- Large product/image payloads should be optimized.

## 37.2 Security

- Passwords must be securely hashed.
- APIs must enforce authentication and authorization.
- Vendor data must be isolated.
- Customer data must be isolated.
- Sensitive configuration must be stored outside source control.
- User input must be validated.
- File uploads must be validated.
- Payment credentials must not be unnecessarily stored.
- Audit logs should capture important administrative actions.
- Secrets must be managed through environment or secure secret-management mechanisms.

## 37.3 Scalability

The architecture should support growth in:

- Customers
- Vendors
- Products
- Orders
- Search activity
- Notifications
- Future branches

The system should allow future introduction of Redis, background processing, advanced search, and mobile clients without major architectural redesign.

## 37.4 Availability

The system should be designed for reliable operation using:

- Error handling
- Health checks
- Logging
- Database backups
- Monitoring
- Graceful failure handling

## 37.5 Maintainability

The codebase should use:

- Clear module boundaries
- Clean Architecture
- Consistent naming
- Validation
- Logging
- Automated tests
- API documentation
- Environment-specific configuration
- Versioned APIs

## 37.6 Usability

- Responsive UI
- Clear navigation
- Accessible forms
- Clear validation messages
- Mobile-friendly customer experience
- Simple vendor workflows
- Clear order status presentation

---

# 38. Suggested Technology Stack

## 38.1 Frontend

### Primary

- Angular
- TypeScript
- Tailwind CSS
- RxJS
- Angular Signals
- Angular Reactive Forms

Angular Signals should be used where local/reactive UI state benefits from fine-grained state updates. RxJS remains suitable for asynchronous streams and API/event workflows.

---

## 38.2 Backend

- ASP.NET Core Web API (.NET 8)
- C#
- Clean Architecture
- CQRS
- MediatR
- Entity Framework Core
- FluentValidation
- JWT Authentication
- Refresh Tokens
- SignalR
- REST APIs

---

## 38.3 Database and Backend Infrastructure

### Supabase

Supabase will be used as the managed PostgreSQL backend infrastructure.

Planned usage:

- PostgreSQL database
- Database management
- Database migrations / SQL tooling where appropriate
- Backup / infrastructure capabilities according to the selected Supabase plan
- Optional Supabase Storage if required

**Important:** LocalMart's main application API remains ASP.NET Core. Supabase is primarily the managed PostgreSQL/infrastructure layer rather than replacing the application backend.

---

## 38.4 Media Storage

### Cloudinary

Cloudinary is recommended for media management.

Use cases:

- Product images
- Vendor logos
- Shop cover images
- Image resizing
- Image optimization
- Responsive image delivery
- Media transformations

---

## 38.5 Payments

Possible providers:

- Stripe
- Suitable local payment gateway

Also support:

- Cash on Delivery

The final provider should be selected according to the deployment country, supported currencies, fees, compliance requirements, and business needs.

---

## 38.6 Search

### Initial

- PostgreSQL Full-Text Search
- PostgreSQL indexes
- Search suggestions
- Search logs

### Future

- pgvector
- Semantic search
- AI-powered recommendations
- Search embeddings

Advanced search must not block MVP delivery.

---

## 38.7 Location

- Latitude / longitude
- Maps API
- Distance calculations
- Nearby vendor search
- Nearby product availability
- Future map routing

The initial version should avoid unnecessary live GPS complexity.

---

## 38.8 Real-Time Communication

### SignalR

SignalR may be used for:

- Order status updates
- Vendor new-order notifications
- Delivery assignment notifications
- Admin alerts
- Real-time dashboard updates

---

## 38.9 MCP / AI Integration

### Model Context Protocol (MCP)

MCP may be used as a controlled integration layer for AI-assisted development and future AI workflows.

Potential uses:

- AI-assisted development tools
- Controlled access to project tools/data
- Database inspection through authorized tools
- Development automation
- Future search/recommendation workflows

MCP must follow strict authentication, authorization, least-privilege, and data-access controls.

MCP is not required for the core customer/vendor checkout workflow.

---

## 38.10 DevOps

- Git
- GitHub
- Docker
- GitHub Actions
- Swagger / OpenAPI
- Health Checks
- Structured Logging
- Environment-based configuration

---

## 38.11 Testing

### Backend

- xUnit
- Unit testing
- Integration testing
- API testing

### Frontend

- Angular testing tools
- Component testing
- Service testing
- Integration testing where appropriate

### Quality

Core business workflows should be covered by automated tests.

---

# 39. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Customers      │
                         └──────────┬──────────┘
                                    |
                         ┌──────────▼──────────┐
                         │  Angular Frontend   │
                         │ TypeScript/Tailwind │
                         └──────────┬──────────┘
                                    |
                          REST APIs / SignalR
                                    |
                         ┌──────────▼──────────┐
                         │  ASP.NET Core API   │
                         │       .NET 8        │
                         └──────────┬──────────┘
                                    |
                         ┌──────────▼──────────┐
                         │    Application      │
                         │ CQRS / MediatR      │
                         │ Business Rules      │
                         └──────────┬──────────┘
                                    |
                         ┌──────────▼──────────┐
                         │      Domain         │
                         │   Core Business     │
                         │      Models         │
                         └──────────┬──────────┘
                                    |
                         ┌──────────▼──────────┐
                         │  Infrastructure     │
                         │ EF Core / Services  │
                         └──────────┬──────────┘
                                    |
                         ┌──────────▼──────────┐
                         │ Supabase PostgreSQL │
                         └─────────────────────┘

External Services
 ├── Cloudinary
 ├── Payment Provider
 ├── Maps API
 ├── Email / SMS Provider
 └── Future AI / Search Services
```

---

# 40. Suggested Database Entities

## Identity and Access

```text
Users
Roles
Permissions
UserRoles
RolePermissions
RefreshTokens
```

## Customer and Vendor

```text
Customers
Vendors
VendorApplications
VendorVerificationRecords
Addresses
StoreProfiles
```

## Catalog

```text
Categories
Brands
Products
ProductImages
ProductVariants
```

## Inventory

```text
Inventory
InventoryMovements
```

## Shopping

```text
Carts
CartItems
Wishlists
WishlistItems
```

## Orders and Payments

```text
Orders
OrderItems
VendorOrders
Payments
Refunds
```

## Delivery

```text
Deliveries
DeliveryAssignments
```

## Promotions

```text
Coupons
CouponUsages
Commissions
Payouts
```

## Reviews and Communication

```text
Reviews
Ratings
Notifications
```

## Analytics and Governance

```text
SearchLogs
AuditLogs
```

## Future

```text
Branches
ProductBranchStock
SearchEmbeddings
Recommendations
DemandForecasts
```

---

# 41. API Overview

Suggested versioned API structure:

```text
/api/v1/auth
/api/v1/products
/api/v1/categories
/api/v1/brands
/api/v1/vendors
/api/v1/cart
/api/v1/wishlist
/api/v1/addresses
/api/v1/orders
/api/v1/payments
/api/v1/deliveries
/api/v1/reviews
/api/v1/coupons
/api/v1/notifications
/api/v1/search
/api/v1/admin
```

Example:

```http
GET /api/v1/search/suggestions?prefix=iph
```

Example response:

```json
[
  "iphone 15",
  "iphone 15 pro",
  "iphone charger"
]
```

API contracts should later be documented through OpenAPI / Swagger.

---

# 42. Key User Journeys

## 42.1 Customer Purchase Journey

```text
Landing Page
    ↓
Search / Browse
    ↓
Search Suggestions
    ↓
Product Details
    ↓
Add to Cart
    ↓
Multi-Vendor Cart
    ↓
Checkout
    ↓
Address
    ↓
Delivery Method
    ↓
Payment / COD
    ↓
Order Confirmation
    ↓
Order Tracking
    ↓
Delivery
    ↓
Review
```

---

## 42.2 Vendor Journey

```text
Landing Page
    ↓
Become a Vendor
    ↓
Vendor Registration
    ↓
Business Information
    ↓
Verification Information
    ↓
Store Profile
    ↓
Terms Acceptance
    ↓
Application Submitted
    ↓
Pending Approval
    ↓
Admin Review
    ↓
Approved
    ↓
Vendor Dashboard
    ↓
Create Products
    ↓
Manage Inventory
    ↓
Receive Orders
    ↓
Process Orders
    ↓
Complete Sales
    ↓
View Analytics / Payouts
```

---

## 42.3 Admin Journey

```text
Admin Login
    ↓
Dashboard
    ↓
Vendor Applications
    ↓
Review Vendor
    ↓
Verify Information
    ↓
Approve / Reject
    ↓
Monitor Marketplace
    ↓
Products / Orders / Payments
    ↓
Analytics
    ↓
Search Trends
    ↓
Audit Logs
```

---

## 42.4 Delivery Journey

```text
Delivery Login
    ↓
Assigned Deliveries
    ↓
View Order
    ↓
Pickup
    ↓
Picked Up
    ↓
Out for Delivery
    ↓
Customer Delivery
    ↓
Delivered
    ↓
Delivery History
```

---

# 43. MVP Definition

The first release should focus on the smallest complete marketplace workflow.

## MVP Features

### Customer

- Registration / login
- Product browsing
- Search
- Search suggestions
- Product details
- Cart
- Wishlist
- Address management
- Checkout
- COD / basic online payment
- Orders
- Order status
- Reviews

### Vendor

- Vendor registration
- Vendor verification information
- Admin approval
- Store profile
- Product management
- Product images
- Inventory
- Order processing
- Basic analytics

### Admin

- Admin authentication
- Dashboard
- Vendor approval
- User management
- Category management
- Product moderation
- Order monitoring
- Payment monitoring
- Basic commission management
- Review moderation
- Search analytics
- Audit logs

### Delivery

- Delivery login
- Delivery assignment
- Pickup
- Delivery status updates
- Delivery completion

### Platform

- JWT + refresh token
- RBAC / permissions
- PostgreSQL
- Cloudinary
- SignalR
- Swagger
- Logging
- Health checks
- Automated tests

---

# 44. MVP Exclusions

The following should not block MVP completion:

- AI semantic search
- AI recommendations
- Demand forecasting
- Live driver GPS tracking
- Advanced loyalty
- Mobile application
- Redis
- Advanced warehouse management
- Complex multi-branch inventory

These should be implemented only after the core marketplace workflow is stable.

---

# 45. Future Roadmap

## Version 2.0 — Advanced Local Commerce

- Multiple branches per vendor
- Branch-specific inventory
- Advanced delivery management
- Improved location services
- Advanced analytics
- Vendor promotions
- Better recommendation engine
- Redis caching
- Background job processing

## Version 3.0 — AI and Intelligent Marketplace

- AI semantic search
- pgvector embeddings
- Personalized recommendations
- Demand forecasting
- Advanced fraud detection
- AI-assisted marketplace analytics
- AI-assisted vendor insights

## Future Mobile Platform

- Customer mobile application
- Vendor mobile application
- Delivery staff mobile application
- Push notifications
- Mobile-first location features

---

# 46. Security Requirements Summary

LocalMart should follow secure-by-default principles.

## Required Controls

- Secure password hashing
- JWT authentication
- Refresh-token rotation where implemented
- Role-based authorization
- Permission-based authorization
- Vendor data isolation
- Customer data isolation
- Input validation
- Output validation where appropriate
- File upload validation
- Rate limiting where appropriate
- Secure HTTP configuration in production
- Secrets outside source control
- Payment-provider webhook verification
- Audit logging
- Least-privilege access
- Secure MCP/tool access where enabled

---

# 47. Data and Privacy Considerations

The platform may process:

- Customer account information
- Vendor business information
- Delivery addresses
- Order information
- Payment transaction references
- Search activity
- Reviews
- Notifications
- Audit information

The system should:

1. Collect only required information.
2. Protect personal information.
3. Restrict access according to role and business need.
4. Avoid storing unnecessary payment credentials.
5. Define retention rules for logs and personal data.
6. Provide appropriate privacy policy and consent mechanisms.
7. Follow applicable Sri Lankan and deployment-region privacy/legal requirements.

---

# 48. Success Criteria

LocalMart will be considered successful when:

1. A customer can register and purchase a product.
2. A vendor can submit a complete business application.
3. An administrator can review and approve/reject a vendor.
4. An approved vendor can create and manage products.
5. Product images can be uploaded and displayed correctly.
6. Inventory updates correctly during the order lifecycle.
7. Multi-vendor carts can be split into vendor-specific orders.
8. Vendors can access only their own vendor orders.
9. Customers can track order status.
10. Delivery staff can update delivery progress.
11. Search suggestions work with debounce.
12. Search terms are recorded for analytics.
13. Customers can submit eligible reviews.
14. Admins can monitor users, vendors, products, orders, payments, and analytics.
15. Role- and permission-based authorization prevents unauthorized access.
16. Core business workflows are covered by automated tests.
17. The application can be deployed using documented configuration.
18. The architecture remains extensible for future branches, AI search, recommendations, and mobile applications.

---

# 49. Project Differentiators

LocalMart should differentiate itself through:

1. **Multi-vendor marketplace**
2. **Local / nearby shopping**
3. **Vendor business verification and approval**
4. **Multi-vendor cart and order splitting**
5. **Inventory-aware purchasing**
6. **Real-time order notifications**
7. **Search suggestions**
8. **Search analytics**
9. **Integrated delivery workflow**
10. **Role and permission security**
11. **Vendor store profiles**
12. **Commission and payout support**
13. **Future AI-ready search architecture**

The project should not simply reproduce an existing marketplace UI. The objective is to build an independently designed marketplace focused on local commerce.

---

# 50. Business Vision

LocalMart aims to become a digital bridge between local businesses and customers.

```text
                 LOCAL BUSINESSES
                       |
                       v
                 ┌─────────────┐
                 │  LocalMart  │
                 └──────┬──────┘
                        |
        +---------------+---------------+
        |               |               |
        v               v               v
    Products         Orders          Delivery
        |               |               |
        +---------------+---------------+
                        |
                        v
                   CUSTOMERS
                        |
                        v
             Reviews / Demand Data
                        |
                        v
                 Marketplace Growth
```

The initial release should remain focused and achievable while keeping the architecture extensible for:

- AI search
- Personalized recommendations
- Multiple branches
- Advanced delivery
- Demand forecasting
- Mobile applications
- Intelligent marketplace analytics

---

# 51. Recommended Next Documentation Phase

After this BRD is approved and frozen as the business baseline, the project should proceed in a documentation-first sequence:

1. **SRS — Software Requirements Specification**
2. **Detailed User Flows**
3. **Use Case Specification**
4. **Functional Requirements Matrix**
5. **Database Design / ERD**
6. **API Contract**
7. **System Architecture / HLD**
8. **Low-Level Design / Module Design**
9. **UI/UX Specification**
10. **Security Requirements**
11. **Testing / QA Strategy**
12. **DevOps / Deployment Plan**
13. **Development Roadmap**
14. **Sprint Plan**

Each later document should trace back to this BRD and should not introduce business functionality that has not been approved through the requirements process.

---

# 52. BRD Baseline Summary

| Area | Baseline Decision |
|---|---|
| Project | LocalMart |
| Business Model | Location-aware multi-vendor marketplace |
| Customer | Browse, search, cart, checkout, order, delivery tracking, reviews |
| Vendor | Register, verification, approval, products, inventory, orders, analytics |
| Admin | Marketplace management, approval, moderation, analytics, configuration |
| Delivery | Assignment, pickup, delivery status, completion |
| Frontend | Angular + TypeScript + Tailwind CSS |
| Reactive Layer | RxJS + Angular Signals |
| Backend | ASP.NET Core Web API .NET 8 |
| Architecture | Clean Architecture |
| Application Pattern | CQRS + MediatR |
| ORM | Entity Framework Core |
| Validation | FluentValidation |
| Authentication | JWT + Refresh Token |
| Real-time | SignalR |
| Database | PostgreSQL |
| Managed Backend Infrastructure | Supabase |
| Media | Cloudinary |
| Payments | Stripe / Local Payment Gateway + COD |
| Search | PostgreSQL Full-Text Search |
| Future Search | pgvector / semantic search |
| Location | Latitude/Longitude + Maps API |
| AI Integration | MCP for controlled AI/tool integration |
| DevOps | Git, GitHub, Docker, GitHub Actions |
| API Documentation | Swagger / OpenAPI |
| Testing | xUnit + Integration Testing + Angular Testing |
| Future Infrastructure | Redis, pgvector, AI, mobile |
| Initial Status | Draft / Baseline |
