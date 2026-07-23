# macOS Deployment Plan

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Planned (Phase 2) |
| Target | Q3 2026 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

The ERP desktop client will extend to **macOS** using the same **Electron + React + TypeScript** codebase developed for Windows. Electron's cross-platform nature means the vast majority of application code is shared; macOS-specific work focuses on packaging, code signing, platform conventions, and App Store distribution (optional).

**Timeline**: Q3 2026 (after Windows desktop client reaches production stability)
**Priority**: Medium (per [../03-product/PRODUCT_ROADMAP.md](../03-product/PRODUCT_ROADMAP.md))

---

## 2. Strategic Rationale

| Factor | Assessment |
|--------|------------|
| Code reuse | ~95% shared with Windows Electron build |
| Target users | Management, accounting staff using MacBooks |
| Market demand | Growing Mac adoption in Uzbekistan business sector |
| Development effort | Low–medium (packaging and platform polish) |
| Maintenance burden | Minimal (shared codebase; platform-specific CI job) |

### Target User Personas

| Persona | Use Case | Device |
|---------|----------|--------|
| Business owner | Dashboard, reports, financial overview | MacBook Pro/Air |
| Accountant (future) | Accounting module, reconciliation | iMac / MacBook |
| Regional manager | Multi-branch oversight, approvals | MacBook Air |

Cashiers and warehouse staff remain on Windows desktops and mobile devices.

---

## 3. Platform Requirements

| Requirement | Specification |
|-------------|---------------|
| Minimum OS | macOS 12 Monterey |
| Recommended OS | macOS 14 Sonoma+ |
| Architecture | Apple Silicon (arm64) + Intel (x64) |
| RAM | 8 GB minimum |
| Display | 1280×800 minimum |
| Disk | 500 MB for application + cache |
| Network | Broadband internet required |

### Universal Binary

Electron-builder produces a **universal binary** (arm64 + x64) in a single `.dmg`, supporting both Apple Silicon and Intel Macs without separate downloads.

---

## 4. macOS-Specific Adaptations

### UI/UX Conventions

| Windows Pattern | macOS Adaptation |
|-----------------|------------------|
| Window controls (right) | Traffic lights (left) — Electron handles automatically |
| Menu bar in window | Native macOS menu bar (application menu) |
| Ctrl+ shortcuts | Cmd+ shortcuts (Electron maps automatically) |
| System tray | Menu bar extra (tray icon) |
| Scrollbar | Overlay scrollbars (macOS default) |
| Font rendering | San Francisco system font (via CSS `-apple-system`) |
| Dark mode | Respect `prefers-color-scheme`; match system appearance |
| Full-screen | Native macOS full-screen (green button) |

### Native Menu Bar

| Menu | Items |
|------|-------|
| ERP | About, Preferences (⌘,), Check for Updates, Quit (⌘Q) |
| Edit | Undo, Redo, Cut, Copy, Paste, Select All |
| View | Reload, Toggle DevTools (dev only), Toggle Full Screen |
| Window | Minimize, Zoom, Bring All to Front |
| Help | Documentation, Report Issue |

### Platform-Specific Features

| Feature | Implementation |
|---------|----------------|
| Touch Bar (legacy MacBooks) | Quick actions: new sale, search (optional) |
| Handoff | Not planned (no iOS app Handoff in Phase 1) |
| Spotlight integration | Not planned |
| Notification Center | Native macOS notifications via Electron |
| Dock badge | Unread notification count |

---

## 5. Distribution Strategy

### Option A: Direct Download (Recommended for Phase 1)

| Property | Value |
|----------|-------|
| Format | `.dmg` (disk image) |
| Distribution | `https://erp.example.uz/downloads/` |
| Auto-update | electron-updater (same as Windows) |
| Code signing | Apple Developer ID certificate |
| Notarization | Required (macOS 10.15+ Gatekeeper) |

### Option B: Mac App Store (Future Evaluation)

| Factor | Assessment |
|--------|------------|
| Sandbox restrictions | Conflicts with auto-update, file system access |
| Review process | 1–3 day delay per release |
| Revenue share | 15–30% (not applicable; internal tool) |
| Discovery | Not needed (B2B distribution) |
| **Decision** | **Not recommended** for initial release |

---

## 6. Code Signing and Notarization

### Requirements

| Step | Tool | Purpose |
|------|------|---------|
| Developer ID certificate | Apple Developer Program ($99/year) | Sign application |
| Hardened runtime | electron-builder config | Required for notarization |
| Entitlements | `entitlements.mac.plist` | Network, file access permissions |
| Notarization | `notarytool` (Apple) | Gatekeeper approval |
| Stapling | `stapler` | Attach notarization ticket to `.dmg` |

### Entitlements

