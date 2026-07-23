# User Stories

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## Epic 1: Authentication & Sessions

| ID | Story | Acceptance Criteria | Priority |
|----|-------|---------------------|----------|
| US-1.1 | As a user, I want to log in from my phone and computer so I can work from any device | Login works on all platforms; separate sessions per device | P0 |
| US-1.2 | As a user, I want my session to persist so I don't re-login constantly | Refresh token auto-renews; 7-day session | P0 |
| US-1.3 | As an admin, I want to force logout a user so I can respond to security incidents | All sessions revoked within 5 seconds | P0 |
| US-1.4 | As an admin, I want to block a device so lost phones can't access the system | Blocked device denied immediately | P0 |

---

## Epic 2: Multi-Company

| ID | Story | Acceptance Criteria | Priority |
|----|-------|---------------------|----------|
| US-2.1 | As an admin, I want to create companies so I can manage Market, Somafix, etc. separately | Company created with isolated data | P0 |
| US-2.2 | As a user, I want to switch between companies so I can work for multiple businesses | Company switcher updates all data | P0 |
| US-2.3 | As a business owner, I want guaranteed data isolation so competitors' data is never visible | Penetration test confirms zero leakage | P0 |

---

## Epic 3: Products & Inventory

| ID | Story | Acceptance Criteria | Priority |
|----|-------|---------------------|----------|
| US-3.1 | As a warehouse keeper, I want to add products with SKU and barcode so I can track inventory | Product created with all price fields | P0 |
| US-3.2 | As a manager, I want to see total inventory value in UZS and USD so I know my stock worth | Totals calculated correctly | P0 |
| US-3.3 | As a warehouse keeper, I want to receive stock in batches so FIFO is maintained | Batch created with cost and date | P0 |
| US-3.4 | As a cashier, I want stock to update in real-time when another device sells so I don't oversell | WebSocket update < 1 second | P0 |

---

## Epic 4: FIFO & Sales

| ID | Story | Acceptance Criteria | Priority |
|----|-------|---------------------|----------|
| US-4.1 | As a cashier, I want to complete a sale quickly so customers aren't waiting | Sale flow < 30 seconds | P0 |
| US-4.2 | As a manager, I want FIFO costing automatic so profit is accurate | Oldest batch consumed first | P0 |
| US-4.3 | As a cashier, I want to sell in UZS or USD so I match customer preference | Currency selected per sale | P0 |
| US-4.4 | As a manager, I want historical sales unchanged when exchange rate updates | Audit confirms immutability | P0 |

---

## Epic 5: Customers & Debt

| ID | Story | Acceptance Criteria | Priority |
|----|-------|---------------------|----------|
| US-5.1 | As a cashier, I want to find customers by phone so I can process credit sales | Phone search < 200ms | P0 |
| US-5.2 | As a manager, I want to see customer debt history so I can follow up on payments | Purchases, payments, balance shown | P0 |
| US-5.3 | As a cashier, I want to record partial payments so customers can pay incrementally | Balance reduced correctly | P0 |

---

## Epic 6: Dashboard & Reports

| ID | Story | Acceptance Criteria | Priority |
|----|-------|---------------------|----------|
| US-6.1 | As a manager, I want a dashboard with daily/weekly/monthly sales so I monitor performance | All periods with UZS/USD | P0 |
| US-6.2 | As a manager, I want to export reports to Excel so I can share with accountant | XLSX download works | P1 |
| US-6.3 | As a manager, I want to see top-selling products so I can optimize stock | Top 10 by revenue | P1 |

---

## Epic 7: Admin Panel

| ID | Story | Acceptance Criteria | Priority |
|----|-------|---------------------|----------|
| US-7.1 | As an admin, I want to manage users and roles so access is controlled | CRUD users, assign roles | P0 |
| US-7.2 | As an admin, I want to enable/disable modules so I control feature rollout | Module toggle affects all clients | P0 |
| US-7.3 | As an admin, I want to see active devices and sessions so I monitor security | Real-time device/session list | P0 |
| US-7.4 | As an admin, I want to manage permissions so I can customize role access | Permission matrix UI | P1 |

---

## Epic 8: Real-Time & Notifications

| ID | Story | Acceptance Criteria | Priority |
|----|-------|---------------------|----------|
| US-8.1 | As a user, I want instant updates when data changes on another device | WebSocket push < 1 second | P0 |
| US-8.2 | As a manager, I want notifications for large sales so I'm aware of activity | Configurable threshold alerts | P2 |

---

## Epic 9: Operations

| ID | Story | Acceptance Criteria | Priority |
|----|-------|---------------------|----------|
| US-9.1 | As an admin, I want daily backups so data is protected | Automated backup at 02:00 | P0 |
| US-9.2 | As an admin, I want system health monitoring so I detect issues early | Health dashboard with alerts | P1 |
| US-9.3 | As an admin, I want to view audit logs so I can investigate incidents | Searchable audit trail | P0 |

---

## Story Point Reference

| Points | Complexity |
|--------|------------|
| 1 | Trivial |
| 2 | Simple |
| 3 | Moderate |
| 5 | Complex |
| 8 | Very complex |
| 13 | Epic — must be split |

---

## Related Documents

- [USE_CASES.md](./USE_CASES.md)
- [../03-product/FEATURE_PRIORITIZATION.md](../03-product/FEATURE_PRIORITIZATION.md)
