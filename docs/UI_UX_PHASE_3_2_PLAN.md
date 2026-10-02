# LocalMart — Phase 3.2 Pre-Implementation Technical Plan
## Customer Address Management UI Phase (Architecture Correction Pass)

**Document Status:** PROPOSAL / REVISED FOR ARCHITECT REVIEW  
**Phase:** Phase 3.2 — Customer Address Management UI  
**Target Date:** October 01, 2026  
**Primary Target Stack:** Angular 19 (Standalone Components, TypeScript, Tailwind CSS, Angular Signals, Reactive Forms, RxJS)  
**Design System Foundation:** Approved Phase 2.1 Design Tokens (`bg-lm-bg`, `bg-lm-surface`, `bg-lm-surface-elevated`, `border-lm-border`, `text-lm-text-main`, `text-lm-text-muted`, Electric Blue accents)  
**Strict Directives:**  
- **PRE-IMPLEMENTATION PLANNING ONLY.** Zero Angular source code (`*.ts`, `*.html`, `*.css`) or C# backend code modified.
- **READ-ONLY INSPECTION COMPLETED.** Verified domain entity `CustomerAddress.cs` in `LocalMart.Domain` and `DbSet<CustomerAddress>` in EF Core `ApplicationDbContext`.
- **UNIMPLEMENTED BACKEND DEPENDENCY.** WebAPI controller (`CustomerAddressesController`) and Application layer CQRS handlers do not exist. Endpoints are strictly labeled as PROPOSED / FUTURE CONTRACTS.
- **NO FAKE HTTP INTEGRATION OR HARDCODED DATA.** Do NOT create fake mock HTTP services, fake customer address arrays, or hardcode sample records in source code.
- **NO ARTIFICIAL COORDINATES.** Geographic coordinates remain unset when unprovided; no `0.0 / 0.0` placeholder defaults introduced.

---

## 1. Executive Summary & Phase Objective

### Purpose of Customer Address Management UI
The objective of Phase 3.2 is to design the technical architecture and user experience for **Customer Address Management** (`/customer/addresses`). 

LocalMart is a **Location-Aware Multi-Vendor Marketplace**. Delivery location coordinates (`Latitude`, `Longitude`), postal codes, and city/district boundaries govern vendor discovery, shipping eligibility, and checkout calculations. By building the Customer Address Management UI prior to Cart and Checkout implementation, customers can save, edit, delete, and designate primary delivery locations.

### Strategic Role in Multi-Vendor E-Commerce Lifecycle:
1. **Pre-Checkout Infrastructure:** Saved addresses directly feed into the upcoming **Multi-Vendor Checkout Wizard** (Phase 4.2), allowing 1-click address selection.
2. **Default Address Pre-selection:** The primary default address (`IsDefault == true`) will automatically populate delivery estimations.
3. **Neighborhood Vendor Matching:** Saved geographic coordinates (`Latitude`, `Longitude`) provide the foundation for future neighborhood delivery radius calculations.

---

## 2. Read-Only Repository & Architecture Inspection Findings

A comprehensive read-only inspection of the repository confirmed the following structural baseline:

| Architecture Layer | Inspected Target | Inspection Findings & Status |
|---|---|---|
| **Domain Entities** | `LocalMart.Domain/Entities/CustomerAddress.cs` | **EXISTING IN REPOSITORY.** Inherits `BaseEntity<Guid>`. Properties: `CustomerId` (Guid), `Title` (string), `AddressLine1` (string), `AddressLine2` (string?), `City` (string), `State` (string), `PostalCode` (string), `Latitude` (double), `Longitude` (double), `IsDefault` (bool). |
| **Database & Persistence** | `LocalMart.Infrastructure/Persistence/ApplicationDbContext.cs` | **EXISTING IN REPOSITORY.** `DbSet<CustomerAddress> CustomerAddresses` mapped in EF Core schema with foreign key to `User`. |
| **Application Layer CQRS** | `LocalMart.Application/Features/` | **UNIMPLEMENTED DEPENDENCY.** No CQRS commands (`CreateCustomerAddressCommand`, etc.) or DTOs exist in Application layer. |
| **WebAPI Controllers** | `LocalMart.WebAPI/Controllers/` | **UNIMPLEMENTED DEPENDENCY.** No `CustomerAddressesController.cs` exists in WebAPI. |
| **Frontend Routing** | `src/LocalMart.Client/src/app/app.routes.ts` | **NOT YET REGISTERED.** Route `/customer/addresses` needs to be added. |
| **Customer Dashboard** | `src/LocalMart.Client/src/app/features/customer-dashboard/` | **EXISTING IN REPOSITORY.** Placeholder card for "Saved Delivery Addresses" exists and will link to `/customer/addresses`. |
| **Frontend Services** | `src/LocalMart.Client/src/app/core/services/` | **NOT YET CREATED.** `AddressService` needs creation. |

