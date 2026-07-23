# Responsive Design

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## Breakpoints (Desktop Web View)

| Name | Width | Layout |
|------|-------|--------|
| `sm` | 640px | Single column, hamburger menu |
| `md` | 768px | Sidebar collapsed, 2-column grid |
| `lg` | 1024px | Sidebar expanded, full tables |
| `xl` | 1280px | Optimal ERP layout |
| `2xl` | 1536px | Wide tables, side panels |

---

## Platform Strategy

| Platform | Min Width | Primary Layout |
|----------|-----------|----------------|
| Windows Desktop | 1024px | Sidebar + content area |
| Tablet (iPad) | 768px | Collapsed sidebar or bottom nav |
| Phone | 320px | Bottom tab bar, stacked cards |

---

## Desktop Adaptations

- Sidebar collapses to icons at < 1024px
- Data tables horizontal scroll at < 1280px
- POS layout: cart panel moves below products at < 1024px
- Admin tables: priority columns only on smaller screens

---

## Mobile Adaptations (Flutter)

- All list views use cards instead of tables
- POS: full-screen product search → bottom sheet cart
- Dashboard: vertically stacked stat cards, swipeable charts
- Forms: full-width inputs, 48px touch targets
- Admin functions: simplified mobile views (view + basic actions)

---

## Touch Targets

- Minimum 44×44px on mobile (Apple HIG)
- Minimum 48×48px on Android (Material)
- Desktop click targets: 36px minimum height

---

## Related Documents

- [MOBILE_UI_SPEC.md](./MOBILE_UI_SPEC.md)
- [DESKTOP_UI_SPEC.md](./DESKTOP_UI_SPEC.md)
