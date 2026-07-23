# Wireframe Implementation Guide

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Figma & Dev Handoff |
| Last Updated | 2026-06-17 |
| Audience | Figma Designers, React/Electron Devs, Flutter Devs, QA |
| Parent | [UI_UX_MASTER_BLUEPRINT.md](./UI_UX_MASTER_BLUEPRINT.md) |

---

## 1. Purpose

This guide translates design tokens and screen specifications into **pixel-accurate frames** in Figma and equivalent layout constraints in React (Tailwind) and Flutter. Follow this document so all teams produce visually identical ERP surfaces.

**Canonical screen IDs**: [SCREEN_HIERARCHY.md](./SCREEN_HIERARCHY.md)  
**Canonical tokens**: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

---

## 2. Figma Project Setup

### 2.1 File Structure

| Figma File | Contents |
|------------|----------|
| `ERP-Tokens-v2` | Color, type, spacing, radius, shadow variables only |
| `ERP-Components-v2` | CMP-001–CMP-052 component set |
| `ERP-Templates-v2` | App Shell, Auth Shell, POS Shell, List, Detail |
| `ERP-Screens-v2` | All SCR frames by domain page |

### 2.2 Variable Collections

Link tokens from `ERP-Tokens-v2` to all component and screen files.

| Collection | Modes |
|------------|-------|
| `Theme` | Light, Dark |
| `Platform` | Desktop, Mobile (optional density) |
| `Currency` | UZS-accent, USD-accent (for preview only) |

### 2.3 Frame Naming (mandatory)

```
{Domain} / SCR-{NNN} {Screen Name} / {Breakpoint} / {State}

Examples:
  Sales / SCR-020 POS / Desktop XL 1280 / Cart Populated
  Admin / SCR-131 Users / Mobile 390 / Block Confirm Modal
  Auth / SCR-000 Login / Desktop 1280 / Error Credentials
```

### 2.4 Base Frame Dimensions

| Token | Width × Height | Columns | Margin | Gutter |
|-------|----------------|---------|--------|--------|
| Desktop XL | 1536 × 900 | 12 | 32px | 24px |
| Desktop LG | 1280 × 800 | 12 | 24px | 24px |
| Desktop MD | 1024 × 768 | 12 | 16px | 16px |
| Tablet | 768 × 1024 | 8 | 16px | 16px |
| Mobile | 390 × 844 | 4 | 16px | 12px |

**Safe areas (mobile)**: Top 47px (status bar), bottom 34px (home indicator) — use Figma iOS frame preset.

---

## 3. Layout Grid Implementation

### 3.1 Desktop App Shell (authenticated)

```
Viewport
├── TopBar: fixed, h=56px, z=50, full width
├── Body: flex row, h=calc(100vh - 56px)
│   ├── Sidebar: w=240px (expanded) | w=64px (collapsed), z=40
│   └── Main: flex-1, min-w=0, overflow-auto
│       ├── BreadcrumbRow: h=40px, px=24px
│       ├── PageHeader: min-h=64px, px=24px, py=16px
│       ├── FilterBar (optional): min-h=48px, px=24px, mb=16px
│       └── Content: px=24px, pb=24px
```

| Element | Pixel Spec |
|---------|------------|
| TopBar height | 56px fixed |
| TopBar padding horizontal | 16px |
| TopBar item gap | 12px |
| Sidebar expanded | 240px |
| Sidebar collapsed | 64px |
| Sidebar item height | 40px |
| Sidebar item padding | 8px 12px |
| Sidebar icon size | 20px |
| Breadcrumb font | 12px / 400 / muted |
| Page title font | 24px / 600 / foreground |
| Content max-width (optional) | 1440px centered on ultra-wide |

### 3.2 POS Shell (SCR-020) — Desktop

```
Main content (no breadcrumb)
├── Split: flex row, gap=0, h=100%
│   ├── Left panel: flex-1 (60%), border-r 1px border
│   │   ├── Barcode strip: h=56px, px=16px
│   │   ├── Search: h=48px, px=16px
│   │   └── Product grid: padding 16px, gap 12px
│   └── Right cart: w=40% min-w=380px max-w=480px, flex col
│       ├── Cart header: h=48px
│       ├── Customer row: h=56px
│       ├── Currency toggle: h=40px
│       ├── Line items: flex-1 scroll
│       ├── Totals block: min-h=120px, p=16px
│       └── Complete CTA: h=56px, m=16px
```

