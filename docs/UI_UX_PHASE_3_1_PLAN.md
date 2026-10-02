# LocalMart — Phase 3.1 Pre-Implementation Technical Plan
## Public Discovery & Product Detail UI Phase

**Document Status:** PROPOSAL / PENDING ARCHITECT APPROVAL  
**Phase:** Phase 3.1 — Public Discovery & Product Detail UI  
**Target Date:** October 01, 2026  
**Primary Target Stack:** Angular 19 (Standalone Components, TypeScript, Tailwind CSS, Angular Signals, RxJS)  
**Design System Foundation:** Approved Phase 2.1 Design Tokens (`bg-lm-bg`, `bg-lm-surface`, `bg-lm-surface-elevated`, `border-lm-border`, `text-lm-text-main`, `text-lm-text-muted`, Electric Blue accents)  
**Strict Directives:**  
- **PRE-IMPLEMENTATION PLANNING ONLY.** Zero Angular source code (`*.ts`, `*.html`, `*.css`) modified.
- **ZERO BACKEND / API / DATABASE CHANGES.** Consumes existing WebAPI endpoints (`GET /api/v1/products/{idOrSlug}`, `GET /api/v1/products/search`, `GET /api/v1/categories`).
- **NO INVENTED DATA FIELDS.** Strict adherence to existing `ProductDetailDto`, `SearchProductsResponseDto`, `ProductDto`, and `CategoryDto` backend schemas.
- **UNSUPPORTED ITEMS DEFERRED.** Product variants, reviews, and distance delivery math are explicitly marked as deferred non-goals.

---

## 1. Phase 3.1 Objective

The objective of Phase 3.1 is to build the front-facing **Product Details Screen** (`/products/:idOrSlug`) and the dedicated **Search Results / Catalog Browsing Screen** (`/products/search`) within the Angular client, enabling public marketplace users to inspect individual products with full multi-image support, stock availability indicators, vendor identification, category filtering, and paginated search discovery.

Phase 3.1 bridges the gap between basic Landing Page browsing (Phase 2.3) and full Multi-Vendor Cart Management (Phase 4.1).

---

## 2. Exact Target Routes

The plan registers two canonical Angular routes in `app.routes.ts`:

1. **Product Detail Route:**  
   - **Path:** `products/:idOrSlug`  
   - **Canonical Spec:** `GET /api/v1/products/{idOrSlug}` (API Contract Section 8.2 & LLD Section 9)  
   - **Load Strategy:** Standalone Component Lazy Loading (`ProductDetailComponent`)  
   - **Access:** Public (`AllowAnonymous`)

2. **Faceted Product Search Route:**  
   - **Path:** `products/search`  
   - **Canonical Spec:** `GET /api/v1/products/search` (API Contract Section 8.1 & LLD Section 9)  
   - **Load Strategy:** Standalone Component Lazy Loading (`SearchResultsComponent`)  
   - **Access:** Public (`AllowAnonymous`)

*Note: Order matters in `app.routes.ts`. `products/search` must be declared BEFORE `products/:idOrSlug` so that the literal string `"search"` is not captured as an `idOrSlug` route parameter.*

---

## 3. Exact Existing Files / Components Involved

The following existing files will be referenced or updated during Phase 3.1 implementation:

