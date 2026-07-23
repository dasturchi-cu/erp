# Admin Panel UX Specification

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Figma Handoff |
| Last Updated | 2026-06-17 |
| Platform | Windows Desktop (Electron), Future macOS; Tablet read-heavy; Mobile limited |
| Figma Page | `05 — Admin Panel` |
| Related Module | [ADMIN_PANEL.md](../08-modules/ADMIN_PANEL.md) |

---

## 1. Purpose

This document defines **Figma-ready UX specifications** for the entire Admin Panel: layout, navigation, wireframes per breakpoint, data tables, forms, modals, confirmation patterns, destructive actions, and real-time behaviors. Admin Panel is **desktop-first**; mobile provides read-only and emergency actions only.

**Access gate**: `admin.access` permission. Individual sections require granular `admin.*` permissions.

**Out of scope**: API implementation, server logic, code.

---

## 2. Figma Setup

### 2.1 Frame Naming

```
Admin / {Section} / {Breakpoint} / {State}

Examples:
  Admin / Users / Desktop / List Default
  Admin / Modules / Desktop / Disable Confirm Modal
  Admin / Monitoring / Tablet / Live
```

### 2.2 Base Frame Sizes

| Breakpoint | Frame Size | Notes |
|------------|------------|-------|
| Desktop XL | 1536 × 900 | Primary design target |
| Desktop LG | 1280 × 800 | Minimum admin layout |
| Tablet | 768 × 1024 | Collapsed nav, stacked panels |
| Mobile | 390 × 844 | Emergency actions only |