---

## 3. Exact Target Route & Access Controls

- **Route Path:** `/customer/addresses`
- **Canonical Feature Module:** `src/app/features/customer/customer-addresses.component.ts`
- **Load Strategy:** Standalone Component Lazy Loading (`loadComponent`)
- **Route Guards:**
  - `canActivate: [authGuard, roleGuard]`
  - `data: { roles: ['Customer'] }`
- **Access Boundary:** Authenticated Customer access only. Unauthenticated requests redirect to `/login`. Non-Customer roles redirect to their respective portal dashboards.

---

## 4. Backend API Status & Proposed / Future Contracts

### Backend Dependency Statement:
> **"Backend address WebAPI endpoints and Application CQRS handlers do NOT currently exist in the codebase. All endpoints specified below are PROPOSED / FUTURE CONTRACTS and must be implemented as a backend vertical slice dependency before live HTTP API UI integration."**

### Proposed / Future WebAPI Endpoint Contracts (matching ERD & LLD specs):

1. **`GET /api/v1/customer/addresses`** *(PROPOSED FUTURE CONTRACT)*
   - **Auth:** `Bearer <JWT>` (Customer role)
   - **Returns:** `List<CustomerAddressDto>`
   - **Behavior:** Returns all saved delivery addresses for the authenticated customer.

2. **`POST /api/v1/customer/addresses`** *(PROPOSED FUTURE CONTRACT)*
   - **Auth:** `Bearer <JWT>` (Customer role)
   - **Body:** `CreateAddressRequestDto`
   - **Returns:** `CustomerAddressDto` (HTTP 201 Created)

3. **`PUT /api/v1/customer/addresses/{id}`** *(PROPOSED FUTURE CONTRACT)*
   - **Auth:** `Bearer <JWT>` (Customer role)
   - **Body:** `UpdateAddressRequestDto`
   - **Returns:** `CustomerAddressDto` (HTTP 200 OK)

4. **`DELETE /api/v1/customer/addresses/{id}`** *(PROPOSED FUTURE CONTRACT)*
   - **Auth:** `Bearer <JWT>` (Customer role)
   - **Returns:** HTTP 204 No Content

5. **`PUT /api/v1/customer/addresses/{id}/default`** *(PROPOSED FUTURE CONTRACT)*
   - **Auth:** `Bearer <JWT>` (Customer role)
   - **Returns:** `CustomerAddressDto` (HTTP 200 OK - sets specified address as `IsDefault = true` and unsets all other addresses for that customer).

---

## 5. Implementation & Mock-Data Policy

To ensure architecture purity and prevent deceptive testing states, the following policies are strictly enforced:

### A. Approved Backend Integration Strategy
- **Option B (Recommended Architecture):** Full live HTTP API wiring in the frontend implementation **MUST WAIT** until the backend address vertical slice (Application layer CQRS commands/queries, FluentValidation schemas, and `CustomerAddressesController.cs`) is implemented and verified.
- **Option A (UI Shell Only):** If frontend component presentation layout is authorized prior to backend completion, `AddressService` will declare an isolated service contract that explicitly fails or returns unhandled state, ensuring it cannot be mistaken for a working backend integration.

