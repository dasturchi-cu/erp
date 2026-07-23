# FRONTEND_REPORT

## 1. Technology Stack
- **Framework**: React 19 with TypeScript.
- **Build Tool**: Vite 6.
- **CSS System**: Vanilla CSS with styled emotion wrappers for Material UI components.

## 2. Core Modules & Component Architecture
- **Features**: Features are grouped as domain folders under `src/features/`:
  - `products/`, `sales/`, `inventory/`, `customers/`, `suppliers/`, `reports/`, `finance/`, `admin/`.
- **State Store**: Zustand stores handle global reactive state (authentication, current sale cart, active company, active currency rates).
- **API Client**: Axios instance configured with interceptors:
  - Automatically appends JWT bearer tokens.
  - Automatically appends device ID and pilot tracking logs.
  - Automatically triggers silent token refresh on expiration.
  - Dynamic API URL resolution to use Vite proxy in dev browser mode and absolute URL in packaged Electron mode.

## 3. UX & UI Standards
- High-fidelity visual styles using customized Material UI palettes.
- Fully responsive layout for topbar, sidebar, and dashboard cards.
