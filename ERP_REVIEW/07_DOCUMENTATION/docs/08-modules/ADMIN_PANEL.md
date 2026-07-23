# Admin Panel Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Admin Panel module is the central administration interface for platform and company management. It provides tools for user management, device registration and control, session monitoring, company configuration, role and permission assignment, module enablement, and system health monitoring. The Admin Panel is restricted to users with administrative roles and serves as the control plane for the entire ERP platform.

Access to the Admin Panel requires the `admin.access` permission. Individual sections within the panel require additional granular permissions.

---

## 2. Admin Panel Structure

```
Admin Panel
├── Users
├── Devices
├── Sessions
├── Companies
├── Roles & Permissions
├── Modules
├── Branches
├── Exchange Rates
├── System Monitoring
└── Settings
```

---

## 3. User Management

### 3.1 User Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `email` | String | Login identifier (unique platform-wide) |
| `full_name` | String | Display name |
| `phone` | String | Contact phone |
| `status` | Enum | `ACTIVE`, `INACTIVE`, `BLOCKED` |
| `blocked_at` | Timestamp | When user was blocked |
| `blocked_reason` | Text | Reason for blocking |
| `last_login_at` | Timestamp | Most recent successful login |
| `created_at` | Timestamp | Account creation |
| `password_changed_at` | Timestamp | Last password change |

### 3.2 User Management Actions

| Action | Description | Permission |
|--------|-------------|------------|
| Create user | New account with email, name, initial password | `admin.users.create` |
| Edit user | Update name, phone, email | `admin.users.update` |
| Block user | Prevent all authentication | `admin.users.block` |
| Unblock user | Restore access | `admin.users.block` |
| Reset password | Force password change on next login | `admin.users.reset_password` |
| Assign to company | Link user to company with role and branch | `admin.users.assign` |
| Remove from company | Unlink user from company | `admin.users.assign` |

### 3.3 User List View

```
┌──────────────────────────────────────────────────────────────────────┐
│  USERS                                              [+ Create User]  │
├──────────────┬──────────────┬──────────┬───────────┬────────────────┤
│ Name         │ Email        │ Status   │ Companies │ Last Login     │
├──────────────┼──────────────┼──────────┼───────────┼────────────────┤
│ Sarvar R.    │ sarvar@...   │ ACTIVE   │ 3         │ 2 hours ago    │
│ Dilshod K.   │ dilshod@...  │ ACTIVE   │ 1         │ 15 min ago     │
│ Aziza M.     │ aziza@...    │ BLOCKED  │ 2         │ 5 days ago     │
└──────────────┴──────────────┴──────────┴───────────┴────────────────┘
```

### 3.4 User-Company Assignment

A single user can belong to multiple companies with different roles:

```
User: Sarvar Rahimov
  ├── Market (Manager) — Tashkent Main branch
  ├── Somafix (Admin) — all branches
  └── Xitoy Tovar (Viewer) — Tashkent Main branch
```

---

## 4. Device Management

### 4.1 Device Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owning user |
| `name` | String | Device name (auto-detected or user-set) |
| `platform` | Enum | `WINDOWS`, `MACOS`, `LINUX`, `ANDROID`, `IOS`, `WEB` |
| `os_version` | String | Operating system version |
| `app_version` | String | ERP client version |
| `ip_address` | String | Last known IP |
| `status` | Enum | `ACTIVE`, `BLOCKED` |
| `last_seen_at` | Timestamp | Last activity |
| `registered_at` | Timestamp | First registration |

### 4.2 Device Lifecycle

```
Login from new device
  → Device auto-registered with detected metadata
  → Admin notification (new device login)
  → Device appears in device list

Admin blocks device
  → All sessions on device revoked immediately
  → Future login attempts rejected
  → User notified
```

### 4.3 Device Management Actions

| Action | Description | Permission |
|--------|-------------|------------|
| View devices | List all devices per user | `admin.devices.view` |
| Block device | Prevent authentication from device | `admin.devices.block` |
| Unblock device | Restore device access | `admin.devices.block` |
| Rename device | Update display name | `admin.devices.update` |

---

## 5. Session Management

### 5.1 Session Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Session owner |
| `device_id` | UUID | Originating device |
| `company_id` | UUID | Active company context |
| `ip_address` | String | Connection IP |
| `user_agent` | String | Browser/client info |
| `created_at` | Timestamp | Session start |
| `expires_at` | Timestamp | Token expiration |
| `last_activity_at` | Timestamp | Last API request |
| `revoked_at` | Timestamp | Force-logout timestamp (null = active) |

### 5.2 Active Sessions View

```
┌──────────────────────────────────────────────────────────────────────┐
│  ACTIVE SESSIONS (12)                                                │
├──────────┬──────────────┬─────────────────┬──────────┬──────────────┤
│ User     │ Device       │ IP              │ Company  │ Active Since │
├──────────┼──────────────┼─────────────────┼──────────┼──────────────┤
│ Dilshod  │ POS-01 Win   │ 192.168.1.10    │ Market   │ 6 hours ago  │
│ Sarvar   │ MacBook Pro  │ 192.168.1.5     │ Somafix  │ 2 hours ago  │
│ Aziza    │ Web Browser  │ 10.0.0.45       │ Market   │ 30 min ago   │
└──────────┴──────────────┴─────────────────┴──────────┴──────────────┘
```

### 5.3 Session Actions

| Action | Description | Permission |
|--------|-------------|------------|
| View sessions | List active sessions | `admin.sessions.view` |
| Force logout (single) | Revoke specific session | `admin.sessions.revoke` |
| Force logout (all) | Revoke all sessions for user | `admin.sessions.revoke` |
| Force logout (device) | Revoke all sessions on device | `admin.sessions.revoke` |

