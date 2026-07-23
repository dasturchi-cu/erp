# Screen Specifications — Administration

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Status | Approved — Figma Handoff |
| Last Updated | 2026-06-17 |
| Figma Page | `08 — Administration` |
| Parent | [ADMIN_PANEL_UX.md](../ADMIN_PANEL_UX.md) |
| Canonical IDs | [SCREEN_HIERARCHY.md](../SCREEN_HIERARCHY.md) §12 |

---

## Document Scope

| SCR-ID | Screen | Route |
|--------|--------|-------|
| SCR-130 | Admin Control Center | `/admin` |
| SCR-131 | Users List | `/admin/users` |
| SCR-133 | User Detail | `/admin/users/:id` |
| SCR-135 | Roles List | `/admin/roles` |
| SCR-137 | Role Detail / Permission Editor | `/admin/roles/:id` |
| SCR-139 | Devices List | `/admin/devices` |
| SCR-140 | Device Detail | `/admin/devices/:id` |
| SCR-141 | Sessions List | `/admin/sessions` |
| SCR-142 | Companies List | `/admin/companies` |
| SCR-145 | Modules List | `/admin/modules` |
| SCR-147 | Branches List (Admin) | `/admin/branches` |
| SCR-149 | Audit Logs | `/admin/audit-logs` |
| SCR-151 | System Monitoring | `/admin/monitoring` |
| SCR-152 | Backup Center | `/admin/backup` |

---

## Global Admin UX Patterns

### Destructive Action Tiers

| Tier | Examples | UX |
|------|----------|-----|
| T1 | Block user, block device, force logout | Dialog + reason (optional) + Confirm |
| T2 | Disable module, suspend company | Dialog + reason required + type module name |
| T3 | Restore backup, delete company | Full-screen confirm + type phrase + admin password re-entry |

### Real-Time Admin Streams
All admin list screens subscribe to relevant WS events; rows update without full page reload. Live indicator pulse on SCR-151 and SCR-141.

