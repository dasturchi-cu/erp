# Component Library

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |
| Figma Library | `ERP-Components-v2` |
| Component ID Prefix | `CMP-` |
| Total Components | 52 |

---

## Purpose

This catalog defines every reusable UI component for the ERP platform. Each entry is Figma-ready with anatomy, variants, states, sizing, designer props, platform differences, accessibility requirements, and usage guidance.

**Figma naming:** `CMP-XXX / ComponentName / Variant / State / Size`

**Cross-reference:** All visual tokens reference [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

---

## Component Index

| ID | Component | Category | Platforms |
|----|-----------|----------|-----------|
| CMP-001 | Button | Actions | Desktop, Mobile |
| CMP-002 | Icon Button | Actions | Desktop, Mobile |
| CMP-003 | Button Group | Actions | Desktop, Mobile |
| CMP-004 | Text Input | Forms | Desktop, Mobile |
| CMP-005 | Textarea | Forms | Desktop, Mobile |
| CMP-006 | Select | Forms | Desktop, Mobile |
| CMP-007 | Combobox | Forms | Desktop, Mobile |
| CMP-008 | Checkbox | Forms | Desktop, Mobile |
| CMP-009 | Radio Group | Forms | Desktop, Mobile |
| CMP-010 | Switch | Forms | Desktop, Mobile |
| CMP-011 | Date Picker | Forms | Desktop, Mobile |
| CMP-012 | Date Range Picker | Forms | Desktop, Mobile |
| CMP-013 | Currency Input | Forms | Desktop, Mobile |
| CMP-014 | Search Input | Forms | Desktop, Mobile |
| CMP-015 | File Upload | Forms | Desktop, Mobile |
| CMP-016 | Form Field | Forms | Desktop, Mobile |
| CMP-017 | Data Table | Data Display | Desktop |
| CMP-018 | Pagination | Data Display | Desktop, Mobile |
| CMP-019 | Card | Data Display | Desktop, Mobile |
| CMP-020 | Stat Card (KPI) | Data Display | Desktop, Mobile |
| CMP-021 | List Tile | Data Display | Mobile, Desktop |
| CMP-022 | Empty State | Data Display | Desktop, Mobile |
| CMP-023 | Dialog | Overlay | Desktop, Mobile |
| CMP-024 | Alert Dialog | Overlay | Desktop, Mobile |
| CMP-025 | Sheet (Drawer) | Overlay | Desktop, Mobile |
| CMP-026 | Popover | Overlay | Desktop |
| CMP-027 | Tooltip | Overlay | Desktop |
| CMP-028 | Toast | Feedback | Desktop, Mobile |
| CMP-029 | Banner (Alert) | Feedback | Desktop, Mobile |
| CMP-030 | Badge | Feedback | Desktop, Mobile |
| CMP-031 | Chip | Feedback | Desktop, Mobile |
| CMP-032 | Avatar | Data Display | Desktop, Mobile |
| CMP-033 | Avatar Group | Data Display | Desktop, Mobile |
| CMP-034 | Tabs | Navigation | Desktop, Mobile |
| CMP-035 | Breadcrumbs | Navigation | Desktop |
| CMP-036 | Sidebar | Navigation | Desktop |
| CMP-037 | Top Bar (App Bar) | Navigation | Desktop, Mobile |
| CMP-038 | Bottom Navigation | Navigation | Mobile |
| CMP-039 | Dropdown Menu | Navigation | Desktop, Mobile |
| CMP-040 | Context Menu | Navigation | Desktop |
| CMP-041 | Command Palette | Navigation | Desktop |
| CMP-042 | Skeleton | Feedback | Desktop, Mobile |
| CMP-043 | Spinner | Feedback | Desktop, Mobile |
| CMP-044 | Progress Bar | Feedback | Desktop, Mobile |
| CMP-045 | Chart Container | Data Display | Desktop, Mobile |
| CMP-046 | Accordion | Data Display | Desktop, Mobile |
| CMP-047 | Stepper | Navigation | Desktop, Mobile |
| CMP-048 | Divider | Layout | Desktop, Mobile |
| CMP-049 | Scroll Area | Layout | Desktop |
| CMP-050 | Currency Display | ERP-Specific | Desktop, Mobile |
| CMP-051 | Product Picker | ERP-Specific | Desktop, Mobile |
| CMP-052 | Customer Picker | ERP-Specific | Desktop, Mobile |

---

## Actions

---

### CMP-001 — Button

**Purpose:** Trigger actions, submit forms, navigate within workflows.

**Anatomy:**
1. Container (hit area)
2. Leading icon (optional)
3. Label text
4. Trailing icon (optional)
5. Loading spinner (replaces label when loading)

**Variants:** Primary | Secondary | Outline | Ghost | Destructive | Destructive Outline | Link

**States:** Default | Hover | Pressed | Focus | Disabled | Loading

**Sizes:** xs | sm | md (default) | lg | xl

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `variant` | See variants | Primary |
| `size` | xs–xl | md |
| `label` | String | "Button" |
| `leadingIcon` | Icon name / none | none |
| `trailingIcon` | Icon name / none | none |
| `fullWidth` | boolean | false |
| `disabled` | boolean | false |
| `loading` | boolean | false |

**Desktop vs Mobile:**

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Default height | 36px (md) | 48px (md) |
| Default radius | 6px | 12px |
| Min touch target | 36px | 48px |
| Font | Label/MD 13px | Label/Large 14px |
| Full-width | Dialog footers only | Primary actions common |

**Accessibility:**
- Role: `button`
- Focus ring visible (3px)
- `aria-busy="true"` when loading
- `aria-disabled="true"` when disabled (not just styled)
- Link variant uses `<a>` semantics when href provided

**When to use:** Primary workflow actions, form submission, confirmation.
**When NOT to use:** Navigation between pages (use links); toggling state (use Switch/Chip); multiple exclusive options (use Segmented Control or Radio).

---

### CMP-002 — Icon Button

**Purpose:** Compact icon-only actions in toolbars, tables, and cards.

**Anatomy:** Container | Icon (centered)

**Variants:** Default | Ghost | Outline | Destructive

**States:** Default | Hover | Pressed | Focus | Disabled

**Sizes:** sm (32px) | md (36px) | lg (40px) — Mobile: sm 40px | md 48px | lg 52px

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `icon` | Icon name | required |
| `variant` | See variants | Ghost |
| `size` | sm / md / lg | md |
| `ariaLabel` | String | required |

**Desktop vs Mobile:** Mobile requires 48px minimum hit area; use md or lg. Desktop may use sm in dense tables.

**Accessibility:**
- **Mandatory** `aria-label` — no visible text
- Tooltip on hover (desktop) showing action name
- 3:1 non-text contrast for icon against background

**When to use:** Table row actions, toolbar utilities, close buttons.
**When NOT to use:** Primary CTAs; actions unfamiliar to users without tooltip/label.

---

### CMP-003 — Button Group

**Purpose:** Related actions presented as a visually connected set.

**Anatomy:** Container | Button(s) | Divider (optional between segments)

**Variants:** Default | Segmented (single-select) | Split (primary + dropdown)

**States:** Per-button states; segmented shows one selected

**Sizes:** Matches child button sizes

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `type` | default / segmented / split | default |
| `selectedIndex` | number (segmented) | 0 |
| `options` | string[] | — |

**Desktop vs Mobile:** Segmented controls scroll horizontally on mobile if >3 options. Split button dropdown opens below on desktop, bottom sheet on mobile.

**Accessibility:** Segmented control uses `role="tablist"` or `role="radiogroup"`; arrow keys navigate.

**When to use:** View toggles (list/grid), filter mode selection, split save actions.
**When NOT to use:** Unrelated actions; more than 5 segments (use Tabs or Select).

---

## Forms

---

### CMP-004 — Text Input

**Purpose:** Single-line text, number, email, password entry.

**Anatomy:** Label | Helper text | Container | Prefix | Value/Placeholder | Suffix | Clear button | Error message

**Variants:** Default | Search | Password | Number

**States:** Default | Hover | Focus | Filled | Disabled | Read-only | Error | Success

**Sizes:** sm | md (default) | lg

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `label` | String | — |
| `placeholder` | String | — |
| `helperText` | String | — |
| `errorMessage` | String | — |
| `required` | boolean | false |
| `prefixIcon` | Icon / none | none |
| `suffixIcon` | Icon / none | none |
| `showClear` | boolean | false |
| `disabled` | boolean | false |

**Desktop vs Mobile:**

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Height (md) | 36px | 48px |
| Font size | 14px | 16px (prevents iOS zoom) |
| Autocomplete | Browser native | OS keyboard suggestions |

**Accessibility:** Label linked via `for`/`id`; error in `aria-describedby`; `aria-invalid` on error; required marked visually and semantically.

**When to use:** Names, descriptions, quantities, credentials.
**When NOT to use:** Multi-line content (Textarea); selection from list (Select/Combobox); monetary values (Currency Input).

---

### CMP-005 — Textarea

**Purpose:** Multi-line text entry for notes, descriptions, addresses.

**Variants:** Default | Auto-resize

**States:** Same as Text Input

**Sizes:** min-height 80px (sm), 120px (md), 160px (lg)

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `rows` | number | 4 |
| `maxLength` | number | — |
| `showCharCount` | boolean | false |
| `autoResize` | boolean | false |

**Desktop vs Mobile:** Mobile textarea 16px font minimum; expands on focus if auto-resize.

**Accessibility:** Same as Text Input; character count announced on change if near limit.

**When to use:** Notes, comments, product descriptions.
**When NOT to use:** Single-line data; rich formatting (future: Rich Text Editor).

---

### CMP-006 — Select

**Purpose:** Choose one value from a predefined list.

**Anatomy:** Label | Trigger (closed state) | Dropdown panel | Option items | Group headers

**Variants:** Default | Searchable | Multi-select (with tags)

**States:** Default | Hover | Focus | Open | Disabled | Error

**Sizes:** sm | md | lg

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `options` | {label, value, group?}[] | — |
| `placeholder` | String | "Select..." |
| `searchable` | boolean | false |
| `multiple` | boolean | false |

**Desktop vs Mobile:** Desktop uses dropdown panel; mobile uses full-screen picker sheet or native OS picker for simple lists.

**Accessibility:** `role="combobox"` or `listbox`; type-ahead in searchable mode; `aria-expanded` on trigger.

**When to use:** Status filters, category selection, enum fields (<50 options).
**When NOT to use:** Large datasets (use Combobox); boolean (use Switch); 2–4 options visible (use Radio Group).

---

### CMP-007 — Combobox

**Purpose:** Searchable selection with async data loading for large datasets.

**Anatomy:** Label | Input with dropdown | Option list | Loading state | Empty state | Create-new action (optional)

**Variants:** Single | Multi

**States:** Default | Focus | Open | Loading | Empty | Error

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `async` | boolean | true |
| `minChars` | number | 2 |
| `debounceMs` | number | 300 |
| `allowCreate` | boolean | false |
| `renderOption` | template | label + subtitle |

**Desktop vs Mobile:** Desktop inline dropdown; mobile full-screen search overlay with keyboard auto-focus.

**Accessibility:** `aria-autocomplete="list"`; announce result count; arrow key navigation in list.

**When to use:** Product search, customer search, company switcher.
**When NOT to use:** Small static lists (<10 items, use Select); free text (use Text Input).

---

### CMP-008 — Checkbox

**Purpose:** Multiple independent selections or boolean consent.

**Anatomy:** Box (16/20px) | Check icon | Label | Helper text

**States:** Unchecked | Checked | Indeterminate | Disabled

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `checked` | boolean / indeterminate | false |
| `label` | String | — |

**Desktop vs Mobile:** 16px desktop, 20px mobile checkbox size. Mobile label tap area includes full row.

**Accessibility:** `role="checkbox"`; `aria-checked="mixed"` for indeterminate; label clickable.

**When to use:** Bulk table selection, permissions, multi-filter.
**When NOT to use:** Mutually exclusive options (Radio); on/off settings (Switch).

---

### CMP-009 — Radio Group

**Purpose:** Single selection from 2–6 visible options.

**Anatomy:** Group label | Radio items (circle + label)

**States:** Unselected | Selected | Disabled (per item)

**Layout:** Vertical (default) | Horizontal (max 4)

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `options` | {label, value, description?}[] | — |
| `layout` | vertical / horizontal | vertical |

**Desktop vs Mobile:** Horizontal only if ≤3 options and sufficient width; otherwise vertical.

**Accessibility:** `role="radiogroup"`; `aria-labelledby` on group; arrow keys navigate items.

**When to use:** Payment method, delivery type, report format.
**When NOT to use:** Many options (use Select); multiple selection (Checkbox).

---

### CMP-010 — Switch

**Purpose:** Immediate on/off toggle for settings and feature flags.

**Anatomy:** Track | Thumb | Label | Description (optional)

**States:** Off | On | Disabled

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `checked` | boolean | false |
| `label` | String | — |
| `description` | String | — |

**Desktop vs Mobile:** Track 36×20 desktop, 44×24 mobile.

**Accessibility:** `role="switch"`; `aria-checked`; label associated.

**When to use:** Module enable/disable, notification preferences, active/inactive.
**When NOT to use:** Form submission choices that require Save button; multiple options.

---

### CMP-011 — Date Picker

**Purpose:** Select a single date.

**Anatomy:** Label | Input trigger (with calendar icon) | Calendar popover | Month/year navigation | Day grid

**States:** Default | Focus | Open | Filled | Disabled | Error

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `format` | DD.MM.YYYY / ISO | DD.MM.YYYY |
| `minDate` | date | — |
| `maxDate` | date | — |
| `disabledDates` | date[] | — |

**Desktop vs Mobile:** Desktop inline calendar popover; mobile OS date picker or full-screen calendar.

**Accessibility:** Calendar grid `role="grid"`; arrow keys navigate days; selected date announced.

**When to use:** Invoice date, birth date, report date filter.
**When NOT to use:** Date ranges (Date Range Picker); time-only (Time Picker, future).

---

### CMP-012 — Date Range Picker

**Purpose:** Select start and end dates for reports and filters.

**Anatomy:** Label | Dual inputs | Preset chips | Calendar (dual month on desktop)

**Presets:** Today | Yesterday | Last 7 days | Last 30 days | This month | Last month | Custom

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `presets` | preset[] | all |
| `maxRange` | days | 365 |

**Desktop vs Mobile:** Desktop shows 2-month calendar side-by-side; mobile shows preset list then calendar sheet.

**Accessibility:** Preset buttons are regular buttons; range announced as "March 1 to March 31".

**When to use:** Sales reports, audit log filters, dashboard period.
**When NOT to use:** Single date fields.

---

### CMP-013 — Currency Input

**Purpose:** Monetary value entry with currency formatting and color coding.

**Anatomy:** Label | Currency badge (UZS/USD) | Input | Formatted preview | Left accent bar (currency color)

**Variants:** UZS | USD

**States:** Default | Focus | Filled | Error | Disabled

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `currency` | UZS / USD | UZS |
| `allowNegative` | boolean | false |
| `decimals` | 0 (UZS) / 2 (USD) | auto |

**Desktop vs Mobile:** Same formatting rules; mobile numeric keyboard; currency color accent bar 3px left.

**Accessibility:** `inputmode="decimal"`; currency announced in label ("Amount in UZS"); not color-only (badge shows code).

**When to use:** Prices, payments, discounts, exchange amounts.
**When NOT to use:** Non-monetary numbers (quantity); display-only (Currency Display).

---

### CMP-014 — Search Input

**Purpose:** Filter lists, global search entry, table search.

**Variants:** Default | Command (with keyboard hint) | Expandable (toolbar)

**States:** Default | Focus | Active (has value) | Loading

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `placeholder` | String | "Search..." |
| `showShortcut` | boolean | true (desktop) |
| `debounce` | boolean | true |

**Desktop vs Mobile:** Desktop shows `⌘K` or `Ctrl+K` hint; mobile no shortcut badge; full-width in app bar.

**Accessibility:** `role="search"` on container; `aria-label="Search"` if no visible label.

**When to use:** Table filters, product lookup, customer search.
**When NOT to use:** Form field labeled "Name" (use Text Input variant search only for filter context).

---

### CMP-015 — File Upload

**Purpose:** Upload documents, images, import files.

**Anatomy:** Drop zone | Browse button | File list | Progress per file | Remove action

**Variants:** Drop zone | Button only | Avatar upload (circular)

**States:** Empty | Drag over | Uploading | Complete | Error

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `accept` | mime types | — |
| `maxSize` | MB | 10 |
| `multiple` | boolean | false |

**Desktop vs Mobile:** Desktop drag-and-drop enabled; mobile camera/gallery picker integration.

**Accessibility:** Hidden file input with visible button; upload progress `aria-valuenow`.

**When to use:** Product images, CSV import, receipt attachments.
**When NOT to use:** Text data entry.

---

### CMP-016 — Form Field

**Purpose:** Wrapper composing label, control, helper, and error for any input.

**Anatomy:** Label row (label + optional badge) | Control slot | Helper text | Error message

**Variants:** Default | Inline (label left, control right — desktop settings only)

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `label` | String | required |
| `required` | boolean | false |
| `error` | String | — |
| `layout` | vertical / inline | vertical |

**Desktop vs Mobile:** Inline layout only on desktop ≥1280px for settings pages; always vertical on mobile.

**Accessibility:** Single `id` chain linking label, input, helper, error via `aria-describedby`.

**When to use:** Wrap every form control for consistency.
**When NOT to use:** Standalone search in toolbar (no label needed if aria-label set).

---

## Data Display

---

### CMP-017 — Data Table

**Purpose:** Dense tabular data with sort, filter, selection, and pagination.

**Anatomy:** Toolbar | Header row | Body rows | Selection column | Actions column | Footer (pagination + bulk actions)

**Variants:** Default | Dense | Comfortable | Expandable rows

**States (row):** Default | Hover | Selected | Active | Disabled | Error

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `density` | dense / comfortable | dense |
| `selectable` | boolean | true |
| `sortable` | boolean | true |
| `stickyHeader` | boolean | true |
| `columns` | column def[] | — |

**Desktop vs Mobile:** Desktop only for full table. Mobile replaces with List Tile cards (see RESPONSIVE_GUIDELINES). Tablet: horizontal scroll with priority columns.

**Accessibility:** `<th scope="col">`; sort announced; select-all checkbox in header; keyboard: Tab between interactive cells, arrow keys with roving tabindex optional.

**When to use:** Admin lists, inventory, sales history, audit logs.
**When NOT to use:** Mobile primary views; <3 columns and <10 rows (use simple list).

---

### CMP-018 — Pagination

**Purpose:** Navigate paged data sets.

**Anatomy:** Row count label | Rows-per-page select | Page buttons | Prev/Next

**Variants:** Full (desktop) | Compact (mobile)

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `page` | number | 1 |
| `pageSize` | 10/25/50/100 | 25 |
| `total` | number | — |

**Desktop vs Mobile:** Desktop shows page numbers; mobile shows "Page X of Y" with prev/next only.

**Accessibility:** `aria-label` on nav; current page `aria-current="page"`.

**When to use:** Any paginated table or list.
**When NOT to use:** Infinite scroll lists (show loading indicator instead).

---

### CMP-019 — Card

**Purpose:** Group related content with visual boundary.

**Anatomy:** Header (title + action) | Body | Footer (optional)

**Variants:** Default | Interactive (clickable) | Outlined | Elevated

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `title` | String | — |
| `subtitle` | String | — |
| `padding` | default / none | default |
| `interactive` | boolean | false |

**Desktop vs Mobile:** Radius 6px desktop, 12px mobile. Mobile cards often full-bleed with 16px margin.

**Accessibility:** Interactive cards: `role="button"` or wrapped in link; heading level appropriate.

**When to use:** Dashboard sections, form groups, detail panels.
**When NOT to use:** Single line of data (use List Tile); tabular data (Data Table).

---

### CMP-020 — Stat Card (KPI)

**Purpose:** Display key metric with trend and optional sparkline.

**Anatomy:** Label | Value (large number) | Trend indicator | Comparison period | Sparkline (optional) | Currency badge (optional)

**Variants:** Default | Currency (UZS/USD) | Percentage | Count

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `label` | String | — |
| `value` | String/number | — |
| `trend` | up / down / neutral | — |
| `trendValue` | String | "+12%" |
| `sparkline` | boolean | false |
| `currency` | UZS / USD / none | none |

**Desktop vs Mobile:** Desktop 4-column grid; mobile stacked full-width, Number/Large 32px.

**Accessibility:** Trend not color-only — includes icon and text; value readable by screen readers as complete string.

**When to use:** Dashboard KPIs, summary reports.
**When NOT to use:** Detailed breakdowns (use Chart); single numbers inline in tables.

---

### CMP-021 — List Tile

**Purpose:** Single record in a scrollable list.

**Anatomy:** Leading (avatar/icon) | Title | Subtitle | Trailing (badge/amount/action) | Chevron (optional)

**Variants:** Default | Compact | Multi-line

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `title` | String | — |
| `subtitle` | String | — |
| `leading` | avatar / icon / none | none |
| `trailing` | text / badge / icon | — |
| `showChevron` | boolean | false |

**Desktop vs Mobile:** Mobile primary list pattern (replaces table). Desktop used in sidebars, pickers, notification lists. Min height 48px mobile, 40px desktop.

**Accessibility:** Entire row tappable; `role="listitem"` within `list`; trailing actions have own labels.

**When to use:** Mobile data lists, picker results, notification items.
**When NOT to use:** Multi-column comparable data on desktop (use Data Table).

---

### CMP-022 — Empty State

**Purpose:** Communicate no data and guide next action.

**Anatomy:** Illustration/icon (48–64px) | Title | Description | Primary CTA | Secondary CTA (optional)

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `icon` | Icon name | `inbox` |
| `title` | String | "No data" |
| `description` | String | — |
| `actionLabel` | String | — |

**Desktop vs Mobile:** Same content; mobile CTAs full-width stacked.

**Accessibility:** `role="status"` or region with `aria-label`; heading for title.

**When to use:** Empty tables, search no results, first-time setup.
**When NOT to use:** Loading state (Skeleton); error state (Banner/Alert).

---

### CMP-050 — Currency Display

**Purpose:** Read-only formatted monetary value with currency color.

**Variants:** UZS | USD | Negative | Mixed total

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `amount` | number | — |
| `currency` | UZS / USD | UZS |
| `size` | sm / md / lg | md |
| `showSign` | boolean | false |

**Desktop vs Mobile:** Same formatting; size tokens from typography scale.

**Accessibility:** Full amount announced including currency name; color is supplementary to currency code/symbol.

**When to use:** Cart totals, invoice lines, dashboard revenue.
**When NOT to use:** Editable amounts (Currency Input).

---

### CMP-051 — Product Picker

**Purpose:** Search and select products by SKU, barcode, or name.

**Anatomy:** Search input | Barcode scan button (mobile) | Result list (image, name, SKU, price, stock) | Selected product chip

**Variants:** Single | Multi (cart)

**Desktop vs Mobile:** Desktop inline combobox + Data Table for bulk; mobile full-screen search with barcode FAB.

**Accessibility:** Scan button labeled "Scan barcode"; results announce stock status.

**When to use:** POS, purchase orders, inventory adjustment.
**When NOT to use:** Category browsing only (Product Grid pattern).

---

### CMP-052 — Customer Picker

**Purpose:** Search customers by phone, name, or ID.

**Anatomy:** Phone input with mask | Search results (name, phone, balance) | Quick-create link

**Desktop vs Mobile:** Phone autocomplete prominent; mobile uses tel keyboard.

**Accessibility:** Phone format announced; balance uses Currency Display semantics.

**When to use:** POS customer assignment, sales orders.
**When NOT to use:** Supplier selection (reuse with different data source label).

---

## Overlay

---

### CMP-023 — Dialog

**Purpose:** Modal overlay for forms, details, and focused tasks.

**Anatomy:** Scrim | Panel | Header | Body (scrollable) | Footer

**Sizes:** sm (400) | md (560) | lg (720) | xl (900) | full

**States:** Open | Closing

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `size` | sm–full | md |
| `dismissable` | boolean | true |
| `title` | String | required |

**Desktop vs Mobile:** Desktop centered modal; mobile → bottom sheet or full-screen based on size.

**Accessibility:** Focus trap; `role="dialog"`; `aria-modal="true"`; return focus on close; Escape dismisses.

**When to use:** Create/edit forms, detail quick-view, multi-step wizards.
**When NOT to use:** Non-blocking info (Toast); navigation (use page); filters (Sheet).

---

### CMP-024 — Alert Dialog

**Purpose:** Interrupt user for confirmation before irreversible actions.

**Anatomy:** Icon (optional) | Title | Description | Cancel button | Confirm button

**Variants:** Info | Warning | Destructive

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `variant` | info / warning / destructive | warning |
| `confirmLabel` | String | "Confirm" |
| `requireTypedConfirmation` | boolean | false (true for delete org) |

**Desktop vs Mobile:** Destructive confirm full-width on mobile; typed confirmation uses full-width input.

**Accessibility:** Focus on cancel by default (destructive); confirm requires explicit activation; `aria-describedby` for description.

**When to use:** Delete records, void sales, logout all sessions.
**When NOT to use:** Informational messages (Toast); complex forms (Dialog).

---

### CMP-025 — Sheet (Drawer)

**Purpose:** Non-modal or semi-modal side panel for filters, details, cart.

**Anatomy:** Scrim (optional) | Panel | Drag handle (mobile) | Header | Body | Footer

**Positions:** Right (default) | Left | Bottom (mobile)

**Sizes:** sm (320) | md (480) | lg (640) | xl (800)

**Desktop vs Mobile:** Desktop right-side sheet; mobile bottom sheet with snap points.

**Accessibility:** `role="dialog"` or `complementary`; focus trap when modal; swipe dismiss announces.

**When to use:** Filter panels, POS cart, record detail without leaving list.
**When NOT to use:** Simple confirmations (Alert Dialog).

---

### CMP-026 — Popover

**Purpose:** Contextual floating content anchored to a trigger.

**Anatomy:** Trigger | Floating panel | Arrow (optional)

**Desktop only** for hover-rich interactions; mobile converts to bottom sheet or full-screen for complex content.

**Accessibility:** `aria-expanded` on trigger; dismiss on Escape; click outside closes.

**When to use:** Quick filters, emoji picker, density toggle, column picker.
**When NOT to use:** Critical actions; mobile-primary flows.

---

### CMP-027 — Tooltip

**Purpose:** Brief supplementary text on hover/focus.

**Anatomy:** Trigger | Tooltip bubble

**Delay:** 300ms show, 0ms hide

**Desktop only.** Mobile uses no tooltips — use visible labels or long-press context menu.

**Accessibility:** `role="tooltip"`; `aria-describedby` on focus; must not contain interactive elements.

**When to use:** Icon button labels, truncated text full value, keyboard shortcut hints.
**When NOT to use:** Essential information; mobile interfaces.

---

## Feedback

---

### CMP-028 — Toast

**Purpose:** Brief non-blocking feedback after actions.

**Variants:** Success | Error | Warning | Info

**States:** Entering | Visible | Exiting

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `variant` | success/error/warning/info | info |
| `title` | String | — |
| `description` | String | — |
| `action` | {label, onClick} | — |
| `duration` | ms / persistent | 5000 |

**Desktop vs Mobile:** Position bottom-right vs bottom-center above nav.

**Accessibility:** `role="status"` (info/success) or `role="alert"` (error); `aria-live="polite"` or `"assertive"`.

**When to use:** Save confirmation, copy to clipboard, non-critical errors.
**When NOT to use:** Errors requiring user action (Dialog); persistent system status (Banner).

---

### CMP-029 — Banner (Alert)

**Purpose:** Persistent inline message within page content.

**Variants:** Info | Success | Warning | Error

**Anatomy:** Icon | Title | Description | Action link | Dismiss button

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `dismissable` | boolean | true |
| `action` | {label} | — |

**Desktop vs Mobile:** Full content width; mobile stacks action below text.

**Accessibility:** `role="alert"` for error/warning; `role="status"` for info; dismiss button labeled.

**When to use:** Offline mode, subscription expiry, maintenance notice, form-level errors.
**When NOT to use:** Transient success (Toast).

---

### CMP-030 — Badge

**Purpose:** Compact read-only status or category label.

**Variants:** Default | Success | Warning | Error | Info | UZS | USD | Outline

**Sizes:** sm | md | lg

**Accessibility:** Text content required; color not sole indicator.

**When to use:** Order status, stock level, role labels.
**When NOT to use:** Interactive filters (Chip); large text blocks.

---

### CMP-031 — Chip

**Purpose:** Interactive filter, tag, or removable selection.

**Variants:** Filter | Input (removable tag) | Choice (selectable)

**States:** Default | Selected | Disabled

**Accessibility:** `role="option"` or button; remove button has `aria-label="Remove [tag]"`.

**When to use:** Active filters, selected categories, multi-select display.
**When NOT to use:** Static status (Badge).

---

### CMP-042 — Skeleton

**Purpose:** Placeholder loading state matching final layout.

**Variants:** Text | Circle | Rect | Table-row | Card | Stat-card

**Accessibility:** `aria-busy="true"` on parent; `aria-label="Loading"`; replaced by content when loaded.

**When to use:** Initial page load with known layout.
**When NOT to use:** Button actions (Spinner in button); unknown layout (Spinner centered).

---

### CMP-043 — Spinner

**Purpose:** Indeterminate loading indicator.

**Sizes:** sm (16px) | md (24px) | lg (32px)

**Accessibility:** `role="status"`; `aria-label="Loading"`.

**When to use:** Button loading, content areas, pull-to-refresh.
**When NOT to use:** Full page with known shape (Skeleton).

---

### CMP-044 — Progress Bar

**Purpose:** Determinate progress for uploads and multi-step processes.

**Variants:** Default | Striped (active) | With label

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `value` | 0–100 | 0 |
| `showLabel` | boolean | false |

**Accessibility:** `role="progressbar"`; `aria-valuenow/min/max`.

**When to use:** File upload, wizard steps, sync progress.
**When NOT to use:** Indeterminate wait (Spinner).

---

### CMP-045 — Chart Container

**Purpose:** Wrapper for dashboard and report charts.

**Anatomy:** Title | Subtitle (date range) | Chart area | Legend | Tooltip template

**Chart types:** Line | Area | Bar | Stacked Bar | Pie | Donut | Combo | Sparkline

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `type` | chart type | line |
| `height` | 240 / 320 / 400 | 240 |
| `showLegend` | boolean | true |
| `currency` | UZS/USD/none | none |

**Desktop vs Mobile:** Desktop full legend below; mobile simplified legend (max 4 items) or swipeable series.

**Accessibility:** Data table alternative required; summary text "Revenue increased 12%"; patterns distinguishable without color.

**When to use:** Dashboard trends, report visualizations.
**When NOT to use:** Single KPI (Stat Card); precise data lookup (Data Table).

---

## Navigation

---

### CMP-034 — Tabs

**Purpose:** Switch between related content sections without page navigation.

**Variants:** Underline (default) | Pills | Vertical (sidebar context)

**States:** Default | Hover | Active | Disabled

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `tabs` | {label, icon?}[] | — |
| `variant` | underline / pills | underline |

**Desktop vs Mobile:** Desktop underline tabs; mobile scrollable horizontal tabs or segment control for ≤4 tabs.

**Accessibility:** `role="tablist"`; `aria-selected`; arrow keys switch tabs; panel `role="tabpanel"`.

**When to use:** Record detail sections, settings categories, report views.
**When NOT to use:** Unrelated modules (Sidebar nav); >8 tabs (use Select or sidebar).

---

### CMP-035 — Breadcrumbs

**Purpose:** Show hierarchical location within application.

**Anatomy:** Item links separated by chevron or slash

**Desktop only** (hidden on mobile — replaced by back button in App Bar).

**Accessibility:** `nav` with `aria-label="Breadcrumb"`; current page `aria-current="page"`.

**When to use:** Deep admin pages, nested settings.
**When NOT to use:** Mobile screens; flat modules.

---

### CMP-036 — Sidebar

**Purpose:** Primary application navigation on desktop.

**Anatomy:** Logo | Company switcher | Nav groups | Nav items (icon + label) | Collapse toggle | User menu footer

**States:** Expanded (240px) | Collapsed (64px, icons only)

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `collapsed` | boolean | false |
| `activeItem` | string | — |
| `groups` | {label, items[]}[] | — |

**Desktop only.** Mobile uses Bottom Navigation.

**Accessibility:** `nav` landmark; `aria-current="page"` on active; collapse toggle labeled; keyboard navigable.

**When to use:** Desktop primary navigation.
**When NOT to use:** Mobile; contextual sub-navigation (use Tabs).

---

### CMP-037 — Top Bar (App Bar)

**Purpose:** Global header with page title, search, and user actions.

**Anatomy:** Menu toggle (tablet) | Breadcrumb/Title | Search | Notifications | Connection indicator | User avatar menu

**Height:** 56px both platforms

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `title` | String | — |
| `showSearch` | boolean | true |
| `showBack` | boolean | false (mobile sub-pages) |

**Desktop vs Mobile:** Desktop shows breadcrumb + global search; mobile shows back arrow + screen title + overflow menu.

**Accessibility:** `header` landmark; skip link target; notification badge count announced.

**When to use:** Every authenticated screen.
**When NOT to use:** POS fullscreen mode (minimal chrome variant).

---

### CMP-038 — Bottom Navigation

**Purpose:** Primary mobile navigation between top-level modules.

**Anatomy:** 3–5 tab items (icon + label) | Active indicator

**Tabs:** Dashboard | POS | Products | Customers | More

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `activeTab` | string | — |
| `items` | max 5 | — |

**Mobile only.**

**Accessibility:** `nav` landmark; `aria-current="page"`; labels always visible (not icon-only).

**When to use:** Mobile root-level module switching.
**When NOT to use:** Desktop; sub-page navigation (use back + tabs).

---

### CMP-039 — Dropdown Menu

**Purpose:** List of actions or links triggered by button.

**Anatomy:** Trigger | Menu panel | Menu items (icon + label + shortcut) | Separators | Submenu (optional)

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `items` | {label, icon?, shortcut?, destructive?}[] | — |
| `align` | start / end | end |

**Desktop vs Mobile:** Desktop dropdown; mobile action sheet from bottom.

**Accessibility:** Arrow keys navigate; type-ahead; `role="menu"`; disabled items `aria-disabled`.

**When to use:** Row actions (···), user menu, export format picker.
**When NOT to use:** Single action (Button); navigation (Sidebar).

---

### CMP-040 — Context Menu

**Purpose:** Right-click menu for contextual actions on elements.

**Desktop only.** Mobile equivalent: long-press action sheet.

**Accessibility:** Opens on Shift+F10 or context menu key; same menu pattern as Dropdown.

**When to use:** Table row right-click, kanban cards (future).
**When NOT to use:** Mobile; primary action discovery.

---

### CMP-041 — Command Palette

**Purpose:** Global search and command launcher (Ctrl+K).

**Anatomy:** Modal overlay | Search input | Grouped results (Pages, Actions, Recent) | Keyboard hints footer

**Desktop only.**

**Accessibility:** `role="combobox"`; results `role="listbox"`; Escape closes; focus on open.

**When to use:** Power user navigation, quick actions.
**When NOT to use:** Mobile (use Search Input in App Bar).

---

## Layout & Structure

---

### CMP-032 — Avatar

**Purpose:** User or entity visual identity.

**Sizes:** xs (24) | sm (32) | md (40) | lg (48) | xl (64) | 2xl (96)

**Variants:** Image | Initials | Icon fallback

**States:** Default | With status dot (online/offline)

**Accessibility:** `alt` text with person name; decorative if accompanying visible name.

**When to use:** User menu, comments, assignment fields.
**When NOT to use:** Product images (use Product Thumbnail pattern).

---

### CMP-033 — Avatar Group

**Purpose:** Show multiple assignees or participants with overflow count.

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `max` | number | 4 |
| `size` | avatar size | sm |
| `overflow` | "+N" badge | auto |

**Accessibility:** All names available in tooltip or screen reader text on group.

**When to use:** Team assignments, shared records.
**When NOT to use:** Single user (Avatar).

---

### CMP-046 — Accordion

**Purpose:** Expandable sections for dense settings or FAQ.

**Anatomy:** Header (title + chevron) | Collapsible body

**Variants:** Single expand | Multiple expand

**Accessibility:** `aria-expanded`; header is `button`; panel `role="region"`.

**When to use:** Settings groups, filter sections, help content.
**When NOT to use:** Primary navigation (Sidebar/Tabs).

---

### CMP-047 — Stepper

**Purpose:** Multi-step wizard progress indicator.

**Variants:** Horizontal | Vertical

**States per step:** Complete | Active | Upcoming | Error

| Designer Prop | Values | Default |
|---------------|--------|---------|
| `steps` | {label, description?}[] | — |
| `currentStep` | number | 0 |

**Desktop vs Mobile:** Horizontal max 4 steps; mobile vertical or condensed dots.

**Accessibility:** `aria-current="step"` on active; step labels announced.

**When to use:** Onboarding, multi-page create flows.
**When NOT to use:** Simple 2-step (use Dialog with back/next).

---

### CMP-048 — Divider

**Purpose:** Visual separation between content sections.

**Variants:** Horizontal | Vertical | With label

**Accessibility:** `role="separator"` or decorative (`aria-hidden`).

**When to use:** Form sections, menu groups, card footers.
**When NOT to use:** When whitespace alone suffices.

---

### CMP-049 — Scroll Area

**Purpose:** Custom scrollable container with styled scrollbars.

**Desktop only** (mobile uses native scroll).

**When to use:** Sidebar nav overflow, dropdown menus, code blocks.
**When NOT to use:** Full page scroll (native).

---

## Figma Component Checklist

For each component above, the Figma library must include:

- [ ] All variants as component properties
- [ ] All states as component variants (or interactive component connections)
- [ ] Light and Dark mode variable bindings
- [ ] Desktop and Mobile size frames
- [ ] Auto-layout with spacing tokens applied
- [ ] Component description with CMP-ID
- [ ] Link to this document section

---

## Related Documents

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — Tokens and foundations
- [RESPONSIVE_GUIDELINES.md](./RESPONSIVE_GUIDELINES.md) — Breakpoint behavior
- [DESKTOP_UI_SPEC.md](./DESKTOP_UI_SPEC.md) — Desktop screen templates
- [MOBILE_UI_SPEC.md](./MOBILE_UI_SPEC.md) — Mobile screen templates
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) — Platform accessibility requirements
