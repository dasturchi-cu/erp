# PROJECT_STRUCTURE_REPORT

## 1. Overview of Codebase Architecture
The ERP System is a professional-grade multi-platform application designed for retail, warehousing, and finance management. It uses a **Modular Monolith** architecture on the backend, a **React SPA** desktop client wrapped in **Electron**, and a **Flutter** mobile client.

## 2. Directory Tree of ERP_REVIEW Folder
Below is the directory mapping of the gathered audit material:
- `01_DATABASE/`: Prisma database configuration, schema definition, seed scripts, and SQL migration history.
- `02_BACKEND/`: NestJS source modules containing REST controllers, services, repositories, DTOs, and security middleware.
- `03_FRONTEND/`: React source features, components, custom hooks, Zustand stores, and Axios client helpers.
- `04_DESKTOP/`: Electron-specific configuration, preload scripts, and IPC communication managers.
- `05_MOBILE/`: Flutter mobile source codes (lib directory) containing main entry, API integrations, and UI views.
- `06_CONFIGURATION/`: Subdivided configurations (backend, desktop, mobile, root) to inspect compiler, package, and tooling rules.
- `07_DOCUMENTATION/`: Comprehensive system validation reports, integration tests, user guides, and architecture freeze specifications.

## 3. Structural Analysis
- **Modular Monolith Backend**: Each business capability (auth, sales, inventory, customers, suppliers, reports, finance) is isolated as a NestJS module. This enables high maintainability and potential future transition to microservices.
- **Unified Client Architecture**: The frontend is a React application built with Vite. It compiles into static assets that are either served on the web or loaded locally by Electron's `file://` protocol.
- **Native Wrappers**: Electron is used to access native hardware (barcode scanners, ticket printers, offline storage) on desktops, while Flutter serves mobile users.
