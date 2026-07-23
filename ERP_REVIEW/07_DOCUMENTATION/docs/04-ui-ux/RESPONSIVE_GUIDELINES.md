# Responsive Guidelines

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |
| Figma Frames | Desktop 1280×800, Tablet 768×1024, Mobile 390×844 |

---

## Purpose

This document defines breakpoints, layout rules, component behavior changes, touch targets, and orientation handling across all ERP platforms. Use alongside [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) and [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) when designing responsive Figma frames.

**Design philosophy:** Desktop optimizes for data density and keyboard power users. Mobile optimizes for touch, essential workflows, and glanceable information. Tablet bridges both with adaptive layouts.

---

## 1. Breakpoint System

### 1.1 Desktop Web (Electron) Breakpoints

| Token | Min Width | Max Width | Name | Primary Use |
|-------|-----------|-----------|------|-------------|
| `bp/xs` | 0px | 639px | Extra small | Unsupported — show minimum width warning |
| `bp/sm` | 640px | 767px | Small | Collapsed chrome, single column |
| `bp/md` | 768px | 1023px | Medium | Tablet / narrow desktop |
| `bp/lg` | 1024px | 1279px | Large | Minimum supported desktop |
| `bp/xl` | 1280px | 1535px | Extra large | Optimal ERP layout |
| `bp/2xl` | 1536px | ∞ | 2X large | Wide monitors, side panels |

**Figma frames to maintain:** 1024, 1280, 1440, 1920 (widths)

### 1.2 Mobile (Flutter) Breakpoints

| Token | Min Width | Max Width | Name | Device Class |
|-------|-----------|-----------|------|----------------|
| `bp/mobile/sm` | 320px | 359px | Compact phone | iPhone SE, small Android |
| `bp/mobile/md` | 360px | 413px | Standard phone | Most phones |
| `bp/mobile/lg` | 414px | 599px | Large phone | iPhone Plus/Max |
| `bp/mobile/xl` | 600px | 904px | Tablet portrait | iPad Mini, small tablets |
| `bp/mobile/2xl` | 905px | ∞ | Tablet landscape / fold | iPad Pro, foldables |

**Figma frames to maintain:** 360×800 (Android), 390×844 (iPhone 14), 768×1024 (iPad)

### 1.3 Platform Minimum Widths

| Platform | Minimum Width | Behavior Below Minimum |
|----------|---------------|------------------------|
| Windows Desktop (Electron) | 1024px | Horizontal scroll warning banner; layout does not reflow below 1024 |
| Web (future) | 1024px | Same as desktop |
| Android / iOS Phone | 320px | Full responsive reflow |
| Android / iOS Tablet | 600px | Hybrid layout activation |

---

## 2. Layout Shell per Breakpoint

### 2.1 Desktop Layout Matrix

| Region | lg (1024–1279) | xl (1280–1535) | 2xl (1536+) |
|--------|----------------|----------------|-------------|
| Sidebar | Collapsed 64px (icons) | Expanded 240px | Expanded 240px |
| Top bar | 56px, full width | 56px | 56px |
| Content padding | 24px | 24px | 32px |
| Content max-width | 100% | 1280px content area | 1440px centered |
| Right panel (optional) | Hidden or overlay sheet | 320–480px inline | 480–640px inline |
| Page header | Title + actions inline | Same | Same + more toolbar space |

### 2.2 Desktop Shell Anatomy by Breakpoint

