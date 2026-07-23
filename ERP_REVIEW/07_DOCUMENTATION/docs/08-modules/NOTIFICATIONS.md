# Notifications Module

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Overview

The Notifications module delivers real-time, in-app notifications to users within the ERP platform. Notifications inform users of business events — sales completions, payments received, low stock alerts, debt milestones, system events, and administrative actions — without requiring page refresh. The module uses WebSocket connections for instant delivery and maintains a persistent notification history for review.

All notifications are user-scoped and company-scoped. Users only receive notifications for events within their active company context.

---

## 2. Notification Model

### 2.1 Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Recipient user |
| `company_id` | UUID | Company context |
| `type` | Enum | Notification category |
| `title` | String | Short headline |
| `body` | Text | Detailed message |
| `data` | JSON | Structured payload for action/deep-link |
| `read_at` | Timestamp | When user acknowledged (null = unread) |
| `created_at` | Timestamp | Notification creation time |
| `expires_at` | Timestamp | Auto-cleanup date (default: 90 days) |

### 2.2 Notification States

| State | Condition | UI |
|-------|-----------|-----|
| **Unread** | `read_at IS NULL` | Bold text, blue dot indicator |
| **Read** | `read_at IS NOT NULL` | Normal text, no indicator |
| **Expired** | `expires_at < now()` | Removed from history |

---

## 3. Notification Types

### 3.1 Business Events

| Type | Trigger | Example |
|------|---------|---------|
| `SALE_COMPLETED` | Sale finalized | "Sale #MKT-004521 completed — 700,000 UZS by Dilshod" |
| `PAYMENT_RECEIVED` | Debt payment recorded | "Payment 500,000 UZS received from Alisher Qurilish" |
| `RETURN_PROCESSED` | Sale return completed | "Return processed for Sale #MKT-004380 — 50,000 UZS" |
| `LOW_STOCK` | Product below min level | "Low stock: Cement 50kg — 15 units remaining (min: 50)" |
| `OUT_OF_STOCK` | Product reaches zero | "Out of stock: Power Drill XT-8847" |
| `OVERSELL` | Sale with insufficient stock | "Oversell: Brick Standard — sold 25, available 20" |

### 3.2 Debt Events

| Type | Trigger | Example |
|------|---------|---------|
| `DEBT_THRESHOLD` | Customer debt exceeds limit | "Alisher Qurilish debt exceeds 10,000,000 UZS" |
| `DEBT_OVERDUE` | Debt older than 30 days | "3 customers have overdue debt totaling 8,500,000 UZS" |
| `DEBT_PAID_FULL` | Customer debt fully paid | "Bobur Mebel — all debt cleared (UZS)" |

### 3.3 System Events

| Type | Trigger | Example |
|------|---------|---------|
| `RATE_CHANGED` | Exchange rate updated | "Exchange rate updated: 1 USD = 12,800 UZS" |
| `USER_LOGIN` | Login from new device | "New login from Windows Desktop — 192.168.1.45" |
| `SESSION_REVOKED` | Admin force-logout | "Your session was terminated by administrator" |
| `MODULE_ENABLED` | Module activated for company | "Reports module enabled for Market" |
| `REPORT_READY` | Async report generation complete | "Daily Sales Report ready for download" |

### 3.4 Administrative Events

| Type | Trigger | Example |
|------|---------|---------|
| `USER_BLOCKED` | User account blocked | "Your account has been blocked. Contact administrator." |
| `DEVICE_BLOCKED` | Device blocked | "Device 'Warehouse PC' has been blocked" |
| `PERMISSION_CHANGED` | User role/permissions updated | "Your permissions have been updated" |
| `BACKUP_COMPLETED` | Daily backup success | "Daily backup completed successfully" |
| `BACKUP_FAILED` | Daily backup failure | "Daily backup failed — administrator notified" |

---

## 4. Delivery Architecture

### 4.1 Real-Time Flow

```
Business Event (e.g., sale.completed)
  │
  ▼
Domain Event Emitter (within DB transaction)
  │
  ▼
Notification Service
  ├── Determine recipients (by role, permission, subscription)
  ├── Create notification records in DB
  └── Publish to WebSocket channel: company:{company_id}
        │
        ▼
  Connected Clients (filtered by user_id)
        │
        ▼
  UI: Toast popup + badge count update + history entry
```

### 4.2 WebSocket Protocol

**Subscribe** (on company context established):
```json
{ "action": "subscribe", "channel": "notifications" }
```