Force logout takes effect immediately — the revoked session's next API call receives 401 Unauthorized.

---

## 6. Company Management

### 6.1 Company Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | String | Company display name |
| `code` | String | Short code (e.g., `MARKET`, `SOMAFIX`) |
| `status` | Enum | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `settings` | JSON | Company-specific configuration |
| `created_at` | Timestamp | Creation date |

### 6.2 Company Management Actions

| Action | Description | Permission |
|--------|-------------|------------|
| Create company | New company with code and name | `admin.companies.create` |
| Edit company | Update name, settings | `admin.companies.update` |
| Suspend company | Disable all access for company | `admin.companies.suspend` |
| View company detail | Users, branches, modules, stats | `admin.companies.view` |

### 6.3 Registered Companies

| Company | Code | Branches | Users | Status |
|---------|------|----------|-------|--------|
| Market | MARKET | 2 | 8 | ACTIVE |
| O'O'MQ | OOMQ | 1 | 5 | ACTIVE |
| Xitoy Tovar | XITOY | 1 | 6 | ACTIVE |
| Somafix | SOMAFIX | 1 | 4 | ACTIVE |
| Lantian | LANTIAN | 1 | 3 | ACTIVE |

---

## 7. Roles and Permissions

### 7.1 Role Management

| Action | Description | Permission |
|--------|-------------|------------|
| View roles | List roles and their permissions | `admin.roles.view` |
| Create role | Custom role with selected permissions | `admin.roles.create` |
| Edit role | Modify permissions | `admin.roles.update` |
| Delete role | Remove custom role (not system roles) | `admin.roles.delete` |

### 7.2 System Roles (Non-Deletable)

| Role | Description |
|------|-------------|
| **Super Admin** | Platform-wide administration (all permissions) |
| **Company Admin** | Full company management |
| **Manager** | Sales, debt, inventory, reports |
| **Cashier** | POS sales, customer lookup |
| **Warehouse** | Inventory receiving, stock management |
| **Viewer** | Read-only access to assigned modules |

### 7.3 Permission Assignment

Permissions are organized by module:

```
Products
  ☑ products.view
  ☑ products.create
  ☐ products.delete

Sales
  ☑ sales.view
  ☑ sales.create
  ☐ sales.cancel
  ☐ sales.return
```

Permissions are additive — a user's effective permissions are the union of all permissions from their assigned role.

---

## 8. Module Management

See [MODULE_MANAGEMENT.md](./MODULE_MANAGEMENT.md) for detailed module enablement documentation.

Admin Panel provides the UI for:
- Viewing available modules and their status per company
- Enabling/disabling modules
- Viewing module dependencies

---

## 9. System Monitoring

### 9.1 Health Dashboard

| Metric | Description |
|--------|-------------|
| API uptime | Service availability percentage |
| Response time | Average API response (p50, p95, p99) |
| Active sessions | Current connected users |
| WebSocket connections | Active real-time connections |
| Database connections | Pool utilization |
| Background jobs | Queue depth, failed jobs |
| Storage usage | Database size, file storage |
| Last backup | Timestamp and status |

### 9.2 System Logs

| Log Type | Description | Retention |
|----------|-------------|-----------|
| Application logs | Error, warning, info | 30 days |
| Access logs | API request logs | 90 days |
| Background job logs | Report generation, cleanup | 30 days |

### 9.3 Alerts

| Alert | Condition | Notification |
|-------|-----------|-------------|
| High error rate | > 5% 5xx responses in 5 min | Admin notification |
| Backup failure | Daily backup job fails | Admin notification |
| Disk space low | < 20% free | Admin notification |
| Session spike | > 2× normal active sessions | Admin notification |

---

## 10. Permissions Summary

| Permission | Description |
|------------|-------------|
| `admin.access` | Access Admin Panel |
| `admin.users.*` | User management operations |
| `admin.devices.*` | Device management operations |
| `admin.sessions.*` | Session management operations |
| `admin.companies.*` | Company management operations |
| `admin.roles.*` | Role and permission management |
| `admin.modules.*` | Module enablement |
| `admin.monitoring` | View system health dashboard |

---

## 11. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | List users |
| POST | `/api/v1/admin/users` | Create user |
| PATCH | `/api/v1/admin/users/:id` | Update user |
| POST | `/api/v1/admin/users/:id/block` | Block/unblock user |
| GET | `/api/v1/admin/devices` | List devices |
| POST | `/api/v1/admin/devices/:id/block` | Block/unblock device |
| GET | `/api/v1/admin/sessions` | List active sessions |
| POST | `/api/v1/admin/sessions/:id/revoke` | Force logout |
| GET | `/api/v1/admin/companies` | List companies |
| GET | `/api/v1/admin/health` | System health metrics |

---

## 12. Related Documents

- [MODULE_MANAGEMENT.md](./MODULE_MANAGEMENT.md)
- [MULTI_COMPANY.md](./MULTI_COMPANY.md)
- [BRANCH_MANAGEMENT.md](./BRANCH_MANAGEMENT.md)
- [AUDIT_LOGS.md](./AUDIT_LOGS.md)
- [../07-security/RBAC_DESIGN.md](../07-security/RBAC_DESIGN.md)
- [../07-security/SESSION_MANAGEMENT.md](../07-security/SESSION_MANAGEMENT.md)
- [../07-security/DEVICE_MANAGEMENT.md](../07-security/DEVICE_MANAGEMENT.md)