```
lg (1024px) — Collapsed Sidebar
┌────┬──────────────────────────────────────────┐
│ 64 │  Top Bar (56px)                          │
│ px ├──────────────────────────────────────────┤
│    │  Content (padding 24px)                  │
│ S  │  ┌────────────────────────────────────┐  │
│ i  │  │ Page Title          [Actions]      │  │
│ d  │  │ ─────────────────────────────────  │  │
│ e  │  │ Main content (full width)          │  │
│ b  │  └────────────────────────────────────┘  │
└────┴──────────────────────────────────────────┘

xl (1280px) — Expanded Sidebar
┌──────────┬────────────────────────────────────┐
│ 240px    │  Top Bar                           │
│ Sidebar  ├────────────────────────────────────┤
│          │  Content                           │
│ Logo     │  ┌─────────────┬─────────────────┐ │
│ Nav      │  │ Main (8 col)│ Panel (4 col)   │ │
│ Groups   │  │             │ optional        │ │
│ User     │  └─────────────┴─────────────────┘ │
└──────────┴────────────────────────────────────┘
```

### 2.3 Mobile Layout Matrix

| Region | Phone (<600px) | Tablet (600–904px) | Tablet Landscape (905px+) |
|--------|----------------|--------------------|-----------------------------|
| App bar | 56px, back + title + actions | 56px | 56px |
| Bottom nav | 56px + safe area, 5 tabs | 56px or hidden if sidebar | Hidden — use sidebar rail |
| Content padding | 16px | 24px | 24px |
| FAB | 16px from bottom-right above nav | Same | 24px from edge, no bottom nav |
| Safe areas | iOS notch + home indicator | Same | Reduced bottom inset |

### 2.4 Mobile Shell Anatomy

```
Phone Portrait (390px)
┌─────────────────────────────────┐
│ App Bar (56px)                  │
├─────────────────────────────────┤
│                                 │
│  Content (padding 16px)         │
│  ┌───────────────────────────┐  │
│  │ Stat cards (stacked)      │  │
│  │ List tiles                │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                          [FAB]  │
├─────────────────────────────────┤
│ Bottom Nav (56px + safe area)   │
└─────────────────────────────────┘
```

---

## 3. Grid & Column Rules per Breakpoint

### 3.1 Dashboard Grid

| Breakpoint | Stat Card Columns | Chart Width | Table |
|------------|-------------------|-------------|-------|
| Mobile phone | 1 (stacked) | 100% | List tiles |
| Mobile tablet | 2 | 100% | List tiles or scroll table |
| lg desktop | 2 | 100% | Full table, h-scroll |
| xl desktop | 4 | 50% (2-col chart grid) | Full table |
| 2xl desktop | 4 | 33% (3-col chart grid) | Full table + side panel |

### 3.2 Form Layout

| Breakpoint | Column Layout | Field Width |
|------------|---------------|-------------|
| Mobile | Single column | 100% |
| Tablet portrait | Single column | max 480px centered optional |
| Tablet landscape | Two column for short fields | 50% pairs |
| Desktop lg | Two column | 50% pairs, 100% for textareas |
| Desktop xl+ | Two column + sidebar summary | Main 8 col, summary 4 col |

### 3.3 POS Layout

| Breakpoint | Product Area | Cart Area |
|------------|--------------|-----------|
| 2xl (1536+) | 60% left grid | 40% right fixed panel |
| xl (1280–1535) | 55% | 45% right panel |
| lg (1024–1279) | 100% top | Cart as right sheet (overlay) |
| Tablet | 100% product grid | Bottom sheet cart (half snap) |
| Mobile | Full-screen product search | Bottom sheet cart (full snap) |

```
Desktop xl+ POS
┌────────────────────────────┬──────────────────┐
│ Product search + grid      │ Cart (fixed)     │
│ Categories │ Products      │ Line items       │
│            │               │ Totals           │
│            │               │ [Pay]            │
└────────────────────────────┴──────────────────┘

Mobile POS
┌─────────────────────────────────┐
│ Search + scan                   │
│ Product grid (2 columns)        │
│                                 │
├─────────────────────────────────┤
│ ▲ Cart peek (25%) — tap expand  │
│ 3 items · 125 000 so'm  [Pay]   │
└─────────────────────────────────┘
```

---

## 4. Component Behavior Changes

### 4.1 Navigation Components