### B. Strict Policy on Sample & Mock Data
- **NO FAKE HTTP INTEGRATION:** The frontend implementation will NOT create fake mock HTTP interceptors or mock backend API responses.
- **NO HARDCODED SOURCE CODE DATA:** Sample values used in visual planning wireframes (e.g. *John Doe*, *123 Main Street*, *Colombo*, *Kandy*, sample GPS coordinates) are **ILLUSTRATIVE EXAMPLES FOR DOCUMENTATION ONLY** and **MUST NOT BE IMPLEMENTED AS HARDCODED DATA ARRAYS IN SOURCE CODE FILES (`*.ts`)**.
- **ACTUAL DATA RENDERING:** The actual UI must render data strictly from the backend contract once available.

---

## 6. Address UI & Interaction Architecture

The `CustomerAddressesComponent` provides a complete management interface:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Header: My Saved Delivery Addresses                                               │
│ "Manage your neighborhood delivery locations for fast multi-vendor checkout."      │
│ ┌───────────────────────────────────────────────────┐ ┌────────────────────────┐ │
│ │ Search or Filter Saved Addresses...               │ │ [ + Add New Address ]  │ │
│ └───────────────────────────────────────────────────┘ └────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Address Cards Grid (2-Column Desktop / 1-Column Mobile)                          │
│ Illustrative Wireframe Sample (MUST NOT BE HARDCODED IN SOURCE CODE):            │
│ ┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐ │
│ │ 🏠 Home [ DEFAULT ADDRESS BADGE ]     │ │ 🏢 Work                              │ │
│ │ 123 Main Street, Suite 400           │ │ 456 Commercial Ave                   │ │
│ │ Colombo 03, Western Province 00300   │ │ Kandy, Central Province 20000        │ │
│ ├──────────────────────────────────────┤ ├──────────────────────────────────────┤ │
│ │ [ Edit Address ] [ Delete Address ]  │ │ [ Set as Default ] [ Edit ] [ Delete]│ │
│ └──────────────────────────────────────┘ └──────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### UI Components & Dialogs:
1. **Address List Grid:** Displays saved address cards with title pills (`Home`, `Work`, `Other`), address details, default badge, and action buttons.
2. **Default Address Badge:** Highlighted in Electric Blue (`bg-blue-500/10 text-blue-400 border border-blue-500/20`).
3. **Add / Edit Address Modal:** Modal overlay (`bg-slate-950/80 backdrop-blur-md`) containing a reactive form for creating or updating address details.
4. **Delete Confirmation Dialog:** Warning modal asking customer to confirm address deletion.
5. **Set as Default Button:** Action button updating the primary delivery location.
6. **Empty State Card:** Rendered when user has 0 saved addresses.

---

## 7. Field Validation & Domain Constraint Matrix

Field constraints are strictly categorized into **Domain Constraints** (verified from `CustomerAddress.cs`), **API Validation Constraints** (to be verified upon backend contract creation), and **Frontend UX Validation**:

| Field Name | HTML Input | Domain Constraint (`CustomerAddress.cs`) | API Validation Constraint | Frontend UX Validation |
|---|---|---|---|---|
| **Title** | `text` | Required (`string Title`) | Requires backend contract verification | Required, Trimmed |
| **AddressLine1** | `text` | Required (`string AddressLine1`) | Requires backend contract verification | Required, Trimmed |
| **AddressLine2** | `text` | Optional (`string? AddressLine2`) | Requires backend contract verification | Optional |
| **City** | `text` | Required (`string City`) | Requires backend contract verification | Required, Trimmed |
| **State** | `text` | Required (`string State`) | Requires backend contract verification | Required, Trimmed |
| **PostalCode** | `text` | Required (`string PostalCode`) | Requires backend contract verification | Required, Trimmed |
| **Latitude** | `number` | Optional numeric (`double Latitude`) | Requires backend contract verification | Optional (-90 to 90) |
| **Longitude** | `number` | Optional numeric (`double Longitude`) | Requires backend contract verification | Optional (-180 to 180) |
| **IsDefault** | `checkbox` | Boolean (`bool IsDefault`) | Unsets other defaults on backend | Boolean toggle |

*Note: `CustomerAddress.cs` domain entity does not enforce hardcoded max string length attributes. Specific string length limits (e.g. Max 50/150 chars) require backend FluentValidation contract verification.*

---