| Entitlement | Reason |
|-------------|--------|
| `com.apple.security.cs.allow-jit` | V8 JavaScript engine |
| `com.apple.security.network.client` | API and WebSocket connections |
| `com.apple.security.print` | Receipt printing |
| `com.apple.security.files.user-selected.read-write` | Export reports to user-chosen location |

### CI/CD for macOS

| Step | Runner | Tool |
|------|--------|------|
| Build | `macos-latest` (GitHub Actions) | electron-builder |
| Sign | macOS runner with certificate in keychain | `codesign` |
| Notarize | macOS runner | `notarytool` |
| Upload | Any | GitHub Releases + update server |

**Note**: macOS builds require a macOS CI runner (cannot cross-compile from Linux/Windows).

---

## 7. Build Configuration

### electron-builder macOS Target

| Property | Value |
|----------|-------|
| Target | `dmg` + `zip` (for auto-update) |
| Architecture | `universal` (arm64 + x64) |
| Category | `public.app-category.business` |
| Icon | `icons/icon.icns` (1024×1024) |
| DMG window | Custom background with drag-to-Applications |
| Auto-update | `zip` target (electron-updater requirement) |

### File Structure

```
dist/
├── ERP-{version}-universal.dmg     # User download
├── ERP-{version}-universal-mac.zip # Auto-update package
├── latest-mac.yml                  # Update manifest
└── mac-universal/                  # Unpacked app bundle
    └── ERP.app/
```

---

## 8. Testing Plan

### Pre-Release Testing

| Test | Environment | Pass Criteria |
|------|-------------|---------------|
| Install from DMG | macOS 12, 13, 14 | Clean install; app launches |
| Apple Silicon | M1/M2/M3 Mac | Native performance; no Rosetta |
| Intel Mac | x64 Mac | Functional parity |
| Auto-update | Signed + notarized build | Update downloads and installs |
| Gatekeeper | Fresh macOS install | No security warnings |
| Dark/light mode | System preference change | Theme switches correctly |
| Menu bar | All menu items | Functional |
| Keyboard shortcuts | Cmd-based shortcuts | POS shortcuts work |
| Printing | USB/network printer | Receipt prints correctly |
| WebSocket | Real-time sync | Events received < 500ms |
| Multi-monitor | External display | Window management correct |

### Beta Program

| Phase | Duration | Testers |
|-------|----------|---------|
| Internal alpha | 2 weeks | Dev team (2–3 Macs) |
| Business beta | 4 weeks | 3–5 Mac-using managers |
| Release candidate | 1 week | All beta testers |

---

## 9. Effort Estimate

| Task | Effort | Dependencies |
|------|--------|-------------|
| electron-builder macOS config | 2 days | Windows build stable |
| Code signing setup | 1 day | Apple Developer account |
| Menu bar + platform UI polish | 3 days | — |
| Notarization CI pipeline | 2 days | Signing setup |
| Testing (3 macOS versions) | 3 days | Test devices |
| Beta program | 4 weeks | Beta testers |
| Documentation + release | 1 day | — |
| **Total development** | **~2 weeks** | |
| **Total calendar** | **~8 weeks** (including beta) | |

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Apple Developer account delay | Blocks signing | Apply early (before development starts) |
| Notarization rejection | Blocks distribution | Follow Apple guidelines; test early |
| macOS CI runner cost | GitHub Actions billing | macOS minutes are 10x; optimize build cache |
| Platform-specific bugs | User experience | Beta program with real Mac users |
| Electron macOS performance | Slower than native | Acceptable for ERP UI; profile if issues |
| macOS version fragmentation | Testing burden | Support macOS 12+ only; drop 12 in 2027 |

---

## 11. Success Criteria

- [ ] `.dmg` installs cleanly on macOS 12, 13, 14 (Intel + Apple Silicon)
- [ ] Gatekeeper accepts signed and notarized build without warnings
- [ ] Auto-update works from Windows-equivalent update server
- [ ] Feature parity with Windows desktop (all modules accessible)
- [ ] Performance: cold start < 5 seconds; POS flow < 500ms
- [ ] No macOS-specific crashes in 4-week beta period
- [ ] At least 3 business users actively using macOS client

---

## 12. Related Documents

- [DESKTOP_ELECTRON.md](./DESKTOP_ELECTRON.md)
- [MULTI_DEVICE_STRATEGY.md](./MULTI_DEVICE_STRATEGY.md)
- [../03-product/PRODUCT_ROADMAP.md](../03-product/PRODUCT_ROADMAP.md)
- [../10-devops/CI_CD.md](../10-devops/CI_CD.md)
- [../04-ui-ux/DESKTOP_UI_SPEC.md](../04-ui-ux/DESKTOP_UI_SPEC.md)