| Component | lg (1024) | xl (1280+) | Mobile |
|-----------|-----------|------------|--------|
| CMP-036 Sidebar | Collapsed icons only | Expanded with labels | Hidden |
| CMP-038 Bottom Nav | Hidden | Hidden | Visible (5 tabs) |
| CMP-035 Breadcrumbs | Truncated middle items | Full path | Hidden → back button |
| CMP-041 Command Palette | Available (Ctrl+K) | Available | Hidden → search in App Bar |
| CMP-037 Top Bar | Hamburger to expand sidebar | Full search + breadcrumbs | Back + title + overflow |

### 4.2 Data Display Components

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| CMP-017 Data Table | Full table, dense mode | H-scroll, priority columns | CMP-021 List Tiles |
| CMP-018 Pagination | Full page numbers | Compact | Prev/Next + infinite scroll option |
| CMP-020 Stat Card | 4-column grid | 2-column grid | 1-column stacked |
| CMP-045 Chart | Full legend, tooltips on hover | Simplified legend | Tap for tooltip, swipe series |
| CMP-022 Empty State | Centered 400px max | Same | Full width, smaller icon |

**Table → List Tile conversion rules (mobile):**
- Column 1 (primary) → List Tile title
- Column 2 (secondary) → List Tile subtitle
- Status column → Trailing badge
- Amount column → Trailing text with currency color
- Actions → Swipe actions or overflow menu
- Selection → Long-press multi-select mode

### 4.3 Form Components

| Component | Desktop | Mobile |
|-----------|---------|--------|
| CMP-004 Text Input | 36px height | 48px height, 16px font |
| CMP-006 Select | Dropdown panel | Full-screen picker sheet |
| CMP-007 Combobox | Inline dropdown | Full-screen search overlay |
| CMP-011 Date Picker | Calendar popover | OS native or full-screen calendar |
| CMP-012 Date Range Picker | Dual calendar | Preset list → calendar sheet |
| CMP-016 Form Field | Inline layout in settings (xl+) | Always vertical stack |
| CMP-001 Button | Inline footer right-aligned | Full-width primary, stacked |
| CMP-015 File Upload | Drag-and-drop zone | Camera / gallery / files picker |

### 4.4 Overlay Components

| Component | Desktop | Mobile |
|-----------|---------|--------|
| CMP-023 Dialog md | Centered 560px modal | Bottom sheet 90% or full-screen |
| CMP-023 Dialog sm | Centered 400px | Centered card (confirm only) |
| CMP-024 Alert Dialog | Centered modal | Bottom sheet with stacked buttons |
| CMP-025 Sheet | Right panel 320–800px | Bottom sheet with snap points |
| CMP-026 Popover | Floating anchored | Bottom sheet |
| CMP-027 Tooltip | Hover + focus | Not used — visible labels instead |
| CMP-028 Toast | Bottom-right | Bottom-center above nav |
| CMP-039 Dropdown Menu | Dropdown below trigger | Bottom action sheet |

### 4.5 ERP-Specific Components

| Component | Desktop | Mobile |
|-----------|---------|--------|
| CMP-051 Product Picker | Combobox + table results | Full-screen search + barcode FAB |
| CMP-052 Customer Picker | Phone autocomplete dropdown | Tel keyboard + full-screen results |
| CMP-050 Currency Display | Inline in table cells | Trailing in list tiles |
| POS Cart | Fixed right panel | Bottom sheet (peek/half/full) |
| Barcode Scanner | USB scanner input field | Camera scanner full-screen |

---

## 5. Touch Targets & Pointer Interaction

### 5.1 Minimum Target Sizes

| Platform | Standard | Dense Exception | Notes |
|----------|----------|-----------------|-------|
| iOS (mobile) | 44×44px | 38×38px with 3px spacing | Apple HIG |
| Android (mobile) | 48×48dp | 40×40dp with 8px spacing | Material 3 |
| Desktop (mouse) | 36×36px | 28×28px table icon buttons | Precision pointer |
| Desktop (touch screen) | 44×44px | — | Hybrid laptops |

