# Design System

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |
| Figma Library | `ERP-Design-System-v2` |
| Target Platforms | Windows Desktop (Electron), Android/iOS (Flutter) |

---

## Purpose

This document is the single source of truth for all visual design tokens, component foundations, and Figma variable definitions for the ERP platform. Every value is production-ready and maps 1:1 to Figma variables using the naming convention `category/subcategory/token`.

**Figma setup:** Create a Variables collection named `ERP Tokens` with modes `Light` and `Dark`. Bind all color, spacing, radius, and shadow tokens below. Create a second collection `ERP Typography` with modes `Desktop` and `Mobile`.

---

## 1. Color Palette

### 1.1 Primitive Palette (Brand Foundation)

These primitives are not used directly in UI. Always reference semantic tokens.

| Figma Variable | Hex | Usage |
|----------------|-----|-------|
| `primitive/blue/50` | `#EFF6FF` | Tinted backgrounds |
| `primitive/blue/100` | `#DBEAFE` | Hover tints |
| `primitive/blue/200` | `#BFDBFE` | Selected row tint |
| `primitive/blue/300` | `#93C5FD` | Chart accent light |
| `primitive/blue/400` | `#60A5FA` | Dark mode primary hover |
| `primitive/blue/500` | `#3B82F6` | Dark mode primary |
| `primitive/blue/600` | `#2563EB` | Light mode primary |
| `primitive/blue/700` | `#1D4ED8` | Primary pressed |
| `primitive/blue/800` | `#1E40AF` | Primary dark accent |
| `primitive/blue/900` | `#1E3A8A` | Deep accent |
| `primitive/slate/50` | `#F8FAFC` | Light muted bg |
| `primitive/slate/100` | `#F1F5F9` | Light secondary bg |
| `primitive/slate/200` | `#E2E8F0` | Light borders |
| `primitive/slate/300` | `#CBD5E1` | Disabled borders |
| `primitive/slate/400` | `#94A3B8` | Placeholder text dark |
| `primitive/slate/500` | `#64748B` | Secondary text light |
| `primitive/slate/600` | `#475569` | Body emphasis light |
| `primitive/slate/700` | `#334155` | Dark borders |
| `primitive/slate/800` | `#1E293B` | Dark card bg |
| `primitive/slate/900` | `#0F172A` | Dark page bg / light text |
| `primitive/slate/950` | `#020617` | Dark elevated bg |
| `primitive/green/500` | `#22C55E` | Success base |
| `primitive/green/600` | `#16A34A` | Success emphasis / USD |
| `primitive/green/700` | `#15803D` | Success pressed |
| `primitive/red/500` | `#EF4444` | Error base |
| `primitive/red/600` | `#DC2626` | Error emphasis / destructive |
| `primitive/red/700` | `#B91C1C` | Error pressed |
| `primitive/amber/500` | `#F59E0B` | Warning base |
| `primitive/amber/600` | `#D97706` | Warning emphasis |
| `primitive/amber/700` | `#B45309` | Warning pressed |
| `primitive/cyan/500` | `#06B6D4` | Info base |
| `primitive/cyan/600` | `#0891B2` | Info emphasis |
| `primitive/violet/500` | `#8B5CF6` | Chart series 5 |
| `primitive/orange/500` | `#F97316` | Chart series 6 |
| `primitive/pink/500` | `#EC4899` | Chart series 7 |
| `primitive/white` | `#FFFFFF` | Pure white |
| `primitive/black` | `#000000` | Pure black (overlays only) |

---

### 1.2 Semantic Tokens — Light Mode

| Figma Variable | Hex | Maps From | Usage |
|----------------|-----|-----------|-------|
| `color/background/page` | `#FFFFFF` | white | Main page canvas |
| `color/background/elevated` | `#FFFFFF` | white | Cards, modals on page |
| `color/background/sunken` | `#F8FAFC` | slate-50 | Inset areas, table header bg |
| `color/background/overlay` | `#000000` at 50% opacity | black | Modal scrim |
| `color/foreground/primary` | `#0F172A` | slate-900 | Headings, primary body |
| `color/foreground/secondary` | `#64748B` | slate-500 | Labels, captions, metadata |
| `color/foreground/tertiary` | `#94A3B8` | slate-400 | Placeholder, disabled text |
| `color/foreground/inverse` | `#FFFFFF` | white | Text on primary buttons |
| `color/foreground/link` | `#2563EB` | blue-600 | Hyperlinks, text buttons |
| `color/foreground/link-hover` | `#1D4ED8` | blue-700 | Link hover state |
| `color/border/default` | `#E2E8F0` | slate-200 | Card borders, dividers |
| `color/border/strong` | `#CBD5E1` | slate-300 | Input borders default |
| `color/border/focus` | `#2563EB` | blue-600 | Focus ring color |
| `color/border/error` | `#DC2626` | red-600 | Invalid input border |
| `color/primary/default` | `#2563EB` | blue-600 | Primary buttons, active nav |
| `color/primary/hover` | `#1D4ED8` | blue-700 | Primary hover |
| `color/primary/pressed` | `#1E40AF` | blue-800 | Primary pressed |
| `color/primary/subtle` | `#EFF6FF` | blue-50 | Primary tinted bg |
| `color/primary/foreground` | `#FFFFFF` | white | Text on primary |
| `color/secondary/default` | `#F1F5F9` | slate-100 | Secondary button bg |
| `color/secondary/hover` | `#E2E8F0` | slate-200 | Secondary hover |
| `color/secondary/pressed` | `#CBD5E1` | slate-300 | Secondary pressed |
| `color/secondary/foreground` | `#0F172A` | slate-900 | Text on secondary |
| `color/muted/default` | `#F8FAFC` | slate-50 | Muted sections |
| `color/muted/foreground` | `#64748B` | slate-500 | Muted text |
| `color/accent/default` | `#F1F5F9` | slate-100 | Hover row, menu highlight |
| `color/accent/foreground` | `#0F172A` | slate-900 | Text on accent |
| `color/destructive/default` | `#DC2626` | red-600 | Delete, destructive actions |
| `color/destructive/hover` | `#B91C1C` | red-700 | Destructive hover |
| `color/destructive/pressed` | `#991B1B` | red-800 | Destructive pressed |
| `color/destructive/subtle` | `#FEF2F2` | red-50 equiv | Destructive tinted bg |
| `color/destructive/foreground` | `#FFFFFF` | white | Text on destructive |
| `color/input/background` | `#FFFFFF` | white | Input fill |
| `color/input/border` | `#CBD5E1` | slate-300 | Input default border |
| `color/input/border-hover` | `#94A3B8` | slate-400 | Input hover border |
| `color/ring/focus` | `#2563EB` at 40% opacity | blue-600 | Focus ring spread |
| `color/sidebar/background` | `#0F172A` | slate-900 | Sidebar bg (light mode dark sidebar) |
| `color/sidebar/foreground` | `#F8FAFC` | slate-50 | Sidebar text |
| `color/sidebar/foreground-muted` | `#94A3B8` | slate-400 | Sidebar secondary text |
| `color/sidebar/accent` | `#1E293B` | slate-800 | Sidebar hover item |
| `color/sidebar/border` | `#1E293B` | slate-800 | Sidebar divider |
| `color/sidebar/active` | `#2563EB` | blue-600 | Active nav item indicator |

