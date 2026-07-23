# Mobile Client (Flutter)

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | 2026-06-17 |

---

## 1. Executive Summary

The ERP mobile client is a cross-platform application built with **Flutter** and **Material Design 3**, targeting **Android** and **iOS** from a single codebase. Mobile serves field sales representatives, warehouse staff, and managers who need business data access away from the desktop workstation.

**Phase 1 target**: Android 8.0+ (API 26+)
**Phase 1 target**: iOS 15.0+

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Flutter | 3.19+ |
| Language | Dart | 3+ |
| Design System | Material Design 3 | Latest |
| State Management | Riverpod | 2+ |
| HTTP Client | Dio | 5+ |
| WebSocket | socket_io_client | 2+ |
| Models | freezed + json_serializable | Latest |
| Navigation | go_router | 13+ |
| Secure Storage | flutter_secure_storage | 9+ |
| Local DB (Phase 2) | drift (SQLite) | 2+ |
| Connectivity | connectivity_plus | 6+ |

---

## 3. Application Architecture

```
┌─────────────────────────────────────────────────┐
│              Flutter Application                  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │              Presentation Layer           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Screens  │ │ Widgets  │ │ Themes   │  │   │
│  │  │ (MD3)    │ │ (shared) │ │ (D/L)    │  │   │
│  │  └────┬─────┘ └──────────┘ └──────────┘  │   │
│  └───────┼──────────────────────────────────┘   │
│          │                                       │
│  ┌───────▼──────────────────────────────────┐   │
│  │           State Management (Riverpod)     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Providers│ │ Notifiers│ │ Async    │  │   │
│  │  │          │ │          │ │ Providers│  │   │
│  │  └────┬─────┘ └──────────┘ └──────────┘  │   │
│  └───────┼──────────────────────────────────┘   │
│          │                                       │
│  ┌───────▼──────────────────────────────────┐   │
│  │              Service Layer                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ API      │ │ WebSocket│ │ Auth     │  │   │
│  │  │ Service  │ │ Service  │ │ Service  │  │   │
│  │  └────┬─────┘ └────┬─────┘ └──────────┘  │   │
│  └───────┼────────────┼─────────────────────┘   │
│          │            │                          │
└──────────┼────────────┼──────────────────────────┘
           │            │
           ▼            ▼
      ┌─────────┐  ┌─────────┐
      │ REST API│  │WebSocket│
      └─────────┘  └─────────┘
```

---

## 4. Platform Support

### Android

| Requirement | Specification |
|-------------|---------------|
| Minimum OS | Android 8.0 (API 26) |
| Target OS | Android 14 (API 34) |
| Architecture | arm64-v8a, armeabi-v7a |
| RAM | 3 GB minimum |
| Storage | 100 MB app + cache |
| Distribution | Google Play Store + direct APK |
| Permissions | Internet, Camera (barcode), Biometric (optional) |

### iOS

| Requirement | Specification |
|-------------|---------------|
| Minimum OS | iOS 15.0 |
| Target OS | iOS 17 |
| Devices | iPhone, iPad |
| Architecture | arm64 |
| Storage | 100 MB app + cache |
| Distribution | Apple App Store |
| Permissions | Internet, Camera (barcode), Face ID (optional) |

---

## 5. Material Design 3 Implementation

### Theme Configuration

| Property | Light | Dark |
|----------|-------|------|
| Primary | Brand blue | Brand blue (lighter) |
| Surface | White | `#1C1B1F` |
| Background | `#FEF7FF` | `#141218` |
| Error | `#B3261E` | `#F2B8B5` |
| Typography | Roboto (system default) | Roboto |

### MD3 Components Used

| Component | Usage |
|-----------|-------|
| `NavigationBar` | Bottom navigation (5 tabs max) |
| `NavigationRail` | Tablet landscape navigation |
| `SearchBar` | Product and customer search |
| `Card` | Product tiles, sale summaries |
| `FilledButton` / `OutlinedButton` | Primary/secondary actions |
| `TextField` | Form inputs with MD3 styling |
| `BottomSheet` | Payment, customer selection |
| `SnackBar` | Success/error notifications |
| `Badge` | Notification count, cart items |
| `SegmentedButton` | Currency toggle (UZS/USD) |
| `DataTable` | Stock lists, sale history |
| `FloatingActionButton` | Quick sale initiation |

See [../04-ui-ux/MOBILE_UI_SPEC.md](../04-ui-ux/MOBILE_UI_SPEC.md) for detailed screen specifications.

---

## 6. Core Mobile Flows (Phase 1)

### Priority Flows

| Flow | Priority | Description |
|------|----------|-------------|
| Login | P0 | Company selection, credentials, biometric |
| Product search | P0 | Barcode scan, text search, stock view |
| Quick sale | P0 | Add items, select customer, complete sale |
| Payment recording | P0 | Record debt payment against customer |
| Customer lookup | P1 | Search, view debt balance, contact info |
| Stock view | P1 | Product stock levels across batches |
| Dashboard (summary) | P1 | Key KPIs: today's sales, receivables |
| Notifications | P2 | In-app notification list |
| Profile / Settings | P2 | Theme, company switch, logout |

