# Desktop Client (Electron)

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

The ERP desktop client is a **Windows-native application** built with **Electron**, **React**, and **TypeScript**. It serves as the primary workstation for cashiers, warehouse keepers, and managers who need a full-featured, keyboard-optimized interface with real-time data synchronization.

**Phase 1 target**: Windows 10/11 (64-bit)
**Phase 2 target**: macOS 12+ (see [FUTURE_MACOS.md](./FUTURE_MACOS.md))

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Shell | Electron | 28+ |
| UI Framework | React | 18+ |
| Language | TypeScript | 5+ |
| Build Tool | Vite | 5+ |
| Server State | TanStack Query | 5+ |
| Client State | Zustand | 4+ |
| Routing | React Router | 6+ |
| WebSocket | socket.io-client | 4+ |
| Styling | Tailwind CSS + shadcn/ui | Latest |
| Auto-Update | electron-updater | 6+ |
| Packaging | electron-builder | 24+ |

---

## 3. Application Architecture

```
┌─────────────────────────────────────────────────┐
│                  Electron Shell                   │
│  ┌───────────────┐  ┌────────────────────────┐  │
│  │  Main Process │  │    Renderer Process     │  │
│  │               │  │    (React Application)  │  │
│  │  • Window mgmt│  │                         │  │
│  │  • Auto-update│  │  ┌─────────────────┐   │  │
│  │  • IPC bridge │◀▶│  │ UI Components   │   │  │
│  │  • Tray icon  │  │  │ (shadcn/ui)     │   │  │
│  │  • Shortcuts  │  │  ├─────────────────┤   │  │
│  │  • Secure     │  │  │ TanStack Query  │   │  │
│  │    storage    │  │  │ (server state)  │   │  │
│  │               │  │  ├─────────────────┤   │  │
│  │               │  │  │ Zustand         │   │  │
│  │               │  │  │ (client state)  │   │  │
│  │               │  │  ├─────────────────┤   │  │
│  │               │  │  │ Socket.io       │   │  │
│  │               │  │  │ (real-time)     │   │  │
│  │               │  │  └─────────────────┘   │  │
│  └───────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │ HTTPS/WSS                    │
         ▼                              ▼
    ┌──────────┐                 ┌──────────┐
    │ REST API │                 │ WebSocket│
    └──────────┘                 └──────────┘
```

### Main Process Responsibilities

| Function | Detail |
|----------|--------|
| Window management | Create, minimize, maximize, multi-window support |
| Auto-update | Check, download, install updates silently |
| IPC bridge | Secure communication between main and renderer |
| System tray | Minimize to tray; notification badge |
| Global shortcuts | POS hotkeys (F1–F12 mapping) |
| Secure storage | Token storage via `safeStorage` API |
| Print integration | Receipt printing via system print dialog |
| Deep links | `erp://` protocol handler (future) |

### Renderer Process Responsibilities

| Function | Detail |
|----------|--------|
| UI rendering | All business screens and interactions |
| API communication | REST calls via TanStack Query |
| Real-time updates | WebSocket event handling |
| Local state | Cart, form drafts, UI preferences |
| Routing | Module-based navigation |

---

## 4. Platform Support

### Windows (Phase 1 — Primary)

| Requirement | Specification |
|-------------|---------------|
| OS | Windows 10 (1903+) or Windows 11 |
| Architecture | x64 |
| RAM | 4 GB minimum, 8 GB recommended |
| Display | 1280×720 minimum; 1920×1080 recommended |
| Disk | 500 MB for application + cache |
| Network | Broadband internet required |
| .NET | Not required |
| Printer | USB or network thermal receipt printer |

### Installer

| Property | Value |
|----------|-------|
| Format | NSIS installer (`.exe`) |
| Distribution | GitHub Releases + auto-update server |
| Installation path | `%LOCALAPPDATA%\Programs\erp-desktop` |
| Auto-update | Background download; prompt on restart |
| Code signing | Windows Authenticode certificate (required for SmartScreen) |
| Uninstaller | Included; preserves user preferences |

### macOS (Phase 2 — Planned)

See [FUTURE_MACOS.md](./FUTURE_MACOS.md) for detailed macOS deployment plan.

---

## 5. Key Features

### POS-Optimized Layout

| Feature | Description |
|---------|-------------|
| Full-screen POS mode | Distraction-free sales interface |
| Barcode scanner input | USB HID keyboard emulation; instant product lookup |
| Keyboard shortcuts | F1: new sale, F2: payment, F3: search, F4: customer, Esc: cancel |
| Dual monitor | POS on primary; customer display on secondary (future) |
| Receipt printing | Thermal printer via system print API |
| Quick product grid | Configurable product tiles for fast selection |

