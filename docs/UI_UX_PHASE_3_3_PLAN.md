# LOCALMART — PHASE 3.3 TECHNICAL PLAN
## Shared UI Infrastructure (Toast, Skeleton Loading, Empty-State, Error-State)

**DOCUMENT STATUS:** PROPOSED / PENDING LEAD ARCHITECT APPROVAL  
**AUTHOR:** Lead UI/UX Architect  
**DATE:** October 02, 2026  
**TARGET STACK:** Angular 19 (Standalone Components, TypeScript, Tailwind CSS, Angular Signals, RxJS)  
**DESIGN SYSTEM:** Phase 2.1 Design System Tokens (`--lm-bg: #090D16`, `--lm-surface: #0F172A`, `--lm-surface-elevated: #1E293B`, `--lm-primary: #3B82F6`, `--lm-border: #1E293B`)  

---

### 1. Executive Summary

Phase 3.3 establishes the standardized **Shared UI Infrastructure** for LocalMart. A comprehensive repository audit of Phase 2 and Phase 3 pages (`SearchResultsComponent`, `ProductDetailComponent`, `CustomerAddressesComponent`, `VendorCatalogComponent`) revealed repetitive, ad-hoc implementations of:
- Toast / Notification banners (`cartNotice`, `successNotice`, `backendNotice` managed locally in component signals).
- Loading Skeleton cards (`animate-pulse` divs duplicated across 4 distinct feature files).
- Empty State fallback containers (custom inline SVGs and empty copy duplicated in catalog search, address list, and vendor product management).
- Error State fallback boxes (inline rose alert cards with manual retry handlers).

Phase 3.3 will extract these fragmented patterns into 4 highly-focused, lightweight, accessible Angular 19 standalone shared components and 1 reactive notification service:
1. `ToastService` (`src/app/core/services/toast.service.ts`) + `ToastContainerComponent` (`src/app/shared/components/toast/toast-container.component.ts`)
2. `SkeletonLoaderComponent` (`src/app/shared/components/loading/skeleton-loader.component.ts`)
3. `EmptyStateComponent` (`src/app/shared/components/empty-state/empty-state.component.ts`)
4. `ErrorStateComponent` (`src/app/shared/components/error-state/error-state.component.ts`)

This infrastructure eliminates visual discrepancies, enforces Phase 2.1 design token compliance, and provides the foundation for upcoming Phase 4 Multi-Vendor Cart & Checkout flows.

---

### 2. Current Repository Findings

A comprehensive audit of the codebase yielded the following pattern distributions:

| Component / Feature | Notification Method | Loading Indicator Method | Empty State Implementation | Error Handling Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **`CustomerAddressesComponent`** | Local `signal<string \| null>` notices | Inline `<div *ngFor="let i of [1,2,3]" class="animate-pulse">` | Custom rounded-3xl container with pin SVG | Ad-hoc `backendNotice` blue banner |
| **`SearchResultsComponent`** | N/A | Inline `<div *ngFor="let i of [1..8]" class="animate-pulse">` | Custom rounded-3xl container with search SVG | Inline rose alert card with manual retry button |
| **`ProductDetailComponent`** | Local `cartNotice` signal alert banner | Inline `<div class="space-y-8 animate-pulse">` | Redirect to search catalog | Inline rose alert card with 404 message |
| **`VendorCatalogComponent`** | Local action notification banners | Inline table skeleton rows | Custom table empty state row | Inline red error banner |

#### Identified Technical Deficiencies:
1. **Notification Duplication:** Every component manages auto-dismiss timers, message text, and visibility via independent local signals without global queueing or z-index layering.
2. **Skeleton Inconsistency:** Skeleton loaders use differing aspect ratios, padding, border radii, and pulse colors across pages.
3. **Empty State Code Bloat:** Over 40 lines of boilerplate SVG and layout code are copied verbatim in each feature component.
4. **Accessibility Gaps:** Dynamic error messages and toast notices lack `aria-live="polite"` and proper screen reader role announcements.

---

### 3. Phase 3.3 Objectives

1. **Centralize Toast Queueing:** Provide a singleton `ToastService` managing typed notifications (success, error, info, warning) with configurable auto-dismiss timeouts and signal-driven updates.
2. **Unify Skeleton UI:** Deliver a versatile `SkeletonLoaderComponent` supporting `card`, `list`, `table`, and `text` layouts adhering to Phase 2.1 surface tokens.
3. **Standardize Empty States:** Deliver an `EmptyStateComponent` supporting configurable icons, title, description, primary action CTA, and secondary link.
4. **Standardize Error States:** Deliver an `ErrorStateComponent` providing explicit error title, detail copy, and optional retry event emitter.
5. **Zero Breaking Changes:** Refactor existing feature components to consume the shared components without altering routes, auth guards, or business logic.