### Flows NOT in Phase 1 (Desktop Only)

| Flow | Reason |
|------|--------|
| Product CRUD | Complex forms; desktop preferred |
| Inventory batch management | Warehouse desktop workflow |
| Admin panel | Security; desktop only |
| Report generation | Large data; desktop preferred |
| User/role management | Admin function; desktop only |

---

## 7. Navigation Structure

```
Bottom Navigation (Phone)
├── Home (Dashboard)
├── Sales (POS + History)
├── Products (Search + Stock)
├── Customers (List + Debt)
└── More (Notifications, Settings, Profile)

Navigation Rail (Tablet)
├── Home
├── Sales
├── Products
├── Customers
├── Notifications
└── Settings
```

### Deep Linking

| Route | Screen |
|-------|--------|
| `/login` | Login screen |
| `/home` | Dashboard |
| `/sales/new` | New sale (POS) |
| `/sales/:id` | Sale detail |
| `/products/search` | Product search |
| `/products/:id` | Product detail + stock |
| `/customers` | Customer list |
| `/customers/:id` | Customer detail + debt |
| `/notifications` | Notification center |
| `/settings` | Settings |

---

## 8. Barcode Scanning

| Method | Implementation |
|--------|----------------|
| Camera scan | `mobile_scanner` package; camera overlay with viewfinder |
| Hardware scanner | Bluetooth/USB HID; text input field captures scan |
| Manual entry | Text search fallback |

Scan flow: Scan → API lookup by barcode → Display product with stock → Add to cart (if in sale flow).

---

## 9. Real-Time Sync

| Feature | Implementation |
|---------|----------------|
| WebSocket connection | `socket_io_client`; background-capable |
| Event handling | Riverpod providers invalidate/patch on events |
| Reconnection | Automatic with exponential backoff |
| Background | Maintain connection during active sale; disconnect after 5 min idle |
| Company scope | Events filtered by active `company_id` |

See [../09-realtime/REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md).

---

## 10. Security

| Concern | Implementation |
|---------|----------------|
| Token storage | `flutter_secure_storage` (Keychain/Keystore) |
| Biometric auth | `local_auth` package; optional quick re-login |
| Certificate pinning | Dio interceptor validates server certificate |
| Screenshot prevention | `FLAG_SECURE` on Android; sensitive screens |
| Jailbreak/root detection | Warning displayed; admin can block |
| Session timeout | 15 min idle → require re-authentication |
| Device registration | Device ID sent at login; admin can block |

---

## 11. Offline Considerations (Phase 2)

Phase 1 is online-only. Phase 2 will add:

| Feature | Technology |
|---------|------------|
| Product catalog cache | drift (SQLite) with 24h TTL |
| Sale queue | Local SQLite queue; sync on reconnect |
| Connectivity indicator | `connectivity_plus` listener |
| Offline banner | Persistent UI indicator |

See [../09-realtime/OFFLINE_STRATEGY.md](../09-realtime/OFFLINE_STRATEGY.md).

---

## 12. Performance Targets

| Metric | Target |
|--------|--------|
| Cold start | < 3 seconds |
| Product search | < 300ms |
| Barcode scan to display | < 500ms |
| Sale completion | < 1 second |
| Memory usage | < 200 MB |
| APK size | < 30 MB |
| Battery (active use) | < 5% per hour |

---

## 13. Build and Distribution

### Android

| Step | Tool | Output |
|------|------|--------|
| Build APK | `flutter build apk --release` | `.apk` |
| Build App Bundle | `flutter build appbundle --release` | `.aab` (Play Store) |
| Sign | Upload key (Play App Signing) | Signed |
| Distribute | Google Play Console | Production track |

### iOS

| Step | Tool | Output |
|------|------|--------|
| Build | `flutter build ios --release` | `.ipa` |
| Sign | Apple Developer certificate | Signed |
| Distribute | App Store Connect | Production |

### Release Cadence

| Channel | Platform | Frequency |
|---------|----------|-----------|
| Production | Play Store + App Store | Bi-weekly (aligned with API) |
| Internal testing | TestFlight + Play Internal | Weekly |
| Development | Direct install | Continuous |

---

## 14. Development Setup

| Step | Command |
|------|---------|
| Install Flutter | `flutter doctor` (verify setup) |
| Install dependencies | `flutter pub get` |
| Run on device | `flutter run` |
| Run tests | `flutter test` |
| Analyze | `flutter analyze` |
| Build release | `flutter build apk --release` |

---

## 15. Related Documents

- [DESKTOP_ELECTRON.md](./DESKTOP_ELECTRON.md)
- [MULTI_DEVICE_STRATEGY.md](./MULTI_DEVICE_STRATEGY.md)
- [../04-ui-ux/MOBILE_UI_SPEC.md](../04-ui-ux/MOBILE_UI_SPEC.md)
- [../04-ui-ux/DESIGN_SYSTEM.md](../04-ui-ux/DESIGN_SYSTEM.md)
- [../09-realtime/REALTIME_SYNC.md](../09-realtime/REALTIME_SYNC.md)
- [../09-realtime/OFFLINE_STRATEGY.md](../09-realtime/OFFLINE_STRATEGY.md)