| File Path | Status | Role / Usage in Phase 3.1 |
|---|---|---|
| `src/LocalMart.Client/src/app/app.routes.ts` | To Be Modified | Register lazy-loaded routes for `products/search` and `products/:idOrSlug`. |
| `src/LocalMart.Client/src/app/core/services/catalog.service.ts` | To Be Modified | Extend service with `getProductDetail(idOrSlug: string)` and `searchProducts(query?, categoryId?, pageNumber?, pageSize?)` methods mapping to existing backend API DTOs. |
| `src/LocalMart.Client/src/app/core/models/auth.models.ts` | To Be Modified | Add TypeScript interfaces for `ProductDetailDto` matching backend DTO contract. |
| `src/LocalMart.Client/src/app/shared/components/product-card/product-card.component.ts` | Preserved | Existing reusable product card; will be wrapped with `[routerLink]="['/products', product.slug || product.id]"` for navigation. |
| `src/LocalMart.Client/src/app/features/landing/landing.component.ts` | Preserved | Main landing page hero search bar will redirect to `/products/search?query=...` for deep faceted queries. |
| `src/LocalMart.Client/src/styles.css` | Preserved | Phase 2.1 CSS tokens and utilities (`bg-lm-surface`, `border-lm-border`, etc.). |

---

## 4. New Components Required

Two new Angular standalone presentation components will be created under `src/app/features/customer/`:

1. **`ProductDetailComponent`**
   - **File Path:** `src/LocalMart.Client/src/app/features/customer/product-detail.component.ts`
   - **Type:** Standalone Component (`imports: [CommonModule, RouterLink]`)
   - **Purpose:** Full standalone view for product specifications, image gallery viewer, vendor store identity, stock indicator, quantity selection, and "Add to Cart" trigger placeholder.

2. **`SearchResultsComponent`**
   - **File Path:** `src/LocalMart.Client/src/app/features/customer/search-results.component.ts`
   - **Type:** Standalone Component (`imports: [CommonModule, FormsModule, RouterLink, ProductCardComponent]`)
   - **Purpose:** Dedicated catalog search page featuring active search bar, category filter pills, results count header, paginated grid, empty state fallback, and clear filter actions.

---

## 5. Product Detail UI Structure

The `ProductDetailComponent` layout is structured into a responsive 2-column grid on desktop and stacked container on mobile:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Breadcrumb: Home / Categories / [Category Name] / [Product Name]                 │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│ LEFT COLUMN: Multi-Image Gallery       │ RIGHT COLUMN: Product Identity & Purchase│
│ ┌────────────────────────────────────┐ │ ┌─────────────────────────────────────┐ │
│ │ Main Active Display Image          │ │ │ Vendor Badge: [Vendor Store Name]   │ │
│ │ (Aspect ratio 4:3, Cloudinary CDN) │ │ │ Product Title: [Name]               │ │
│ └────────────────────────────────────┘ │ │ SKU: [SKU] | Status: [Active] Badge │ │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐                │ │ Price: $XX.XX                       │ │
│ │Thumb│Thumb│Thumb│Thumb│                │ │ Stock Status: [In Stock / Qty Avail]│ │
│ └───┘ └───┘ └───┘ └───┘                │ ├─────────────────────────────────────┤ │
│                                        │ │ Description Snippet & Specification │ │
│                                        │ ├─────────────────────────────────────┤ │
│                                        │ │ Quantity Stepper: [-  1  +]         │ │
│                                        │ │ CTA: [ Add to Cart ] Button         │ │
│                                        │ └─────────────────────────────────────┘ │
├────────────────────────────────────────┴─────────────────────────────────────────┤
│ LOWER SECTION: Detailed Description & Vendor Storefront Information              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Key UI Elements & Controls:
- **Category Breadcrumbs:** Interactive link hierarchy navigating back to `/products/search?categoryId=...`.
- **Multi-Image Gallery:** Primary main image viewer displaying selected image from `ProductDetailDto.imageUrls[]`. Thumbnail row underneath allows clicking thumbnails to update primary viewer.
- **Vendor Store Identity Badge:** Prominent badge showing `VendorBusinessName` with Electric Blue border (`bg-blue-500/10 text-blue-400 border-blue-500/20`).
- **Stock Availability Badge:** Displays `In Stock (N units available)` in emerald tint when `inStock == true` and `quantityAvailable > 0`, or `Out of Stock` in rose tint when stock is 0.
- **Quantity Selector Stepper:** Decrement `[-]`, Quantity Input field (defaults to 1), and Increment `[+]` constrained by `1 <= quantity <= QuantityAvailable`.
- **Primary CTA ("Add to Cart"):** Electric Blue gradient button (`from-blue-600 to-blue-500`). In Phase 3.1, clicking triggers a temporary placeholder notice ("Cart Management will be available in Phase 4.1"). Button is disabled if `inStock == false`.