## 8. Location & Coordinate Handling Correctness

- **Domain Contract Nullability:** `CustomerAddress.cs` defines `Latitude` (double) and `Longitude` (double).
- **Correct Coordinate Handling:**
  - Coordinate values (`Latitude`, `Longitude`) **REMAIN UNSET** when the customer does not provide them.
  - **NO ARTIFICIAL PLACEHOLDER COORDINATES (`0.0 / 0.0`) ARE INTRODUCED.** Coordinates will not be defaulted to `0.0` as `0.0, 0.0` represents a real geographic point (Null Island).
  - The frontend implementation will preserve actual domain nullability/optionality as defined by the backend API contract once created.
- **Map Provider Guardrail:** Third-party Map SDKs (Google Maps JavaScript API, Mapbox GL) and PostGIS spatial queries are **DEFERRED Technical Decisions (#2 & #3)**. No map script tags will be injected.

---

## 9. Design System Alignment (Phase 2.1 Tokens)

The Customer Address Management UI strictly consumes approved Phase 2.1 design system tokens:

- **Page Background:** `bg-lm-bg` (`#090D16`)
- **Card & Table Surfaces:** `bg-lm-surface` (`#0F172A`)
- **Elevated Inputs & Modals:** `bg-lm-surface-elevated` (`#1E293B`)
- **Borders:** `border-lm-border` (`#1E293B`), `hover:border-lm-border-hover`
- **Text Tokens:** `text-lm-text-main` (`#F8FAFC`), `text-lm-text-muted` (`#94A3B8`)
- **Primary Action Accents:** Electric Blue gradient (`from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400`), badge tints (`bg-blue-500/10 text-blue-400 border border-blue-500/20`), focus rings (`focus:ring-2 focus:ring-blue-500/30`).
- **No Theme Switcher or Unapproved CSS Frameworks.**

---

## 10. Responsive Layout Specifications

- **Desktop (>= 1024px):** 2-column or 3-column address card grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`). Modals centered with `max-w-xl`.
- **Tablet (640px – 1023px):** 2-column card grid. Header action buttons collapse gracefully.
- **Mobile (< 640px):** Single column stacked address card list. Full-width stacked buttons (`+ Add Address`). Form fields adapt to touch targets (`py-3 px-4`).

---

## 11. Accessibility (a11y) Specifications

- **Keyboard Focus:** Visible focus rings (`focus:ring-2 focus:ring-blue-500/40 focus:outline-none`) on all form fields, buttons, and close icons.
- **Form Controls:** Labels explicitly linked to input IDs. Inline validation errors styled in rose text (`text-rose-400 text-xs mt-1`).
- **Semantic Actions:** `aria-label` attribute on delete confirmation and default address toggle buttons.

---

## 12. State Management Architecture

Phase 3.2 uses Angular Signals and RxJS observables (no unapproved external state libraries):

```typescript
// Component State Signals
addresses = signal<CustomerAddressDto[]>([]);
loading = signal<boolean>(true);
submitting = signal<boolean>(false);
errorState = signal<boolean>(false);
errorMessage = signal<string>('');

activeModal = signal<'add' | 'edit' | 'delete' | null>(null);
selectedAddress = signal<CustomerAddressDto | null>(null);
```

- **State Transitions:**
  - `loading == true`: Displays 3-card animated pulse loader.
  - `loading == false && addresses.length == 0`: Displays Empty Address List container.
  - `activeModal == 'add'`: Opens empty modal form.
  - `activeModal == 'edit'`: Opens pre-filled modal form for `selectedAddress()`.
  - `activeModal == 'delete'`: Opens delete confirmation dialog.

---

## 13. Future Integration with Cart & Checkout (Phases 4.1 & 4.2)

When Phase 4.1 (Cart) and Phase 4.2 (Checkout) are implemented:
1. **Checkout Delivery Selector:** The checkout page will call `AddressService` to render saved address selector pills.
2. **Pre-selected Default Address:** The address marked `IsDefault == true` will be pre-selected as the active shipping address.
3. **Cart Validation:** Delivery address coordinates (`Latitude`, `Longitude`) will be passed in the checkout payload to validate neighborhood vendor delivery eligibility.

---

## 14. Security & Authorization Policy

- **Token Protection:** All address requests require `Authorization: Bearer <JWT>` header via `jwt.interceptor.ts`.
- **Tenant Isolation:** The backend API automatically extracts `CustomerId` from the JWT claims (`ICurrentUserService`).
- **Cross-Customer Security:** Customers can ONLY view, edit, or delete address records where `CustomerId == currentUserId`. Handlers throw `UnauthorizedAccessException` if cross-tenant tampering is attempted.

---

## 15. Exact Scope of Changed & Created Files

### A. Existing Frontend Files to Modify (3 Files):
1. `src/LocalMart.Client/src/app/core/models/auth.models.ts`  
   - Add TypeScript interfaces: `CustomerAddressDto`, `CreateAddressRequestDto`, `UpdateAddressRequestDto`.
2. `src/LocalMart.Client/src/app/app.routes.ts`  
   - Register route `/customer/addresses` guarded by `authGuard` and `roleGuard` (`roles: ['Customer']`).
3. `src/LocalMart.Client/src/app/features/customer-dashboard/customer-dashboard.component.ts`  
   - Add `routerLink="/customer/addresses"` to the "Saved Delivery Addresses" card.

### B. New Frontend Files to Create (2 Files):
1. `src/LocalMart.Client/src/app/core/services/address.service.ts`  
   - Angular service wrapping HTTP calls (`getAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`).
2. `src/LocalMart.Client/src/app/features/customer/customer-addresses.component.ts`  
   - Standalone Angular page component for Customer Address Management.

### C. Backend Prerequisites (To be built in Backend Slice when authorized):
- `LocalMart.Application/DTOs/AddressDTOs.cs`
- `LocalMart.Application/Features/CustomerAddresses/...` (MediatR Commands/Queries)
- `LocalMart.WebAPI/Controllers/CustomerAddressesController.cs`

---

## 16. Scope Protection

### IN SCOPE for Phase 3.2:
- Frontend address data models & interfaces (`auth.models.ts`).
- `AddressService` Angular HTTP client service contract.
- Standalone `CustomerAddressesComponent` UI (Address list grid, Add/Edit modal form, Delete modal, Default address toggle).
- Route registration (`/customer/addresses`) and customer dashboard navigation link.
- Design token styling, responsive mobile layout, loading/empty/error states.
- Automated build (`ng build`) and unit test (`ng test`) verification.

### EXPLICITLY OUT OF SCOPE:
- ❌ **Cart Management** (Deferred to Phase 4.1).
- ❌ **Multi-Vendor Checkout** (Deferred to Phase 4.2).
- ❌ **Payment Gateways** (Deferred to Phase 4.1/4.2).
- ❌ **Third-Party Maps SDK Injection** (Deferred per Technical Decision #2).
- ❌ **Live GPS Tracking / Geofencing** (Explicit Non-Goal).
- ❌ **Unapproved Backend Code Changes** (Backend WebAPI controller marked as backend dependency).

---

## 17. Verification Plan

Upon authorization and implementation of Phase 3.2:

1. **Angular Production Build:**
   ```bash
   npx.cmd ng build --configuration production
   ```
   Must complete with **0 Errors and 0 Warnings**.

2. **Angular Unit Test Suite:**
   ```bash
   npx.cmd ng test --watch=false
   ```
   Must pass with **100% success rate**.

3. **Route & Navigation Verification:**
   - Navigating to `/customer/addresses` renders address management portal.
   - Clicking "Saved Delivery Addresses" card on `/customer/dashboard` navigates to `/customer/addresses`.

4. **Git Diff Scope Check:**
   - Verify `git status --short` to ensure only the target frontend files and Phase 3.2 reports are modified/created.

---

### EXECUTION STATUS: TECHNICAL PLAN REVISED — STOPPED & WAITING FOR LEAD ARCHITECT APPROVAL

This revised technical plan is ready for Lead Architect review.  
Zero application source code files (`*.ts`, `*.html`, `*.css`, `*.cs`) have been modified.  
Awaiting formal Lead Architect review and approval before proceeding.