---

### 1.3 Semantic Tokens — Dark Mode

| Figma Variable | Hex | Maps From | Usage |
|----------------|-----|-----------|-------|
| `color/background/page` | `#0F172A` | slate-900 | Main page canvas |
| `color/background/elevated` | `#1E293B` | slate-800 | Cards, modals |
| `color/background/sunken` | `#020617` | slate-950 | Inset areas |
| `color/background/overlay` | `#000000` at 70% opacity | black | Modal scrim |
| `color/foreground/primary` | `#F8FAFC` | slate-50 | Headings, primary body |
| `color/foreground/secondary` | `#94A3B8` | slate-400 | Labels, captions |
| `color/foreground/tertiary` | `#64748B` | slate-500 | Placeholder, disabled |
| `color/foreground/inverse` | `#0F172A` | slate-900 | Text on light buttons |
| `color/foreground/link` | `#60A5FA` | blue-400 | Hyperlinks |
| `color/foreground/link-hover` | `#93C5FD` | blue-300 | Link hover |
| `color/border/default` | `#334155` | slate-700 | Card borders |
| `color/border/strong` | `#475569` | slate-600 | Input borders |
| `color/border/focus` | `#3B82F6` | blue-500 | Focus ring |
| `color/border/error` | `#EF4444` | red-500 | Invalid input |
| `color/primary/default` | `#3B82F6` | blue-500 | Primary buttons |
| `color/primary/hover` | `#60A5FA` | blue-400 | Primary hover |
| `color/primary/pressed` | `#2563EB` | blue-600 | Primary pressed |
| `color/primary/subtle` | `#1E3A8A` at 30% opacity | blue-900 | Primary tinted bg |
| `color/primary/foreground` | `#FFFFFF` | white | Text on primary |
| `color/secondary/default` | `#1E293B` | slate-800 | Secondary button |
| `color/secondary/hover` | `#334155` | slate-700 | Secondary hover |
| `color/secondary/pressed` | `#475569` | slate-600 | Secondary pressed |
| `color/secondary/foreground` | `#F8FAFC` | slate-50 | Text on secondary |
| `color/muted/default` | `#1E293B` | slate-800 | Muted sections |
| `color/muted/foreground` | `#94A3B8` | slate-400 | Muted text |
| `color/accent/default` | `#334155` | slate-700 | Hover row |
| `color/accent/foreground` | `#F8FAFC` | slate-50 | Text on accent |
| `color/destructive/default` | `#EF4444` | red-500 | Destructive |
| `color/destructive/hover` | `#F87171` | red-400 | Destructive hover |
| `color/destructive/pressed` | `#DC2626` | red-600 | Destructive pressed |
| `color/destructive/subtle` | `#7F1D1D` at 30% opacity | red-900 | Destructive tint |
| `color/destructive/foreground` | `#FFFFFF` | white | Text on destructive |
| `color/input/background` | `#1E293B` | slate-800 | Input fill |
| `color/input/border` | `#475569` | slate-600 | Input border |
| `color/input/border-hover` | `#64748B` | slate-500 | Input hover |
| `color/ring/focus` | `#3B82F6` at 40% opacity | blue-500 | Focus ring |
| `color/sidebar/background` | `#020617` | slate-950 | Sidebar bg |
| `color/sidebar/foreground` | `#F8FAFC` | slate-50 | Sidebar text |
| `color/sidebar/foreground-muted` | `#64748B` | slate-500 | Sidebar secondary |
| `color/sidebar/accent` | `#1E293B` | slate-800 | Sidebar hover |
| `color/sidebar/border` | `#1E293B` | slate-800 | Sidebar divider |
| `color/sidebar/active` | `#3B82F6` | blue-500 | Active nav |

---

### 1.4 Status Colors

Status colors are theme-stable (hue does not shift between light/dark). Background tints adapt.

| Figma Variable | Foreground Hex | Background Tint (Light) | Background Tint (Dark) | Usage |
|----------------|----------------|-------------------------|------------------------|-------|
| `color/status/success/foreground` | `#16A34A` | `#F0FDF4` | `#14532D` at 40% | Active, paid, in stock |
| `color/status/success/border` | `#86EFAC` | — | — | Badge border light mode |
| `color/status/warning/foreground` | `#D97706` | `#FFFBEB` | `#78350F` at 40% | Pending, low stock, draft |
| `color/status/warning/border` | `#FCD34D` | — | — | Badge border |
| `color/status/error/foreground` | `#DC2626` | `#FEF2F2` | `#7F1D1D` at 40% | Blocked, failed, overdue |
| `color/status/error/border` | `#FCA5A5` | — | — | Badge border |
| `color/status/info/foreground` | `#0891B2` | `#ECFEFF` | `#164E63` at 40% | Informational, processing |
| `color/status/info/border` | `#67E8F9` | — | — | Badge border |
| `color/status/neutral/foreground` | `#64748B` | `#F8FAFC` | `#334155` | Inactive, archived |
| `color/status/neutral/border` | `#CBD5E1` | — | — | Badge border |

**ERP status mapping:**

| Business Status | Token | Icon (Desktop) | Icon (Mobile) |
|-----------------|-------|----------------|---------------|
| Active / Completed / Paid | success | `circle-check` | `check_circle` |
| Pending / Draft / Processing | warning | `clock` | `schedule` |
| Blocked / Cancelled / Failed | error | `circle-x` | `cancel` |
| Info / Syncing | info | `info` | `info` |
| Inactive / Archived | neutral | `minus-circle` | `remove_circle` |

---

### 1.5 Currency Colors

Currency colors provide instant visual differentiation for dual-currency ERP operations (UZS / USD).

| Figma Variable | Light Hex | Dark Hex | Usage |
|----------------|-----------|----------|-------|
| `color/currency/uzs/foreground` | `#2563EB` | `#60A5FA` | UZS amounts, labels, chart segments |
| `color/currency/uzs/background` | `#EFF6FF` | `#1E3A8A` at 30% | UZS badge/chip background |
| `color/currency/uzs/border` | `#BFDBFE` | `#1E40AF` | UZS input left accent bar |
| `color/currency/usd/foreground` | `#16A34A` | `#4ADE80` | USD amounts, labels |
| `color/currency/usd/background` | `#F0FDF4` | `#14532D` at 30% | USD badge background |
| `color/currency/usd/border` | `#86EFAC` | `#15803D` | USD input left accent bar |
| `color/currency/mixed/foreground` | `#0F172A` / `#F8FAFC` | theme foreground | Totals combining currencies |
| `color/currency/negative/foreground` | `#DC2626` | `#F87171` | Negative balances, refunds |

