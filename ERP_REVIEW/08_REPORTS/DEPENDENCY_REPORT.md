# DEPENDENCY_REPORT

## 1. Backend Dependencies (NestJS)
- **Framework Core**: `@nestjs/common`, `@nestjs/core` (v10.4.15) - High performance, TypeScript-first dependency injection.
- **Database ORM**: `@prisma/client` (v6.1.0) - Typesafe client for PostgreSQL.
- **Security & Crypto**: `bcrypt` (v5.1.1) for secure hashing, `@nestjs/jwt` (v10.2.0) and `passport-jwt` (v4.0.1) for token auth.
- **Validation**: `class-validator` (v0.14.1), `class-transformer` (v0.5.1) - Enforces DTO payload validation.
- **Caching**: `ioredis` (v5.4.2) - High-performance Redis caching client.
- **Document Generation**: `exceljs` (v4.4.0), `pdfkit` (v0.16.0) - High-fidelity reports compilation.

## 2. Desktop & Frontend Dependencies (React + Electron)
- **UI Framework**: `@mui/material` (v7.0.0), `@mui/icons-material` (v7.0.0) - Modern Material Design component library.
- **State Management**: `zustand` (v5.0.2) - Lightweight, high-performance state manager.
- **Form Handling**: `react-hook-form` (v7.54.2), `@hookform/resolvers` - Optimizes input validation and prevents redundant re-renders.
- **HTTP Client**: `axios` (v1.7.9) - Promisified request controller.
- **Tooling**: `vite` (v6.0.5) - Fast dev server and Rollup packager.
- **Desktop Wrapper**: `electron` (v33.2.1), `electron-builder` (v25.1.8) - Desktop package compiler.

## 3. Mobile Dependencies (Flutter)
- **HTTP Controller**: `dio` (v5.10.0) - Powerful Dart networking client.
- **Charting**: `fl_chart` (v1.2.0) - High-performance chart plotter.
- **Local Storage**: `shared_preferences` (v2.5.5) - Encrypted key-value persistence.

## 4. Risks & Bloat Assessment
- Excellent dependency hygiene. No redundant libraries.
- Standard licenses (MIT, Apache 2.0). No GPL/AGPL copyleft risks found.