---

### 4. Exact Scope

During implementation of Phase 3.3, ONLY the following work items are approved:

1. Create `src/app/core/services/toast.service.ts` for managing global toast queues via Angular Signals.
2. Create `src/app/shared/components/toast/toast-container.component.ts` to render floating toast notifications.
3. Create `src/app/shared/components/loading/skeleton-loader.component.ts` for standardized skeleton loaders.
4. Create `src/app/shared/components/empty-state/empty-state.component.ts` for standardized empty state fallbacks.
5. Create `src/app/shared/components/error-state/error-state.component.ts` for standardized error state fallbacks.
6. Register `ToastContainerComponent` in root shell `AppComponent` template (`src/app/app.component.html`).
7. Refactor existing feature components (`CustomerAddressesComponent`, `SearchResultsComponent`, `ProductDetailComponent`, `VendorCatalogComponent`) to consume the new shared UI components.

---

### 5. Out of Scope

The following items are **EXPLICITLY FORBIDDEN** during Phase 3.3:
- **NO Backend Changes:** No C# files, EF Core migrations, database schemas, or WebAPI controllers.
- **NO Mock Interceptors:** No fake HTTP interceptors or mock data arrays.
- **NO Authentication Changes:** No edits to `AuthService`, `authGuard`, or token refresh logic.
- **NO New Frameworks:** No Angular Material, PrimeNG, Bootstrap, or new CSS libraries.
- **NO Cart / Checkout Implementation:** No cart services, order handlers, or checkout steps (deferred to Phase 4).

---

### 6. Existing Components/Services to Reuse

The proposed shared components will build directly upon existing LocalMart primitives:
- **Design Tokens (`src/styles.css`):** Utilizing CSS variables `--lm-bg`, `--lm-surface`, `--lm-surface-elevated`, `--lm-border`, `--lm-primary`, `--lm-text-main`, `--lm-text-muted`, `--lm-success`, `--lm-danger`, `--lm-warning`.
- **Utility Classes:** Utilizing `.lm-card`, `.lm-btn-primary`, `.lm-btn-secondary`.
- **Font & Icon System:** Inline GFM-style SVG icons matching the existing Lucide/Heroicon icon language.

---

### 7. Proposed Shared Component Architecture

```
src/app/
├── core/
│   └── services/
│       └── toast.service.ts                 [NEW - Toast Queue & Signal Store]
└── shared/
    └── components/
        ├── toast/
        │   └── toast-container.component.ts [NEW - Toast Render Container]
        ├── loading/
        │   └── skeleton-loader.component.ts [NEW - Skeleton Loader Component]
        ├── empty-state/
        │   └── empty-state.component.ts     [NEW - Reusable Empty State]
        └── error-state/
            └── error-state.component.ts     [NEW - Reusable Error State]
```

#### Detailed Justification for Each New File:

1. **`ToastService` (`src/app/core/services/toast.service.ts`)**
   - *Why Needed:* Centralizes notification triggers across async HTTP calls, form submissions, and cart actions.
   - *Consumers:* `CustomerAddressesComponent`, `ProductDetailComponent`, `VendorCatalogComponent`, future Cart/Checkout components.
   - *Problem Solved:* Eliminates ad-hoc `cartNotice` and `successNotice` signal boilerplate in individual pages.
   - *NOT Included:* Persistence to local storage or backend logging.

2. **`ToastContainerComponent` (`src/app/shared/components/toast/toast-container.component.ts`)**
   - *Why Needed:* Renders fixed-position floating notifications (`fixed bottom-5 right-5 z-50`) with enter/leave transitions.
   - *Consumers:* Embedded once in `AppComponent`.
   - *Problem Solved:* Prevents notification banners from altering in-page document flow.
   - *NOT Included:* Modal dialog blocking.

3. **`SkeletonLoaderComponent` (`src/app/shared/components/loading/skeleton-loader.component.ts`)**
   - *Why Needed:* Provides uniform placeholder loading animations during network fetches.
   - *Consumers:* `SearchResultsComponent`, `ProductDetailComponent`, `CustomerAddressesComponent`, `VendorCatalogComponent`.
   - *Problem Solved:* Replaces fragmented inline pulse divs with a single API (`type="card" | "table" | "detail"`).
   - *NOT Included:* Spinner animations.

4. **`EmptyStateComponent` (`src/app/shared/components/empty-state/empty-state.component.ts`)**
   - *Why Needed:* Displays high-quality fallback UI when search yields 0 items or no addresses exist.
   - *Consumers:* `CustomerAddressesComponent`, `SearchResultsComponent`, `VendorCatalogComponent`.
   - *Problem Solved:* Eliminates duplicated SVG/HTML boilerplate.
   - *NOT Included:* Business logic routing.