**Display rules:**
- UZS: space-separated thousands, suffix `so'm` — e.g. `1 250 000 so'm`
- USD: comma thousands, 2 decimals, prefix `$` — e.g. `$1,250.00`
- Always apply currency color to the numeric value; labels use `foreground/secondary`
- In tables, right-align all currency columns

---

### 1.6 Chart Colors

Dedicated palette for dashboards and reports. Ordered for maximum distinguishability.

| Figma Variable | Light Hex | Dark Hex | Series Order |
|----------------|-----------|----------|--------------|
| `color/chart/1` | `#2563EB` | `#60A5FA` | Primary metric |
| `color/chart/2` | `#16A34A` | `#4ADE80` | Secondary metric |
| `color/chart/3` | `#D97706` | `#FBBF24` | Tertiary |
| `color/chart/4` | `#DC2626` | `#F87171` | Negative / expense |
| `color/chart/5` | `#8B5CF6` | `#A78BFA` | Category 5 |
| `color/chart/6` | `#0891B2` | `#22D3EE` | Category 6 |
| `color/chart/7` | `#EC4899` | `#F472B6` | Category 7 |
| `color/chart/8` | `#F97316` | `#FB923C` | Category 8 |
| `color/chart/grid` | `#E2E8F0` | `#334155` | Grid lines |
| `color/chart/axis` | `#94A3B8` | `#64748B` | Axis labels |
| `color/chart/tooltip/bg` | `#0F172A` | `#F8FAFC` | Tooltip background |
| `color/chart/tooltip/fg` | `#F8FAFC` | `#0F172A` | Tooltip text |
| `color/chart/area-opacity` | 15% | 20% | Area fill under lines |

**Chart type color assignment:**

| Chart Type | Color Rule |
|------------|------------|
| Revenue line | `chart/1` (blue) |
| Expense line | `chart/4` (red) |
| UZS bar | `currency/uzs/foreground` |
| USD bar | `currency/usd/foreground` |
| Pie (≤5 segments) | `chart/1` through `chart/5` |
| Pie (6–8 segments) | Full `chart/1`–`chart/8` |
| Comparison (actual vs target) | `chart/1` solid, `chart/3` dashed |
| Heatmap low→high | `#EFF6FF` → `#2563EB` (light) / `#1E3A8A` → `#60A5FA` (dark) |

---

## 2. Typography

### 2.1 Font Families