---

## 6. Search Results UI Structure

The `SearchResultsComponent` layout provides dedicated catalog filtering and pagination:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Top Header: Search Catalog & Neighborhood Vendors                                 │
│ ┌──────────────────────────────────────────────────┐ ┌─────────────────────────┐ │
│ │ Input: Search products, categories, SKUs...      │ │ [ Search Catalog ]      │ │
│ └──────────────────────────────────────────────────┘ └─────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Category Filter Pill Bar: [All] [Groceries] [Electronics] [Bakery] ...           │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Results Header: Showing X Products for "query" in Category                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Product Grid: 4-Column (Desktop) / 2-Column (Tablet) / 1-Column (Mobile)         │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│ │ Product Card │ │ Product Card │ │ Product Card │ │ Product Card │               │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘               │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Pagination Bar: [Previous Page]   Page X of Y   [Next Page]                      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Key UI Elements & Controls:
- **Search Query Bar:** Reactive text input pre-filled from URL query parameter `?query=...` with Enter key listener.
- **Category Filter Pill Bar:** Category pills pre-selected from URL query parameter `?categoryId=...`.
- **Active Filter Summary Strip:** Displays active search term and category filter with single-click clear button (`Clear Filters`).
- **Paginated Results Grid:** Renders `ProductCardComponent` for each returned item in `SearchProductsResponseDto.products`.
- **Pagination Navigation Controls:** `Previous Page` and `Next Page` buttons enabled based on `pageNumber` and `totalCount / pageSize`.

---

## 7. Loading State Specifications

Both components implement skeleton pulse loading patterns consuming Phase 2.1 design tokens:

- **Product Detail Loading Skeleton:**  
  Displayed while `loading()` signal is `true`. Displays a 2-column skeleton shell with pulsing gray/slate placeholders (`bg-lm-surface-elevated/60 animate-pulse rounded-2xl`) for image gallery, title, price block, and description lines.
