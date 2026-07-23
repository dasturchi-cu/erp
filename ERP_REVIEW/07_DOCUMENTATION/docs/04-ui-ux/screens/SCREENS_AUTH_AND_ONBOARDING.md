# Screen Specifications — Authentication & Onboarding

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Figma-Ready Specification |
| Last Updated | 2026-06-17 |
| Audience | Product Design, Figma, Frontend, Mobile, QA |
| Parent Document | [UI_UX_MASTER_BLUEPRINT.md](../UI_UX_MASTER_BLUEPRINT.md) |
| Related | [USER_FLOWS.md](../USER_FLOWS.md) §1, [AUTHENTICATION.md](../../07-security/AUTHENTICATION.md), [COMPONENT_HIERARCHY.md](../COMPONENT_HIERARCHY.md), [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md), [RESPONSIVE_GUIDELINES.md](../RESPONSIVE_GUIDELINES.md) |

---

## Purpose

This document provides **Figma-ready, implementation-complete** specifications for authentication and onboarding screens. Every section below is mandatory per screen. A designer must be able to build all frames, components, and interaction states without follow-up questions.

**Shell type for all screens in this document:** `Auth` (no sidebar, no top bar, minimal chrome).

**Figma file:** `ERP-Screens-Auth-v2`  
**Figma page:** `01 — Auth & Onboarding`

---

## Global Auth Shell Tokens (apply to all screens)

| Token | Value | Usage |
|-------|-------|-------|
| Page background | `color/background/sunken` (`#F8FAFC` light / `#020617` dark) | Full viewport fill |
| Auth card max-width | 480px (Login), 640px (Company Selection) | Centered card |
| Auth card padding | 32px desktop, 24px mobile | Internal card padding |
| Auth card radius | `radius/lg` (12px) | Card corners |
| Auth card shadow | `shadow/lg` | Elevation on card |
| Logo height | 40px | ERP wordmark above card |
| Logo-to-card gap | 24px | Vertical spacing |
| Vertical centering | Flex center; min 48px top/bottom safe margin | Never flush to viewport edge |
| Min viewport width | 320px mobile; 1024px desktop Electron | Below 1024 desktop: show width warning banner 40px |

---

# Screen 1: Company Selection

## Screen ID, Route, Module

| Field | Value |
|-------|-------|
| **Screen ID** | `SCR-010` |
| **Route** | `/company-select` |
| **Module** | `auth` |
| **data-screen-id** | `SCR-010` (root element attribute) |
| **Shell** | Auth |
| **Platform** | Both (Desktop Electron + Mobile Flutter) |

---

## Purpose

Allow an authenticated user who belongs to **two or more companies** to choose which company context to activate before entering the application. Sets `company_id` in JWT/session, loads role permissions for that company, connects WebSocket to `company:{id}` room, and navigates to role-based home screen.

Also used as **post-login onboarding step** and as **full-screen company switch** when invoked from TopBar CompanySwitcher with "View all companies" action.

---

## User Roles (who can access)

| Role | Access | Notes |
|------|--------|-------|
| All authenticated roles | ✓ | Only if `user_companies.count ≥ 2` |
| Unauthenticated | ✗ | Redirect to `/login` |
| Single-company user | ✗ (bypass) | Auto-redirect to role home; never sees this screen |
| Blocked user | ✗ | Redirect to blocked state before reaching here |
| Blocked device | ✗ | Redirect to `/device-blocked` |

---

## User Permissions (exact permission codes)

| Code | Required | Context |
|------|----------|---------|
| *(none — authenticated only)* | Implicit | Access gated by valid JWT; no module permission |
| `admin.companies.view` | No | Not required; user sees only companies in `user_companies` |

**Implicit rule:** User must have an active `user_companies` row for each listed company. Companies without assignment are never shown.

---

## Information Architecture

```
Company Selection (SCR-010)
├── Page Header
│   ├── Greeting ("Welcome back, {firstName}")
│   ├── Instruction ("Select a company to continue")
│   └── Optional: user avatar + email (read-only)
├── Search (if companies > 5)
│   └── Filter company list by name
├── Company List (primary content)
│   └── Company Card × N
│       ├── Company logo/initials avatar
│       ├── Company name (primary)
│       ├── Role badge (user's role in that company)
│       ├── Branch count or "Main branch" subtitle (optional metadata)
│       ├── Last accessed timestamp (relative)
│       └── Selected state indicator (radio/check)
├── Footer Actions
│   ├── "Remember my choice" checkbox
│   └── Log out link
└── States: Loading, Empty (no companies), Error, Submitting
```

**Content priority:** Company name → Role → Last accessed → Continue CTA per card (tap entire card).

---

## Desktop Wireframe Description (ASCII layout with exact regions, dimensions in px, component placement)