### 5.2 Spacing Between Targets

| Context | Minimum Gap |
|---------|-------------|
| Mobile button row | 8px |
| Mobile list actions | 0px (full-width rows) |
| Desktop toolbar icons | 4px |
| Table action icons | 0px (40px row height provides separation) |
| Bottom nav items | Equal width, no gap |

### 5.3 Touch Gesture Map (Mobile)

| Gesture | Action |
|---------|--------|
| Tap | Primary action, selection |
| Long press | Context menu / multi-select start |
| Swipe left (list tile) | Delete or archive action |
| Swipe right (list tile) | Quick action (call, edit) |
| Pull down | Refresh list |
| Pinch | Chart zoom (reports only) |
| Drag (sheet handle) | Resize bottom sheet snap |

### 5.4 Desktop Pointer Map

| Input | Action |
|-------|--------|
| Click | Primary action |
| Right-click | Context menu (CMP-040) |
| Hover | Tooltip, row highlight |
| Scroll | Table / content scroll |
| Drag | Column resize, reorder (admin tables) |
| Keyboard | See ACCESSIBILITY.md shortcuts |

---

## 6. Orientation Handling

### 6.1 Mobile Phone

| Orientation | Layout Changes |
|-------------|----------------|
| **Portrait** (default) | Standard shell: app bar + content + bottom nav |
| **Landscape** | Bottom nav hidden; app bar compact (smaller title); content uses full height; POS shows product grid 3–4 columns; split views not used on phones |

**Rules:**
- Lock orientation to portrait for: barcode scanner, signature capture, camera flows
- Allow rotation for: POS product grid, dashboard charts, report viewing
- Keyboard open: resize content (do not overlay bottom nav on Android); scroll focused input into view

### 6.2 Tablet

| Orientation | Layout Changes |
|-------------|----------------|
| **Portrait** | Mobile-like with 2-column stat grid; optional bottom nav |
| **Landscape** (≥905px width) | Desktop-like: sidebar rail (80px) or full sidebar (240px); no bottom nav; POS split view enabled (60/40) |

**Breakpoint trigger:** When shortest side ≥600px AND longest side ≥905px, activate tablet-landscape / desktop-hybrid layout.

### 6.3 Desktop

| Orientation | Layout Changes |
|-------------|----------------|
| Landscape (default) | Standard layout per width breakpoint |
| Portrait (rotated monitor) | Same rules as width breakpoint; sidebar auto-collapses at <1280 effective width |

Desktop does not change layout based on orientation — width breakpoint rules apply exclusively.

---

## 7. Content Priority & Progressive Disclosure

### 7.1 Table Column Priority (Responsive Hiding)

When horizontal space is insufficient, hide columns in this order (last hidden = lowest priority):

| Priority | Column Type | Example |
|----------|-------------|---------|
| P1 (always show) | Primary identifier | Name, order # |
| P2 (always show) | Key metric | Total, status |
| P3 (hide at lg) | Secondary date | Created at |
| P4 (hide at lg) | Assigned user | Cashier |
| P5 (hide at md) | Reference codes | SKU, barcode |
| P6 (hide at md) | Notes / description | Comment |
| P7 (detail only) | Audit fields | Updated by, IP |

**Column chooser:** Always available in table toolbar so users can restore hidden columns.

### 7.2 Mobile Feature Availability

| Feature | Mobile | Desktop |
|---------|--------|---------|
| POS sale | Full | Full |
| View dashboard | Full | Full |
| View products/customers | Full | Full |
| Create/edit product | Basic fields | All fields |
| Bulk import/export | View status only | Full |
| Permission matrix | View only | Full edit |
| Audit log diff viewer | Summary | Full diff |
| Report builder | Preset reports | Custom builder |
| Module management | View status | Full toggle |
| Multi-tab workflows | Single task focus | Multi-window |

