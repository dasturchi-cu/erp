# Navigation Patterns

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## Desktop Navigation

| Pattern | Usage |
|---------|-------|
| **Sidebar** | Primary module navigation, collapsible |
| **Breadcrumbs** | Deep page hierarchy |
| **Tabs** | Sub-sections within a module (e.g., Customer: Purchases / Payments) |
| **Command Palette** | Cmd+K global search and quick actions |
| **Context Menu** | Right-click on table rows |

### Sidebar Behavior
- Expanded (240px): icons + labels
- Collapsed (64px): icons only, tooltip on hover
- Active item: primary color background
- Disabled module: item hidden (not grayed)

---

## Mobile Navigation

| Pattern | Usage |
|---------|-------|
| **Bottom Tabs** | Primary modules (5 max) |
| **Stack Navigation** | Drill-down within module |
| **Bottom Sheet** | Cart, filters, quick actions |
| **Drawer** | "More" menu, admin section |

---

## Cross-Platform Rules

1. Current company always visible in header
2. Back navigation preserves scroll position
3. Unsaved form changes → confirmation dialog on navigate away
4. Deep links supported: `erp://sales/new`, `erp://customers/{id}`
5. Module-disabled redirect: always to Dashboard with toast

---

## Related Documents

- [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md)
- [USER_FLOWS.md](./USER_FLOWS.md)
