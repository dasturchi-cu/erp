# UI/UX Master Blueprint

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Enterprise Specification |
| Last Updated | 2026-06-17 |
| Audience | Product Design, Frontend (React/Electron), Mobile (Flutter), QA, Stakeholders |
| Supersedes | Consolidates and extends v1.0 UI/UX documents |
| Source of Truth | [ERP_MASTER_PLAN.md](../../ERP_MASTER_PLAN.md) |

---

## 1. Executive Summary

This document is the **authoritative master blueprint** for all user interface and user experience decisions across the ERP platform. It defines how the product should look, feel, and behave on every surface — from a cashier completing 200 POS transactions per shift to a platform administrator managing multi-company module enablement at 2 AM.

The ERP UI/UX strategy deliberately aligns with patterns proven in **SAP Fiori**, **Oracle Fusion**, **Microsoft Dynamics 365**, **Odoo**, and **NetSuite** — while remaining purpose-built for Uzbekistan retail and wholesale operations with dual-currency (UZS/USD), FIFO inventory, and real-time multi-device synchronization.

**Documentation-first policy**: No client implementation may diverge from this blueprint without an approved design change request (DCR) and corresponding documentation update.

---

## 2. Design Philosophy — Enterprise ERP Alignment

### 2.1 Benchmark Analysis

| Platform | Pattern Adopted | Pattern Rejected | Rationale |
|----------|-----------------|------------------|-----------|
| **SAP Fiori** | Role-based launchpad, object pages, semantic colors, busy indicators | Full SAP shell complexity, Launchpad-only navigation | Our scale is mid-market; Fiori's information density principles apply |
| **Oracle Fusion** | Persistent global header, contextual actions, saved searches | Oracle's visual density and legacy form layouts | Fusion's task-centric model fits POS and warehouse flows |
| **Microsoft Dynamics 365** | Command bar, side navigation, Power BI-style dashboards | D365's inconsistent module UX across products | Unified shell across all modules is non-negotiable |
| **Odoo** | Module-app metaphor, list/form/kanban views, quick create | Odoo's inconsistent mobile experience | App-per-module mental model maps to our modular architecture |
| **NetSuite** | Subtab navigation within records, global search, role dashboards | NetSuite's dated visual design | Record-centric subtab pattern for Customer/Product detail |

### 2.2 ERP-Specific Design Tenets

1. **Task over decoration** — Every pixel serves a business operation. Decorative elements must not compete with data.
2. **Trust through transparency** — Users must see *why* a number changed (FIFO allocation, frozen exchange rate, debt balance). Auditability is a UX feature.
3. **Progressive disclosure** — Cashiers see POS essentials; managers see KPIs; admins see system controls. Same product, different depth.
4. **Fail-safe operations** — Destructive actions require confirmation. Financial transactions show immutable receipts. Undo is explicit, never implicit.
5. **Multi-company awareness** — Company context is always visible. Cross-company data leakage is a UX failure, not only a security failure.
6. **Real-time as default** — Users expect live stock, live debt, live notifications. Stale data must be labeled.

### 2.3 Uzbekistan Market Context

| Factor | UX Implication |
|--------|----------------|
| Dual currency (UZS/USD) | Currency is a first-class UI dimension — color-coded, always paired where relevant |
| Phone-based customer lookup | Phone number input optimized (country code, formatting, paste-friendly) |
| Mixed literacy levels | Icons + labels; avoid jargon in cashier flows; Uzbek primary language |
| Warehouse lighting variance | High-contrast light theme default; dark theme for evening shifts |
| Device diversity | Desktop for back-office; mobile for floor sales and stock checks |

Cross-reference: [INDUSTRY_CONTEXT.md](../02-business/INDUSTRY_CONTEXT.md), [CURRENCY_UZS_USD.md](../08-modules/CURRENCY_UZS_USD.md)

---

## 3. Standards Compliance Matrix

### 3.1 Material Design 3 (Mobile — Flutter)

| MD3 Principle | ERP Application |
|---------------|-----------------|
| **Dynamic color** | Seed color `#2563EB`; tonal palettes for surfaces and containers |
| **Typography scale** | Roboto type scale; `titleLarge` for screen headers, `bodyMedium` for lists |
| **Elevation** | Cards at elevation 1; bottom sheets at 3; dialogs at 6 |
| **Motion** | Shared axis transitions for drill-down; fade-through for tab switches |
| **Components** | NavigationBar, NavigationDrawer, SearchBar, FilledButton, FilterChip |
| **Adaptive layouts** | Compact (phone), Medium (tablet portrait), Expanded (tablet landscape) |

Full mobile component mapping: [COMPONENT_HIERARCHY.md](./COMPONENT_HIERARCHY.md)