### 7.3 Action Priority on Mobile

Show maximum **3 primary actions** per screen. Additional actions in overflow (···) menu.

| Screen | Primary Actions | Overflow |
|--------|-----------------|----------|
| Product list | Add, Scan, Search | Import, Export, Filter |
| Sale detail | Print, Refund | Edit, Void, Share |
| Customer detail | Call, New Sale | Edit, Delete, History |

---

## 8. Typography & Density Scaling

### 8.1 Font Size Adjustments

| Breakpoint | Body Size | Table/List Size | Adjustment |
|------------|-----------|-----------------|------------|
| Desktop xl+ | 14px | 13px dense / 14px comfortable | None |
| Desktop lg | 14px | 13px dense | None |
| Tablet | 14px | 14px | None |
| Mobile | 16px (body-large) | 14px (list title) | +2px body for readability |

**Rule:** Never go below 12px on any platform. Mobile body text uses 16px minimum to prevent iOS auto-zoom on input focus.

### 8.2 Density Mode Defaults

| Platform | Default Density | User Override |
|----------|-----------------|---------------|
| Desktop ERP tables | Dense (40px rows) | Comfortable toggle in table toolbar |
| Desktop forms | Comfortable | — |
| Mobile lists | Comfortable (48px min) | — |
| POS desktop | Comfortable | — |
| POS mobile | Comfortable | — |

---

## 9. Image & Media Responsiveness

| Asset | Desktop | Mobile |
|-------|---------|--------|
| Product thumbnail (list) | 40×40px | 48×48px |
| Product thumbnail (grid) | 80×80px | 100% width, 1:1 aspect |
| Product detail image | 320×320px | Full width, max 400px |
| Avatar (list) | 32px | 40px |
| Empty state illustration | 120×120px | 96×96px |
| Company logo (sidebar) | 32px height | 28px in app bar |

**Format:** WebP preferred, PNG fallback. Serve 1x and 2x for retina. Lazy-load images below fold in product grids.

---

## 10. Safe Areas & System UI

### 10.1 iOS Safe Area Insets

| Area | Handling |
|------|----------|
| Top notch / Dynamic Island | App bar extends into safe area; content below |
| Bottom home indicator | Bottom nav padding = 56px + safe area inset |
| Landscape notch | Horizontal safe area padding on content |

### 10.2 Android System UI

| Area | Handling |
|------|----------|
| Status bar | Transparent with theme-colored icons |
| Navigation bar (gesture) | Bottom padding on nav and FAB |
| Navigation bar (3-button) | Additional bottom inset |
| Foldables | Dual-pane when unfolded ≥905px; hinge-aware margin 24px |

### 10.3 Desktop (Electron)

| Area | Handling |
|------|----------|
| Title bar | Custom title bar 32px (Windows 11) or native |
| Resize | Minimum window 1024×640 |
| DPI scaling | Support 100%, 125%, 150%, 200% — use relative tokens |

---

## 11. Responsive Pattern Recipes

### 11.1 Standard List Page

| Breakpoint | Pattern |
|------------|---------|
| xl+ | Sidebar + top bar + page header + toolbar + data table + pagination |
| lg | Collapsed sidebar + same as above |
| md | Hamburger sidebar overlay + table h-scroll |
| mobile | App bar + search + filter chips + list tiles + FAB + bottom nav |

### 11.2 Standard Detail Page

| Breakpoint | Pattern |
|------------|---------|
| xl+ | Sidebar + top bar + breadcrumb + tabs + 2-column form |
| lg | Collapsed sidebar + tabs + single column form |
| mobile | App bar (back) + title + tabs (scrollable) + stacked sections + sticky footer actions |

### 11.3 Dashboard