### 2.3 Admin Shell Layout (Desktop)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TopBar (56px) — global                                                      │
├────────┬───────────────────────────────────────────────────────────────────┤
│ Side   │ Breadcrumbs: Administration > Users                                 │
│ bar    ├───────────────────────────────────────────────────────────────────┤
│        │ SECTION HEADER                                                    │
│ 240px  │  {Section Title}                    [Primary Action] [···]         │
│        ├───────────────────────────────────────────────────────────────────┤
│        │ FILTER BAR (optional, 48–56px)                                    │
│        ├───────────────────────────────────────────────────────────────────┤
│        │ MAIN CONTENT — table, cards, or split panel                       │
│        │                                                                   │
└────────┴───────────────────────────────────────────────────────────────────┘
```

### 2.4 Admin Sidebar Sub-Navigation

When user enters `/admin`, sidebar highlights **Administration** and shows sub-items:

| Order | Label | Route | Icon | Permission |
|-------|-------|-------|------|------------|
| 0 | Control Center | `/admin` | `LayoutDashboard` | `admin.access` |
| 1 | Users | `/admin/users` | `Users` | `admin.users.view` |
| 2 | Roles | `/admin/roles` | `Shield` | `admin.roles.view` |
| 3 | Permissions | `/admin/permissions` | `Key` | `admin.roles.view` |
| 4 | Devices | `/admin/devices` | `Monitor` | `admin.devices.view` |
| 5 | Sessions | `/admin/sessions` | `Radio` | `admin.sessions.view` |
| 6 | Companies | `/admin/companies` | `Building2` | `admin.companies.view` |
| 7 | Branches | `/admin/branches` | `MapPin` | `admin.companies.view` |
| 8 | Modules | `/admin/modules` | `Puzzle` | `admin.modules.view` |
| 9 | Audit Logs | `/admin/audit-logs` | `ScrollText` | `admin.audit.view` |
| 10 | Backup Center | `/admin/backups` | `HardDrive` | `admin.backups.view` |
| 11 | Monitoring | `/admin/monitoring` | `Activity` | `admin.monitoring` |

Items without permission are **hidden**, not disabled.

---

## 3. Shared Admin Patterns

### 3.1 Section Header

| Element | Spec |
|---------|------|
| Title | `heading-1` 30px / 700 |
| Description | `body` 14px muted, one line below title |
| Primary action | `Button` primary, right-aligned, e.g. "+ Create User" |
| Overflow menu | `···` ghost button — Export, Refresh, column settings |

### 3.2 Data Tables (`DataTable`)

| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| Row height | 40px | 44px | N/A (cards) |
| Header height | 44px | 44px | — |
| Font | `body` 14px | 14px | 16px in cards |
| Checkbox column | 40px | 40px | Per-card checkbox |
| Actions column | 120px, icon buttons | 80px | Overflow menu |
| Pagination | Bottom right, 25/50/100 | Same | Infinite scroll |
| Sort | Click header; arrow indicator | Same | Sort bottom sheet |
| Empty | `EmptyState` centered in table area | Same | Same |

### 3.3 Filter Bar

| Property | Value |
|----------|-------|
| Height | 48px min |
| Background | `--muted` subtle or transparent |
| Layout | Horizontal flex, wrap on narrow |
| Clear filters | Text link, appears when any filter active |
| Search | `Input` search variant, 240px, debounce 300ms |

### 3.4 Status Badges

| Status | Background | Text | Border |
|--------|------------|------|--------|
| ACTIVE | green 10% | `--success` | none |
| INACTIVE | slate 10% | `--muted-foreground` | none |
| BLOCKED | red 10% | `--destructive` | none |
| SUSPENDED | amber 10% | `--warning` | none |
| ONLINE | green dot 8px + text | — | — |
| OFFLINE | gray dot | — | — |

### 3.5 Modal Sizes

| Type | Width | Usage |
|------|-------|-------|
| Confirm | 400px | Block, delete, disable |
| Form SM | 480px | Rename, quick edit |
| Form MD | 560px | Create user, assign company |
| Form LG | 720px | Permission matrix excerpt |
| Full screen (mobile) | 100% | All modals on mobile |

### 3.6 Destructive Action Pattern (Global)

**Always** use two-step confirmation for irreversible or high-impact actions:

1. User triggers action (button or row menu)
2. **Confirm dialog** opens:
   - Title: imperative, e.g. "Block user?"
   - Body: consequences listed as bullets
   - Optional: reason `Textarea` (required for block/suspend)
   - Cancel: secondary button (left)
   - Confirm: destructive button (right), label mirrors action
3. On confirm: button shows spinner; dialog closes on success
4. Toast confirms outcome
5. Table row updates in place (no full reload)

**Confirm dialog wireframe:**

```
┌─────────────────────────────────────────┐
│  Block user?                         ✕  │
├─────────────────────────────────────────┤
│  This will immediately:                 │
│  • Log out all active sessions          │
│  • Prevent future sign-ins              │
│  • Notify the user by email (if set)    │
│                                         │
│  Reason *                               │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│              [ Cancel ]  [ Block User ] │
└─────────────────────────────────────────┘
```

### 3.7 Real-Time Admin Updates (Global)

| Mechanism | Behavior |
|-----------|----------|
| WebSocket | Admin subscribes to `admin.*` company-scoped or platform events |
| Live badge | Sections with live data show pulsing green dot in sidebar sub-item |
| Row highlight | New/changed rows flash `--primary` 10% background 2s |
| Counts | Header badges update (e.g. "Active Sessions (12)" → "(13)") |
| Toast | Critical events: "New device registered — POS-02" |
| Polling fallback | Monitoring section: 30s interval if WS unavailable |

---

## 4. Admin Control Center (Overview Dashboard)

**Route**: `/admin`  
**Permission**: `admin.access`

### 4.1 Purpose

At-a-glance platform health and quick links to admin tasks. Not a business KPI dashboard — operational focus only.

### 4.2 Desktop Wireframe (12-column grid)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Admin Control Center                                                      │
│  Platform overview and quick actions                                       │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│ Active Users │ Active       │ Companies    │ Failed Jobs  │ Last Backup  │
│ 24           │ Sessions 12  │ 5 active     │ 0            │ 8h ago ✓     │
├──────────────┴──────────────┴──────────────┴──────────────┴──────────────┤
│ System Health (8 col)              │ Quick Actions (4 col)                 │
│ [API uptime] [Response time chart] │ [Create User] [View Sessions]         │
│                                    │ [Run Backup] [Audit Logs]             │
├────────────────────────────────────┴───────────────────────────────────────┤
│ Realtime Activity Stream (12 col)                                        │
│ · User login · Device registered · Module disabled · ...                   │
├──────────────────────────────────────────────────────────────────────────┤
│ Alerts (6 col)                    │ Recent Errors (6 col)                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Stat Cards (5 across, 2.4 col each at xl)

| Card | Metric | Drill-down |
|------|--------|------------|
| Active Users | Users with session in last 15 min | `/admin/sessions` |
| Active Sessions | Count | `/admin/sessions` |
| Companies | Active / total | `/admin/companies` |
| Failed Jobs | Queue failures 24h | `/admin/monitoring?tab=jobs` |
| Last Backup | Relative time + status icon | `/admin/backups` |

### 4.4 System Health Panel

- API uptime: circular progress, green ≥99.9%, amber ≥99%, red below
- Response time: sparkline p50/p95 last 1h
- DB pool: progress bar % utilized
- WebSocket connections: count

### 4.5 Quick Actions

| Button | Permission | Action |
|--------|------------|--------|
| Create User | `admin.users.create` | Opens create user modal |
| View Sessions | `admin.sessions.view` | Navigate |
| Run Backup | `admin.backups.manage` | Confirm → trigger manual backup |
| Audit Logs | `admin.audit.view` | Navigate |

### 4.6 Realtime Activity Stream

- Same visual pattern as dashboard activity feed
- Admin events: logins, blocks, module changes, backup complete
- Max 50 items; "View all" → Audit Logs filtered to last 1h

### 4.7 Tablet

- Stat cards: 2 per row
- Health + Quick actions stack
- Activity full width

### 4.8 Mobile

- Read-only summary cards
- Quick actions as list tiles
- No manual backup trigger on mobile (desktop only)

---

## 5. User Management

**Route**: `/admin/users`  
**Permissions**: `admin.users.view`, `admin.users.create`, `admin.users.update`, `admin.users.block`, `admin.users.assign`

### 5.1 List View — Desktop Wireframe

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Users                                                    [+ Create User]  │
│  Manage platform accounts and company assignments                          │
├────────────────────────────────────────────────────────────────────────────┤
│ [Search users...]  [Status ▼] [Role ▼] [Company ▼]        Clear filters  │
├────┬──────────────┬─────────────────┬────────┬───────────┬────────┬───────┤
│ ☐  │ Name         │ Email           │ Status │ Companies │ Last Login│ ⋯  │
├────┼──────────────┼─────────────────┼────────┼───────────┼────────┼───────┤
│ ☐  │ Sarvar R.    │ sarvar@market.uz│ ACTIVE │ 3         │ 2h ago │ ⋯    │
│ ☐  │ Aziza M.     │ aziza@...       │ BLOCKED│ 2         │ 5d ago │ ⋯    │
└────┴──────────────┴─────────────────┴────────┴───────────┴────────┴───────┘
│ Bulk: [Block] [Export]                              Showing 1-25 of 142  ◀ ▶│
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Table Columns

| Column | Width | Sortable | Notes |
|--------|-------|----------|-------|
| Checkbox | 40px | — | Bulk select |
| Name | 180px | ✓ | Avatar 32px + name |
| Email | 220px | ✓ | |
| Status | 100px | ✓ | Badge |
| Companies | 100px | — | Count; click → assignment panel |
| Role (primary) | 120px | ✓ | Highest-privilege role label |
| Last Login | 120px | ✓ | Relative time |
| Actions | 48px | — | `⋯` menu |

### 5.3 Row Actions Menu

| Action | Permission | Destructive |
|--------|------------|-------------|
| View details | view | — |
| Edit | update | — |
| Assign to company | assign | — |
| Reset password | reset_password | Confirm |
| Block / Unblock | block | Confirm + reason |
| Force logout all | sessions.revoke | Confirm |

### 5.4 Create User Modal (560px)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Full name | Text | ✓ | 2–100 chars |
| Email | Email | ✓ | Unique platform-wide |
| Phone | Tel | — | Uzbek format hint |
| Initial password | Password + generate | ✓ | Strength meter |
| Send welcome email | Checkbox | — | Default on |

Footer: Cancel | **Create User** (primary)

### 5.5 User Detail — Split Panel (Desktop)

Click row opens **Sheet** 640px from right OR navigates to `/admin/users/:id`:

```
┌─────────────────────────────────────┐
│ [←] Sarvar Rahimov          [Edit]  │
│ sarvar@market.uz · ACTIVE           │
├─────────────────────────────────────┤
│ [Overview] [Companies] [Devices]    │
│ [Sessions] [Activity]               │
├─────────────────────────────────────┤
│ Overview tab:                       │
│ Phone, created, last login,         │
│ password changed                    │
│                                     │
│ Companies tab:                      │
│ ┌─────────────────────────────────┐ │
│ │ Market · Manager · TSH-MAIN [✎]│ │
│ │ Somafix · Admin · All [✎]      │ │
│ │ [+ Assign to company]          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 5.6 Assign to Company Modal