### Admin Shell
Same App Shell; sidebar section **Boshqaruv** at bottom with distinct icon color `color/admin` token (#7C3AED light / #A78BFA dark).

---

# SCR-130 — Admin Control Center

## Purpose
Operational hub: health at a glance, quick actions, live activity feed.

## Permission
`admin.access`

## Desktop Wireframe (1280×800)

```
PageHeader: Boshqaruv markazi
KPI Row (4 cards):
  [Faol foydalanuvchilar 24] [Faol sessiyalar 31] [Qurilmalar 18] [Xatoliklar 0]

Grid 2×3 Quick Action Tiles 160×120:
  Foydalanuvchilar | Rollar | Qurilmalar | Sessiyalar | Kompaniyalar | Modullar
  Audit | Monitoring | Backup

Live Activity Feed (right col 4/12):
  Stream of audit events last 50, auto-scroll pause on hover
```

## Mobile
2-column tile grid; activity feed as separate tab

## Data Flow
`GET /admin/monitoring/summary`; WS audit stream

---

# SCR-131 — User Management

## Purpose
CRUD users; block/unblock; assign companies; force logout all sessions.

## Permission
`admin.users.view`, actions per `admin.users.*`

## Desktop Table
| Ism | Email | Holat | Kompaniyalar | Oxirgi kirish | Amallar |
|-----|-------|-------|--------------|---------------|---------|

**Holat badges**: ACTIVE green, BLOCKED red, INACTIVE gray

**Row actions**: Tahrirlash, Bloklash/Aktivlashtirish, Sessiyani tugatish, Kompaniyalarni boshqarish

**Bulk**: Bloklash (T1 confirm), Export CSV

## Block User Modal (T1)
```
Title: Foydalanuvchini bloklash?
Body: {name} tizimga kira olmaydi. Barcha sessiyalar tugatiladi.
Field: Sabab (ixtiyoriy)
[Bekor qilish] [Bloklash — destructive]
```

## Create User Modal (lg 720px)
Fields: Email*, Ism*, Telefon, Parol*, Parol takror*, Kompaniya+rol multi-assign table

## User Detail SCR-133
Tabs: Profil | Kompaniyalar | Qurilmalar | Sessiyalar | Audit

## Real-time
`user.blocked` → status badge; sessions tab clears

---

# SCR-135 / SCR-137 — Role & Permission Management

## Purpose
Define roles; assign permission matrix; clone custom roles.

## SCR-135 List
Table: Rol nomi, Turi (System/Custom), Foydalanuvchilar soni, Yangilangan

System roles: badge "Tizim" — cannot delete

## SCR-137 Permission Matrix
```
Accordion per module (Sales, Products, Inventory...)
  Checkbox grid: Permission name | Description | Enabled
Dependency hints: enabling sales.create shows sales.view required (auto-check)
Sticky footer: Saqlash | Bekor (unsaved banner if dirty)
```

## Mobile
Module list → drill to permission checklist screen

---

# SCR-139 — Device Management

## Purpose
Monitor registered devices; block/unblock; force logout per device.

## Table Columns
| Qurilma | Foydalanuvchi | Platforma | IP | Oxirgi faollik | Holat | Amallar |

**Platform icons**: Windows, Android, iOS, macOS

## Block Device (T1)
```
"{deviceName} bloklanadi. Bu qurilmadagi sessiya tugaydi."
[Bloklash]
```

## Device Detail SCR-140
Device info card + session history + block toggle

## Real-time
`device.blocked`, `session.terminated` update rows < 1s

---

# SCR-141 — Session Management

## Purpose
Live session monitor; force logout single or bulk.

## Table
| Foydalanuvchi | Qurilma | IP | Boshlangan | Oxirgi faollik | Amallar |

Auto-refresh 10s + WS. **Force logout** per row (T1).

Bulk: "Barcha sessiyalarni tugatish" (T2 — type CONFIRM)

## Mobile
Simplified cards; swipe action "Tugatish"

---

# SCR-142 — Company Management

## Purpose
Create/edit companies; suspend; module overrides per company.

## List Columns
| Kompaniya | Kod | Holat | Foydalanuvchilar | Filialar | Amallar |

## Company Detail
Tabs: Umumiy | Foydalanuvchilar | Filiallar | Modullar | Sozlamalar

**Suspend company** (T2): type company code to confirm

---

# SCR-145 — Module Management

## Purpose
Enable/disable modules globally and per company.

## Global Grid
Card per module: icon, name, description, toggle, dependency warning

**Disable Sales** (T2):
```
Sales moduli o'chiriladi. Barcha foydalanuvchilarda Sales menyusi yashirinadi.
Davom etayotgan sotuvlar 30 soniya ichida yakunlanishi kerak.
Type: DISABLE
[Modulni o'chirish]
```

## Per-Company Override SCR-146
Matrix: Module × Enabled (inherit | on | off)

## Real-time
On disable → WS `module.disabled` → client nav updates globally

---

# SCR-149 — Audit Logs

## Purpose
Searchable immutable audit trail with before/after diff.

## Filters
Date range, User, Action type, Entity type, Full-text search in payload

## Table
| Vaqt | Foydalanuvchi | Amal | Ob'ekt | IP | ▼ |

Expand row: JSON diff viewer old → new (side by side desktop, stacked mobile)

## Export
CSV for date range (max 100k rows)

---

# SCR-151 — System Monitoring

## Purpose
Server health, errors, jobs, realtime metrics.

## Sections
1. **Health cards**: API, PostgreSQL, Redis, Disk — green/yellow/red
2. **Error log** (last 100): timestamp, level, message, requestId — click → detail drawer
3. **Active devices map** (table subset)
4. **Active sessions** count chart (5min intervals)
5. **Job queue**: backup, reports — status bars

## Auto-refresh
30s polling + WS for critical alerts

## Mobile
Health cards stack; errors as list

---

# SCR-152 — Backup Center

## Purpose
View backup history; trigger manual backup; download; restore (T3).

## Table
| Sana | Turi | Hajm | Joylashuv (Local/Cloud) | Holat | Amallar |

Actions: Yuklab olish, Tiklash (T3), O'chirish (T2)

## Manual Backup
Button → progress modal → success with file size

## Restore (T3)
```
WARNING full screen red border
Bu operatsiya barcha joriy ma'lumotlarni almashtiradi.
Type: RESTORE-{backupId}
Admin parol: [____]
[Tiklash]
```

---

# SCR-147 — Branch Management (Admin)

## Purpose
Platform-wide branch administration across companies.

## Table
| Filial | Kompaniya | Manzil | Standart | Holat | Amallar |

Create/Edit modal: name, address, company select, isDefault toggle

---

## Admin Keyboard Shortcuts (Desktop)

| Key | Action |
|-----|--------|
| Ctrl+Shift+U | Go to Users |
| Ctrl+Shift+D | Go to Devices |
| Ctrl+Shift+S | Go to Sessions |
| Ctrl+Shift+M | Go to Monitoring |

---

## Component Trees (Summary)

```
AdminHomePage [SCR-130]
├── AdminKpiStrip
├── QuickActionGrid
└── LiveActivityFeed

UsersListPage [SCR-131]
├── DataTable
├── BlockUserDialog
├── CreateUserDialog
└── BulkActionBar

DevicesListPage [SCR-139]
├── DataTable
└── BlockDeviceDialog

SessionsListPage [SCR-141]
└── LiveSessionTable

ModulesPage [SCR-145]
├── ModuleCardGrid
└── DisableModuleDialog (T2)
```

## State Management
See [UI_STATE_MANAGEMENT.md](../UI_STATE_MANAGEMENT.md); admin queries short staleTime; WS invalidation on security events.

---

## Figma Deliverables (Admin)

Each SCR: Desktop LG + Mobile + key modals (block, disable module, restore backup) × Light/Dark

---

## Related Documents
- [ADMIN_PANEL_UX.md](../ADMIN_PANEL_UX.md)
- [ADMIN_PANEL.md](../../08-modules/ADMIN_PANEL.md)
- [AUDIT_SECURITY.md](../../07-security/AUDIT_SECURITY.md)