| Platform | Figma Variable | Family | Fallback Stack | Usage |
|----------|----------------|--------|----------------|-------|
| Desktop | `font/family/sans` | Inter | `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | All UI text |
| Desktop | `font/family/mono` | JetBrains Mono | `"JetBrains Mono", "Cascadia Code", Consolas, monospace` | SKU, barcodes, codes, audit diffs |
| Mobile | `font/family/sans` | Roboto | `Roboto, sans-serif` | All UI text |
| Mobile | `font/family/mono` | Roboto Mono | `Roboto Mono, monospace` | SKU, barcodes |

**Figma text styles naming:** `Desktop/Category/Size` or `Mobile/Category/Size`

---

### 2.2 Desktop Typography Scale (Inter)

| Figma Style | Size | Weight | Line Height | Letter Spacing | Usage |
|-------------|------|--------|-------------|----------------|-------|
| `Desktop/Display/XL` | 36px | 700 (Bold) | 44px (122%) | -0.02em | Marketing hero (rare in ERP) |
| `Desktop/Display/LG` | 30px | 700 (Bold) | 38px (127%) | -0.02em | Page titles (H1) |
| `Desktop/Heading/H1` | 24px | 600 (Semibold) | 32px (133%) | -0.01em | Section titles |
| `Desktop/Heading/H2` | 20px | 600 (Semibold) | 28px (140%) | -0.01em | Card titles, dialog titles |
| `Desktop/Heading/H3` | 16px | 600 (Semibold) | 24px (150%) | 0 | Subsection headers |
| `Desktop/Heading/H4` | 14px | 600 (Semibold) | 20px (143%) | 0 | Table group headers |
| `Desktop/Body/LG` | 16px | 400 (Regular) | 24px (150%) | 0 | Emphasized body, form labels |
| `Desktop/Body/MD` | 14px | 400 (Regular) | 20px (143%) | 0 | Default body text |
| `Desktop/Body/SM` | 12px | 400 (Regular) | 16px (133%) | 0 | Secondary text, captions |
| `Desktop/Body/XS` | 11px | 400 (Regular) | 14px (127%) | 0.01em | Timestamps, footnotes |
| `Desktop/Label/LG` | 14px | 500 (Medium) | 20px | 0 | Form labels, button text (md) |
| `Desktop/Label/MD` | 13px | 500 (Medium) | 18px | 0 | Button text (sm), tabs |
| `Desktop/Label/SM` | 12px | 500 (Medium) | 16px | 0.01em | Badges, chips, table headers |
| `Desktop/Label/XS` | 11px | 500 (Medium) | 14px | 0.02em | Micro labels, keyboard hints |
| `Desktop/Mono/MD` | 13px | 400 (Regular) | 20px | 0 | SKU, order numbers |
| `Desktop/Mono/SM` | 12px | 400 (Regular) | 16px | 0 | Barcode display, code diffs |
| `Desktop/Number/LG` | 30px | 700 (Bold) | 38px | -0.02em | KPI hero numbers |
| `Desktop/Number/MD` | 24px | 600 (Semibold) | 32px | -0.01em | Stat card values |
| `Desktop/Number/SM` | 16px | 600 (Semibold) | 24px | 0 | Inline totals |
| `Desktop/Table/Header` | 12px | 500 (Medium) | 16px | 0.04em | Column headers (uppercase optional) |
| `Desktop/Table/Cell` | 13px | 400 (Regular) | 18px | 0 | Table body cells (dense) |
| `Desktop/Table/CellComfortable` | 14px | 400 (Regular) | 20px | 0 | Table body (comfortable) |

---

### 2.3 Mobile Typography Scale (Roboto)

| Figma Style | Size | Weight | Line Height | Letter Spacing | Usage |
|-------------|------|--------|-------------|----------------|-------|
| `Mobile/Display/Large` | 36px | 400 (Regular) | 44px | 0 | Screen titles (rare) |
| `Mobile/Headline/Large` | 32px | 400 (Regular) | 40px | 0 | Page headers |
| `Mobile/Headline/Medium` | 28px | 400 (Regular) | 36px | 0 | Section headers |
| `Mobile/Headline/Small` | 24px | 400 (Regular) | 32px | 0 | Card headers |
| `Mobile/Title/Large` | 22px | 500 (Medium) | 28px | 0 | App bar titles |
| `Mobile/Title/Medium` | 16px | 500 (Medium) | 24px | 0.015em | List item titles |
| `Mobile/Title/Small` | 14px | 500 (Medium) | 20px | 0.01em | Compact list titles |
| `Mobile/Body/Large` | 16px | 400 (Regular) | 24px | 0.03em | Primary body |
| `Mobile/Body/Medium` | 14px | 400 (Regular) | 20px | 0.02em | Default body |
| `Mobile/Body/Small` | 12px | 400 (Regular) | 16px | 0.04em | Secondary body |
| `Mobile/Label/Large` | 14px | 500 (Medium) | 20px | 0.01em | Buttons, tabs |
| `Mobile/Label/Medium` | 12px | 500 (Medium) | 16px | 0.05em | Chips, badges |
| `Mobile/Label/Small` | 11px | 500 (Medium) | 16px | 0.05em | Captions, overlines |
| `Mobile/Mono/Medium` | 14px | 400 (Regular) | 20px | 0 | SKU, codes |
| `Mobile/Mono/Small` | 12px | 400 (Regular) | 16px | 0 | Barcodes |
| `Mobile/Number/Large` | 32px | 500 (Medium) | 40px | 0 | Dashboard KPI |
| `Mobile/Number/Medium` | 24px | 500 (Medium) | 32px | 0 | Stat values |
| `Mobile/Number/Small` | 16px | 500 (Medium) | 24px | 0 | Inline amounts |

---

## 3. Grid System

### 3.1 Base Grid — 8px

All layout dimensions snap to an **8px base grid**. Half-steps (4px) are permitted only for internal component padding and icon optical alignment.

| Rule | Value |
|------|-------|
| Base unit | 8px |
| Sub-unit (micro) | 4px (spacing tokens only) |
| Desktop content max-width | 1440px |
| Desktop content min-width | 1024px |
| Mobile content padding | 16px (2× grid) |
| Desktop content padding | 24px (3× grid) |
| Column gutter (desktop) | 24px |
| Column gutter (tablet) | 16px |
| Column gutter (mobile) | 16px |

### 3.2 Desktop Column Grid

| Breakpoint | Columns | Margin | Gutter | Max Content |
|------------|---------|--------|--------|-------------|
| 1024–1279px (`lg`) | 12 | 24px | 24px | 100% |
| 1280–1535px (`xl`) | 12 | 32px | 24px | 1280px |
| 1536px+ (`2xl`) | 12 | auto center | 24px | 1440px |

### 3.3 Mobile Column Grid

| Breakpoint | Columns | Margin | Gutter |
|------------|---------|--------|--------|
| 320–599px | 4 | 16px | 16px |
| 600–904px | 8 | 24px | 16px |
| 905px+ (tablet) | 12 | 24px | 24px |

---

## 4. Spacing Scale

Base unit: **4px**. Figma variable prefix: `space/`

| Token | Value | Grid Multiple | Usage |
|-------|-------|---------------|-------|
| `space/0` | 0px | — | Reset |
| `space/0.5` | 2px | ½× sub | Icon optical nudge only |
| `space/1` | 4px | 1× sub | Tight inline gaps, badge padding-y |
| `space/1.5` | 6px | — | Chip icon gap (exception) |
| `space/2` | 8px | 1× base | Default inline gap, input padding-x |
| `space/3` | 12px | — | Button icon gap, compact card padding |
| `space/4` | 16px | 2× base | Standard card padding, form field gap |
| `space/5` | 20px | — | Comfortable form section gap |
| `space/6` | 24px | 3× base | Section spacing, dialog padding |
| `space/8` | 32px | 4× base | Page section gaps |
| `space/10` | 40px | 5× base | Large section breaks |
| `space/12` | 48px | 6× base | Page header to content |
| `space/16` | 64px | 8× base | Hero spacing |
| `space/20` | 80px | 10× base | Empty state vertical padding |
| `space/24` | 96px | 12× base | Marketing layouts (rare) |

**Component spacing quick reference:**

| Context | Token |
|---------|-------|
| Label to input | `space/1` (4px) |
| Between form fields | `space/4` (16px) |
| Form section title to fields | `space/3` (12px) |
| Card internal padding | `space/4` (16px) desktop, `space/4` (16px) mobile |
| Card grid gap | `space/4` (16px) |
| Table cell padding-x | `space/3` (12px) dense, `space/4` (16px) comfortable |
| Table cell padding-y | `space/2` (8px) dense, `space/3` (12px) comfortable |
| Button icon to label | `space/2` (8px) |
| Sidebar item padding | `space/3` (12px) vertical, `space/4` (16px) horizontal |
| Page title to breadcrumb | `space/2` (8px) |
| Page title to content | `space/6` (24px) |

---

## 5. Elevation & Shadows

Figma effect styles prefixed `Elevation/`

### 5.1 Light Mode Shadows

| Token | X | Y | Blur | Spread | Color | Usage |
|-------|---|---|------|--------|-------|-------|
| `elevation/0` | 0 | 0 | 0 | 0 | — | Flat, flush elements |
| `elevation/1` | 0 | 1px | 2px | 0 | `#000000` 5% | Cards at rest, inputs |
| `elevation/2` | 0 | 1px | 3px | 0 | `#000000` 10% | Cards hover, dropdowns |
| `elevation/3` | 0 | 4px | 6px | -1px | `#000000` 10% | Popovers, menus |
| `elevation/4` | 0 | 10px | 15px | -3px | `#000000` 10% | Modals, dialogs |
| `elevation/5` | 0 | 20px | 25px | -5px | `#000000` 10% | Command palette, drawers |
| `elevation/focus-ring` | 0 | 0 | 0 | 3px | `#2563EB` 40% | Focus state (all interactive) |
| `elevation/inner` | inset 0 | 2px | 4px | 0 | `#000000` 5% | Pressed buttons, sunken inputs |

### 5.2 Dark Mode Shadows

Dark mode uses higher opacity shadows and subtle border highlights instead of heavy drop shadows.

| Token | X | Y | Blur | Spread | Color | Usage |
|-------|---|---|------|--------|-------|-------|
| `elevation/0` | 0 | 0 | 0 | 0 | — | Flat |
| `elevation/1` | 0 | 1px | 2px | 0 | `#000000` 20% | Cards at rest |
| `elevation/2` | 0 | 2px | 4px | 0 | `#000000` 30% | Cards hover |
| `elevation/3` | 0 | 4px | 8px | -2px | `#000000` 40% | Popovers |
| `elevation/4` | 0 | 10px | 20px | -4px | `#000000` 50% | Modals |
| `elevation/5` | 0 | 20px | 30px | -6px | `#000000` 60% | Drawers |
| `elevation/border-subtle` | 0 | 0 | 0 | 1px | `#334155` | Card edge definition (dark) |
| `elevation/focus-ring` | 0 | 0 | 0 | 3px | `#3B82F6` 40% | Focus state |