### 3.3 Mobile Shell

```
├── AppBar: h=56px + safe-area-top
├── Body: flex-1 scroll, pb=calc(56px + safe-area-bottom)
└── BottomNav: h=56px + safe-area-bottom, 5 items max
```

### 3.4 Auth Shell (SCR-000, Company Select overlay)

```
Full viewport, bg=sunken
├── Logo: 40px height, centered, mt=48px mb=24px
└── Card: max-w=480px (login) | 640px (company), centered, p=32px, radius=12px, shadow=lg
```

---

## 4. Component Pixel Specs (implementation)

### 4.1 Buttons (CMP-003)

| Size | Height | Padding X | Font | Icon |
|------|--------|-----------|------|------|
| sm | 32px | 12px | 12px/500 | 16px |
| md | 40px | 16px | 14px/500 | 20px |
| lg | 48px | 20px | 16px/500 | 20px |
| POS primary | 56px | 24px | 16px/600 | — |

Border radius: `radius/md` = 8px (desktop), 12px (mobile primary).

### 4.2 Inputs (CMP-010)

| Size | Height | Padding | Label gap |
|------|--------|---------|-----------|
| md | 40px | 12px 16px | 8px above label |
| lg (mobile) | 48px | 14px 16px | 8px |

Focus ring: 2px offset, `color/ring` token.

### 4.3 Data Table (CMP-020)

| Mode | Row height | Cell padding | Header bg |
|------|------------|--------------|-----------|
| Comfortable | 48px | 12px 16px | muted |
| Dense (ERP default) | 40px | 8px 12px | muted |
| Compact (admin) | 36px | 6px 12px | muted |

Sticky header: yes, on scroll `z=10` within table container.

### 4.4 Stat Card / KPI (CMP-025)

```
┌─────────────────────────────┐  w=100% (grid cell), min-h=120px, p=16px, radius=8px
│ LABEL (12px muted uppercase) │
│ VALUE (28px semibold)        │  + optional trend chip right
│ SUBTEXT (12px muted)         │
└─────────────────────────────┘
```

Dashboard grid: 4 columns × 2 rows desktop XL; 2×2 tablet; 1 column mobile.

### 4.5 Modal (CMP-030)

| Size | Width | Max height |
|------|-------|------------|
| sm | 400px | 80vh |
| md | 560px | 85vh |
| lg | 720px | 90vh |
| full (mobile) | 100% | 100% → use Sheet |

Overlay: `rgba(0,0,0,0.5)` light / `0.7` dark. Padding around modal: 24px min.

### 4.6 Toast (CMP-035)

Position: top-right desktop, bottom-center mobile (above bottom nav).  
Size: min-w=320px, max-w=420px, p=12px 16px, radius=8px, auto-dismiss 5s.

---

## 5. Typography Implementation

### Desktop (Inter)

| Role | Size | Weight | Line | Letter-spacing |
|------|------|--------|------|----------------|
| Page title | 24px | 600 | 32px | -0.02em |
| Section title | 20px | 600 | 28px | -0.01em |
| Body | 14px | 400 | 20px | 0 |
| Table cell | 13px | 400 | 18px | 0 |
| Caption | 12px | 400 | 16px | 0 |
| KPI value | 28px | 600 | 36px | -0.02em |
| Mono SKU | 13px | 400 | 18px | JetBrains Mono |

### Mobile (Roboto / MD3)

Map MD3 `titleLarge`, `bodyLarge`, `labelMedium` per [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) §2.

---

## 6. Color Application Rules

1. **Never hardcode hex** in Figma — use variables only.
2. **UZS amounts**: `color/currency/uzs` foreground on neutral bg.
3. **USD amounts**: `color/currency/usd` foreground.
4. **Destructive**: block, delete, disable — `color/destructive` button variant only.
5. **Real-time flash**: `color/accent/success` at 20% opacity overlay for 2s on updated row.