- **Search Results Loading Skeleton:**  
  Displays a 4-card animated grid skeleton (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`) matching the height and aspect ratio of `ProductCardComponent`.

---

## 8. Empty State Specifications

- **Search Results Empty State:**  
  When `loading()` is `false` and `products.length === 0`, renders a clean surface container (`bg-lm-surface border border-lm-border rounded-3xl p-12 text-center`):
  - Search icon graphics with muted slate color (`text-lm-text-muted`).
  - Heading: "No Products Match Your Search Criteria".
  - Subtext: "Try adjusting your search keywords, clearing category filters, or browsing all marketplace items."
  - Action Button: "Clear Search Filters" (resets query and category ID to show all products).

---

## 9. Error State Specifications

- **Product Detail 404 / Unavailable State:**  
  If `GET /api/v1/products/{idOrSlug}` returns HTTP 404 (or `KeyNotFoundException` when product is inactive/unapproved):
  - Renders error card container (`bg-lm-surface border border-rose-500/30 rounded-3xl p-12 text-center`).
  - Warning Icon pill in rose tint (`bg-rose-500/10 text-rose-400 border border-rose-500/20`).
  - Heading: "Product Unavailable or Not Found".
  - Detail: "This item may have been unlisted by the vendor or is currently out of stock."
  - Action Button: "Return to Marketplace Catalog" (`routerLink="/"`).
- **Search API Failure State:**  
  If search HTTP call fails, displays inline alert banner (`bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl p-4`) with retry button.

---

## 10. Responsive Behavior Specifications

- **Desktop (>= 1024px):**  
  - Product Detail: 2-column flex layout (50% image gallery, 50% purchase specs).
  - Search Results: 4-column product grid with sticky search top bar.
- **Tablet (640px – 1023px):**  
  - Product Detail: Stacked layout with wide image gallery and generous touch padding.
  - Search Results: 2-column product grid with horizontal scrollable category pill bar.
- **Mobile (< 640px):**  
  - Product Detail: Single column stacked layout, full-width quantity stepper, sticky bottom action bar for "Add to Cart".
  - Search Results: Single column stacked product card list, full-width stacked search input and search button.

---

## 11. Accessibility Requirements (a11y)

- **Keyboard Navigation:** All interactive elements (`<button>`, `<a>`, `<input>`) maintain visible Electric Blue focus rings (`focus:ring-2 focus:ring-blue-500/40 focus:outline-none`).
- **Screen Reader Labels:** Image thumbnails include explicit `alt` text (`Product image thumbnail X`). Stepper buttons include `aria-label="Increase quantity"` and `aria-label="Decrease quantity"`.
- **Color Contrast:** High contrast text tokens (`text-lm-text-main` `#F8FAFC`, `text-lm-text-muted` `#94A3B8`) against surfaces (`bg-lm-surface` `#0F172A`). Status badges rely on explicit textual labels (`Active`, `In Stock`, `Out of Stock`) alongside color tints.

---

## 12. Existing API / Data Bindings to Preserve

Phase 3.1 strictly binds to existing backend WebAPI endpoint schemas without modifying contracts:

1. **`GET /api/v1/products/{idOrSlug}`**
   - Returns: `ProductDetailDto`
   - Bound Properties:
     - `id`: Guid
     - `vendorId`: Guid
     - `vendorBusinessName`: string -> Displayed on Vendor Store Badge
     - `categoryId`: Guid
     - `categoryName`: string -> Displayed on Category Breadcrumb
     - `name`: string -> Product Page Header
     - `slug`: string -> URL Parameter
     - `description`: string -> Detailed Description Block
     - `sku`: string -> Mono SKU Tag
     - `price`: decimal -> Currency pipe (`| number:'1.2-2'`)
     - `status`: string -> Enum status badge
     - `imageUrls`: string[] -> Thumbnail and main gallery list
     - `quantityAvailable`: int -> Stock counter
     - `inStock`: bool -> Stock availability state
     - `createdAt`: DateTime

2. **`GET /api/v1/products/search`**
   - Parameters: `query`, `categoryId`, `pageNumber`, `pageSize`
   - Returns: `SearchProductsResponseDto`
   - Bound Properties: `products[]`, `totalCount`, `pageNumber`, `pageSize`.

---

## 13. Design Token Usage

All styles in Phase 3.1 reference Phase 2.1 semantic token classes:

- **Backgrounds:** `bg-lm-bg`, `bg-lm-surface`, `bg-lm-surface-elevated`
- **Borders:** `border-lm-border`, `hover:border-lm-border-hover`
- **Primary Accent:** `bg-blue-600`, `from-blue-600 to-blue-500`, `text-blue-500`, `text-blue-400`
- **Typography:** `text-lm-text-main`, `text-lm-text-muted`
- **Shadows:** `shadow-lm-glow`, `shadow-blue-500/20`
- **Status Tints:**
  - Active/InStock: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`
  - OutOfStock: `bg-rose-500/10 text-rose-400 border-rose-500/20`
  - Vendor Badge: `bg-blue-500/10 text-blue-400 border-blue-500/20`

---

## 14. Dependencies

- `CatalogService` (`src/app/core/services/catalog.service.ts`): Requires adding HTTP calls for `getProductDetail` and `searchProducts`.
- `ProductCardComponent` (`src/app/shared/components/product-card/product-card.component.ts`): Reused directly on search results grid.
- Angular Router (`ActivatedRoute`, `Router`, `RouterLink`): Used for parameter extraction (`idOrSlug`, `query`, `categoryId`) and navigation.

---

## 15. Cart-Related Dependency Considerations

- **Cart Management is NOT implemented in Phase 3.1.**
- The "Add to Cart" button on `ProductDetailComponent` and `ProductCardComponent` will present full visual styling, disabled states (`inStock == false`), and a quantity stepper.
- In Phase 3.1, clicking "Add to Cart" will invoke a placeholder handler displaying a temporary notification ("Shopping Cart management will be enabled in Phase 4.1").
- Zero cart state signals (`active-cart.signal.ts`) or cart API services (`cart.service.ts`) will be modified in Phase 3.1.

---

## 16. Exact Implementation Scope

### IN SCOPE for Phase 3.1:
1. Extend `auth.models.ts` with `ProductDetailDto` interface.
2. Extend `CatalogService` with `getProductDetail()` and paginated `searchProducts()` API methods.
3. Build `ProductDetailComponent` with image gallery, vendor badge, SKU tag, stock indicator, quantity stepper, and description block.
4. Build `SearchResultsComponent` with live search bar, category filter pills, results count header, paginated grid, empty state fallback, and clear filters action.
5. Register `/products/search` and `/products/:idOrSlug` in `app.routes.ts`.
6. Add router link navigation from `ProductCardComponent` and Landing hero search bar.
7. Verify Angular build (`ng build`) and unit tests (`ng test`).

---

## 17. Explicit Out-of-Scope & Deferred Items

The following items are **EXPLICITLY OUT OF SCOPE** and **DEFERRED** per system architecture constraints:

- ❌ **No Product Variants:** Entity/API model does not support color/size variants. Product detail presents single active product unit.
- ❌ **No Reviews or Star Ratings System:** `Review.cs` entity and API endpoints are deferred to Phase 6.2. No review list or star ratings will be mocked.
- ❌ **No Live Distance Delivery Calculations:** Lat/long Haversine distance math is deferred per Technical Decision #2.
- ❌ **No Shopping Cart State Integration:** Cart service and checkout execution remain deferred to Phase 4.1.
- ❌ **No Backend or Database Modifications:** 0 C# files, 0 API controllers, 0 SQL migrations modified.

---

## 18. Verification Requirements

Phase 3.1 implementation must satisfy the following verification gates before completion:

1. **Angular Build Verification:**
   ```bash
   npx.cmd ng build --configuration production
   ```
   Must complete with **0 Errors and 0 Warnings**.

2. **Angular Unit Test Verification:**
   ```bash
   npx.cmd ng test --watch=false
   ```
   All unit tests must pass with **100% success rate**.

3. **Functional Route Verification:**
   - Navigating to `/products/:idOrSlug` fetches and renders product details from PostgreSQL WebAPI.
   - Invalid or inactive product slug displays 404 unavailable state cleanly.
   - Navigating to `/products/search?query=groceries` displays filtered catalog items and handles pagination.

---

## 19. Expected Changed-File Scope

Only **5 frontend files** (3 existing updated, 2 new created) and 1 plan report are within scope for Phase 3.1 implementation:

```
Modified Files:
- src/LocalMart.Client/src/app/core/models/auth.models.ts
- src/LocalMart.Client/src/app/core/services/catalog.service.ts
- src/LocalMart.Client/src/app/app.routes.ts

Created Files:
- src/LocalMart.Client/src/app/features/customer/product-detail.component.ts
- src/LocalMart.Client/src/app/features/customer/search-results.component.ts
- docs/UI_UX_PHASE_3_1_PLAN.md
```

**Zero edits to C# backend, database, auth guards, or cart services.**

---

### EXECUTION STATUS: STOPPED & WAITING FOR LEAD ARCHITECT APPROVAL

This plan is ready for Lead Architect review.  
No application source code files have been modified.  
Awaiting formal Lead Architect approval before commencing Phase 3.1 implementation.