| Field | Type | Notes |
|-------|------|-------|
| Company | Searchable select | Required |
| Role | Select | Roles for selected company |
| Branch | Multi-select | Optional; empty = all branches |
| Primary company | Checkbox | Default login company |

### 5.7 Block User Confirmation

| Element | Content |
|---------|---------|
| Title | "Block Sarvar Rahimov?" |
| Bullets | End all sessions; deny login; audit logged |
| Reason | Required textarea, min 10 chars |
| Confirm button | "Block User" destructive |
| Unblock variant | Reason optional; confirm "Unblock User" primary |

### 5.8 Bulk Block

- Select 2+ users → Bulk bar → Block
- Confirm shows count: "Block 3 users?"
- Single reason applies to all

### 5.9 Tablet

- Hide Role column; Companies → icon with tooltip
- Detail as full-screen sheet

### 5.10 Mobile

- User cards: name, email, status badge
- Tap → detail screen
- Block available; create user desktop-only

### 5.11 Real-Time

- `user.login` → update Last Login column
- `user.blocked` / `user.unblocked` → status badge crossfade
- `session.revoked` → no row change; toast only

---

## 6. Role Management

**Route**: `/admin/roles`  
**Permissions**: `admin.roles.view`, `admin.roles.create`, `admin.roles.update`, `admin.roles.delete`

