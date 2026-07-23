# Mobile UI Specification

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Platform | Android, iPhone, iPad |
| Stack | Flutter + Material Design 3 |
| Last Updated | 2026-06-17 |

---

## Layout Structure

```
┌─────────────────────────┐
│ AppBar: Company | 🔔 👤 │
├─────────────────────────┤
│                         │
│     Main Content        │
│     (scrollable)        │
│                         │
├─────────────────────────┤
│ [🏠] [🛒] [📦] [👥] [≡]│
│ Bottom Navigation Bar   │
└─────────────────────────┘
```

---

## Key Screens

### POS (Mobile)
1. Product search bar (top, auto-focus)
2. Recent/frequent products grid (2 columns)
3. FAB or bottom bar: "View Cart (3 items)"
4. Cart bottom sheet: items, currency, total, complete

### Customer Detail
- Header card: name, phone, debt (UZS + USD chips)
- Tab bar: Purchases | Payments
- FAB: "Record Payment"

### Dashboard
- Pull-to-refresh
- Stat cards (2-column grid)
- Compact sales chart
- Top 5 products list

---

## Platform-Specific

| Feature | Android | iOS |
|---------|---------|-----|
| Back navigation | System back + AppBar back | Swipe back |
| Barcode scan | CameraX | AVFoundation |
| Biometric login | Fingerprint | Face ID (Phase 2) |
| Push notifications | FCM | APNs (Phase 2) |

---

## Related Documents

- [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md)
- [../11-platforms/MOBILE_FLUTTER.md](../11-platforms/MOBILE_FLUTTER.md)
