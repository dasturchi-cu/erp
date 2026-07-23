# Desktop UI Specification

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Platform | Windows (Electron), Future macOS |
| Stack | Electron + React + TypeScript + Tailwind + shadcn/ui |
| Last Updated | 2026-06-17 |

---

## Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│ TopBar: [Company ▼] [Search] [🔔] [Connection] [User ▼]│
├────────┬─────────────────────────────────────────────────┤
│        │ Breadcrumbs: Dashboard > Sales > New Sale      │
│ Side   ├─────────────────────────────────────────────────┤
│ bar    │                                                 │
│        │              Main Content Area                  │
│ 240px  │                                                 │
│        │                                                 │
│        │                                                 │
└────────┴─────────────────────────────────────────────────┘
```

---

## Key Screens

### POS Screen (Primary Cashier View)
- **Left 60%**: Product search + product grid/list
- **Right 40%**: Cart panel (sticky)
- Barcode input auto-focused
- Currency toggle at top of cart
- Large "Complete Sale" button (primary, bottom-right)
- Keyboard: Enter to add product, F9 to complete sale

### Dashboard
- 4-column stat cards row (sales, profit, debt, inventory)
- Currency toggle: show UZS | USD | Both
- Period selector: Day | Week | Month | Year
- Sales chart (line/bar)
- Top products table (right column)
- Recent activity feed (left column)

### Admin Users Table
- Columns: Name, Email, Role, Company, Status, Last Login, Actions
- Actions: Edit, Block/Unblock, Force Logout
- Filter by: status, role, company
- Bulk actions: block selected

---

## Window Management

| Setting | Value |
|---------|-------|
| Default size | 1280 × 800 |
| Minimum size | 1024 × 600 |
| Title bar | Custom (frameless with drag region) |
| System tray | Minimize to tray option |

---

## Related Documents

- [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md)
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
- [../11-platforms/DESKTOP_ELECTRON.md](../11-platforms/DESKTOP_ELECTRON.md)