### 6.1 List View — Desktop

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Roles                                                      [+ Create Role]│
├────────────────────────────────────────────────────────────────────────────┤
│ [Search...]  [Type ▼: All | System | Custom]                               │
├──────────────────┬─────────────┬──────────────┬────────────┬───────────────┤
│ Role Name        │ Type        │ Permissions  │ Users      │ Actions       │
├──────────────────┼─────────────┼──────────────┼────────────┼───────────────┤
│ Super Admin      │ System      │ All (148)    │ 2          │ View only     │
│ Company Admin    │ System      │ 87           │ 5          │ View only     │
│ Sales Lead       │ Custom      │ 34           │ 3          │ Edit · Delete │
└──────────────────┴─────────────┴──────────────┴────────────┴───────────────┘
```

### 6.2 System vs Custom

| Type | Edit permissions | Delete | Badge |
|------|------------------|--------|-------|
| System | View only (clone to customize) | Disabled | "System" slate |
| Custom | Full | Confirm dialog | "Custom" blue |

### 6.3 Create / Edit Role Modal (720px)

| Field | Spec |
|-------|------|
| Name | Text, required, unique per company |
| Description | Textarea, optional |
| Company scope | Select — platform roles vs company-specific |
| Permissions | Embedded matrix (see Section 7) — scrollable 400px height |

### 6.4 Delete Role Confirmation

- Title: "Delete role Sales Lead?"
- Body: "3 users are assigned. They must be reassigned before deletion." OR if 0 users: "This cannot be undone."
- If users assigned: primary action disabled; link "View assigned users"
- Confirm: destructive "Delete Role"

### 6.5 Clone System Role

- Action: "Clone as custom"
- Pre-fills permissions from system role
- Opens create modal

### 6.6 Tablet / Mobile

- Card list with permission count
- Edit opens full-screen permission picker (simplified list, not full matrix)

---

## 7. Permission Management (Matrix UI)

**Route**: `/admin/permissions` (standalone) + embedded in Role editor  
**Permission**: `admin.roles.view` (edit requires `admin.roles.update`)

### 7.1 Matrix Layout — Desktop Wireframe

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Permissions                          Role: [Company Admin ▼]  [Save]      │
├────────────────────────────────────────────────────────────────────────────┤
│ [Search permissions...]  [Module filter ▼]                                 │
├────────────────────────────────────────────────────────────────────────────┤
│ Module: Products                                              [Collapse]   │
│ ┌────────────────────────────┬────────┐                                    │
│ │ Permission                 │ Granted│                                    │
│ ├────────────────────────────┼────────┤                                    │
│ │ products.view              │   ☑    │                                    │
│ │ products.create            │   ☑    │                                    │
│ │ products.update            │   ☑    │                                    │
│ │ products.delete            │   ☐    │                                    │
│ └────────────────────────────┴────────┘                                    │
│ Module: Sales ...                                                          │
└────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Matrix Spec

| Property | Value |
|----------|-------|
| Component | `PermissionMatrix` |
| Grouping | By module accordion |
| Row height | 36px |
| Checkbox | 18px; indeterminate for partial module |
| Module header | `heading-3` + "Select all" link |
| Search | Filters rows; expands matching modules |
| Unsaved changes | Sticky banner: "Unsaved changes" + Save / Discard |

### 7.3 Dependency Hints

- Gray hint icon next to permission: "Requires `products.view`"
- On enable: auto-suggest enabling dependencies (toast with "Enable required permissions" action)
- On disable: warn if dependents enabled

### 7.4 Compare Roles Mode (P2)

- Split view: two role columns side by side
- Diff highlighting: green = only left, blue = only right

### 7.5 Tablet

- Single column; module accordions
- Sticky save bar at bottom

### 7.6 Mobile

- Not available standalone; access via Role edit only
- Simple checklist per module screen

---

## 8. Device Management

**Route**: `/admin/devices`  
**Permissions**: `admin.devices.view`, `admin.devices.block`, `admin.devices.update`

### 8.1 List View — Desktop

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Devices                                                                   │
├────────────────────────────────────────────────────────────────────────────┤
│ [Search...] [Platform ▼] [Status ▼] [User ▼]                               │
├──────────────┬────────────┬──────────┬────────────┬──────────┬────────────┤
│ Device       │ User       │ Platform │ IP         │ Last Seen│ Status     │
├──────────────┼────────────┼──────────┼────────────┼──────────┼────────────┤
│ POS-01 Win   │ Dilshod K. │ Windows  │ 192.168.1.10│ Active now│ ACTIVE  │
│ MacBook Pro  │ Sarvar R.  │ macOS    │ 192.168.1.5 │ 2h ago   │ ACTIVE   │
│ iPhone 14    │ Aziza M.   │ iOS      │ 10.0.0.22   │ 1d ago   │ BLOCKED  │
└──────────────┴────────────┴──────────┴────────────┴──────────┴────────────┘
```

### 8.2 Columns

| Column | Notes |
|--------|-------|
| Device | `DeviceCard` compact — icon by platform + name |
| User | Link to user detail |
| Platform | Badge: Windows, macOS, Android, iOS, Web |
| App version | `body-sm` muted |
| IP | Mono font |
| Last seen | Relative; "Active now" green if < 5 min |
| Status | ACTIVE / BLOCKED badge |
| Actions | Block, Rename, Force logout (device sessions) |

### 8.3 Device Detail Panel

- Metadata: OS version, app version, registered date
- Session list for this device
- Activity timeline (last 20 events)

### 8.4 Block Device Confirmation

| Element | Content |
|---------|---------|
| Title | "Block POS-01 Win?" |
| Bullets | Revoke all sessions on device; reject future logins from this device |
| Reason | Required |
| Confirm | "Block Device" destructive |