| Breakpoint | Pattern |
|------------|---------|
| xl+ | 4 KPI cards → 2-column charts → recent activity table |
| lg | 2×2 KPI cards → full-width charts |
| mobile | Stacked KPI → swipeable chart carousel → activity list tiles |

### 11.4 Modal Form (Create/Edit)

| Breakpoint | Pattern |
|------------|---------|
| xl+ | Centered dialog lg (720px) |
| lg | Centered dialog md (560px) |
| md | Centered dialog md (560px) or full-width with 24px margin |
| mobile | Full-screen page or bottom sheet full snap with sticky footer |

---

## 12. Testing Matrix

Designers and QA should verify layouts at these specific viewport sizes:

| # | Width | Height | Platform | Priority |
|---|-------|--------|----------|----------|
| 1 | 1024 | 768 | Desktop (min) | P0 |
| 2 | 1280 | 800 | Desktop (optimal) | P0 |
| 3 | 1440 | 900 | Desktop (wide) | P1 |
| 4 | 1920 | 1080 | Desktop (full HD) | P1 |
| 5 | 360 | 800 | Android phone | P0 |
| 6 | 390 | 844 | iPhone 14 | P0 |
| 7 | 430 | 932 | iPhone 14 Pro Max | P1 |
| 8 | 768 | 1024 | iPad portrait | P1 |
| 9 | 1024 | 768 | iPad landscape | P1 |
| 10 | 320 | 568 | Minimum phone | P2 |

**Orientation tests:** #5–9 in both portrait and landscape.

**Theme tests:** All viewports in Light and Dark mode.

---

## 13. Figma Responsive Workflow

### 13.1 Frame Organization

```
Pages/
├── 🖥 Desktop/
│   ├── 1024 — List Page
│   ├── 1280 — Dashboard
│   ├── 1280 — POS
│   └── 1440 — Admin Detail
├── 📱 Mobile/
│   ├── 360 — Dashboard
│   ├── 390 — POS
│   └── 390 — Product List
└── 📱 Tablet/
    ├── 768 — Dashboard (portrait)
    └── 1024 — POS (landscape)
```

### 13.2 Component Variant Properties for Responsive

| Property | Values |
|----------|--------|
| `platform` | desktop / mobile |
| `breakpoint` | sm / md / lg / xl / 2xl |
| `density` | dense / comfortable |
| `orientation` | portrait / landscape |

### 13.3 Prototype Connections

- Desktop sidebar collapse: 240px ↔ 64px interactive toggle
- Mobile bottom sheet: peek ↔ half ↔ full drag states
- Table → list: create separate frames linked as responsive variants

---

## 14. Decision Flowchart

```
Start: What platform?
│
├─ Desktop (≥1024px)
│   ├─ Data-heavy page? → Data Table (dense)
│   ├─ Form? → Dialog md/lg or inline 2-column
│   ├─ Quick filter? → Popover or right Sheet sm
│   └─ POS? → Split panel if ≥1280, else cart Sheet
│
├─ Tablet (600–1023px)
│   ├─ Landscape ≥905? → Hybrid (sidebar rail + table h-scroll)
│   └─ Portrait → Mobile patterns with 2-col grid
│
└─ Mobile (<600px)
    ├─ List data? → List Tiles
    ├─ Form? → Full-screen or bottom sheet
    ├─ Action? → Full-width button or FAB
    └─ Detail? → Stacked sections + back navigation
```

---

## Related Documents

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — Tokens, grid, spacing
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) — Component specs (CMP-XXX)
- [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) — Legacy summary (superseded by this document)
- [DESKTOP_UI_SPEC.md](./DESKTOP_UI_SPEC.md) — Desktop screen templates
- [MOBILE_UI_SPEC.md](./MOBILE_UI_SPEC.md) — Mobile screen templates
- [NAVIGATION_PATTERNS.md](./NAVIGATION_PATTERNS.md) — Navigation architecture
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) — Keyboard and screen reader requirements
