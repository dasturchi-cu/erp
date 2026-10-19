/**
 * LIVE Staging Validation — full scenario suite + report generation
 * Usage: node scripts/live-staging.mjs
 * Env: STAGING_API_URL, STAGING_REPORT_PATH
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '../..');
const REPORT_PATH =
  process.env.STAGING_REPORT_PATH ?? resolve(ROOT, 'LIVE_STAGING_REPORT.md');

const BASE = process.env.STAGING_API_URL ?? 'http://localhost:3000/api/v1';
const EMAIL = process.env.STAGING_EMAIL ?? 'admin@erp.uz';
const PASSWORD = process.env.STAGING_PASSWORD ?? 'Admin123!';

const results = [];
const startedAt = new Date().toISOString();

function record(id, name, pass, detail = '') {
  results.push({ id, name, pass, detail, at: new Date().toISOString() });
  const tag = pass ? 'PASS' : 'FAIL';
  console.log(`${tag}  ${id}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function uuid() {
  return crypto.randomUUID();
}

function money(n) {
  return Number(n).toFixed(4);
}

async function request(method, path, { token, companyId, deviceId, body, headers = {} } = {}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  if (companyId) h['X-Company-Id'] = companyId;
  if (deviceId) h['X-Device-Id'] = deviceId;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, ok: res.ok };
}

async function login(deviceId = uuid()) {
  const res = await request('POST', '/auth/login', {
    deviceId,
    body: {
      email: EMAIL,
      password: PASSWORD,
      deviceInfo: {
        deviceId,
        name: 'Live Staging Runner',
        platform: 'windows',
        appVersion: '1.0.0',
      },
    },
  });
  if (!res.ok) return null;
  const company = res.data.companies?.[0];
  if (!company) return null;

  let token = res.data.accessToken;
  let companyId = company.id;

  const sw = await request('POST', '/auth/switch-company', {
    token,
    deviceId,
    body: { companyId: company.id },
  });
  if (sw.ok) {
    token = sw.data.accessToken;
    companyId = sw.data.activeCompany?.id ?? company.id;
  }

  return { token, companyId, deviceId, refreshToken: res.data.refreshToken };
}

async function checkInventoryConsistency(token, companyId, deviceId, productId) {
  const [productRes, batchesRes] = await Promise.all([
    request('GET', `/products/${productId}`, { token, companyId, deviceId }),
    request('GET', '/inventory/batches', { token, companyId, deviceId }),
  ]);
  if (!productRes.ok || !batchesRes.ok) return { ok: false, reason: 'fetch failed' };

  const stock = parseFloat(productRes.data.stock);
  const batchSum = (batchesRes.data.data ?? [])
    .filter((b) => b.productId === productId)
    .reduce((s, b) => s + parseFloat(b.remainingQty), 0);
  const delta = Math.abs(stock - batchSum);
  return { ok: delta < 0.0001, stock, batchSum, delta };
}

async function checkDebtSync(token, companyId, deviceId, customerId) {
  const res = await request('GET', `/customers/${customerId}`, { token, companyId, deviceId });
  if (!res.ok) return { ok: false, reason: 'fetch failed' };
  const rateRes = await request('GET', '/currency/rate', { token, companyId, deviceId });
  const rate = parseFloat(rateRes.data?.rate ?? '12620');
  const debtUzs = parseFloat(res.data.debtUzs ?? res.data.totalDebtUzs ?? 0);
  const debtUsd = parseFloat(res.data.debtUsd ?? res.data.totalDebtUsd ?? 0);
  const expectedUsd = debtUzs / rate;
  const delta = Math.abs(expectedUsd - debtUsd);
  return { ok: delta < 0.01, debtUzs, debtUsd, expectedUsd, delta };
}

async function ensureCategory(session) {
  const { token, companyId, deviceId } = session;
  const list = await request('GET', '/categories', { token, companyId, deviceId });
  const existing = list.data?.data?.find((c) => c.name === 'Live Staging Catalog');
  if (existing) return existing.id;
  const created = await request('POST', '/categories', {
    token,
    companyId,
    deviceId,
    body: { name: 'Live Staging Catalog' },
  });
  if (!created.ok) throw new Error(`Category: ${JSON.stringify(created.data)}`);
  return created.data.id;
}

async function createCustomer(session) {
  const { token, companyId, deviceId } = session;
  const res = await request('POST', '/customers', {
    token,
    companyId,
    deviceId,
    body: {
      name: `Live Customer ${Date.now().toString(36)}`,
      phone: `+99890${Math.floor(Math.random() * 1e7)}`,
    },
  });
  return res;
}

async function createProduct(session, categoryId, warehouseId, stock = 200) {
  const { token, companyId, deviceId } = session;
  const sku = `LIVE-${Date.now().toString(36)}`;
  return request('POST', '/products', {
    token,
    companyId,
    deviceId,
    body: {
      sku,
      name: 'Live Staging Product',
      categoryId,
      purchasePriceUzs: money(7200),
      salePriceUzs: money(10000),
      initialStock: money(stock),
      initialWarehouseId: warehouseId,
    },
  });
}

function createCashSale(session, productId, qty, unitPrice, idempotencyKey) {
  const { token, companyId, deviceId } = session;
  const total = unitPrice * qty;
  return request('POST', '/sales', {
    token,
    companyId,
    deviceId,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    body: {
      originalCurrency: 'UZS',
      paymentType: 'CASH',
      amountPaidUzs: money(total),
      lineItems: [{ productId, quantity: money(qty) }],
    },
  });
}

function writeReport(meta) {
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const lines = [
    '# Live Staging Report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Started:** ${startedAt}`,
    `**API:** ${BASE}`,
    `**Mode:** LIVE HTTP execution`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| PASS | ${passed} |`,
    `| FAIL | ${failed} |`,
    `| Infrastructure | ${meta?.infra ? 'OK' : 'BLOCKED'} |`,
    `| Overall | ${failed === 0 && meta?.infra && !meta?.aborted ? '**PASS**' : '**FAIL**'} |`,
    '',
    '## Scenario results',
    '',
    '| ID | Scenario | Result | Detail |',
    '|----|----------|--------|--------|',
  ];

  for (const r of results) {
    lines.push(`| ${r.id} | ${r.name} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '\\|')} |`);
  }

  lines.push('', '## Verification invariants', '');
  const inv = [
    ['FIFO consistency', results.find((r) => r.id === 'L-FIFO')],
    ['Inventory consistency', results.find((r) => r.id === 'L-INV')],
    ['Debt UZS/USD sync', results.find((r) => r.id === 'L-DEBT')],
    ['Company isolation', results.find((r) => r.id === 'L-ISO')],
    ['Idempotency', results.find((r) => r.id === 'L-IDEM')],
  ];
  for (const [name, r] of inv) {
    lines.push(`- **${name}:** ${r ? (r.pass ? 'PASS' : 'FAIL') : 'SKIP'}`);
  }

  writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
  console.log(`\nReport written: ${REPORT_PATH}`);
}

async function runSuite() {
  console.log(`\n=== LIVE STAGING VALIDATION ===\nAPI: ${BASE}\n`);

  let health;
  try {
    health = await request('GET', '/health');
  } catch (err) {
    record('INFRA', 'API health', false, err.cause?.code ?? err.message);
    return { infra: false };
  }
  if (!health.ok) {
    record('INFRA', 'API health', false, `status=${health.status}`);
    return { infra: false };
  }
  record('L-00', 'Health check', true);

  const session = await login();
  record('L-01', 'Login', Boolean(session), session ? 'JWT + company context' : 'auth failed');
  if (!session) return { infra: true, aborted: true };

  const { token, companyId, deviceId, refreshToken } = session;

  const whRes = await request('GET', '/warehouses', { token, companyId, deviceId });
  const warehouseId = whRes.data?.data?.[0]?.id;
  if (!warehouseId) {
    record('INFRA', 'Warehouse', false, 'no warehouse in seed');
    return { infra: true, aborted: true };
  }

  let categoryId;
  try {
    categoryId = await ensureCategory(session);
  } catch (e) {
    record('L-02a', 'Category bootstrap', false, e.message);
    return { infra: true, aborted: true };
  }
  record('L-02a', 'Category ready', true, categoryId);

  const custRes = await createCustomer(session);
  record('L-02', 'Customer create', custRes.ok, custRes.ok ? `id=${custRes.data.id}` : JSON.stringify(custRes.data));
  if (!custRes.ok) return { infra: true, aborted: true };
  const customerId = custRes.data.id;

  const prodRes = await createProduct(session, categoryId, warehouseId, 200);
  record('L-03', 'Product create', prodRes.ok, prodRes.ok ? `id=${prodRes.data.id}` : JSON.stringify(prodRes.data));
  if (!prodRes.ok) return { infra: true, aborted: true };
  const productId = prodRes.data.id;
  const unitPrice = 10000;

  const prodGet = await request('GET', `/products/${productId}`, { token, companyId, deviceId });
  const prodUpd = await request('PATCH', `/products/${productId}`, {
    token,
    companyId,
    deviceId,
    body: { name: 'Live Staging Product Updated' },
  });
  record(
    'L-03b',
    'Product CRUD (get + update)',
    prodGet.ok && prodUpd.ok,
    prodUpd.ok ? prodUpd.data?.name : JSON.stringify(prodUpd.data),
  );

  const custGet = await request('GET', `/customers/${customerId}`, { token, companyId, deviceId });
  const custUpd = await request('PATCH', `/customers/${customerId}`, {
    token,
    companyId,
    deviceId,
    body: { name: 'Live Customer Updated' },
  });
  record(
    'L-02b',
    'Customer CRUD (get + update)',
    custGet.ok && custUpd.ok,
    custUpd.ok ? custUpd.data?.name : JSON.stringify(custUpd.data),
  );

  // Receiving stock requires a supplier and how it was paid for.
  const supplierRes = await request('POST', '/suppliers', {
    token,
    companyId,
    deviceId,
    body: {
      name: `Live Supplier ${Date.now().toString(36)}`,
      phone: `+99891${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`,
    },
  });
  const supplierId = supplierRes.data?.id;

  const recv = supplierId
    ? await request('POST', '/inventory/receive', {
        token,
        companyId,
        deviceId,
        body: {
          productId,
          warehouseId,
          quantity: money(50),
          unitCostUzs: money(7200),
          supplierId,
          paymentType: 'CREDIT',
        },
      })
    : supplierRes;
  record('L-04', 'Inventory receive', recv.ok, recv.ok ? 'qty=50' : JSON.stringify(recv.data));

  const cashSale = await createCashSale(session, productId, 1, unitPrice, uuid());
  record('L-05', 'Cash sale', cashSale.ok, cashSale.ok ? `id=${cashSale.data.id}` : JSON.stringify(cashSale.data));

  const creditSale = await request('POST', '/sales', {
    token,
    companyId,
    deviceId,
    headers: { 'Idempotency-Key': uuid() },
    body: {
      customerId,
      originalCurrency: 'UZS',
      paymentType: 'CREDIT',
      amountPaidUzs: money(0),
      lineItems: [{ productId, quantity: money(2) }],
    },
  });
  record('L-06', 'Credit sale', creditSale.ok, creditSale.ok ? `debt line qty=2` : JSON.stringify(creditSale.data));

  const payRes = await request('POST', '/debt-payments', {
    token,
    companyId,
    deviceId,
    headers: { 'Idempotency-Key': uuid() },
    body: {
      customerId,
      amount: money(5000),
      currency: 'UZS',
      paymentMethod: 'CASH',
      paymentType: 'PARTIAL',
    },
  });
  const debtAfterPay = await checkDebtSync(token, companyId, deviceId, customerId);
  record(
    'L-07',
    'Debt payment',
    payRes.ok && debtAfterPay.ok,
    `debtUzs=${debtAfterPay.debtUzs}`,
  );

  let returnOk = false;
  if (creditSale.ok) {
    const ret = await request('POST', `/sales/${creditSale.data.id}/returns`, {
      token,
      companyId,
      deviceId,
      headers: { 'Idempotency-Key': uuid() },
      body: { reason: 'live return', lineItems: [{ productId, quantity: money(1) }] },
    });
    if (ret.ok) {
      const appr = await request('POST', `/sales/returns/${ret.data.id}/approve`, {
        token,
        companyId,
        deviceId,
        body: {},
      });
      const saleAfter = await request('GET', `/sales/${creditSale.data.id}`, { token, companyId, deviceId });
      returnOk =
        appr.ok &&
        (saleAfter.data?.status === 'PARTIALLY_RETURNED' || saleAfter.data?.status === 'RETURNED');
      record('L-08', 'Return create + approve', returnOk, `saleStatus=${saleAfter.data?.status}`);
    } else {
      record('L-08', 'Return create + approve', false, JSON.stringify(ret.data));
    }
  } else {
    record('L-08', 'Return create + approve', false, 'credit sale setup failed');
  }

  const voidSetup = await createCashSale(session, productId, 1, unitPrice, uuid());
  if (voidSetup.ok) {
    const invBefore = await checkInventoryConsistency(token, companyId, deviceId, productId);
    const voidRes = await request('POST', `/sales/${voidSetup.data.id}/void`, {
      token,
      companyId,
      deviceId,
      headers: { 'Idempotency-Key': uuid() },
      body: { note: 'live void' },
    });
    const invAfter = await checkInventoryConsistency(token, companyId, deviceId, productId);
    const stockRestored = invAfter.ok && invAfter.stock >= invBefore.stock;
    record(
      'L-09',
      'Void sale',
      voidRes.ok && voidRes.data?.status === 'CANCELLED' && stockRestored,
      `status=${voidRes.data?.status} stock ${invBefore.stock}→${invAfter.stock}`,
    );
  } else {
    record('L-09', 'Void sale', false, 'setup sale failed');
  }

  const rateBefore = await request('GET', '/currency/rate', { token, companyId, deviceId });
  const newRate = await request('POST', '/currency/rates', {
    token,
    companyId,
    deviceId,
    body: { rate: money(12850), notes: 'live staging rate' },
  });
  const saleAfterRate = await createCashSale(session, productId, 1, unitPrice, uuid());
  const rateUsed = parseFloat(saleAfterRate.data?.exchangeRateUsed ?? '0');
  const rateBeforeVal = parseFloat(rateBefore.data?.rate ?? '0');
  record(
    'L-10',
    'Currency change',
    newRate.ok && saleAfterRate.ok && rateUsed > 0,
    `rateBefore=${rateBeforeVal} saleUsed=${rateUsed}`,
  );

  const conc5 = await Promise.all(
    Array.from({ length: 5 }, () => createCashSale(session, productId, 1, unitPrice, uuid())),
  );
  const c5ok = conc5.filter((r) => r.ok).length;
  const inv5 = await checkInventoryConsistency(token, companyId, deviceId, productId);
  record('L-11a', '5 concurrent sales', c5ok === 5 && inv5.ok, `ok=${c5ok}/5 stock=${inv5.stock}`);

  const conc10 = await Promise.all(
    Array.from({ length: 10 }, () => createCashSale(session, productId, 1, unitPrice, uuid())),
  );
  const c10ok = conc10.filter((r) => r.ok).length;
  const c10stock = conc10.filter((r) => r.data?.error?.code === 'INSUFFICIENT_STOCK').length;
  const inv10 = await checkInventoryConsistency(token, companyId, deviceId, productId);
  record(
    'L-11b',
    '10 concurrent sales',
    inv10.ok && inv10.stock >= 0 && c10ok + c10stock === 10,
    `ok=${c10ok} stock_err=${c10stock}`,
  );

  record('L-FIFO', 'FIFO batch sum = stock', inv10.ok, `delta=${inv10.delta ?? 'n/a'}`);
  record('L-INV', 'Inventory consistency', inv10.ok, `stock=${inv10.stock}`);

  const concPay = await Promise.all(
    Array.from({ length: 3 }, () =>
      request('POST', '/debt-payments', {
        token,
        companyId,
        deviceId,
        headers: { 'Idempotency-Key': uuid() },
        body: {
          customerId,
          amount: money(1000),
          currency: 'UZS',
          paymentMethod: 'CASH',
          paymentType: 'PARTIAL',
        },
      }),
    ),
  );
  const debtConc = await checkDebtSync(token, companyId, deviceId, customerId);
  record(
    'L-13',
    '3 concurrent debt payments',
    concPay.every((p) => p.ok) && debtConc.ok,
    `debtUzs=${debtConc.debtUzs}`,
  );
  record('L-DEBT', 'Debt UZS/USD sync', debtConc.ok, `deltaUsd=${debtConc.delta}`);

  const retProduct = await createProduct(session, categoryId, warehouseId, 20);
  if (retProduct.ok) {
    const retPid = retProduct.data.id;
    const retCredit = await request('POST', '/sales', {
      token,
      companyId,
      deviceId,
      headers: { 'Idempotency-Key': uuid() },
      body: {
        customerId,
        originalCurrency: 'UZS',
        paymentType: 'CREDIT',
        amountPaidUzs: money(0),
        lineItems: [{ productId: retPid, quantity: money(1) }],
      },
    });
    if (retCredit.ok) {
      const concRet = await Promise.all(
        Array.from({ length: 2 }, () =>
          request('POST', `/sales/${retCredit.data.id}/returns`, {
            token,
            companyId,
            deviceId,
            headers: { 'Idempotency-Key': uuid() },
            body: { reason: 'concurrent', lineItems: [{ productId: retPid, quantity: money(1) }] },
          }),
        ),
      );
      const retOkCount = concRet.filter((r) => r.ok).length;
      record(
        'L-12',
        '2 concurrent returns (qty=1 sale)',
        retOkCount === 1,
        `success=${retOkCount}/2 (exactly one allowed)`,
      );
    } else {
      record('L-12', '2 concurrent returns', false, 'credit setup failed');
    }
  } else {
    record('L-12', '2 concurrent returns', false, 'product setup failed');
  }

  const idemKey = uuid();
  const id1 = await createCashSale(session, productId, 1, unitPrice, idemKey);
  const id2 = await createCashSale(session, productId, 1, unitPrice, idemKey);
  record('L-IDEM', 'Idempotency replay', id1.ok && id2.ok && id1.data?.id === id2.data?.id, `id=${id1.data?.id}`);

  const wrongCo = await request('GET', '/products', { token, companyId: uuid(), deviceId });
  record('L-ISO', 'Company isolation', wrongCo.status === 403, `status=${wrongCo.status}`);

  if (refreshToken) {
    const ref = await request('POST', '/auth/refresh', { body: { refreshToken } });
    record('L-REF', 'Refresh token rotation', ref.ok && Boolean(ref.data?.accessToken), `status=${ref.status}`);
  }

  return { infra: true };
}

runSuite()
  .then((meta) => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const allPass = failed === 0 && meta?.infra && !meta?.aborted;
    if (allPass) {
      writeReport(meta);
    } else {
      console.log('\nReport skipped — fix failures and re-run until all PASS.\n');
    }
    console.log(`\n=== SUMMARY: ${passed} PASS / ${failed} FAIL ===\n`);
    process.exit(allPass ? 0 : 1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