### 8.5 Unblock

- Single confirm, no reason required
- Primary button "Unblock Device"

### 8.6 Real-Time

- `device.registered` → new row prepend + highlight
- `device.blocked` → status badge update
- Last seen updates every 60s via WS heartbeat

### 8.7 Tablet / Mobile

- Cards with platform icon
- Block + force logout on mobile (emergency)
- Rename desktop/tablet only

---

## 9. Session Management

**Route**: `/admin/sessions`  
**Permissions**: `admin.sessions.view`, `admin.sessions.revoke`

### 9.1 Active Sessions View — Desktop

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Active Sessions (12)                              [Force Logout All Filtered]│
│  Live · Auto-refreshes                                                     │
├────────────────────────────────────────────────────────────────────────────┤
│ [Search user/device...] [Company ▼]                                        │
├──────────┬──────────────┬─────────────────┬──────────┬──────────┬──────────┤
│ User     │ Device       │ IP              │ Company  │ Active   │ Actions  │
├──────────┼──────────────┼─────────────────┼──────────┼──────────┼──────────┤
│ Dilshod  │ POS-01 Win   │ 192.168.1.10    │ Market   │ 6h       │ [Logout]│
└──────────┴──────────────┴─────────────────┴──────────┴──────────┴──────────┘
```

### 9.2 Live Indicator

- Green pulsing dot + "Live" in header when WS connected
- Row `SessionRow` component with inline logout button

### 9.3 Force Logout — Single Session

- Confirm dialog (lightweight): "End session for Dilshod on POS-01?"
- No reason required
- Confirm: "Force Logout" destructive
- Row fades out 300ms on success

### 9.4 Force Logout — All User Sessions

- From user detail or row menu
- Confirm: "End all 3 sessions for Sarvar Rahimov?"

### 9.5 Force Logout — All Filtered

- Header button when filters active
- Shows count: "Force logout 5 sessions matching filters?"
- Super Admin only (`admin.sessions.revoke_all`)

### 9.6 Session Monitor Sidebar (optional xl layout)

- Right panel 320px: selected session details
- Live activity: last API endpoints hit (P2)
- Idle timeout countdown

### 9.7 Real-Time

- New session → row prepend
- Revoked → row remove with animation
- Count in title updates

### 9.8 Tablet / Mobile

- Card per session
- Swipe left → Force Logout (mobile)
- Pull to refresh

---

## 10. Company Management

**Route**: `/admin/companies`  
**Permissions**: `admin.companies.view`, `admin.companies.create`, `admin.companies.update`, `admin.companies.suspend`

### 10.1 List View — Desktop

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Companies                                                [+ Create Company]│
├──────────────┬──────────┬──────────┬──────────┬──────────┬────────────────┤
│ Company      │ Code     │ Branches │ Users    │ Status   │ Actions        │
├──────────────┼──────────┼──────────┼──────────┼──────────┼────────────────┤
│ Market       │ MARKET   │ 2        │ 8        │ ACTIVE   │ View · Edit    │
│ Somafix      │ SOMAFIX  │ 1        │ 4        │ ACTIVE   │ View · Edit    │
└──────────────┴──────────┴──────────┴──────────┴──────────┴────────────────┘
```

### 10.2 Company Detail Page `/admin/companies/:id`

**Tabs**: Overview | Users | Branches | Modules | Settings

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Market (MARKET)                                    [Edit] [Suspend]        │
│ ACTIVE · Created Jan 2025                                                  │
├────────────────────────────────────────────────────────────────────────────┤
│ [Overview] [Users (8)] [Branches (2)] [Modules] [Settings]                 │
├────────────────────────────────────────────────────────────────────────────┤
│ Overview:                                                                  │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐                 │
│ │ Users 8     │ Branches 2  │ Modules 12  │ Sales today │                 │
│ └─────────────┴─────────────┴─────────────┴─────────────┘                 │
│ Quick links to sub-tabs                                                    │
└────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Create Company Modal

| Field | Validation |
|-------|------------|
| Name | Required |
| Code | Required, uppercase, 2–10 chars, unique |
| Default branch name | Required (creates first branch) |
| Status | Default ACTIVE |

### 10.4 Suspend Company (Destructive)

| Element | Content |
|---------|---------|
| Title | "Suspend Market?" |
| Impact | All users lose access; active sessions ended; data preserved |
| Reason | Required |
| Type-to-confirm | User must type company code `MARKET` |
| Confirm | "Suspend Company" destructive |

### 10.5 Unsuspend

- Confirm dialog, primary action
- Optional notification to company admins

### 10.6 Tablet / Mobile

- List as cards
- Detail read-only on mobile; suspend desktop-only

---

## 11. Branch Management

**Route**: `/admin/branches` (global) or tab under Company  
**Permission**: `admin.companies.view` + branch actions via `admin.companies.update`