5. **`ErrorStateComponent` (`src/app/shared/components/error-state/error-state.component.ts`)**
   - *Why Needed:* Renders explicit API error messages with an optional `@Output() retry` action emitter.
   - *Consumers:* `SearchResultsComponent`, `ProductDetailComponent`, `CustomerAddressesComponent`.
   - *Problem Solved:* Unifies error banner styling across all customer and vendor views.
   - *NOT Included:* Exception swallowing or silent retries.

---

### 8. Toast Design Specification

- **Positioning:** Fixed bottom-right corner (`bottom-5 right-5`), stacked vertically, `z-50`.
- **Variants:**
  - `success`: Emerald border (`border-emerald-500/30`), background (`bg-slate-900/95`), text (`text-emerald-400`), icon (`✓`).
  - `error`: Rose border (`border-rose-500/30`), background (`bg-slate-900/95`), text (`text-rose-400`), icon (`✕`).
  - `info`: Electric Blue border (`border-blue-500/30`), background (`bg-slate-900/95`), text (`text-blue-400`), icon (`ℹ`).
  - `warning`: Amber border (`border-amber-500/30`), background (`bg-slate-900/95`), text (`text-amber-400`), icon (`⚠`).
- **Auto-Dismiss:** Default 4000ms timer per toast; pause on hover; manual close button (`✕`).

---

### 9. Loading/Skeleton Design Specification

- **Base Colors:** Background `bg-lm-surface-elevated/60`, border `border-lm-border`, pulse effect `animate-pulse`.
- **Supported Layout Types:**
  - `card`: Renders grid of product/address card skeletons.
  - `detail`: Renders product hero gallery + sidebar skeleton.
  - `table`: Renders tabular row skeletons.
  - `text`: Renders text line skeletons.

---

### 10. Empty-State Design Specification

- **Container:** `bg-lm-surface border border-lm-border rounded-3xl p-10 text-center max-w-lg mx-auto shadow-xl`.
- **Icon Container:** `w-16 h-16 bg-lm-surface-elevated text-lm-text-muted rounded-2xl flex items-center justify-center mx-auto mb-4 border border-lm-border`.
- **Typography:** Title (`text-xl font-bold text-lm-text-main`), Description (`text-sm text-lm-text-muted`).
- **CTA:** Primary action button using `.lm-btn-primary` class emitting `@Output() actionClicked`.

---

### 11. Error-State Design Specification

- **Container:** `bg-lm-surface border border-rose-500/30 rounded-3xl p-8 text-center max-w-lg mx-auto shadow-xl`.
- **Icon Container:** `w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-500/20`.
- **Typography:** Title (`text-lg font-extrabold text-lm-text-main`), Detail (`text-xs text-lm-text-muted`).
- **Retry Action:** Optional button emitting `@Output() retryClicked`.

---

### 12. Design Token Usage

