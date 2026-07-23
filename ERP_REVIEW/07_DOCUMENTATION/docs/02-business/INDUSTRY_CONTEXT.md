# Industry Context

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## 1. Market Context — Uzbekistan

Uzbekistan's wholesale and retail sector operates with unique characteristics that shape ERP requirements:

### 1.1 Dual Currency Economy

- **UZS (So'm)** is the official currency for daily operations
- **USD** is widely used in B2B trade, especially for imported goods (construction materials, tools, Chinese products)
- Exchange rates fluctuate; businesses update rates daily or weekly
- Historical transaction accuracy requires frozen rates per operation

### 1.2 Business Verticals

| Vertical | Uzbek Term | Characteristics |
|----------|------------|-----------------|
| Construction materials | Qurilish mollari | High volume, bulk pricing, credit sales common |
| Furniture parts | Mebel zapchastlari | SKU-heavy, varied sizes, barcode usage |
| Shelving | Narvonlar | Mixed wholesale/retail |
| Tools | Instrumentlar | USD pricing common, import-heavy |
| Sealants | Germetik mahsulotlar | Expiry tracking (future), batch tracking |
| Wholesale | Ulgurji savdo | Large orders, customer debt essential |
| Retail | Chakana savdo | Fast POS, walk-in customers |

### 1.3 Target Companies (from Master Plan)

- **Market** — General retail/wholesale
- **O'O'MQ** — Industry-specific operations
- **Xitoy Tovar** — Chinese imports, USD-heavy
- **Somafix** — Sealant products
- **Lantian** — Multi-product trading

---

## 2. Operational Patterns

### 2.1 Typical Day

1. Morning: warehouse receives goods, enters batches
2. Daytime: cashiers process sales (cash and credit)
3. Afternoon: managers review sales, call debtors
4. Evening: daily summary, cash reconciliation

### 2.2 Credit Culture

- B2B customers commonly buy on credit
- Partial payments are the norm, not exception
- Phone number is primary customer identifier
- Debt follow-up is daily managerial task

### 2.3 Multi-Location

- Companies may have multiple branches/stores
- Central management with branch-level operations
- Shared product catalog, branch-level stock (Phase 2)

---

## 3. Regulatory Considerations

- Financial record retention: 7+ years recommended
- VAT reporting: future accounting module integration
- Personal data: customer phone numbers require protection
- Electronic document requirements: evolving in Uzbekistan

---

## 4. Technology Landscape

- Windows desktops dominant in offices and warehouses
- Android phones widespread among field staff
- iPhones used by management
- Internet connectivity: generally reliable in urban areas; online-first acceptable
- Barcode scanners: USB on desktop, camera on mobile

---

## 5. Competitive Differentiators

| Feature | Why It Matters |
|---------|----------------|
| Real-time multi-device | Staff at warehouse and office see same data instantly |
| UZS/USD dual currency | Matches how Uzbek businesses actually operate |
| FIFO costing | Accurate profit in inflationary environment |
| Multi-company | Holdings with multiple brands (Market, Somafix, etc.) |
| Remote admin | Owner can block devices, manage users from anywhere |
| Uzbek language | Primary user language |

---

## Related Documents

- [STAKEHOLDER_REQUIREMENTS.md](./STAKEHOLDER_REQUIREMENTS.md)
- [../08-modules/CURRENCY_UZS_USD.md](../08-modules/CURRENCY_UZS_USD.md)