### 11.1 List View — Desktop

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Branches                                                 [+ Create Branch]  │
├────────────────────────────────────────────────────────────────────────────┤
│ [Company ▼] [Status ▼] [Search...]                                         │
├──────────────┬──────────┬──────────────┬──────────┬──────────┬───────────┤
│ Branch       │ Code     │ Company      │ Phone    │ Status   │ Default   │
├──────────────┼──────────┼──────────────┼──────────┼──────────┼───────────┤
│ Tashkent Main│ TSH-MAIN │ Market       │ +998...  │ ACTIVE   │ ★         │
│ Samarkand    │ SMK-01   │ Market       │ +998...  │ ACTIVE   │           │
└──────────────┴──────────┴──────────────┴──────────┴──────────┴───────────┘
```

### 11.2 Create / Edit Branch Modal

| Field | Notes |
|-------|-------|
| Company | Select (pre-filled if from company tab) |
| Name | Required |
| Code | Required, unique within company |
| Address | Textarea |
| Phone | Tel |
| Set as default | Checkbox; only one per company |

### 11.3 Deactivate Branch

- Cannot deactivate default branch
- Cannot deactivate last active branch
- Confirm: "Deactivate Samarkand?" — historical data preserved
- Destructive styling; reversible via Activate

### 11.4 Tablet / Mobile

- Filter by company required on mobile
- Card view; edit desktop-preferred

---

## 12. Module Management

**Route**: `/admin/modules`  
**Permissions**: `admin.modules.view`, `admin.modules.manage`

### 12.1 Layout — Company Selector + Module Grid

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Modules                                                                   │
│  Enable or disable features per company                                    │
├────────────────────────────────────────────────────────────────────────────┤
│  Company: [Market ▼]                                                       │
├────────────────────────────────────────────────────────────────────────────┤
│ Platform (always on)                                                       │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                              │
│ │ Core    🔒 │ │ Auth    🔒 │ │ Audit   🔒 │                              │
│ └────────────┘ └────────────┘ └────────────┘                              │
│ Catalog                                                                    │
│ ┌────────────┐ ┌────────────┐                                             │
│ │ Products ☑ │ │ Inventory☑ │  ...                                       │
│ └────────────┘ └────────────┘                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Module Card (`ModuleToggle`)

| Property | Value |
|----------|-------|
| Size | 160 × 120px |
| Content | Icon, module name, phase badge |
| Toggle | Switch bottom-right |
| Locked | Padlock icon; no toggle (platform modules) |
| Dependency gray | Disabled toggle + tooltip "Enable Products first" |
| Dependents warning | Amber border if disabling affects others |

### 12.3 Enable Module

- Toggle on → if dependencies met: immediate enable
- If dependencies missing: modal lists required modules with "Enable all required" primary action
- Toast: "Sales module enabled for Market"
- Audit + WS broadcast (users see nav update)

### 12.4 Disable Module — Confirmation (Required)

```
┌─────────────────────────────────────────┐
│  Disable Sales module?              ✕  │
├─────────────────────────────────────────┤
│  Disabling Sales will:                  │
│  • Hide POS and sales history nav       │
│  • Block all sales API endpoints        │
│  • Redirect 12 active users on sales  │
│                                         │
│  Dependent modules that must be         │
│  disabled first:                        │
│  • Dashboard                            │
│  • Reports                              │
│                                         │
│  Type DISABLE to confirm                │
│  ┌─────────────────────────────────┐   │
│  └─────────────────────────────────┘   │
│              [ Cancel ]  [ Disable ]    │
└─────────────────────────────────────────┘
```

- Confirm button disabled until user types `DISABLE`
- Destructive styling

### 12.5 Real-Time

- `module.enabled` / `module.disabled` → toggle animation
- If current admin's company affected: sidebar nav updates live

### 12.6 Tablet / Mobile

- List view with toggles (not grid)
- Disable confirmation same modal, full screen on mobile
- Manage permission desktop-only

---

## 13. Audit Logs Viewer

**Route**: `/admin/audit-logs`  
**Permission**: `admin.audit.view`

### 13.1 Viewer Layout — Desktop

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Audit Logs                                              [Export CSV]      │
│  Immutable activity trail · Retained 7 years                               │
├────────────────────────────────────────────────────────────────────────────┤
│ [Date range] [Action ▼] [Entity ▼] [User ▼] [Search entity ID...]        │
├──────────┬──────────┬────────────┬──────────────┬────────────┬────────────┤
│ Time     │ User     │ Action     │ Entity       │ IP         │ Details    │
├──────────┼──────────┼────────────┼──────────────┼────────────┼────────────┤
│ 14:32:01 │ Dilshod  │ SALE       │ Sale MKT-... │ 192.168... │ [Expand]   │
│ 14:28:44 │ Sarvar   │ UPDATE     │ Product ...  │ 192.168... │ [Expand]   │
└──────────┴──────────┴────────────┴──────────────┴────────────┴────────────┘
```

### 13.2 Table Columns

| Column | Width | Notes |
|--------|-------|-------|
| Timestamp | 160px | Absolute + relative on hover |
| User | 140px | "System" for automated |
| Action | 120px | Color-coded badge |
| Entity | 200px | Type + name/number |
| Company | 100px | If platform-level, "—" |
| IP | 120px | Mono |
| Expand | 48px | Chevron |