**Receive:**
```json
{
  "event": "notification",
  "data": {
    "id": "uuid",
    "type": "SALE_COMPLETED",
    "title": "Sale Completed",
    "body": "Sale #MKT-004521 — 700,000 UZS",
    "data": { "saleId": "uuid", "route": "/sales/uuid" },
    "createdAt": "2026-06-17T14:32:05Z"
  }
}
```

### 4.3 Offline Handling

When user is offline:
- Notifications persisted in database
- On reconnect: unread count synced, missed notifications delivered
- No notification loss — all events stored regardless of connection state

---

## 5. User Interface

### 5.1 Notification Bell

```
┌──────────────────────────────────────────┐
│  ERP Platform              🔔(3)  👤    │
└──────────────────────────────────────────┘
```

- Bell icon in top navigation bar
- Badge shows unread count (max display: "99+")
- Click opens notification panel

### 5.2 Notification Panel

```
┌─────────────────────────────────────┐
│  Notifications          [Mark all read] │
├─────────────────────────────────────┤
│  ● Sale #MKT-004521 completed      │
│    700,000 UZS — 2 min ago          │
├─────────────────────────────────────┤
│  ● Payment received: 500,000 UZS    │
│    Alisher Qurilish — 15 min ago    │
├─────────────────────────────────────┤
│  ○ Low stock: Cement 50kg            │
│    15 units remaining — 1 hr ago     │
├─────────────────────────────────────┤
│  [View All Notifications]           │
└─────────────────────────────────────┘
```

### 5.3 Toast Notifications

High-priority notifications also display as toast popups (bottom-right):

- Auto-dismiss after 5 seconds
- Click navigates to related entity (sale, customer, product)
- Maximum 3 concurrent toasts

### 5.4 Full Notification History Page

- Paginated list of all notifications (read and unread)
- Filter by type, date range, read/unread status
- Bulk mark as read
- Deep-link to related entity from `data.route`

---

## 6. Recipient Rules

### 6.1 Role-Based Delivery

| Event | Recipients |
|-------|-----------|
| Sale completed | Managers, Admins (not other cashiers) |
| Payment received | Managers, Admins |
| Low stock | Warehouse staff, Managers |
| Debt threshold | Managers, Admins |
| User login (new device) | The logging-in user + Admins |
| Session revoked | The affected user |
| Report ready | The requesting user |
| Backup failed | Admins only |

### 6.2 Permission-Based Filtering

Users only receive notifications for event types they have permission to view:
- User without `debt.view` does not receive debt notifications
- User without `inventory.view` does not receive stock alerts

---

## 7. Configuration

### 7.1 User Preferences (Future)

| Setting | Options | Default |
|---------|---------|---------|
| Toast enabled | On / Off | On |
| Sound enabled | On / Off | Off |
| Email digest | Daily / Weekly / Off | Off |

### 7.2 Company-Level Thresholds

| Setting | Description | Default |
|---------|-------------|---------|
| Low stock notification | Enable/disable | Enabled |
| Debt threshold amount | Per-currency limit | 10,000,000 UZS / $1,000 USD |
| Overdue notification days | Days before overdue alert | 30 |

---

## 8. Retention and Cleanup

| Policy | Value |
|--------|-------|
| Active notifications | 90 days |
| Read notifications | 90 days from read date |
| Unread notifications | 90 days from creation |
| Cleanup schedule | Daily at 03:00 Asia/Tashkent |
| Expired notifications | Hard-deleted (not soft-delete) |

---

## 9. Permissions

| Permission | Description |
|------------|-------------|
| `notifications.view` | View own notifications |
| `notifications.manage` | Configure company notification settings |

---

## 10. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | List notifications (paginated) |
| GET | `/api/v1/notifications/unread-count` | Unread count for badge |
| PATCH | `/api/v1/notifications/:id/read` | Mark single as read |
| POST | `/api/v1/notifications/read-all` | Mark all as read |

WebSocket: `wss://api/ws` — subscribe to `notifications` channel.

---

## 11. Related Documents

- [DASHBOARD.md](./DASHBOARD.md)
- [SALES.md](./SALES.md)
- [DEBT_MANAGEMENT.md](./DEBT_MANAGEMENT.md)
- [ADMIN_PANEL.md](./ADMIN_PANEL.md)
- [../06-api/WEBSOCKET_EVENTS.md](../06-api/WEBSOCKET_EVENTS.md)