### Theme Support

| Theme | Implementation |
|-------|----------------|
| Light mode | Default; optimized for bright retail environments |
| Dark mode | CSS variables; optimized for warehouse/back-office |
| System preference | Auto-detect OS theme setting |
| Per-user | Persisted in server-side user preferences |

See [../04-ui-ux/THEMING_DARK_LIGHT.md](../04-ui-ux/THEMING_DARK_LIGHT.md).

### Real-Time Sync

- WebSocket connection maintained in background.
- TanStack Query cache patched on domain events.
- Automatic reconnection with event replay.
- See [../09-realtime/REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md).

---

## 6. Security

| Concern | Implementation |
|---------|----------------|
| Token storage | Electron `safeStorage` (OS keychain) |
| Context isolation | Enabled; no Node.js in renderer |
| CSP | Strict Content Security Policy |
| Certificate pinning | Validate API server certificate |
| DevTools | Disabled in production builds |
| Auto-update verification | Code signature check before install |
| Screen capture | Prevented on login and payment screens |

---

## 7. Module Coverage

All ERP modules available on desktop (full feature parity with API):

| Module | Desktop Features |
|--------|-----------------|
| Dashboard | Full KPI dashboard with charts |
| Products | CRUD, barcode, categories, dual pricing |
| Inventory | Batch management, FIFO, stock movements |
| Sales (POS) | Full POS flow with keyboard optimization |
| Customers | CRUD, debt view, payment history |
| Debt | Payment recording, aging report |
| Currency | Rate management, dual-currency display |
| Reports | Generate, preview, export (PDF, Excel, CSV) |
| Admin | User/role/company/device management |
| Notifications | In-app notification center |
| Settings | Company, branch, module, theme preferences |

---

## 8. Auto-Update Mechanism

```
App Start → Check for updates (electron-updater)
    │
    ├─ No update → Continue normally
    │
    └─ Update available → Download in background
         │
         └─ Download complete → Notify user
              │
              ├─ "Restart now" → Install and relaunch
              └─ "Later" → Install on next restart
```

| Setting | Value |
|---------|-------|
| Check frequency | On startup + every 4 hours |
| Update server | `https://erp.example.uz/updates/` |
| Channel | `stable` (default); `beta` (opt-in) |
| Rollback | Previous version available for 7 days |
| Forced update | Admin can mandate minimum version via API |

---

## 9. Performance Targets

| Metric | Target |
|--------|--------|
| Cold start | < 5 seconds |
| Hot start | < 2 seconds |
| Product search | < 200ms (local cache) |
| Sale completion | < 500ms (API round-trip) |
| Memory usage (idle) | < 300 MB |
| Memory usage (active POS) | < 500 MB |
| WebSocket reconnect | < 3 seconds |

---

## 10. Build and Release

### Build Pipeline

| Step | Tool | Output |
|------|------|--------|
| TypeScript compile | `tsc` | JavaScript |
| React bundle | Vite | Optimized chunks |
| Electron package | electron-builder | `.exe` installer |
| Code sign | SignTool (Windows) | Signed installer |
| Upload | GitHub Actions | GitHub Releases + update server |

### Release Channels

| Channel | Audience | Update Frequency |
|---------|----------|-----------------|
| `stable` | All production users | Bi-weekly (with API releases) |
| `beta` | Internal testers | Weekly |
| `dev` | Developers | Every commit to `main` |

---

## 11. Development Setup

| Step | Command |
|------|---------|
| Install dependencies | `npm install` |
| Start dev server | `npm run dev` (Vite + Electron) |
| Run tests | `npm run test` |
| Build production | `npm run build:win` |
| Package installer | `npm run package:win` |

Hot reload enabled in development. API connects to `localhost:3000` or staging server.

---

## 12. Related Documents

- [MOBILE_FLUTTER.md](./MOBILE_FLUTTER.md)
- [FUTURE_MACOS.md](./FUTURE_MACOS.md)
- [MULTI_DEVICE_STRATEGY.md](./MULTI_DEVICE_STRATEGY.md)
- [../04-ui-ux/DESKTOP_UI_SPEC.md](../04-ui-ux/DESKTOP_UI_SPEC.md)
- [../01-governance/TECHNOLOGY_STACK.md](../01-governance/TECHNOLOGY_STACK.md)
- [../09-realtime/REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md)