All shared components MUST strictly reference Phase 2.1 CSS variable design tokens:
- Backdrop: `var(--lm-bg)` (#090D16)
- Surface: `var(--lm-surface)` (#0F172A)
- Surface Elevated: `var(--lm-surface-elevated)` (#1E293B)
- Primary Accent: `var(--lm-primary)` (#3B82F6)
- Text Main: `var(--lm-text-main)` (#F8FAFC)
- Text Muted: `var(--lm-text-muted)` (#94A3B8)
- Radii Scale: `var(--lm-radius-xl)` (16px), `var(--lm-radius-2xl)` (24px)

---

### 13. Responsive Behaviour

- **Toast Container:** Full-width on mobile screen width (`< 640px`) with 16px side margins (`inset-x-4 bottom-4`), fixed 380px max-width on desktop.
- **Empty / Error Cards:** Center-aligned with `max-w-md` on mobile and `max-w-lg` on desktop.
- **Skeletons:** Match container responsive grid breaks (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).

---

### 14. Accessibility Requirements

- **Toast Region:** Wrapped in `<div role="region" aria-label="Notifications" aria-live="polite">`.
- **Close Buttons:** Explicit `aria-label="Close notification"`.
- **Loading Skeleton:** Container marked with `aria-busy="true"` and `aria-label="Loading content"`.
- **Error State:** Error container marked with `role="alert"`.

---

### 15. State/Interaction Rules

- **Toast Queue Limits:** Maximum 5 visible toasts at any time; older toasts automatically evicted.
- **Dismiss Interaction:** Click on dismiss button removes toast immediately; mouse hover pauses auto-dismiss timer.
- **Component Clean-up:** Toast timers cleared on component destruction via RxJS / Signal cleanup.

---

### 16. Proposed File Changes

#### Files to Create (5 New Files):
1. `src/LocalMart.Client/src/app/core/services/toast.service.ts`
2. `src/LocalMart.Client/src/app/shared/components/toast/toast-container.component.ts`
3. `src/LocalMart.Client/src/app/shared/components/loading/skeleton-loader.component.ts`
4. `src/LocalMart.Client/src/app/shared/components/empty-state/empty-state.component.ts`
5. `src/LocalMart.Client/src/app/shared/components/error-state/error-state.component.ts`

#### Files to Refactor (5 Existing Files):
1. `src/LocalMart.Client/src/app/app.component.html` (Include `<app-toast-container>`)
2. `src/LocalMart.Client/src/app/features/customer/customer-addresses.component.ts` (Replace inline skeleton, empty state, and notice banners)
3. `src/LocalMart.Client/src/app/features/customer/search-results.component.ts` (Replace inline skeleton, empty state, and error box)
4. `src/LocalMart.Client/src/app/features/customer/product-detail.component.ts` (Replace inline skeleton, 404 error state, and cart notice banner)
5. `src/LocalMart.Client/src/app/features/vendor/vendor-catalog.component.ts` (Replace inline skeleton table and action banners)

---

### 17. Files That MUST NOT Change

- `src/LocalMart.Client/src/app/app.routes.ts` (No route changes)
- `src/LocalMart.Client/src/app/core/guards/*` (No guard changes)
- `src/LocalMart.Client/src/app/core/interceptors/*` (No interceptor changes)
- `src/LocalMart.Client/src/app/core/services/auth.service.ts` (No auth logic changes)
- `src/LocalMart.Client/src/app/core/services/address.service.ts` (No address service changes)
- All C# Backend files in `src/LocalMart.WebAPI`, `src/LocalMart.Application`, `src/LocalMart.Domain`, `src/LocalMart.Infrastructure`.

---

### 18. Testing Strategy

1. **Unit Tests (`ng test`):**
   - `ToastService`: Test toast creation, queueing, typed variants, auto-dismiss timers, and dismissal methods.
   - `SkeletonLoaderComponent`: Test variant inputs (`card`, `table`, `detail`) rendering corresponding HTML structures.
   - `EmptyStateComponent`: Test title, description, icon, and action button `@Output()` click emission.
   - `ErrorStateComponent`: Test title, error message, and retry button `@Output()` click emission.

---

### 19. Build Verification

Following implementation, execution of:
```bash
node node_modules/@angular/cli/bin/ng.js build --configuration production
```
MUST complete with **0 Errors** and **0 Warnings**.

---

### 20. Git Scope Verification

`git status --short` MUST confirm that ONLY the 5 new shared files, 5 refactored frontend components/shell, and Phase 3.3 documentation files have been modified.

---

### 21. Risks / Dependencies

- **Risk:** Existing feature components might have subtle CSS dependency differences on inline skeleton wrappers.
- **Mitigation:** Ensure `SkeletonLoaderComponent` supports flexible host layout wrapper classes (`grid`, `flex`, or `block`).

---

### 22. Future Cart/Checkout Integration Considerations

Phase 3.3 Toast and Notification infrastructure will directly support Phase 4:
- "Item added to cart" success toasts.
- "Vendor inventory threshold reached" warning toasts.
- Checkout error banners and stock validation empty states.

---

### 23. Acceptance Criteria

1. Global `ToastService` and `ToastContainerComponent` active in shell, displaying success/error/info/warning toasts.
2. `SkeletonLoaderComponent` replaces all ad-hoc pulse loader divs across customer search, product detail, addresses, and vendor catalog.
3. `EmptyStateComponent` replaces all ad-hoc empty state containers.
4. `ErrorStateComponent` replaces all ad-hoc error banners and provides retry handlers.
5. Production build completes with 0 errors and 0 warnings.
6. 100% unit tests passing.

---

### 24. Implementation Work Breakdown

- **Package 1:** Create `ToastService` and `ToastContainerComponent`; integrate into `AppComponent`.
- **Package 2:** Create `SkeletonLoaderComponent`, `EmptyStateComponent`, `ErrorStateComponent`.
- **Package 3:** Refactor `CustomerAddressesComponent` to consume shared UI components.
- **Package 4:** Refactor `SearchResultsComponent` and `ProductDetailComponent` to consume shared UI components.
- **Package 5:** Refactor `VendorCatalogComponent` to consume shared UI components.
- **Package 6:** Run build, tests, and produce Phase 3.3 Completion Report.

---

### 25. Phase 3.3 Completion Criteria

Phase 3.3 will be declared complete when:
- All 5 shared UI files are created and unit tested.
- All 4 feature pages are refactored.
- `ng build --configuration production` passes with 0 errors and 0 warnings.
- `ng test --watch=false` passes 100%.
- Lead Architect approval is granted.

---
*END OF TECHNICAL PLAN*