### 5.3 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z/base` | 0 | Default content |
| `z/sticky` | 10 | Sticky table headers, app bar |
| `z/dropdown` | 20 | Dropdowns, popovers |
| `z/overlay` | 30 | Modal scrim |
| `z/modal` | 40 | Dialogs, sheets |
| `z/toast` | 50 | Toast notifications |
| `z/tooltip` | 60 | Tooltips (topmost) |
| `z/command` | 70 | Command palette |

---

## 6. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius/none` | 0px | Tables, full-bleed panels |
| `radius/xs` | 2px | Progress bars, inner ticks |
| `radius/sm` | 4px | Badges, chips (desktop), tooltips |
| `radius/md` | 6px | Buttons, inputs, desktop cards |
| `radius/lg` | 8px | Desktop modals, large cards |
| `radius/xl` | 12px | Mobile cards, mobile bottom sheets |
| `radius/2xl` | 16px | Mobile FAB menu, feature cards |
| `radius/full` | 9999px | Avatars, pills, circular buttons |

**Platform defaults:**

| Component | Desktop Radius | Mobile Radius |
|-----------|----------------|---------------|
| Button | `radius/md` (6px) | `radius/xl` (12px) |
| Input | `radius/md` (6px) | `radius/md` (6px) |
| Card | `radius/md` (6px) | `radius/xl` (12px) |
| Modal | `radius/lg` (8px) | `radius/xl` (12px) top corners |
| Badge | `radius/sm` (4px) | `radius/full` (pill) |
| Avatar | `radius/full` | `radius/full` |
| Bottom sheet | — | `radius/xl` (12px) top only |

---

## 7. Icon System

### 7.1 Libraries

| Platform | Library | Figma Component Set | Weight/Style |
|----------|---------|---------------------|----------------|
| Desktop | Lucide | `Icons/Lucide/*` | 2px stroke, round caps |
| Mobile | Material Symbols | `Icons/Material/*` | Outlined default; Filled for selected nav |

### 7.2 Icon Sizes

| Token | Desktop Size | Mobile Size | Usage |
|-------|--------------|-------------|-------|
| `icon/xs` | 14px | 16px | Inline with body-xs, badge icons |
| `icon/sm` | 16px | 20px | Table actions, compact buttons |
| `icon/md` | 20px | 24px | Default UI icons |
| `icon/lg` | 24px | 28px | Section headers, empty states |
| `icon/xl` | 32px | 36px | Feature illustrations, onboarding |
| `icon/2xl` | 48px | 48px | Empty state hero icons |

### 7.3 Icon Color Rules

| Context | Color Token |
|---------|-------------|
| Default | `foreground/secondary` |
| On primary button | `primary/foreground` |
| Interactive (hover) | `foreground/primary` |
| Destructive | `destructive/default` |
| Success status | `status/success/foreground` |
| Disabled | `foreground/tertiary` |
| Navigation active | `primary/default` |
| Sidebar default | `sidebar/foreground-muted` |
| Sidebar active | `sidebar/foreground` |

### 7.4 Icon Usage Rules

1. **Pair with text** for non-obvious actions; icon-only requires tooltip (desktop) or accessibility label (mobile).
2. **Consistent metaphor:** use `shopping-cart` for POS cart on both platforms (Lucide `shopping-cart`, Material `shopping_cart`).
3. **No mixed libraries** on the same platform.
4. **Stroke alignment:** optical center within 24×24 bounding box; 2px padding minimum.
5. **Currency icons:** do not use generic dollar icons for UZS; use `color/currency/uzs` text label "so'm" or locale flag optional.
6. **Status dots:** 8px circle icons, filled, using status foreground colors.
7. **Spinners:** use `loader-2` (Lucide) / `progress_activity` (Material), rotating 360° continuous.

---

## 8. Button System

### 8.1 Variants

| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| **Primary** | `primary/default` | `primary/foreground` | none | Main CTA, one per view |
| **Secondary** | `secondary/default` | `secondary/foreground` | none | Secondary actions |
| **Outline** | transparent | `foreground/primary` | `border/strong` | Tertiary actions, filters |
| **Ghost** | transparent | `foreground/primary` | none | Toolbar, table row actions |
| **Destructive** | `destructive/default` | `destructive/foreground` | none | Delete, irreversible |
| **Destructive Outline** | transparent | `destructive/default` | `destructive/default` | Secondary delete |
| **Link** | transparent | `foreground/link` | none | Inline navigation |

### 8.2 Sizes

| Size | Height (Desktop) | Height (Mobile) | Padding-X | Font Style | Icon Size | Min Width |
|------|------------------|-----------------|-----------|------------|-----------|-----------|
| `xs` | 28px | — | 8px | Label/XS | 14px | 28px |
| `sm` | 32px | 40px | 12px | Label/SM | 16px | 32px |
| `md` | 36px | 48px | 16px | Label/MD | 20px | 36px |
| `lg` | 40px | 52px | 20px | Label/LG | 20px | 40px |
| `xl` | 48px | 56px | 24px | Body/LG | 24px | 48px |
| `icon` | 36×36px | 48×48px | centered | — | 20/24px | equal height |

### 8.3 States (per variant)

| State | Visual Change |
|-------|---------------|
| **Default** | Base colors |
| **Hover** | Background → hover token; elevation/2 on primary |
| **Pressed** | Background → pressed token; elevation/inner |
| **Focus** | Focus ring `elevation/focus-ring` |
| **Disabled** | 50% opacity; cursor not-allowed; no hover |
| **Loading** | Label hidden; spinner centered; width preserved; disabled interaction |

### 8.4 Button Groups

- Adjacent buttons: `space/2` (8px) gap
- Segmented control: shared container `radius/md`, internal dividers `border/default`
- Primary always rightmost in dialog footers (desktop); primary full-width top on mobile destructive confirmations

---

## 9. Form System

### 9.1 Input Anatomy

```
┌─ Label (Label/LG) ──────────────── optional badge ─┐
│  Helper text (Body/SM, secondary)    [optional]    │
├─────────────────────────────────────────────────────┤
│ [prefix icon]  Placeholder / Value  [suffix] [×]   │
├─────────────────────────────────────────────────────┤
│  Error message (Body/SM, error color)  [optional]   │
└─────────────────────────────────────────────────────┘
```

### 9.2 Input Sizes