---

## 7. Responsive Transformation Rules

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| DataTable | Full columns | Hide low-priority cols | Card list (CMP-021) |
| Page header actions | Inline right | Wrap second row | Overflow menu (⋮) |
| Filters | Horizontal bar | 2-row wrap | Sheet from "Filters" chip |
| Master-detail | Side-by-side | Stacked | Navigate to detail route |
| Modal | Centered dialog | Centered | Full-screen sheet |
| Sidebar | 240/64px | 64px rail | Hidden; bottom nav |

Priority column order for truncation: Actions → Status → Date → Amount → Name → SKU (keep leftmost identity columns).

---

## 8. State Visual Specifications

### 8.1 Loading

- **Page**: Skeleton blocks matching final layout (CMP-040). Shimmer 1.5s loop.
- **Button**: Spinner 16px left of label; button disabled.
- **Table**: 8 skeleton rows, dense height.

### 8.2 Empty

- Illustration: 120×120px centered, `color/muted` stroke style.
- Headline: 18px semibold, 8px below illustration.
- Body: 14px muted, max-w=400px centered.
- CTA: primary button, 24px below body.

### 8.3 Error

- **Inline field**: border destructive + 12px message below.
- **Banner**: full-width in content, 48px min-h, icon + message + Retry.
- **Full page**: same as empty but destructive icon; no illustration.

### 8.4 Success

- Toast for actions; for POS sale → full-screen success 1.5s then auto-next sale.
- Checkmark animation: 400ms ease-out.

### 8.5 Real-time row update

Background: `success/10%` → fade to transparent over 2000ms ease.

---

## 9. React / Electron Mapping

| Figma token | Tailwind / CSS variable |
|-------------|-------------------------|
| `color/primary` | `hsl(var(--primary))` |
| `space/4` | `p-4` (16px) |
| `radius/md` | `rounded-md` |
| Sidebar 240px | `w-60` |
| TopBar 56px | `h-14` |

Use shadcn/ui components aligned to CMP IDs. Every page root: `data-screen-id="SCR-NNN"`.

---

## 10. Flutter Mapping

| Figma token | Flutter |
|-------------|---------|
| `color/primary` | `Theme.of(context).colorScheme.primary` |
| `space/4` | `16.0` via `AppSpacing.md` |
| Stat card | `ErpStatCard` widget |
| Table → mobile | `ListView` of `ErpCard` tiles |
| Modal | `showModalBottomSheet` (mobile) / `AlertDialog` (tablet+) |

Use `ThemeData` from MD3 `ColorScheme.fromSeed`. Screen wrapper: `Key('SCR-NNN')` for QA.

---

## 11. Accessibility Implementation

| Requirement | Figma | Dev |
|-------------|-------|-----|
| Focus order | Number layers in prototype | `tabIndex` logical order |
| Contrast | Use a11y plugin on text/bg pairs | Verify 4.5:1 body, 3:1 large |
| Touch target | 48×48 min mobile frames | `minHeight: 48` |
| Live region | Annotate "aria-live" on KPI strip | `aria-live="polite"` on dashboard KPIs |
| Skip link | Note on template | First focusable link in DOM |

---

## 12. Handoff Checklist (per screen)

- [ ] All breakpoints: Desktop LG, Tablet, Mobile
- [ ] All states: Default, Loading, Empty, Error, Permission denied
- [ ] Dark + Light mode variants
- [ ] Interactive prototype for primary flow
- [ ] `data-screen-id` annotated on root frame
- [ ] Component instances linked to library (not detached)
- [ ] Spacing verified on 8px grid
- [ ] Currency examples show UZS and USD
- [ ] Uzbek copy on primary labels (English in description layer optional)

---

## 13. Related Documents

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
- [UI_SCREEN_CATALOG.md](./UI_SCREEN_CATALOG.md)
- [RESPONSIVE_GUIDELINES.md](./RESPONSIVE_GUIDELINES.md)
- [UI_STATE_MANAGEMENT.md](./UI_STATE_MANAGEMENT.md)