Cross-reference: [MOBILE_UI_SPEC.md](./MOBILE_UI_SPEC.md), [MOBILE_FLUTTER.md](../11-platforms/MOBILE_FLUTTER.md)

### 3.2 Apple Human Interface Guidelines (iOS)

| HIG Principle | ERP Application |
|---------------|-----------------|
| **Clarity** | Legible text at 16pt minimum for body content on iOS |
| **Deference** | Content fills screen; chrome is minimal on mobile |
| **Depth** | Layered navigation with swipe-back; bottom sheets for secondary tasks |
| **Touch targets** | Minimum 44×44pt for all interactive elements |
| **Safe areas** | Respect notch, home indicator, Dynamic Island |
| **Haptics** | Light impact on sale completion; warning haptic on destructive confirm |

iOS-specific behaviors documented in [MOBILE_UI_SPEC.md](./MOBILE_UI_SPEC.md) § Platform-Specific.

### 3.3 WCAG 2.2 Level AA

| Criterion | Requirement | ERP Implementation |
|-----------|-------------|-------------------|
| **1.4.3 Contrast (Minimum)** | 4.5:1 text, 3:1 large text | All design tokens validated in both themes |
| **1.4.11 Non-text Contrast** | 3:1 UI components | Borders, focus rings, chart elements |
| **2.1.1 Keyboard** | All functionality keyboard-operable (desktop) | Full POS keyboard flow documented |
| **2.4.11 Focus Not Obscured (Minimum)** | Focus not fully hidden | Sticky headers offset focus scroll |
| **2.5.8 Target Size (Minimum)** | 24×24px minimum (AA) | Mobile targets 44×44pt (exceeds AA) |
| **3.3.8 Accessible Authentication** | No cognitive function test | No CAPTCHA puzzles; device trust model |
| **4.1.3 Status Messages** | Programmatic status | `aria-live` for toasts, connection, real-time KPI updates |

Full accessibility specification: [ACCESSIBILITY.md](./ACCESSIBILITY.md)

### 3.4 ISO 9241 — Ergonomics of Human-System Interaction

| ISO 9241 Part | Application |
|---------------|-------------|
| **Part 110: Dialogue principles** | Suitability for task, self-descriptiveness, controllability, error tolerance |
| **Part 112: Presentation of information** | Consistent number formatting, currency display, status encoding |
| **Part 125: Visual presentation of information** | Data tables with scannable columns; zebra striping optional |
| **Part 151: Software ergonomics** | Form tab order, field grouping, logical workflow sequence |
| **Part 210: Human-centred design** | Personas per role; usability testing gates before release |

### 3.5 Enterprise SaaS Conventions

| Convention | ERP Standard |
|------------|--------------|
| Global search | Command palette (Ctrl/Cmd+K) |
| Notification center | Bell icon with unread badge; real-time WebSocket push |
| User avatar menu | Profile, theme, company switcher access, logout |
| Empty states | Illustration + primary CTA + help link |
| Loading | Skeleton screens (not spinners) for data-heavy views |
| Error boundaries | Graceful module-level failure; shell remains functional |
| Session timeout | Modal with countdown; preserve unsaved POS cart where possible |
| Audit trail visibility | Admin views show who/when/what for all configuration changes |

---

## 4. Design Principles for ERP

### 4.1 Data Density

Enterprise ERP users process high-volume tabular data. Density is a feature, not a flaw — when applied correctly.

| Surface | Density Mode | Specifications |
|---------|--------------|----------------|
| Desktop data tables | **Compact** | 40px row height, 12px secondary text, 14px primary |
| Desktop POS product grid | **Comfortable** | 48px tiles minimum for touch-barcode hybrid workflows |
| Mobile lists | **Comfortable** | Single-column cards; key fields only |
| Admin permission matrix | **Ultra-compact** | 32px rows, sticky header, horizontal scroll |
| Dashboard KPI cards | **Comfortable** | Large numbers (24–30px), small labels (12px) |

**Density toggle** (desktop only, Phase 2): User preference for Compact / Comfortable / Spacious table row height.

Cross-reference: [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) § 1.4

### 4.2 Task Efficiency

| Role | Primary Task | Efficiency Target | Key UX Patterns |
|------|--------------|-------------------|-----------------|
| Cashier | Complete sale | < 30 seconds for 5-item cash sale | Barcode auto-focus, keyboard shortcuts, customer phone search |
| Warehouse Keeper | Receive stock | < 2 minutes per SKU batch | Barcode scan, inline quantity entry, batch auto-suggest |
| Manager | Review daily performance | < 10 seconds to answer "how did we do today?" | Dashboard default period = Today, real-time KPI refresh |
| Admin | Block compromised device | < 3 clicks from any screen | Command palette → "block device" → confirm |