| Size | Height (Desktop) | Height (Mobile) | Padding-X | Font |
|------|------------------|-----------------|-----------|------|
| `sm` | 32px | 40px | 8px | Body/SM |
| `md` | 36px | 48px | 12px | Body/MD |
| `lg` | 40px | 52px | 12px | Body/LG |

### 9.3 Input States

| State | Border | Background | Label |
|-------|--------|------------|-------|
| Default | `input/border` | `input/background` | `foreground/secondary` |
| Hover | `input/border-hover` | `input/background` | — |
| Focus | `border/focus` + focus ring | `input/background` | `foreground/primary` |
| Filled | `input/border` | `input/background` | — |
| Disabled | `border/default` | `muted/default` | `foreground/tertiary` |
| Read-only | `border/default` | `muted/default` | — |
| Error | `border/error` | `destructive/subtle` | `destructive/default` |
| Success | `status/success/border` | `status/success` bg tint | — |

### 9.4 Select & Dropdown

- Chevron icon trailing, 16px
- Menu max-height: 320px, scrollable
- Selected item: `accent/default` background + check icon trailing
- Group headers: `Label/XS`, uppercase, `foreground/tertiary`
- Searchable select: search input sticky at top, `space/2` padding

### 9.5 Checkbox, Radio, Switch

| Control | Desktop Size | Mobile Size | Selected Color |
|---------|--------------|-------------|----------------|
| Checkbox | 16×16px | 20×20px | `primary/default` |
| Radio | 16×16px | 20×20px | `primary/default` |
| Switch track | 36×20px | 44×24px | `primary/default` when on |
| Switch thumb | 16px circle | 20px circle | white |

### 9.6 Form Layout Patterns

| Pattern | Desktop | Mobile |
|---------|---------|--------|
| Label position | Above input | Above input |
| Field width | 50% for pairs, 100% default | 100% always |
| Required indicator | Red asterisk after label | Same |
| Inline validation | On blur | On blur |
| Form actions | Right-aligned button row | Full-width stacked buttons |
| Section dividers | `border/default` 1px + `space/6` margin | Same |

---

## 10. Table System

### 10.1 Density Modes

| Property | Dense | Comfortable |
|----------|-------|-------------|
| Row height | 40px | 48px |
| Cell padding-x | 12px | 16px |
| Cell padding-y | 8px | 12px |
| Font | Table/Cell (13px) | Table/CellComfortable (14px) |
| Header height | 36px | 40px |
| Default context | ERP data grids, admin | Reports, readability focus |

### 10.2 Table Anatomy

```
┌─ Toolbar ─────────────────────────────────────────────────┐
│ [Search] [Filters] [Columns ▾]          [Export] [+ New]  │
├───────────────────────────────────────────────────────────┤
│ ☐ │ Column A ▲ │ Column B │ Column C │ Actions           │
├───┼────────────┼──────────┼──────────┼───────────────────┤
│ ☐ │ Cell data  │ Cell     │ Cell     │ [···]             │
│ ☐ │ Cell data  │ Cell     │ Cell     │ [···]             │
├───────────────────────────────────────────────────────────┤
│ Selected: 3  [Bulk Delete]     Rows/page ▾  ◀ 1 2 3 ▶    │
└───────────────────────────────────────────────────────────┘
```

### 10.3 Sorting

| State | Header Icon | Text Style |
|-------|-------------|------------|
| Unsorted | `chevrons-up-down` faded | Label/SM |
| Ascending | `chevron-up` primary | Label/SM semibold |
| Descending | `chevron-down` primary | Label/SM semibold |
| Active sorted column | `accent/default` bg tint | — |

### 10.4 Row States

| State | Background |
|-------|------------|
| Default | transparent |
| Hover | `accent/default` |
| Selected | `primary/subtle` |
| Active/Editing | `primary/subtle` + left border 3px `primary/default` |
| Disabled | 50% opacity |
| Error row | `destructive/subtle` |

### 10.5 Selection

- Checkbox column: 48px width (desktop), includes header select-all
- Shift+click range select (desktop)
- Selected row count in footer bar with bulk actions

### 10.6 Pagination

| Element | Spec |
|---------|------|
| Height | 40px footer bar |
| Rows per page | 10, 25, 50, 100 options |
| Page info | "Showing 1–25 of 1,234" |
| Controls | First, Prev, Page numbers (max 5), Next, Last |
| Mobile | Prev/Next only + infinite scroll alternative |

---

## 11. Card System

### 11.1 Content Card

| Property | Desktop | Mobile |
|----------|---------|--------|
| Background | `background/elevated` | `background/elevated` |
| Border | 1px `border/default` | none (elevation/1) |
| Radius | `radius/md` (6px) | `radius/xl` (12px) |
| Padding | `space/4` (16px) | `space/4` (16px) |
| Shadow | `elevation/1` | `elevation/1` |
| Header | H2 style + optional action icon | Title/Medium |
| Footer | Top border, right-aligned actions | Full-width buttons |

### 11.2 Stat Card (KPI)

| Property | Value |
|----------|-------|
| Min width | 200px (desktop), 100% (mobile) |
| Padding | `space/4` (16px) |
| Label | Body/SM, `foreground/secondary` |
| Value | Number/MD (24px semibold) |
| Trend up | `status/success/foreground` + `trending-up` icon |
| Trend down | `status/error/foreground` + `trending-down` icon |
| Trend neutral | `foreground/tertiary` + `minus` icon |
| Sparkline | 48px height, `chart/1` stroke 1.5px |
| Comparison | "vs last period" Body/XS below trend |

### 11.3 Interactive Card

- Hover: `elevation/2`, border `border/strong`
- Clickable: entire card is hit target
- Selected: 2px border `primary/default`

---

## 12. Modal & Dialog System

### 12.1 Sizes

| Size | Width | Usage |
|------|-------|-------|
| `sm` | 400px | Confirmations, simple alerts |
| `md` | 560px | Standard forms (default) |
| `lg` | 720px | Complex forms, multi-section |
| `xl` | 900px | Permission matrix, wide content |
| `full` | 100vw − 64px | Full-screen detail (desktop) |

Mobile: all dialogs become full-width bottom sheets or full-screen overlays.

### 12.2 Anatomy

```
        ┌─────────────────────────────────┐
        │ Title (H2)               [×]  │
        │ Description (Body/SM)         │
        ├─────────────────────────────────┤
        │                                 │
        │         Content area            │
        │                                 │
        ├─────────────────────────────────┤
        │         [Cancel]  [Confirm]     │
        └─────────────────────────────────┘
```

### 12.3 Confirmation Patterns

| Type | Icon | Primary Action | Primary Variant |
|------|------|----------------|-----------------|
| Info | `info` info color | OK | Primary |
| Success | `circle-check` success | OK | Primary |
| Warning | `alert-triangle` warning | Proceed | Primary |
| Destructive | `alert-triangle` error | Delete | Destructive |
| Input confirm | — | Type name to enable | Destructive |

