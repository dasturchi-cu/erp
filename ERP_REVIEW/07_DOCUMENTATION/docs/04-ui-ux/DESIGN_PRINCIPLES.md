# Design Principles

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Core Principles

### 1.1 Speed for Operations
Cashiers process 100+ sales per day. Every tap counts. POS flows must minimize steps.

### 1.2 Clarity for Management
Managers need instant understanding. Dashboards use clear numbers, not charts that require interpretation.

### 1.3 Consistency Across Platforms
Same information architecture on desktop and mobile. Users switching devices should feel at home.

### 1.4 Data Density for Power Users
Desktop ERP users expect tables with many columns, keyboard navigation, and bulk actions.

### 1.5 Simplicity for Mobile
Mobile shows essential actions only. Complex operations deferred to desktop.

### 1.6 Real-Time Feedback
Every action shows immediate visual confirmation. WebSocket updates animate subtly.

---

## 2. Visual Identity

| Element | Guideline |
|---------|-----------|
| Style | Professional, clean, enterprise-grade |
| Density | Compact on desktop (data tables), comfortable on mobile |
| Icons | Lucide (desktop), Material Icons (mobile) |
| Typography | Inter (desktop), Roboto (mobile) |
| Border radius | 6px (desktop), 12px (mobile cards) |
| Shadows | Subtle, layered for depth |

---

## 3. Theme System

| Mode | Usage |
|------|-------|
| Light | Default for well-lit warehouse/office environments |
| Dark | Evening operations, reduced eye strain |
| System | Follow OS preference (auto-switch) |

Theme stored in user preference, synced across devices.

---

## 4. Language

- **Primary**: Uzbek (Latin script)
- **Secondary**: Russian (Phase 1.5)
- **Technical**: English for admin/developer interfaces

---

## 5. Error Handling UX

- Inline validation on forms (not alert dialogs)
- Toast notifications for success/error (auto-dismiss 5s)
- Critical errors: modal with clear action ("Session expired — Log in again")
- Network errors: banner with retry button

---

## 6. Loading States

- Skeleton screens for data tables
- Spinner for actions (button disabled during submit)
- Optimistic updates for real-time data (revert on failure)

---

## 7. Accessibility Targets

- WCAG 2.1 AA compliance (Phase 1.5)
- Minimum contrast ratio 4.5:1
- Keyboard navigable desktop forms
- Screen reader labels on interactive elements

---

## Related Documents

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md)
- [THEMING_DARK_LIGHT.md](./THEMING_DARK_LIGHT.md)