### 13.3 Expanded Row (`AuditLogTable`)

- Accordion below row, full width
- Side-by-side diff: **Before** | **After** (JSON viewer, syntax highlighted)
- Changed fields highlighted yellow
- Copy JSON button
- Link to entity if still exists

### 13.4 Action Badge Colors

| Category | Color |
|----------|-------|
| CREATE | Green |
| UPDATE | Blue |
| DELETE | Red |
| SALE, PAYMENT | Purple |
| LOGIN, LOGOUT | Slate |
| ADMIN (block, module) | Amber |

### 13.5 Export

- CSV / JSON for filtered results
- Max 10,000 rows per export; toast if truncated
- Export action itself audited

### 13.6 Real-Time

- Optional "Live tail" toggle: new entries prepend when on
- Pause button when scrolling up (don't auto-scroll)

### 13.7 Tablet / Mobile

- Card: time, action, entity summary
- Tap → full-screen detail with diff tabs

---

## 14. Backup Center

**Route**: `/admin/backups`  
**Permissions**: `admin.backups.view`, `admin.backups.manage`, `admin.backups.restore`

### 14.1 Layout — Desktop

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Backup Center                                    [Run Backup Now]         │
├────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐   │
│ │ Last Backup         │ │ Next Scheduled      │ │ Storage Used        │   │
│ │ ✓ 8 hours ago       │ │ Tonight 02:00       │ │ 12.4 / 50 GB        │   │
│ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘   │
├────────────────────────────────────────────────────────────────────────────┤
│ Backup History                                                             │
├──────────────┬──────────┬──────────┬──────────┬──────────┬────────────────┤
│ Date         │ Size     │ Duration │ Location │ Status   │ Actions        │
├──────────────┼──────────┼──────────┼──────────┼──────────┼────────────────┤
│ Jun 17 02:00 │ 1.2 GB   │ 45s      │ Local+S3 │ Success  │ Verify · Restore│
│ Jun 16 02:00 │ 1.2 GB   │ 43s      │ Local+S3 │ Success  │ Verify · Restore│
│ Jun 15 02:00 │ —        │ —        │ —        │ Failed   │ View error     │
└──────────────┴──────────┴──────────┴──────────┴──────────┴────────────────┘
```

### 14.2 Status Cards

| Card | Content |
|------|---------|
| Last backup | Status icon ✓/✗, relative time, link to detail |
| Next scheduled | Cron display Asia/Tashkent |
| Storage | Progress bar local + cloud indicator |

### 14.3 Run Backup Now

- Confirm: "Start manual backup? May impact performance during dump."
- Progress modal: step list (dump → compress → upload → verify)
- Cannot close until complete or failed
- Toast on success

### 14.4 Backup Detail Drawer

- Metadata: PG version, record counts, checksum
- Download ZIP (signed URL, expires 1h)
- Verify checksum button → green check or red mismatch

### 14.5 Restore (Highly Destructive)

```
┌─────────────────────────────────────────┐
│  Restore from Jun 15 backup?        ✕  │
├─────────────────────────────────────────┤
│  ⚠ This will REPLACE all current data   │
│                                         │
│  All users will be logged out.          │
│  Active sales will be interrupted.      │
│                                         │
│  Type RESTORE-{date} to confirm         │
│  ┌─────────────────────────────────┐   │
│  └─────────────────────────────────┘   │
│              [ Cancel ]  [ Restore ]    │
└─────────────────────────────────────────┘
```

- Super Admin + `admin.backups.restore` only
- Maintenance mode banner site-wide during restore

### 14.6 Real-Time

- Backup job progress via WS: progress bar in modal
- History table row updates on completion

### 14.7 Tablet / Mobile

- View history read-only
- Run backup desktop-only
- Restore never on mobile

---

## 15. System Monitoring

**Route**: `/admin/monitoring`  
**Permission**: `admin.monitoring`

### 15.1 Tab Structure

`[Health] [Errors] [Devices] [Sessions] [Jobs] [Storage]`

### 15.2 Health Tab — Desktop Wireframe

```
┌────────────────────────────────────────────────────────────────────────────┐
│  System Monitoring                              Live · Refreshing every 30s  │
├────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ API      │ │ Database │ │ Redis    │ │ WebSocket│ │ Disk     │          │
│ │ 99.98%   │ │ Healthy  │ │ OK       │ │ 24 conn  │ │ 62% used │          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├────────────────────────────────────────────────────────────────────────────┤
│ Response Time (24h)                    │ Request Volume (24h)              │
│ [line chart p50/p95/p99]               │ [area chart]                      │
├────────────────────────────────────────┴──────────────────────────────────┤
│ Active Devices (12) · Active Sessions (12) · [View details links]          │
└────────────────────────────────────────────────────────────────────────────┘
```

### 15.3 Health Metric Cards

| Metric | Green | Amber | Red |
|--------|-------|-------|-----|
| API uptime | ≥99.9% | ≥99% | <99% |
| Response p95 | <500ms | <2s | ≥2s |
| DB pool | <70% | <90% | ≥90% |
| Disk | <70% | <85% | ≥85% |
| Failed jobs (24h) | 0 | 1–5 | >5 |

### 15.4 Errors Tab

| Column | Content |
|--------|---------|
| Time | Timestamp |
| Level | ERROR / WARN |
| Message | Truncated |
| Endpoint | API path |
| Count | Occurrences if grouped |
| Actions | Expand stack trace |

- Filter: last 1h / 24h / 7d
- Group similar errors toggle
- Copy stack trace button

### 15.5 Devices Tab (Monitoring context)

- Subset of device list: online now only
- Map of IPs (P2 — optional)
- Link to full Device Management

### 15.6 Sessions Tab (Monitoring context)

- Same as Session Management but read-only + charts: sessions over time
- Peak concurrent sessions marker

### 15.7 Jobs Tab

| Column | Notes |
|--------|-------|
| Job name | |
| Last run | |
| Status | success / failed / running |
| Duration | |
| Actions | Retry (failed), View log |

### 15.8 Realtime Activity Panel (persistent bottom on xl)

- Height 200px, collapsible
- Stream of API requests (sampled), WS events, job completions
- Pause / clear buttons
- Not a security audit — operational debug view

### 15.9 Alerts Banner

- Sticky top when active alerts: backup failed, disk low, error rate high
- Dismiss per session; link to detail

### 15.10 Tablet

- Metric cards 2-wide
- Charts stack
- Activity panel hidden; link to full screen

### 15.11 Mobile

- Health summary only (5 cards stack)
- Errors list read-only
- No activity stream

---

## 16. Cross-Cutting States

### 16.1 Loading

| Context | Pattern |
|---------|---------|
| Table initial load | 8 skeleton rows |
| Detail panel | Skeleton form fields |
| Monitoring charts | Shimmer chart area |
| Modal submit | Button spinner, fields disabled |

### 16.2 Empty

| Section | Message | CTA |
|---------|---------|-----|
| Users | "No users match filters" | Clear filters |
| Devices | "No devices registered" | — |
| Sessions | "No active sessions" | Normal state, positive tone |
| Audit logs | "No events in range" | Widen date range |
| Backups | "No backups yet" | Run backup |

### 16.3 Error

| Scope | Treatment |
|-------|-----------|
| Page level | Banner + Retry |
| Table | Inline "Failed to load" + Retry |
| Action failure | Toast destructive + keep modal open with error |
| Permission denied | Full page 403: "You don't have access" + link to dashboard |

### 16.4 Offline

- Banner: "Admin actions require connection"
- Read-only cached data where safe (user list stale badge)
- Destructive actions disabled

---

## 17. Notifications & Admin Toasts

| Event | Toast Type | Message pattern |
|-------|------------|-----------------|
| User blocked | Success | "{name} has been blocked" |
| Module disabled | Warning | "Sales disabled for Market" |
| Backup complete | Success | "Backup completed in 45s" |
| Backup failed | Error | "Backup failed — View details" |
| Force logout | Success | "Session ended" |
| New device | Info | "New device: POS-02 registered" |

---

## 18. Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Admin search (jump to user, company, device) |
| `N` | New (context: create user/company/role) |
| `R` | Refresh current table |
| `Esc` | Close modal/sheet |

---

## 19. Accessibility

- All tables: proper `th` scope, sort announced
- Destructive confirm: focus trap, initial focus on Cancel
- Status badges: icon + text
- Live regions for session count updates
- Matrix checkboxes: labels linked, module select-all announces count

See [ACCESSIBILITY.md](./ACCESSIBILITY.md).

---

## 20. Figma Deliverables Checklist

| Section | Frames |
|---------|--------|
| Control Center | Desktop default, tablet |
| Users | List, create modal, detail sheet, block confirm, bulk |
| Roles | List, edit with matrix, delete confirm |
| Permissions | Full matrix, search filtered |
| Devices | List, block confirm, detail |
| Sessions | Live list, force logout confirm |
| Companies | List, detail tabs, suspend confirm |
| Branches | List, create modal, deactivate |
| Modules | Grid enabled, disable confirm, dependency error |
| Audit Logs | List, expanded diff, export |
| Backups | Dashboard, run progress, restore confirm |
| Monitoring | Health, errors, activity stream |
| Shared | Destructive dialog variants, empty, error, loading |

---

## Related Documents

- [ADMIN_PANEL.md](../08-modules/ADMIN_PANEL.md)
- [MODULE_MANAGEMENT.md](../08-modules/MODULE_MANAGEMENT.md)
- [AUDIT_LOGS.md](../08-modules/AUDIT_LOGS.md)
- [BRANCH_MANAGEMENT.md](../08-modules/BRANCH_MANAGEMENT.md)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
- [DESKTOP_UI_SPEC.md](./DESKTOP_UI_SPEC.md)
- [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md)
- [../07-security/RBAC_DESIGN.md](../07-security/RBAC_DESIGN.md)
- [../10-devops/BACKUP_RECOVERY.md](../10-devops/BACKUP_RECOVERY.md)