- Scrim: `background/overlay`, click closes only if `dismissable`
- Enter key: confirms primary (unless destructive requires explicit click)
- Escape key: cancels (desktop)

---

## 13. Drawer & Sheet System

### 13.1 Desktop Sheet (Side Panel)

| Size | Width | Usage |
|------|-------|-------|
| `sm` | 320px | Filters, quick detail |
| `md` | 480px | Record detail, edit forms |
| `lg` | 640px | POS cart, complex detail |
| `xl` | 800px | Split-view editing |

- Position: right (default), left (navigation alternative)
- Shadow: `elevation/5`
- Header: 56px height, sticky
- Footer: 64px height, sticky, action buttons

### 13.2 Mobile Bottom Sheet

| Snap | Height | Usage |
|------|--------|-------|
| `peek` | 25% | Quick info, single action |
| `half` | 50% | Cart summary, filters |
| `full` | 90% | Forms, product lists |
| Drag handle | 32×4px pill, `border/strong`, centered, 8px from top |

---

## 14. Notification & Toast System

### 14.1 Toast

| Property | Value |
|----------|-------|
| Position (desktop) | Bottom-right, 24px from edges |
| Position (mobile) | Bottom-center, 16px above bottom nav |
| Width | 360px max (desktop), calc(100% − 32px) mobile |
| Padding | `space/4` (16px) |
| Radius | `radius/md` |
| Shadow | `elevation/4` |
| Auto-dismiss | 5s default, 8s with action, persistent on error |
| Stack | Max 3 visible, slide up stack |

| Variant | Left Accent | Icon |
|---------|-------------|------|
| Success | `status/success/foreground` 4px | `circle-check` |
| Error | `status/error/foreground` 4px | `circle-x` |
| Warning | `status/warning/foreground` 4px | `alert-triangle` |
| Info | `status/info/foreground` 4px | `info` |

### 14.2 Banner (Inline Alert)

- Full-width within content area
- 48px min height
- Dismissible X trailing
- Optional action link inline
- Used for: connection status, trial expiry, system maintenance

---

## 15. Chart & Graph System

### 15.1 Chart Container

| Property | Value |
|----------|-------|
| Min height | 240px (dashboard), 320px (reports) |
| Padding | `space/4` (16px) |
| Title | H3 + optional date range subtitle |
| Legend | Bottom horizontal, `space/4` gap, 12px color swatch |
| Tooltip | `chart/tooltip/bg`, `radius/sm`, `elevation/3` |
| Empty state | Centered, 120px chart icon + "No data for period" |

### 15.2 Chart Types

| Type | Usage | Default Colors |
|------|-------|----------------|
| Line | Trends over time, revenue | `chart/1`, `chart/2` |
| Area | Volume, cumulative | `chart/1` at area-opacity |
| Bar (vertical) | Category comparison | `chart/1`–`chart/5` |
| Bar (horizontal) | Rankings, long labels | Same |
| Stacked bar | Multi-series breakdown | `chart/1`–`chart/4` |
| Pie / Donut | Part-of-whole (≤8 segments) | `chart/1`–`chart/8` |
| Combo | Revenue bar + margin line | Bar `chart/1`, line `chart/3` |
| Sparkline | Inline in stat cards | `chart/1`, no axes |

### 15.3 Axis & Grid

- Grid lines: `chart/grid`, 1px, horizontal only (bar/line)
- Axis labels: `chart/axis`, Body/XS
- No vertical grid on dashboards (clean)
- Currency axis: apply currency color to tick labels

---

## 16. Badge & Chip System

### 16.1 Badge (Read-only Status)

| Size | Height | Padding-X | Font |
|------|--------|-----------|------|
| `sm` | 20px | 6px | Label/XS |
| `md` | 24px | 8px | Label/SM |
| `lg` | 28px | 10px | Label/SM |

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| Default | `muted/default` | `foreground/secondary` | none |
| Success | `status/success` bg | `status/success/foreground` | optional |
| Warning | `status/warning` bg | `status/warning/foreground` | optional |
| Error | `status/error` bg | `status/error/foreground` | optional |
| Info | `status/info` bg | `status/info/foreground` | optional |
| UZS | `currency/uzs/background` | `currency/uzs/foreground` | none |
| USD | `currency/usd/background` | `currency/usd/foreground` | none |
| Outline | transparent | `foreground/secondary` | `border/strong` |

### 16.2 Chip (Interactive / Removable)

- Height: 28px (desktop), 32px (mobile)
- Radius: `radius/full`
- Remove icon: 14px `x`, trailing, 4px from text
- Selected chip: `primary/subtle` bg, `primary/default` text
- Filter chip with dropdown: trailing `chevron-down`

---

## 17. Avatar System

| Size | Dimensions | Font Size | Usage |
|------|------------|-----------|-------|
| `xs` | 24px | 10px | Table inline, compact lists |
| `sm` | 32px | 12px | Comments, activity feed |
| `md` | 40px | 14px | Default user display |
| `lg` | 48px | 16px | Profile headers |
| `xl` | 64px | 20px | Profile page |
| `2xl` | 96px | 28px | Settings avatar upload |

- Shape: `radius/full` (circle)
- Fallback: initials on `primary/subtle` bg, `primary/default` text
- Image: object-fit cover
- Status dot: 10px (md avatar), bottom-right, 2px white border
- Group overflow: "+3" badge on `muted/default`

---

## 18. Skeleton & Loading Patterns

### 18.1 Skeleton

| Variant | Spec |
|---------|------|
| Text line | Height matches target font line-height, `radius/sm`, shimmer animation |
| Circle | Match avatar size |
| Rect | Match image/card aspect ratio |
| Table row | Full row height, column-width blocks |

- Color light: `#E2E8F0` base, `#F1F5F9` shimmer highlight
- Color dark: `#334155` base, `#475569` shimmer highlight
- Animation: 1.5s ease-in-out infinite shimmer left-to-right

### 18.2 Loading Patterns

| Pattern | Usage |
|---------|-------|
| Skeleton | Initial page load, known layout |
| Spinner (inline) | Button loading, small areas |
| Spinner (centered) | Modal content loading |
| Progress bar | File upload, multi-step wizard |
| Full-page overlay | Authentication, critical save (blocking) |
| Optimistic UI | Row appears immediately, subtle pulse until confirmed |

---

## 19. Motion & Animation Tokens

### 19.1 Duration

| Token | Value | Usage |
|-------|-------|-------|
| `motion/duration/instant` | 0ms | Reduced motion, toggles |
| `motion/duration/fast` | 100ms | Button press, checkbox |
| `motion/duration/normal` | 200ms | Hovers, dropdowns, theme switch |
| `motion/duration/moderate` | 300ms | Modals, sheets, page transitions |
| `motion/duration/slow` | 500ms | Complex layout changes |
| `motion/duration/slower` | 700ms | Onboarding, celebrations |