**Keyboard-first desktop flows** are mandatory for POS, product search, and data table navigation. See [ACCESSIBILITY.md](./ACCESSIBILITY.md) § Desktop Keyboard Shortcuts.

### 4.3 Role-Based UX

Navigation, dashboards, and default landing pages adapt to the user's role within the active company.

| Role | Default Landing | Hidden Surfaces | Simplified Surfaces |
|------|-----------------|-----------------|---------------------|
| `admin` | Dashboard or last visited | None (permission-gated) | — |
| `manager` | Dashboard | Administration | — |
| `cashier` | POS (`/sales/new`) | Dashboard, Reports, Settings | Product detail (view-only) |
| `warehouse` | Inventory Stock Overview | Sales, Customers, Reports | Product pricing hidden |

Role resolution is per-company. A user who is Admin in Company A and Cashier in Company B sees different navigation after company switch.

Cross-reference: [RBAC_DESIGN.md](../07-security/RBAC_DESIGN.md), [PERMISSIONS_MODEL.md](../07-security/PERMISSIONS_MODEL.md), [NAVIGATION_ARCHITECTURE.md](./NAVIGATION_ARCHITECTURE.md) § Role-Based Navigation Matrices

### 4.4 Additional Principles

| Principle | Description |
|-----------|-------------|
| **Consistency across platforms** | Same URLs/deep links, same terminology, same permission gates |
| **Optimistic UI with rollback** | Real-time updates apply optimistically; server rejection reverts with toast |
| **Context preservation** | Back navigation restores scroll position and filter state |
| **Unsaved change protection** | Navigate-away confirmation for forms and active POS carts |
| **Module boundary respect** | Disabled modules disappear entirely — never grayed-out teasing |

---

## 5. Platform Matrix

### 5.1 Client Platforms

| Platform | Runtime | UI Framework | Design Language | Primary Users |
|----------|---------|--------------|-----------------|---------------|
| **Windows Desktop** | Electron 28+ | React 18 + TypeScript | Custom enterprise (shadcn/ui + Tailwind) | Cashiers, managers, warehouse, admin |
| **macOS Desktop** (Future) | Electron | React 18 + TypeScript | Same as Windows + macOS menu conventions | Managers, admin |
| **Android Mobile** | Flutter 3.x | Material Design 3 | MD3 dynamic color | Cashiers, floor sales |
| **iOS Mobile** | Flutter 3.x | Material Design 3 + HIG adaptations | MD3 with iOS navigation gestures | Cashiers, managers on floor |

Cross-reference: [DESKTOP_ELECTRON.md](../11-platforms/DESKTOP_ELECTRON.md), [MOBILE_FLUTTER.md](../11-platforms/MOBILE_FLUTTER.md), [MULTI_DEVICE_STRATEGY.md](../11-platforms/MULTI_DEVICE_STRATEGY.md)

### 5.2 Feature Parity Matrix

| Feature | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| POS — cash sale | ✓ Full | ✓ Full | Mobile uses bottom sheet cart |
| POS — credit sale | ✓ Full | ✓ Full | |
| POS — returns | ✓ Full | ✓ Partial | Complex returns → desktop recommended |
| Product management | ✓ Full | ✓ View + quick edit | Create/delete desktop-preferred |
| Inventory receive | ✓ Full | ✓ Full | Barcode scan on both |
| Inventory adjustments | ✓ Full | ✓ View only | Adjustments desktop-only Phase 1 |
| Customer management | ✓ Full | ✓ Full | |
| Debt payment recording | ✓ Full | ✓ Full | |
| Dashboard | ✓ Full | ✓ Compact | Mobile shows top 5 products only |
| Reports + export | ✓ Full | ✓ View + share | PDF generation desktop-preferred |
| Admin panel | ✓ Full | ✓ Essential | User block, device block, session revoke |
| Module management | ✓ Full | ✓ View + toggle | Dependency warnings on both |
| Command palette | ✓ Ctrl+K | — | Mobile uses search bar |
| Multi-window | ✓ Phase 2 | — | POS + inventory side-by-side |
| Offline mode | — Phase 2 | — Phase 2 | Phase 1 online-only |

### 5.3 Responsive Breakpoints (Desktop Web/Electron)

| Token | Width | Layout |
|-------|-------|--------|
| `sm` | ≥ 640px | Collapsed sidebar optional |
| `md` | ≥ 768px | Sidebar expanded |
| `lg` | ≥ 1024px | Standard desktop layout |
| `xl` | ≥ 1280px | POS split-pane optimal |
| `2xl` | ≥ 1536px | Dashboard 4-column KPI grid |