**Frame:** 1280×800 (Figma reference frame `Desktop/1280`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ VIEWPORT: 1280 × 800                                                         │
│ Background: color/background/sunken, full bleed                                │
│                                                                              │
│                    ┌─ LOGO REGION ─────────────────┐                         │
│                    │  ERP Logo (CMP-ATOM-023)      │  40px height           │
│                    │  centered, y = 120px from top   │                         │
│                    └───────────────────────────────┘                         │
│                              gap 24px                                        │
│         ┌──────────────── AUTH CARD (640 × auto, min 400px) ────────────────┐│
│         │ padding: 32px all sides                                           ││
│         │ border: 1px color/border/default                                    ││
│         │ radius: 12px | shadow: shadow/lg                                    ││
│         │                                                                     ││
│         │  HEADER ROW (576 × 56)                                              ││
│         │  ┌────┐  Welcome back, Dilshod          Typography: heading/lg 24px ││
│         │  │ AV │  Select a company to continue   Typography: body/md 14px    ││
│         │  │40px│  secondary color/foreground/secondary                      ││
│         │  └────┘                                                               ││
│         │  gap 24px                                                             ││
│         │  SEARCH (576 × 40) — visible only if company count > 5              ││
│         │  [ 🔍 Search companies...                    ]  CMP-MOL-002         ││
│         │  gap 16px                                                             ││
│         │  COMPANY LIST SCROLL AREA (576 × max 360px, overflow-y auto)        ││
│         │  ┌─────────────────────────────────────────────────────────────┐   ││
│         │  │ COMPANY CARD (576 × 72) — CMP-ORG-037 item                  │   ││
│         │  │ [M] Market — Tashkent    [Manager] badge   Last: 2h ago  ○  │   ││
│         │  ├─────────────────────────────────────────────────────────────┤   ││
│         │  │ COMPANY CARD (576 × 72)                                     │   ││
│         │  │ [S] Somafix              [Admin] badge     Last: Yesterday ○  │   ││
│         │  ├─────────────────────────────────────────────────────────────┤   ││
│         │  │ COMPANY CARD (576 × 72) — SELECTED (border primary 2px)     │   ││
│         │  │ [X] Xitoy Tovar          [Cashier] badge   Last: 3d ago  ●  │   ││
│         │  └─────────────────────────────────────────────────────────────┘   ││
│         │  gap 16px                                                             ││
│         │  FOOTER ROW (576 × 40)                                                ││
│         │  [☑ Remember my choice]                    [Log out] link 14px       ││
│         │                                                                     ││
│         │  PRIMARY CTA (576 × 44) — enabled when card selected                ││
│         │  [ Continue → ]  full width, CMP-ATOM-001 primary                   ││
│         └─────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  VERSION FOOTER: v2.0.0 — bottom center, 12px tertiary, y = 768px            │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Region | X | Y | W | H | Notes |
|--------|---|---|---|---|-------|
| Logo | center | 120 | 120 | 40 | Horizontally centered |
| Auth card | center | 184 | 640 | auto | Max height 560px; internal scroll for list |
| Company card row | 32 inset | — | 576 | 72 | 12px gap between cards |
| Company avatar | 16px inset left | center | 40 | 40 | Rounded `radius/full` |
| Role badge | right of name | top 16px | auto | 24px | `CMP-MOL-022` |
| Continue button | 32 inset | bottom 32 | 576 | 44 | Disabled until selection |

---

## Tablet Wireframe Description

**Frame:** 768×1024 (portrait)

```
┌────────────────────────────────────┐
│ VIEWPORT: 768 × 1024               │
│                                    │
│         [LOGO 40px]  y=80          │
│              gap 20px              │
│  ┌──────────────────────────────┐  │
│  │ AUTH CARD: width = 100% - 48 │  │
│  │ (720px effective, max 640)   │  │
│  │ margin: 24px horizontal      │  │
│  │ padding: 24px                │  │
│  │                                │  │
│  │ Header (avatar 36px)           │  │
│  │ Search (if >5 companies)       │  │
│  │ Company cards: full width      │  │
│  │ Card height: 68px              │  │
│  │ Touch target: entire card 68px │  │
│  │                                │  │
│  │ [Remember]     [Log out]       │  │
│  │ [ Continue — full width 48px ] │  │
│  └──────────────────────────────┘  │
│                                    │
│  Safe area bottom: 34px (iOS)      │
└────────────────────────────────────┘
```

- Card width: `min(640px, 100vw - 48px)`, centered.
- Company cards stack vertically; no horizontal grid on tablet.
- Continue button height: **48px** (touch target compliance).

---

## Mobile Wireframe Description

**Frame:** 390×844 (iPhone 14 reference)

```
┌─────────────────────────┐
│ STATUS BAR 47px         │
├─────────────────────────┤
│ LOGO: 32px height       │
│ y = 24px below status   │
│ gap 16px                │
│                         │
│ ┌─────────────────────┐ │
│ │ CARD: edge-to-edge  │ │
│ │ margin: 16px        │ │
│ │ radius: 12px        │ │
│ │ padding: 20px       │ │
│ │                     │ │
│ │ "Welcome back"      │ │
│ │ 20px semibold       │ │
│ │ Subtitle 14px       │ │
│ │                     │ │
│ │ Search (optional)   │ │
│ │ 44px height         │ │
│ │                     │ │
│ │ ┌─────────────────┐ │ │
│ │ │ Co. Card 80px   │ │ │
│ │ │ tap = select    │ │ │
│ │ └─────────────────┘ │ │
│ │ ┌─────────────────┐ │ │
│ │ │ Co. Card 80px   │ │ │
│ │ └─────────────────┘ │ │
│ │ (scroll)            │ │
│ │                     │ │
│ │ ☐ Remember          │ │
│ │ Log out (text btn)  │ │
│ │                     │ │
│ │ [ Continue 52px ]   │ │
│ └─────────────────────┘ │
│                         │
│ v2.0.0 — 12px bottom    │
│ HOME INDICATOR 34px     │
└─────────────────────────┘
```

- Full-width card with 16px horizontal margin.
- Company card height: **80px** minimum for 44px+ touch targets.
- Selecting a card shows 2px primary border + filled radio (●).
- On mobile, **tap card = select**; Continue confirms (no auto-navigate on tap).

---

## Layout Structure (grid columns)

| Breakpoint | Grid | Card placement |
|------------|------|----------------|
| Desktop ≥1280 | 12-col, content area centered; auth card spans visual 5 cols (~640px) | Single column list inside card |
| Desktop 1024–1279 | Same; card max 600px | Single column |
| Tablet 768–1023 | 8-col fluid; card 100% - 48px margin | Single column |
| Mobile <768 | 4-col; card 100% - 32px margin | Single column stack |

**Internal card grid:** 12-column at 640px width; avatar col 1–2, text col 3–10, indicator col 11–12.

---

## Navigation Pattern (how user arrives and leaves)

### Arrival

| Source | Condition | Transition |
|--------|-----------|------------|
| Login success (SCR-001) | `user_companies.count > 1` | Replace route → `/company-select` |
| Splash / token refresh | Valid token, no `company_id` in context, multi-company | Redirect → `/company-select` |
| CompanySwitcher → "All companies" | Authenticated | Push full-screen (mobile) or modal overlay (desktop) → SCR-010 |
| Deep link | Authenticated, no company context | Guard redirect |

### Departure

| Action | Destination | Transition |
|--------|-------------|------------|
| Continue (company selected) | Role home: Cashier → `/sales/new`; Manager/Admin → `/dashboard` | Replace; fade 200ms |
| Log out | `/login` (SCR-001) | Replace; clear tokens |
| Back (mobile hardware) | Blocked on first onboarding; from switcher → previous screen | — |
| Company access revoked mid-screen | Stay; error toast; refresh list | — |

---

## Components (list with CMP-IDs)

| CMP-ID | Name | Role on screen |
|--------|------|----------------|
| CMP-TPL-002 | AuthLayout | Page shell: centered content, background |
| CMP-ORG-027 | AuthCard | Card container (variant: `wide` 640px) |
| CMP-ORG-037 | CompanySelectList | Scrollable list of selectable company cards |
| CMP-ORG-007 | Card | Individual company card wrapper |
| CMP-ATOM-006 | Avatar | Company initials avatar (40px) |
| CMP-ATOM-020 | Typography | Headings, subtitles |
| CMP-ATOM-005 | Badge | Role badge per company |
| CMP-MOL-002 | SearchField | Company name filter |
| CMP-MOL-022 | StatusBadge | Role label (Admin, Manager, Cashier, Warehouse) |
| CMP-ATOM-007 | Checkbox | "Remember my choice" |
| CMP-ATOM-001 | Button | Continue (primary) |
| CMP-ATOM-016 | Link | Log out |
| CMP-ATOM-023 | Logo | ERP brand mark |
| CMP-ATOM-012 | Spinner | Loading state |
| CMP-ATOM-013 | Skeleton | Company card skeleton × 3 |
| CMP-MOL-013 | Alert | Error banner |
| CMP-MOL-014 | EmptyState | No companies assigned |
| CMP-ATOM-008 | Radio | Selection indicator (visual) |

---

## Component Tree (indented hierarchy)

```
CompanySelectPage [SCR-010]
└── AuthLayout (CMP-TPL-002)
    ├── Logo (CMP-ATOM-023)
    └── AuthCard (CMP-ORG-027, variant=wide)
        ├── HeaderRow
        │   ├── Avatar (CMP-ATOM-006, user)
        │   └── TextBlock (CMP-ATOM-020)
        │       ├── Title: "Welcome back, {name}"
        │       └── Subtitle: "Select a company to continue"
        ├── SearchField (CMP-MOL-002) [conditional: count > 5]
        ├── CompanySelectList (CMP-ORG-037)
        │   └── CompanyCard (CMP-ORG-007) × N
        │       ├── Avatar (CMP-ATOM-006, company)
        │       ├── TextBlock
        │       │   ├── CompanyName (CMP-ATOM-020, weight=semibold)
        │       │   └── LastAccessed (CMP-ATOM-020, variant=secondary)
        │       ├── StatusBadge (CMP-MOL-022, role)
        │       └── RadioIndicator (CMP-ATOM-008)
        ├── FooterRow
        │   ├── Checkbox (CMP-ATOM-007) + Label (CMP-ATOM-004)
        │   └── Link (CMP-ATOM-016) "Log out"
        ├── Button (CMP-ATOM-001, primary, fullWidth) "Continue"
        └── Alert (CMP-MOL-013) [error state only]
```

---

## Forms (fields, validation, labels)

This screen has **no traditional form submission fields**. Interaction is selection-based.

| Field / Control | Type | Label | Validation | Default |
|-----------------|------|-------|------------|---------|
| Company selection | Radio group (card tap) | `aria-label="Select company"` | Exactly one required before Continue | Pre-select last-used if "Remember" was on |
| Remember my choice | Checkbox | "Remember my choice" | Optional boolean | `true` if previously enabled in local prefs |
| Search | Text input | Placeholder: "Search companies…" | None; filters client-side | Empty |

**Validation rules:**

| Rule | Message | Trigger |
|------|---------|---------|
| No company selected | Continue button disabled (no message until click) | Continue clicked without selection → "Please select a company" inline below list |
| Company revoked | "You no longer have access to {name}" | API 403 on switch |
| Network error | "Unable to connect. Check your internet." | POST `/auth/switch-company` fails |

---

## Tables

Not applicable.

---

## Search behavior

| Property | Value |
|----------|-------|
| Visibility | Shown when `companies.length > 5` |
| Placement | Below header, above list |
| Debounce | 150ms client-side |
| Match fields | Company `name` (case-insensitive, substring) |
| Min characters | 0 (empty shows all) |
| No results | Inline text: "No companies match your search." |
| Clear | X icon in SearchField when text present |
| Keyboard | `/` focuses search (desktop); Esc clears |

---

## Filters

Not applicable (search is the only filter).

---

## Modals

| Modal ID | Trigger | Content | Actions |
|----------|---------|---------|---------|
| MOD-010-A | Company switch from app (unsaved changes elsewhere) | "You have unsaved changes. Switch company anyway?" | Cancel (secondary), Switch (destructive) |
| MOD-010-B | Log out confirm (optional, desktop only) | "Log out of ERP?" | Cancel, Log out |

**Note:** First-time post-login company selection does **not** show MOD-010-A.

---

## Drawers

Not applicable on this screen.

---

## Charts/Widgets

Not applicable.

---

## Keyboard Shortcuts (desktop)

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Move selection between company cards |
| `Enter` | Select focused card / activate Continue if card selected |
| `Space` | Toggle selection on focused card |
| `/` | Focus search field (if visible) |
| `Esc` | Clear search text |
| `Ctrl+Shift+L` | Log out (with confirmation MOD-010-B) |
| `Tab` | Move focus: search → cards → remember → log out → continue |

---

## User Actions (primary, secondary, destructive)

| Priority | Label | Control | Enabled when | Result |
|----------|-------|---------|--------------|--------|
| **Primary** | Continue | Button, full width | Company selected | POST `/auth/switch-company` → navigate home |
| **Secondary** | Select company card | Card tap/click | Always | Highlights card; enables Continue |
| **Secondary** | Remember my choice | Checkbox | Always | Persists `last_company_id` to secure local storage |
| **Secondary** | Log out | Text link | Always | POST `/auth/logout` → `/login` |
| **Destructive** | Switch anyway | Modal button | Unsaved changes guard | Forces company switch |

---

## Data Flow (API endpoints, WebSocket events)

### API

| Step | Method | Endpoint | Request | Response |
|------|--------|----------|---------|----------|
| Load companies | GET | `/auth/me` | — | `{ user, companies: [{ id, name, role, last_accessed_at, logo_url }] }` |
| Switch company | POST | `/auth/switch-company` | `{ company_id: UUID }` | `{ access_token, permissions[], modules[], default_route }` |
| Log out | POST | `/auth/logout` | — | 204 |

### WebSocket

| Event | Direction | When | UI effect |
|-------|-----------|------|-----------|
| `session.revoked` | Server → Client | Admin force-logout | Redirect `/login` + toast |
| `user.company_removed` | Server → Client | Access revoked | Remove card from list; if active selection, clear |
| *(connect after switch)* | Client → Server | After successful switch | Join `company:{id}` room |

---

## State Management Requirements (what state, where stored, persistence)

| State | Store | Persistence |
|-------|-------|-------------|
| `companies[]` | Auth store (Zustand/Riverpod) | Session only |
| `selectedCompanyId` | Auth store | Cleared on navigate |
| `rememberChoice` | User prefs (local) | `localStorage` / `SharedPreferences` |
| `lastCompanyId` | User prefs (local) | Encrypted local storage |
| `searchQuery` | Component local state | None |
| `isSubmitting` | Component local state | None |
| `error` | Auth store | Cleared on retry |

**On Continue success:** Update JWT, permissions cache, module registry, WebSocket room, `activeCompany` in global store.

---

## Empty State

**Condition:** `companies.length === 0` (user has no company assignments).

| Element | Specification |
|---------|---------------|
| Illustration | `empty-no-access` 120×120px, muted |
| Heading | "No companies available" |
| Body | "Your account is not assigned to any company. Contact your administrator." |
| Primary action | "Log out" button |
| Secondary | "Contact support" mailto link (if configured) |

Component: `CMP-MOL-014` EmptyState.

---

## Loading State

| Phase | UI |
|-------|-----|
| Initial load | 3× company card skeletons (`CMP-ATOM-013`, 72px height, shimmer) |
| Submitting switch | Continue button shows spinner; cards disabled; opacity 0.6 on list |
| Duration | Skeleton min display 300ms to avoid flash |

---

## Error State

| Error type | UI treatment |
|------------|--------------|
| Network | `CMP-MOL-013` Alert banner top of card: destructive variant + "Retry" button |
| 403 company access | Toast + remove company from list |
| 500 server | Alert: "Something went wrong. Please try again." |
| Session expired | Full redirect to SCR-001 with message query param |

---

## Success State

| Element | Specification |
|---------|---------------|
| Transition | 200ms fade out card → fade in app shell |
| Toast | "Switched to {companyName}" (only when coming from CompanySwitcher, not first login) |
| Loading overlay | Brief 400ms "Loading workspace…" with spinner during permission fetch |

---

## Real-time Update Behavior

| Event | Behavior |
|-------|----------|
| `user.company_removed` | Animate card removal (slide up 200ms); if last company, show Empty State |
| `user.company_added` | Prepend new card to list (admin assignment while on screen — rare) |
| `session.revoked` | Immediate logout flow |

No live polling; WebSocket only.

---

## Accessibility (WCAG 2.2)

| ID | Requirement | Implementation |
|----|-------------|----------------|
| 2.4.3 Focus Order | Logical | Search → company cards (roving tabindex) → remember → log out → continue |
| 2.4.7 Focus Visible | 2px `color/border/focus` ring | All interactive elements |
| 4.1.2 Name, Role, Value | Radio group | `role="radiogroup"` `aria-label="Select company"`; each card `role="radio"` `aria-checked` |
| 1.4.3 Contrast | 4.5:1 text | All text on card backgrounds |
| 2.5.8 Target Size | 44×44px minimum | Entire company card is target on mobile |
| 4.1.3 Status Messages | Selection announced | `aria-live="polite"`: "{Company name} selected" |
| 3.3.1 Error Identification | Continue without selection | `aria-describedby` error text |
| 2.4.1 Bypass Blocks | Skip link | "Skip to company list" (desktop) |

---

## Figma Frame Name

```
SCR-010 / Company Selection / {Breakpoint} / {State}
```

**Required frames (Light + Dark each):**

- `SCR-010 / Company Selection / Desktop-1280 / Default`
- `SCR-010 / Company Selection / Desktop-1280 / Loading`
- `SCR-010 / Company Selection / Desktop-1280 / Selected`
- `SCR-010 / Company Selection / Desktop-1280 / Empty`
- `SCR-010 / Company Selection / Desktop-1280 / Error`
- `SCR-010 / Company Selection / Tablet-768 / Default`
- `SCR-010 / Company Selection / Mobile-390 / Default`
- `SCR-010 / Company Selection / Mobile-390 / Selected`

---

# Screen 2: Login

## Screen ID, Route, Module

| Field | Value |
|-------|-------|
| **Screen ID** | `SCR-001` |
| **Route** | `/login` |
| **Module** | `auth` |
| **data-screen-id** | `SCR-001` |
| **Shell** | Auth |
| **Platform** | Both |

---

## Purpose

Primary authentication entry point. Collects email and password, authenticates against the API, registers/refreshes device fingerprint, creates server session, and routes to Company Selection (SCR-010) if multi-company or directly to role home if single-company.

---

## User Roles (who can access)

| Role | Access |
|------|--------|
| Unauthenticated visitors | ✓ |
| Authenticated with valid token | ✗ (redirect to last route or company select) |
| All roles (as login identity) | ✓ |

---

## User Permissions (exact permission codes)

| Code | Required |
|------|----------|
| *(Public)* | No authentication required |
| N/A | Permissions loaded **after** successful login via `/auth/me` |

---

## Information Architecture

```
Login (SCR-001)
├── Brand Region
│   └── ERP Logo
├── Auth Card
│   ├── Card Header
│   │   ├── Title: "Sign in"
│   │   └── Subtitle: "Enter your credentials to continue"
│   ├── Error Alert (conditional)
│   ├── Login Form
│   │   ├── Email field
│   │   ├── Password field (with show/hide toggle)
│   │   ├── Remember this device checkbox
│   │   └── Submit button
│   ├── Forgot password link
│   └── Footer: version + language selector (Phase 2)
└── States: Default, Loading, Error (credentials), Error (blocked), Error (rate limit)
```

---

## Desktop Wireframe Description (ASCII layout with exact regions, dimensions in px, component placement)

**Frame:** 1280×800

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ VIEWPORT: 1280 × 800                                                         │
│ Background: color/background/sunken                                          │
│                                                                              │
│                         [LOGO 40px]  y=160                                   │
│                              gap 24px                                        │
│              ┌──────────── AUTH CARD 480 × auto ────────────┐                  │
│              │ padding: 32px                                 │                  │
│              │                                               │                  │
│              │  "Sign in"          heading/xl 28px semibold   │                  │
│              │  "Enter your..."    body/md 14px secondary    │                  │
│              │  gap 24px                                     │                  │
│              │  ┌─ ERROR ALERT (416 × auto) ─────────────┐  │  [conditional]  │
│              │  │ ⚠ Invalid email or password            │  │  CMP-MOL-013    │
│              │  └────────────────────────────────────────┘  │                  │
│              │  gap 16px                                     │                  │
│              │  EMAIL FIELD (416 × 72)                       │                  │
│              │  Label: "Email" 14px medium                   │                  │
│              │  Input: 416 × 40px                            │                  │
│              │  Placeholder: "name@company.com"              │                  │
│              │  gap 16px                                     │                  │
│              │  PASSWORD FIELD (416 × 72)                    │                  │
│              │  Label: "Password"                            │                  │
│              │  Input: 416 × 40px + eye toggle 40×40 right    │                  │
│              │  gap 8px                                      │                  │
│              │  [☑ Remember this device]  14px               │                  │
│              │  gap 24px                                     │                  │
│              │  [ Sign in ]  PRIMARY 416 × 44px              │                  │
│              │  gap 16px                                     │                  │
│              │  Forgot password? — link, centered            │                  │
│              └───────────────────────────────────────────────┘                  │
│                                                                              │
│  Connection indicator (bottom-right): ● Connected  12px  y=776 x=1230       │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Region | W | H | Notes |
|--------|---|---|-------|
| Auth card | 480 | min 420 | Centered horizontally and vertically (offset -20px visual) |
| Form fields | 416 | 40 input + 24 label | 32px card padding each side |
| Submit button | 416 | 44 | Full width inside card |
| Password toggle | 40 | 40 | Icon button inside input, right 8px |

---

## Tablet Wireframe Description

**Frame:** 768×1024

- Auth card: `width = min(480px, 100vw - 64px)`, centered vertically at 40% from top.
- Padding: 28px internal.
- Input height: 44px (touch).
- Submit button: 48px height.
- Logo: 36px, y=100px.

---

## Mobile Wireframe Description

**Frame:** 390×844

```
┌─────────────────────────┐
│ STATUS BAR              │
│ LOGO 32px  margin 24    │
│                         │
│ ┌─────────────────────┐ │
│ │ CARD margin 16px    │ │
│ │ padding 20px        │ │
│ │                     │ │
│ │ Sign in  22px       │ │
│ │ Subtitle 14px       │ │
│ │                     │ │
│ │ [Error alert]       │ │
│ │                     │ │
│ │ Email               │ │
│ │ [ input 44px ]      │ │
│ │                     │ │
│ │ Password      [👁]  │ │
│ │ [ input 44px ]      │ │
│ │                     │ │
│ │ ☐ Remember device   │ │
│ │                     │ │
│ │ [ Sign in 52px ]    │ │
│ │                     │ │
│ │ Forgot password?    │ │
│ └─────────────────────┘ │
│                         │
│ Keyboard pushes card up │
│ (scrollable)            │
└─────────────────────────┘
```

- Form scrolls above keyboard; primary button remains visible (sticky bottom inside card when keyboard open).
- Biometric login button placeholder (Phase 2): below Forgot password, 44px secondary outline.

---

## Layout Structure (grid columns)

| Breakpoint | Card width | Grid |
|------------|------------|------|
| Desktop ≥1024 | 480px fixed, centered | 12-col center cols 4–9 |
| Tablet | fluid max 480px | 8-col center |
| Mobile | 100% - 32px margin | 4-col |

Single-column form; no multi-column fields.

---

## Navigation Pattern (how user arrives and leaves)

### Arrival

| Source | Transition |
|--------|------------|
| App cold start (no token) | Splash → `/login` fade 300ms |
| Logout | Replace → `/login` |
| Session expired (SCR-003) | "Login again" → `/login?returnUrl={encoded}` |
| Auth guard (protected route) | Redirect → `/login?returnUrl=` |
| Device blocked | Never arrives here; goes to SCR-002 |

### Departure

| Condition | Destination |
|-----------|-------------|
| Login success, multi-company | `/company-select` (SCR-010) |
| Login success, single company | Role home (`/dashboard` or `/sales/new`) |
| Forgot password link | `/forgot-password` (SCR-001-FP separate spec) |
| Valid existing token | `returnUrl` or default home |

---

## Components (list with CMP-IDs)

| CMP-ID | Name | Role |
|--------|------|------|
| CMP-TPL-002 | AuthLayout | Page shell |
| CMP-ORG-027 | AuthCard | Card container (variant: `narrow` 480px) |
| CMP-ORG-028 | LoginForm | Email + password form organism |
| CMP-ORG-009 | Form | Form wrapper with validation |
| CMP-MOL-001 | FormField | Email and password fields |
| CMP-ATOM-003 | Input | Text inputs |
| CMP-ATOM-004 | Label | Field labels |
| CMP-ATOM-001 | Button | Sign in submit |
| CMP-ATOM-002 | Icon | Eye show/hide, alert icon |
| CMP-ATOM-007 | Checkbox | Remember device |
| CMP-ATOM-016 | Link | Forgot password |
| CMP-ATOM-023 | Logo | Brand |
| CMP-MOL-013 | Alert | Error banner |
| CMP-MOL-023 | ConnectionIndicator | Server reachability dot |
| CMP-ATOM-012 | Spinner | Button loading state |
| CMP-ATOM-009 | Switch | — (not used) |

---

## Component Tree (indented hierarchy)

```
LoginPage [SCR-001]
└── AuthLayout (CMP-TPL-002)
    ├── Logo (CMP-ATOM-023)
    └── AuthCard (CMP-ORG-027, variant=narrow)
        ├── HeaderBlock
        │   ├── Title (CMP-ATOM-020) "Sign in"
        │   └── Subtitle (CMP-ATOM-020) "Enter your credentials..."
        ├── Alert (CMP-MOL-013) [error]
        └── LoginForm (CMP-ORG-028)
            └── Form (CMP-ORG-009)
                ├── FormField (CMP-MOL-001, email)
                │   ├── Label (CMP-ATOM-004)
                │   └── Input (CMP-ATOM-003, type=email)
                ├── FormField (CMP-MOL-001, password)
                │   ├── Label (CMP-ATOM-004)
                │   ├── Input (CMP-ATOM-003, type=password)
                │   └── IconButton (CMP-ATOM-002, toggle visibility)
                ├── CheckboxRow
                │   ├── Checkbox (CMP-ATOM-007)
                │   └── Label "Remember this device"
                └── Button (CMP-ATOM-001, type=submit) "Sign in"
        ├── Link (CMP-ATOM-016) "Forgot password?"
        └── ConnectionIndicator (CMP-MOL-023)
```

---

## Forms (fields, validation, labels)

| Field | Label | Type | Placeholder | Validation | Error messages |
|-------|-------|------|-------------|------------|----------------|
| `email` | Email | `email` | `name@company.com` | Required; RFC 5322 simplified regex | "Email is required" / "Enter a valid email address" |
| `password` | Password | `password` | `••••••••` | Required; min 1 char (server enforces policy) | "Password is required" |
| `rememberDevice` | Remember this device | checkbox | — | Optional | — |

**Client validation:** On blur for email; on submit for all fields.  
**Server errors mapped to Alert:**

| HTTP | Code | Alert message |
|------|------|---------------|
| 401 | — | "Email or password is incorrect." |
| 403 | `USER_BLOCKED` | "Your account has been blocked. Contact your administrator." |
| 403 | `DEVICE_BLOCKED` | Redirect to `/device-blocked` (no inline alert) |
| 429 | — | "Too many attempts. Try again in {n} minutes." |
| Network | — | "Cannot connect to server. Check your internet connection." |

**Show/hide password:** Toggle `type` password ↔ text; `aria-label` "Show password" / "Hide password".

---

## Tables

Not applicable.

---

## Search behavior

Not applicable.

---

## Filters

Not applicable.

---

## Modals

Not applicable on login screen (errors inline).

---

## Drawers

Not applicable.

---

## Charts/Widgets

Not applicable.

---

## Keyboard Shortcuts (desktop)

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit form (when focus in any field) |
| `Tab` / `Shift+Tab` | Cycle: email → password → remember → submit → forgot link |
| `Esc` | Clear error alert (if shown) |
| `Alt+V` | Toggle password visibility |

**Auto-focus:** Email field on mount (desktop). Mobile: no auto-focus (prevents keyboard pop).

---

## User Actions (primary, secondary, destructive)

| Priority | Label | Result |
|----------|-------|--------|
| **Primary** | Sign in | POST `/auth/login` → token storage → device register → route forward |
| **Secondary** | Forgot password? | Navigate `/forgot-password` |
| **Secondary** | Show/hide password | Toggle visibility |
| **Secondary** | Remember this device | Extends refresh token TTL; stores device trust flag |
| **Destructive** | — | None on this screen |

---

## Data Flow (API endpoints, WebSocket events)

| Step | Method | Endpoint | Body | Notes |
|------|--------|----------|------|-------|
| Login | POST | `/auth/login` | `{ email, password, device_fingerprint }` | Returns `access_token`, `refresh_token` |
| Device register | POST | `/devices/register` | `{ platform, name, fingerprint }` | After login success |
| Profile | GET | `/auth/me` | — | Companies, permissions, modules |
| Health check | GET | `/health` | — | Connection indicator polling 30s |

**WebSocket:** Not connected until post-login company context established.

---

## State Management Requirements (what state, where stored, persistence)

| State | Location | Persistence |
|-------|----------|-------------|
| `email` | Form state | Optional: last email in local prefs (not password) |
| `password` | Form state only | Never persisted |
| `rememberDevice` | Form + prefs | `localStorage` |
| `isSubmitting` | Form state | — |
| `error` | Auth store | Cleared on field change |
| `tokens` | Secure storage | Keychain / Electron safeStorage |
| `returnUrl` | Router query | Session |

---

## Empty State

Not applicable (form always shown).

---

## Loading State

| Element | Behavior |
|---------|----------|
| Submit button | Text → Spinner + "Signing in…"; disabled |
| Inputs | `disabled`, opacity 0.7 |
| Card | No overlay; button-level loading only |
| Min duration | 400ms to prevent flicker |

---

## Error State

| Variant | Visual |
|---------|--------|
| Invalid credentials | Red alert banner (`color/destructive/subtle` bg), icon left, message 14px |
| Account blocked | Same alert; no retry emphasis — contact admin copy |
| Rate limited | Alert + countdown timer inline `{mm:ss}` |
| Field-level | Red border `color/border/error` + 12px message below field |

Alert component: `CMP-MOL-013` variant `destructive`.  
`role="alert"` `aria-live="assertive"` on submit errors.

---

## Success State

| Step | UI |
|------|-----|
| API 200 | Brief checkmark flash in button (200ms) OR immediate transition |
| Transition | Card fade out 200ms → route change |
| No success toast | Login success is silent transition |

---

## Real-time Update Behavior

| Event | Behavior |
|-------|----------|
| `device.blocked` | If login in progress, abort → redirect `/device-blocked` |
| Connection loss | ConnectionIndicator turns amber; submit shows network error |

---

## Accessibility (WCAG 2.2)

| Criterion | Implementation |
|-----------|----------------|
| 1.3.1 Info and Relationships | `<form>` with explicit labels via `htmlFor` / `aria-labelledby` |
| 1.4.3 Contrast | Input text 4.5:1; placeholder 3:1 minimum |
| 2.4.6 Headings | `h1` "Sign in" inside card |
| 3.3.2 Labels | Visible labels always (no placeholder-only) |
| 3.3.3 Error Suggestion | "Enter a valid email address" not just "Invalid" |
| 4.1.3 Status Messages | Submit errors in `role="alert"` region |
| 2.5.8 Target Size | Mobile inputs min 44px height; toggle 44×44 |
| 3.2.2 On Input | Do not auto-submit on email blur |

**Screen reader flow:** Logo decorative `alt=""`; form announced as "Sign in form".

---

## Figma Frame Name

```
SCR-001 / Login / {Breakpoint} / {State}
```

**Required frames:**

- `SCR-001 / Login / Desktop-1280 / Default`
- `SCR-001 / Login / Desktop-1280 / Loading`
- `SCR-001 / Login / Desktop-1280 / Error-Credentials`
- `SCR-001 / Login / Desktop-1280 / Error-Blocked`
- `SCR-001 / Login / Desktop-1280 / Error-RateLimit`
- `SCR-001 / Login / Tablet-768 / Default`
- `SCR-001 / Login / Mobile-390 / Default`
- `SCR-001 / Login / Mobile-390 / Keyboard-Open`
- `SCR-001 / Login / Dark / Desktop-1280 / Default`

---

## Related Documents

- [USER_FLOWS.md](../USER_FLOWS.md) — Flow 1: Authentication
- [AUTHENTICATION.md](../../07-security/AUTHENTICATION.md)
- [SESSION_MANAGEMENT.md](../../07-security/SESSION_MANAGEMENT.md)
- [DEVICE_MANAGEMENT.md](../../07-security/DEVICE_MANAGEMENT.md)
- [SCREENS_COMMERCE.md](./SCREENS_COMMERCE.md) — Post-login commerce screens