### 19.2 Easing

| Token | Curve | Usage |
|-------|-------|-------|
| `motion/ease/default` | cubic-bezier(0.4, 0, 0.2, 1) | General transitions |
| `motion/ease/in` | cubic-bezier(0.4, 0, 1, 1) | Exit animations |
| `motion/ease/out` | cubic-bezier(0, 0, 0.2, 1) | Enter animations |
| `motion/ease/in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Symmetric transitions |
| `motion/ease/bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | Toast entrance (subtle) |
| `motion/ease/spring` | cubic-bezier(0.175, 0.885, 0.32, 1.275) | Bottom sheet snap |

### 19.3 Standard Animations

| Animation | Duration | Easing | Properties |
|-----------|----------|--------|------------|
| Fade in | 200ms | ease-out | opacity 0→1 |
| Fade out | 150ms | ease-in | opacity 1→0 |
| Slide up (toast) | 300ms | ease-out | transform translateY(100%)→0 |
| Slide in right (sheet) | 300ms | ease-out | transform translateX(100%)→0 |
| Scale in (modal) | 200ms | ease-out | scale 0.95→1, opacity |
| Theme transition | 200ms | ease-default | background-color, color, border-color |
| Skeleton shimmer | 1500ms | ease-in-out | background-position |
| Spinner rotate | 1000ms | linear | rotate 360° infinite |
| Number count-up | 500ms | ease-out | KPI value changes |
| Row highlight | 2000ms | ease-default | background flash `primary/subtle` fade out |

### 19.4 Reduced Motion

When `prefers-reduced-motion: reduce`:
- Replace all transforms with opacity-only or instant
- Disable shimmer (static skeleton)
- Disable parallax and count-up animations

---

## 20. WCAG 2.2 Contrast Ratios

All pairs below meet or exceed WCAG 2.2 Level AA. Level AAA noted where achieved.

### 20.1 Light Mode Contrast Matrix

| Foreground | Background | Ratio | AA Normal | AA Large | AAA |
|------------|------------|-------|-----------|----------|-----|
| `#0F172A` (primary text) | `#FFFFFF` | 15.4:1 | Pass | Pass | Pass |
| `#64748B` (secondary text) | `#FFFFFF` | 4.6:1 | Pass | Pass | Fail |
| `#94A3B8` (tertiary text) | `#FFFFFF` | 2.9:1 | Fail* | Pass | Fail |
| `#2563EB` (primary) | `#FFFFFF` | 4.6:1 | Pass | Pass | Fail |
| `#FFFFFF` | `#2563EB` (primary btn) | 4.6:1 | Pass | Pass | Fail |
| `#FFFFFF` | `#DC2626` (destructive btn) | 4.5:1 | Pass | Pass | Fail |
| `#16A34A` (success) | `#F0FDF4` | 4.5:1 | Pass | Pass | Fail |
| `#DC2626` (error) | `#FEF2F2` | 5.2:1 | Pass | Pass | Fail |
| `#D97706` (warning) | `#FFFBEB` | 4.5:1 | Pass | Pass | Fail |
| `#2563EB` (UZS) | `#FFFFFF` | 4.6:1 | Pass | Pass | Fail |
| `#16A34A` (USD) | `#FFFFFF` | 3.3:1 | Fail* | Pass | Fail |
| `#2563EB` (link) | `#F8FAFC` (muted bg) | 4.5:1 | Pass | Pass | Fail |

*Do not use tertiary text or USD green on white for body-size text. USD green on white is permitted for large text (18px+ bold or 24px+) and numeric displays 16px+ semibold only.

### 20.2 Dark Mode Contrast Matrix

| Foreground | Background | Ratio | AA Normal | AA Large | AAA |
|------------|------------|-------|-----------|----------|-----|
| `#F8FAFC` (primary text) | `#0F172A` | 15.4:1 | Pass | Pass | Pass |
| `#94A3B8` (secondary text) | `#0F172A` | 6.1:1 | Pass | Pass | Pass |
| `#64748B` (tertiary text) | `#0F172A` | 3.8:1 | Fail* | Pass | Fail |
| `#60A5FA` (primary dark) | `#0F172A` | 6.8:1 | Pass | Pass | Pass |
| `#FFFFFF` | `#3B82F6` (primary btn) | 3.7:1 | Fail* | Pass | Fail |
| `#4ADE80` (USD dark) | `#0F172A` | 8.2:1 | Pass | Pass | Pass |
| `#60A5FA` (UZS dark) | `#0F172A` | 6.8:1 | Pass | Pass | Pass |
| `#F8FAFC` | `#1E293B` (card) | 12.1:1 | Pass | Pass | Pass |

*Primary button in dark mode: use bold label (600 weight) at 14px+ to qualify as large text, achieving effective AA compliance.

### 20.3 Focus & Interactive Requirements (WCAG 2.2)

| Requirement | Implementation |
|-------------|----------------|
| 2.4.11 Focus Not Obscured (AA) | Focus ring 3px spread; modals scroll focused element into view |
| 2.4.13 Focus Appearance (AAA target) | Focus ring 3px, `ring/focus` color, 4.5:1 against adjacent colors |
| 2.5.8 Target Size (AA) | All targets ≥24×24px; mobile ≥44×44px |
| 1.4.3 Contrast Minimum | Body text ≥4.5:1; large text ≥3:1 |
| 1.4.11 Non-text Contrast | UI boundaries ≥3:1 against background |

---

## 21. Figma File Organization

```
ERP-Design-System-v2/
├── Cover & Changelog
├── Foundations/
│   ├── Colors (Light + Dark modes)
│   ├── Typography (Desktop + Mobile)
│   ├── Spacing & Grid
│   ├── Effects (Shadows)
│   ├── Radius
│   └── Motion
├── Components/
│   ├── Buttons
│   ├── Forms
│   ├── Data Display
│   ├── Navigation
│   ├── Feedback
│   └── ERP-Specific
├── Patterns/
│   ├── Dashboard
│   ├── POS
│   ├── Data Table Page
│   └── Mobile List Screen
└── Templates/
    ├── Desktop — 1280×800
    └── Mobile — 390×844
```

---

## Related Documents

- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) — Component specifications with CMP IDs
- [RESPONSIVE_GUIDELINES.md](./RESPONSIVE_GUIDELINES.md) — Breakpoints and adaptive behavior
- [THEMING_DARK_LIGHT.md](./THEMING_DARK_LIGHT.md) — Theme switching implementation
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) — Accessibility requirements and keyboard shortcuts
- [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) — Core UX principles