Cross-reference: [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md)

---

## 6. Theme System — Dark & Light

### 6.1 Theme Modes

| Mode | Behavior | Default For |
|------|----------|-------------|
| **Light** | Light backgrounds, dark text | New users, well-lit environments |
| **Dark** | Dark backgrounds, light text | Evening operations, OLED mobile |
| **System** | Follows OS `prefers-color-scheme` | Recommended default |

User preference stored in `user_settings.theme` and synced across devices via API.

### 6.2 Token Architecture

All colors, typography, spacing, elevation, and motion values are defined as **design tokens** — never hardcoded in components.

| Token Category | Desktop Implementation | Mobile Implementation |
|----------------|------------------------|----------------------|
| Color | CSS custom properties on `:root` / `.dark` | `ThemeExtension` + `ColorScheme.fromSeed()` |
| Typography | Tailwind font utilities | `TextTheme` MD3 scale |
| Spacing | Tailwind spacing scale (4px base) | `EdgeInsets` constants |
| Radius | `--radius: 6px` | `BorderRadius.circular(12)` for cards |
| Shadow | Tailwind shadow utilities | `BoxShadow` elevation mapping |
| Motion | `transition: 200ms ease` | `Duration(milliseconds: 200)` |

### 6.3 Semantic Color Roles

| Role | Light | Dark | Usage |
|------|-------|------|-------|
| Primary | `#2563EB` | `#3B82F6` | CTAs, active nav, links |
| Success | `#16A34A` | `#22C55E` | Completed sales, active status |
| Warning | `#D97706` | `#F59E0B` | Pending, low stock |
| Destructive | `#DC2626` | `#EF4444` | Delete, block, cancel sale |
| UZS Currency | `#2563EB` (blue) | `#60A5FA` | All UZS amounts |
| USD Currency | `#16A34A` (green) | `#4ADE80` | All USD amounts |

### 6.4 Theme Switching UX

1. User selects theme in avatar menu → Theme submenu
2. Change applies instantly (200ms cross-fade on background)
3. Preference persisted to API (debounced 500ms)
4. Charts, images, and logos re-render with theme-appropriate palette
5. No page reload required

Full specification: [THEMING_DARK_LIGHT.md](./THEMING_DARK_LIGHT.md), [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

---

## 7. Global Shell Architecture

### 7.1 Shell Overview

The **application shell** is the persistent frame surrounding all module content. It is owned by the platform core — individual modules render only within the content area.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GLOBAL TOP BAR                                                          │
│  [Company Switcher] [Branch] [Global Search] [Connection] [🔔] [User]   │
├──────────┬──────────────────────────────────────────────────────────────┤
│          │  BREADCRUMB BAR (desktop only)                                │
│  SIDE    ├──────────────────────────────────────────────────────────────┤
│  NAV     │                                                              │
│  (module │              MODULE CONTENT AREA                             │
│   tree)  │              (route outlet / navigator)                      │
│          │                                                              │
│  240px   │                                                              │
│  / 64px  │                                                              │
└──────────┴──────────────────────────────────────────────────────────────┘
```

Mobile shell replaces sidebar with bottom navigation + drawer. See [NAVIGATION_ARCHITECTURE.md](./NAVIGATION_ARCHITECTURE.md).

### 7.2 Shell Regions

| Region | Owner | Responsibility |
|--------|-------|----------------|
| **Top Bar** | Platform Core | Company/branch context, search entry, notifications, connection status, user menu |
| **Side Navigation** | Platform Core + Module Registry | Dynamic module tree filtered by permissions + enabled modules |
| **Breadcrumb Bar** | Route System | Hierarchical path with clickable ancestors |
| **Content Area** | Module | Screen-specific UI; lazy-loaded per route |
| **Toast Layer** | Platform Core | Global notification toasts (success, error, info) |
| **Modal Layer** | Platform Core | Dialogs, confirmations, command palette |
| **Connection Banner** | Platform Core | Offline/reconnecting overlay (below top bar) |

### 7.3 Shell State Management

| State | Scope | Persistence |
|-------|-------|-------------|
| Active company | Session | Restored on login |
| Active branch | Session | Per company, restored on switch |
| Sidebar collapsed | User preference | Local + API sync |
| Theme | User preference | API sync |
| Last route per module | User preference | Restored on module re-entry |
| POS draft cart | Session | Local storage + server draft (Phase 1.5) |
| Command palette history | User | Local only |

### 7.4 Authentication Shell vs. Application Shell

| Shell | Routes | Elements |
|-------|--------|----------|
| **Auth Shell** | `/login`, `/forgot-password`, `/device-blocked` | Centered card, logo, no navigation |
| **App Shell** | All authenticated routes | Full global shell |
| **Minimal Shell** | `/print/*`, `/receipt/:id` | Print-optimized, no navigation |

Cross-reference: [AUTHENTICATION.md](../07-security/AUTHENTICATION.md), [SESSION_MANAGEMENT.md](../07-security/SESSION_MANAGEMENT.md)

### 7.5 Company & Branch Context Bar

Always visible in top bar:

```
[🏢 Market O'zbekiston ▼]  [📍 Tashkent Main ▼]
```

- Company switcher: searchable dropdown; shows role badge per company
- Branch switcher: visible when user has access to multiple branches; filters data scope
- Switching company: full navigation refresh, WebSocket room change, toast confirmation
- Switching branch: content area refresh, preserves current module route where valid

Cross-reference: [MULTI_COMPANY.md](../08-modules/MULTI_COMPANY.md), [BRANCH_MANAGEMENT.md](../08-modules/BRANCH_MANAGEMENT.md)

---

## 8. Real-Time UI Patterns

### 8.1 WebSocket Integration in UI

All clients maintain a persistent WebSocket connection. UI layers subscribe to events and update without full page reload.

| Event Category | UI Response | Animation |
|----------------|-------------|-----------|
| `sale.completed` | Dashboard KPI increment; stock badge update | Subtle number pulse (300ms) |
| `inventory.updated` | Stock column refresh in product list | Cell highlight fade (500ms) |
| `debt.payment_recorded` | Customer debt chip update | — |
| `notification.created` | Bell badge increment; optional toast | Badge bounce |
| `module.disabled` | Nav item removal; redirect if on module | Toast warning |
| `session.revoked` | Force logout modal | — |
| `device.blocked` | Force logout modal with reason | — |

Cross-reference: [WEBSOCKET_EVENTS.md](../06-api/WEBSOCKET_EVENTS.md), [REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md), [CONFLICT_RESOLUTION.md](../09-realtime/CONFLICT_RESOLUTION.md)

### 8.2 Optimistic UI Rules

| Action | Optimistic Behavior | Rollback Behavior |
|--------|---------------------|-------------------|
| Add to POS cart | Line appears immediately | Remove line + error toast |
| Complete sale | Cart clears, success toast | Restore cart + error modal |
| Record debt payment | Debt balance decreases | Revert balance + error toast |
| Toggle module (admin) | Switch animates | Revert switch + error toast |

### 8.3 Connection Status Indicator

| State | Indicator | User Messaging |
|-------|-----------|----------------|
| Connected | Green dot in top bar | None |
| Reconnecting | Amber pulsing dot | Banner: "Reconnecting..." |
| Disconnected | Red dot | Banner: "Connection lost. Retrying..." + Retry button |
| Offline (Phase 2) | Red dot + offline badge | Banner: "Working offline. Changes will sync." |

Component: `ConnectionIndicator` (desktop), `ErpConnectionBanner` (mobile). See [COMPONENT_HIERARCHY.md](./COMPONENT_HIERARCHY.md).

### 8.4 Live Data Refresh Strategy

| Data Type | Strategy | User Control |
|-----------|----------|--------------|
| Dashboard KPIs | Auto-refresh on WebSocket event | Manual refresh button |
| Data tables | Row-level update on event; full refresh on filter change | Pull-to-refresh (mobile) |
| Detail pages | Re-fetch on focus; WebSocket patch for owned entity | Pull-to-refresh |
| Admin monitoring | Polling 30s + WebSocket | Auto |

### 8.5 Concurrent Edit Handling

Server-authoritative model. If User A edits a product while User B saves changes:

1. User A receives `entity.updated` WebSocket event
2. Non-blocking banner: "This record was updated by [User B]. [Refresh] [Keep editing]"
3. Refresh reloads server state; Keep editing allows overwrite on next save (server validates)

Cross-reference: [CONFLICT_RESOLUTION.md](../09-realtime/CONFLICT_RESOLUTION.md)

---

## 9. Accessibility Requirements — WCAG 2.2 AA

### 9.1 Compliance Scope

| Platform | Target | Audit Phase |
|----------|--------|-------------|
| Desktop (Electron) | WCAG 2.2 AA | Phase 1.5 formal audit |
| Mobile (Flutter) | WCAG 2.2 AA + platform HIG | Phase 1.5 formal audit |
| Admin interfaces | WCAG 2.2 AA | Phase 1.5 |

### 9.2 Mandatory Requirements

| ID | Requirement | Desktop | Mobile |
|----|-------------|---------|--------|
| A11Y-01 | Color contrast ≥ 4.5:1 (text), ≥ 3:1 (large text) | ✓ | ✓ |
| A11Y-02 | All functionality keyboard-operable | ✓ | N/A (touch) |
| A11Y-03 | Visible focus indicators (2px ring, offset) | ✓ | Focus highlight |
| A11Y-04 | Form labels programmatically associated | ✓ | ✓ |
| A11Y-05 | Images/icons have accessible names | ✓ | ✓ |
| A11Y-06 | Error messages linked via `aria-describedby` | ✓ | Semantics |
| A11Y-07 | Data tables: `<th scope>` / semantic headers | ✓ | List semantics |
| A11Y-08 | Skip navigation link | ✓ | N/A |
| A11Y-09 | `aria-live="polite"` for status updates | ✓ | `SemanticsService` |
| A11Y-10 | Touch targets ≥ 44×44pt | N/A | ✓ |
| A11Y-11 | Focus not fully obscured by sticky elements | ✓ | ✓ |
| A11Y-12 | Target size minimum 24×24px | ✓ | ✓ |
| A11Y-13 | Consistent help mechanism | ✓ | ✓ |
| A11Y-14 | Redundant entry avoidance (autocomplete) | ✓ | ✓ |

### 9.3 Screen Reader Announcements

| Event | Announcement |
|-------|--------------|
| Sale completed | "Sale completed. Total [amount] [currency]." |
| Connection lost | "Connection lost. Attempting to reconnect." |
| Module disabled | "[Module name] has been disabled by administrator." |
| Form validation | "[Field name]: [error message]" |
| Sort applied | "Table sorted by [column], [ascending/descending]" |

### 9.4 Reduced Motion

Respect `prefers-reduced-motion`:
- Disable chart animations
- Instant theme transitions
- No pulse animations on KPI updates
- Page transitions: fade only (no slide)

Full specification: [ACCESSIBILITY.md](./ACCESSIBILITY.md)

---

## 10. Figma Handoff Guidelines

### 10.1 Figma File Structure

```
ERP Design System (Figma)
├── 📁 Cover & Changelog
├── 📁 Foundations
│   ├── Colors (light + dark variables)
│   ├── Typography
│   ├── Spacing & Grid
│   ├── Icons (Lucide + Material mapping)
│   ├── Elevation & Shadows
│   └── Motion Specimens
├── 📁 Components
│   ├── Atoms
│   ├── Molecules
│   ├── Organisms
│   └── Templates
├── 📁 Desktop Screens
│   ├── Shell
│   ├── Dashboard
│   ├── Sales (POS)
│   ├── Products
│   ├── Inventory
│   ├── Customers
│   ├── Reports
│   ├── Settings
│   └── Admin
├── 📁 Mobile Screens
│   └── (mirror desktop module structure)
├── 📁 Flows
│   ├── POS Cash Sale
│   ├── Credit Sale + Debt
│   ├── Stock Receive
│   └── Admin User Block
└── 📁 Prototypes
    ├── Desktop Interactive
    └── Mobile Interactive
```

### 10.2 Naming Conventions

| Asset Type | Convention | Example |
|------------|------------|---------|
| Component | `CMP/[Tier]/[Name]/[Variant]` | `CMP/Molecule/DataTable/Compact` |
| Screen | `SCR/[ID]/[Name]/[Platform]` | `SCR-012/POS-NewSale/Desktop` |
| Flow | `FLOW/[Name]/[Step]` | `FLOW/CashSale/03-CompletePayment` |
| Token | `token/[category]/[name]` | `token/color/primary` |

Screen IDs must match [SCREEN_HIERARCHY.md](./SCREEN_HIERARCHY.md).

### 10.3 Component Spec Annotations

Every component frame must include:

1. **Component ID** (from [COMPONENT_HIERARCHY.md](./COMPONENT_HIERARCHY.md))
2. **States**: default, hover, focus, active, disabled, loading, error
3. **Responsive variants**: compact / comfortable where applicable
4. **Accessibility**: focus order number, aria role annotation
5. **Token references**: no raw hex in component specs — link to variable
6. **Platform notes**: desktop-only, mobile-only, or shared

### 10.4 Developer Handoff Checklist

| Item | Required |
|------|----------|
| Auto-layout with constraints | ✓ |
| Figma variables for all colors | ✓ |
| Text styles linked to type scale | ✓ |
| Export settings for icons (SVG, 24px) | ✓ |
| Redlines for spacing on key screens | ✓ |
| Interactive prototype for primary flows | ✓ |
| Dark mode variant for every screen | ✓ |
| Uzbek + English text on all user-facing strings | ✓ |
| Permission badge on gated screens | ✓ |
| SCR-ID in frame name | ✓ |

### 10.5 Design QA Gate

Before handoff to development:

- [ ] All screens have SCR-ID
- [ ] Light and dark variants complete
- [ ] Empty, loading, and error states designed
- [ ] Mobile adaptation for all Phase 1 screens
- [ ] Stakeholder sign-off recorded in Figma changelog
- [ ] Cross-reference to module doc verified

---

## 11. Implementation Guidance

### 11.1 React / Electron Team

#### Project Structure (UI Layer)

```
apps/desktop/src/
├── shell/           # Global shell components
├── modules/         # Feature modules (mirror backend modules)
│   ├── sales/
│   ├── products/
│   └── ...
├── shared/
│   ├── components/  # Shared organisms
│   ├── hooks/
│   └── utils/
├── design-system/   # Token wrappers, theme provider
└── routes/          # Route definitions (see NAVIGATION_ARCHITECTURE)
```

#### Key Libraries

| Concern | Library |
|---------|---------|
| UI primitives | shadcn/ui (Radix) |
| Styling | Tailwind CSS 3.x |
| Routing | React Router 6 |
| State | Zustand (shell) + TanStack Query (server) |
| Tables | TanStack Table |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Charts | Recharts |
| Command palette | cmdk |
| i18n | i18next |

#### Implementation Rules

1. **Route guards** — Every route declares required permissions; unauthorized → redirect to default landing
2. **Module gates** — Navigation and routes check `enabledModules` from session context
3. **Token-only styling** — No hardcoded colors; use `bg-background`, `text-foreground`, etc.
4. **Lazy loading** — Module routes code-split per module
5. **Error boundaries** — One per module; shell survives module crash
6. **WebSocket hook** — `useRealtimeSubscription(event, handler)` shared hook
7. **Screen IDs** — `data-screen-id="SCR-012"` on root element for QA automation

Cross-reference: [DESKTOP_ELECTRON.md](../11-platforms/DESKTOP_ELECTRON.md), [CODING_STANDARDS.md](../01-governance/CODING_STANDARDS.md)

### 11.2 Flutter Team

#### Project Structure (UI Layer)

```
apps/mobile/lib/
├── shell/           # ErpApp, bottom nav, drawer
├── modules/         # Feature modules
├── shared/
│   ├── widgets/     # Shared components
│   └── theme/       # Theme extensions
└── routes/        # GoRouter configuration
```

#### Key Packages

| Concern | Package |
|---------|---------|
| Routing | go_router |
| State | flutter_riverpod |
| HTTP | dio |
| WebSocket | socket_io_client |
| i18n | flutter_localizations + intl |
| Barcode | mobile_scanner |

#### Implementation Rules

1. **Widget naming** — `Erp` prefix for all custom widgets (e.g., `ErpStatCard`)
2. **MD3 compliance** — Use Material 3 components; custom only when MD3 insufficient
3. **Theme extensions** — Currency colors, status colors via `ThemeExtension`
4. **Accessibility** — `Semantics` wrapper on all interactive custom widgets
5. **Screen IDs** — `Key('SCR-012')` on screen root `Scaffold`
6. **Platform adaptations** — `Platform.isIOS` for back gesture, safe area padding

Cross-reference: [MOBILE_FLUTTER.md](../11-platforms/MOBILE_FLUTTER.md)

### 11.3 Shared Contract Between Teams

| Contract | Format | Owner |
|----------|--------|-------|
| Screen IDs | SCR-NNN | Product Design |
| Route paths | `/module/action/:id` | This document + NAVIGATION_ARCHITECTURE |
| Permission strings | `module.action` | PERMISSIONS_MODEL |
| WebSocket events | `entity.verb` | WEBSOCKET_EVENTS |
| API response shapes | OpenAPI / shared types | API team |
| Design tokens | JSON export from Figma | Design team |

### 11.4 QA Automation Hooks

| Hook | Purpose |
|------|---------|
| `data-screen-id` | E2E test target identification |
| `data-testid` | Component-level test selectors |
| `data-permission` | Verify permission-gated elements |
| `data-module` | Module boundary testing |

---

## 12. Module UI Integration Contract

Each business module contributes to the UI through a standard registration interface.

| Registration | Description |
|--------------|-------------|
| `navigationItems` | Sidebar/drawer entries with icon, label, route, permissions, module code |
| `routes` | Route definitions with lazy component, permission guard, SCR-ID |
| `commandPaletteActions` | Searchable quick actions |
| `dashboardWidgets` | Optional widgets for dashboard composition |
| `notificationTypes` | Icon + color mapping for notification rendering |
| `settingsSections` | Settings page contributions |

When a module is disabled ([MODULE_MANAGEMENT.md](../08-modules/MODULE_MANAGEMENT.md)):
- All `navigationItems` removed from shell
- Routes return redirect to safe landing
- Dashboard widgets hidden
- Command palette actions excluded
- WebSocket handlers for module events unsubscribed

---

## 13. Localization & Content

| Language | Phase | Scope |
|----------|-------|-------|
| Uzbek (Latin) | 1 | All user-facing strings |
| Russian | 1.5 | All user-facing strings |
| English | 1 | Admin panel, developer tools, API errors |

- Number formatting: space-separated thousands for UZS (`1 250 000`)
- Date format: `DD.MM.YYYY` (Uzbekistan convention)
- Phone format: `+998 XX XXX XX XX`

---

## 14. Performance UX Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First contentful paint (desktop) | < 1.5s | Cold start |
| Route transition | < 200ms | Client-side navigation |
| POS barcode-to-cart | < 100ms | Local + API |
| Data table render (1000 rows) | < 500ms | Virtualized |
| WebSocket event to UI update | < 50ms | Client-side |
| Theme switch | < 200ms | No layout shift |

Cross-reference: [NON_FUNCTIONAL_REQUIREMENTS.md](../01-governance/NON_FUNCTIONAL_REQUIREMENTS.md)

---

## 15. Document Index — UI/UX Suite

### 15.1 Blueprint Documents (v2.0)

| Document | Description |
|----------|-------------|
| **UI_UX_MASTER_BLUEPRINT.md** | This document — master reference |
| [NAVIGATION_ARCHITECTURE.md](./NAVIGATION_ARCHITECTURE.md) | Complete navigation system |
| [SCREEN_HIERARCHY.md](./SCREEN_HIERARCHY.md) | Screen tree with SCR-IDs |
| [COMPONENT_HIERARCHY.md](./COMPONENT_HIERARCHY.md) | Atomic design component tree |

### 15.2 Foundation Documents (v1.0)

| Document | Description |
|----------|-------------|
| [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) | Core UX principles |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Colors, typography, spacing tokens |
| [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md) | IA overview |
| [THEMING_DARK_LIGHT.md](./THEMING_DARK_LIGHT.md) | Theme implementation |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | WCAG requirements |
| [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) | Breakpoints and adaptations |

### 15.3 Platform Specifications

| Document | Description |
|----------|-------------|
| [DESKTOP_UI_SPEC.md](./DESKTOP_UI_SPEC.md) | Desktop screen specs |
| [MOBILE_UI_SPEC.md](./MOBILE_UI_SPEC.md) | Mobile screen specs |
| [NAVIGATION_PATTERNS.md](./NAVIGATION_PATTERNS.md) | Navigation pattern summary |
| [USER_FLOWS.md](./USER_FLOWS.md) | Key interaction flows |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | Component catalog |

### 15.4 Cross-Domain References

| Domain | Key Documents |
|--------|---------------|
| Security | [RBAC_DESIGN.md](../07-security/RBAC_DESIGN.md), [PERMISSIONS_MODEL.md](../07-security/PERMISSIONS_MODEL.md), [AUTHENTICATION.md](../07-security/AUTHENTICATION.md) |
| Modules | [MODULE_MANAGEMENT.md](../08-modules/MODULE_MANAGEMENT.md), [ADMIN_PANEL.md](../08-modules/ADMIN_PANEL.md), [SALES.md](../08-modules/SALES.md) |
| Real-Time | [REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md), [WEBSOCKET_EVENTS.md](../06-api/WEBSOCKET_EVENTS.md) |
| Platforms | [DESKTOP_ELECTRON.md](../11-platforms/DESKTOP_ELECTRON.md), [MOBILE_FLUTTER.md](../11-platforms/MOBILE_FLUTTER.md) |

---

## 16. Governance & Change Control

| Change Type | Approval Required | Documents to Update |
|-------------|-------------------|---------------------|
| New screen | Product Owner + Design Lead | SCREEN_HIERARCHY, NAVIGATION_ARCHITECTURE, module doc |
| New component | Design Lead | COMPONENT_HIERARCHY, COMPONENT_LIBRARY, Figma |
| Navigation change | Product Owner | NAVIGATION_ARCHITECTURE, INFORMATION_ARCHITECTURE |
| Token change | Design Lead | DESIGN_SYSTEM, THEMING_DARK_LIGHT, Figma |
| Accessibility exception | Security + Design Lead | ACCESSIBILITY, this document |

---

## 17. Approval Record

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | — | — | Pending |
| Design Lead | — | — | Pending |
| Desktop Tech Lead | — | — | Pending |
| Mobile Tech Lead | — | — | Pending |
| QA Lead | — | — | Pending |

---

*This blueprint is the single authoritative reference for ERP UI/UX. All implementation teams must align with v2.0.0 before Phase 1 development begins.*
