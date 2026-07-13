/**
 * ERP Staging Validation Runner
 * Usage: npm run staging:validate
 * Env: STAGING_API_URL (default http://localhost:3000/api/v1)
 */

const BASE = process.env.STAGING_API_URL ?? 'http://localhost:3000/api/v1';
const EMAIL = process.env.STAGING_EMAIL ?? 'admin@erp.uz';
const PASSWORD = process.env.STAGING_PASSWORD ?? 'Admin123!';

const results = [];

function record(id, name, pass, detail = '') {
  results.push({ id, name, pass, detail });
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
  const h = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) h.Authorization = `Bearer ${token}`;
  if (companyId) h['X-Company-Id'] = companyId;
  if (deviceId) h['X-Device-Id'] = deviceId;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data;
  const text = await res.text();
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
        name: 'Staging Runner',
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

  if (res.data.companies.length >= 1) {
    const sw = await request('POST', '/auth/switch-company', {
      token,
      deviceId,
      body: { companyId: company.id },
    });
    if (sw.ok) {
      token = sw.data.accessToken;
      companyId = sw.data.activeCompany?.id ?? company.id;
    }
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

async function bootstrap(session) {
  const { token, companyId, deviceId } = session;

  let catRes = await request('GET', '/categories', { token, companyId, deviceId });
  let categoryId = catRes.data?.data?.find((c) => c.name === 'Staging Catalog')?.id;

  if (!categoryId) {
    catRes = await request('POST', '/categories', {
      token,
      companyId,
      deviceId,
      body: { name: 'Staging Catalog' },
    });
    categoryId = catRes.data?.id;
  }

  const whRes = await request('GET', '/warehouses', { token, companyId, deviceId });
  const warehouseId = whRes.data?.data?.[0]?.id;
  if (!warehouseId) throw new Error('No warehouse');

  const sku = `STG-${Date.now().toString(36)}`;
  const prodRes = await request('POST', '/products', {
    token,
    companyId,
    deviceId,
    body: {
      sku,
      name: 'Staging Test Product',
      categoryId,
      purchasePriceUzs: money(7200),
      salePriceUzs: money(10000),
      initialStock: money(100),
      initialWarehouseId: warehouseId,
    },
  });
  if (!prodRes.ok) throw new Error(`Product create failed: ${JSON.stringify(prodRes.data)}`);

  const custRes = await request('POST', '/customers', {
    token,
    companyId,
    deviceId,
    body: {
      name: `Staging Customer ${Date.now().toString(36)}`,
      phone: `+99890${Math.floor(Math.random() * 1e7)}`,
    },
  });
  if (!custRes.ok) throw new Error(`Customer create failed: ${JSON.stringify(custRes.data)}`);

  const supRes = await request('GET', '/suppliers', { token, companyId, deviceId });
  const supplierId = supRes.data?.data?.[0]?.id;
  if (!supplierId) throw new Error('No supplier');

  return {
    productId: prodRes.data.id,
    customerId: custRes.data.id,
    warehouseId,
    supplierId,
    salePriceUzs: 10000,
  };
}

async function createCashSale(session, productId, qty = 1, unitPriceUzs = 10000, idempotencyKey = uuid()) {
  const { token, companyId, deviceId } = session;
  const headers = { 'Idempotency-Key': idempotencyKey };
  const total = unitPriceUzs * qty;
  return request('POST', '/sales', {
    token,
    companyId,
    deviceId,
    headers,
    body: {
      originalCurrency: 'UZS',
      paymentType: 'CASH',
      amountPaidUzs: money(total),
      lineItems: [{ productId, quantity: money(qty) }],
    },
  });
}

async function runSuite() {
  console.log(`\n=== ERP STAGING VALIDATION ===\nAPI: ${BASE}\n`);

  let health;
  try {
    health = await request('GET', '/health');
  } catch (err) {
    record('INFRA', 'API health', false, `API unreachable (${err.cause?.code ?? err.message})`);
    return { infra: false };
  }

  if (!health.ok) {
    record('INFRA', 'API health', false, 'API unreachable — start docker, migrate, seed, and API');
    return { infra: false };
  }
  record('S01a', 'Health check', true);

  const session = await login();
  if (!session) {
    record('S01b', 'Login', false, 'Check credentials and seed');
    return { infra: true, aborted: true };
  }
  record('S01b', 'Login + company context', true);

  let ctx;
  try {
    ctx = await bootstrap(session);
    record('S01c', 'Bootstrap catalog', true, `product=${ctx.productId}`);
  } catch (e) {
    record('S01c', 'Bootstrap catalog', false, e.message);
    return { infra: true, aborted: true };
  }

  const { token, companyId, deviceId, refreshToken } = session;
  const { productId, customerId, warehouseId, supplierId } = ctx;

  const unitPrice = ctx.salePriceUzs;

  // S02a — 5 concurrent sales
  const five = await Promise.all(
    Array.from({ length: 5 }, () => createCashSale(session, productId, 1, unitPrice)),
  );
  const fiveOk = five.filter((r) => r.ok).length;
  const inv5 = await checkInventoryConsistency(token, companyId, deviceId, productId);
  record(
    'S02a',
    '5 concurrent cash sales',
    fiveOk === 5 && inv5.ok,
    `success=${fiveOk}/5 stock=${inv5.stock} batches=${inv5.batchSum}`,
  );

  // S02b — 10 concurrent sales
  const ten = await Promise.all(
    Array.from({ length: 10 }, () => createCashSale(session, productId, 1, unitPrice)),
  );
  const tenOk = ten.filter((r) => r.ok).length;
  const tenStockErr = ten.filter((r) => r.data?.error?.code === 'INSUFFICIENT_STOCK').length;
  const inv10 = await checkInventoryConsistency(token, companyId, deviceId, productId);
  record(
    'S02b',
    '10 concurrent cash sales',
    inv10.ok && inv10.stock >= 0 && tenOk + tenStockErr === 10,
    `success=${tenOk} stock_errors=${tenStockErr} stock=${inv10.stock}`,
  );

  // S03 — FIFO consistency
  record('S03b', 'FIFO batch sum = product stock', inv10.ok, `delta=${inv10.delta ?? 'n/a'}`);

  // S10c — Idempotency replay
  const idemKey = uuid();
  const sale1 = await createCashSale(session, productId, 1, unitPrice, idemKey);
  const sale2 = await createCashSale(session, productId, 1, unitPrice, idemKey);
  const sameId = sale1.ok && sale2.ok && sale1.data?.id === sale2.data?.id;
  record('S10c', 'Idempotency key replay', sameId, `id=${sale1.data?.id}`);

  // S10b — Idempotency mismatch
  const idemKey2 = uuid();
  await createCashSale(session, productId, 1, unitPrice, idemKey2);
  const mismatch = await request('POST', '/sales', {
    token,
    companyId,
    deviceId,
    headers: { 'Idempotency-Key': idemKey2 },
    body: {
      originalCurrency: 'UZS',
      paymentType: 'CASH',
      amountPaidUzs: money(unitPrice * 2),
      lineItems: [{ productId, quantity: money(2) }],
    },
  });
  record(
    'S10b',
    'Idempotency key mismatch',
    mismatch.status === 409 && mismatch.data?.error?.code === 'IDEMPOTENCY_KEY_MISMATCH',
    `status=${mismatch.status}`,
  );

  // S04 — Credit + concurrent payments
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
      lineItems: [{ productId, quantity: money(1) }],
    },
  });
  const creditOk = creditSale.ok;
  if (creditOk) {
    const payAmount = money(2000);
    const pays = await Promise.all(
      Array.from({ length: 3 }, (_, i) =>
        request('POST', '/debt-payments', {
          token,
          companyId,
          deviceId,
          headers: { 'Idempotency-Key': uuid() },
          body: {
            customerId,
            amount: payAmount,
            currency: 'UZS',
            paymentMethod: 'CASH',
            paymentType: 'PARTIAL',
          },
        }),
      ),
    );
    const debt = await checkDebtSync(token, companyId, deviceId, customerId);
    record(
      'S04a',
      '3 concurrent debt payments',
      pays.every((p) => p.ok) && debt.ok,
      `debtUzs=${debt.debtUzs} deltaUsd=${debt.delta}`,
    );
  } else {
    record('S04a', '3 concurrent debt payments', false, 'credit sale failed');
  }

  // S07a — Rate change during sales
  const [rateRes, duringSales] = await Promise.all([
    request('POST', '/currency/rates', {
      token,
      companyId,
      deviceId,
      body: { rate: money(12700), notes: 'staging rate bump' },
    }),
    Promise.all(Array.from({ length: 5 }, () => createCashSale(session, productId, 1, unitPrice))),
  ]);
  const ratesFrozen = duringSales
    .filter((r) => r.ok)
    .every((r) => r.data?.exchangeRateUsed != null);
  record('S07a', 'Exchange rate change during sales', ratesFrozen, 'exchangeRateUsed present');

  // S09 — Receive during sales
  const receiveAndSell = await Promise.all([
    request('POST', '/inventory/receive', {
      token,
      companyId,
      deviceId,
      body: {
        productId,
        warehouseId,
        quantity: money(20),
        unitCostUzs: money(7200),
        supplierId,
        paymentType: 'CASH',
      },
    }),
    ...Array.from({ length: 5 }, () => createCashSale(session, productId, 1, unitPrice)),
  ]);
  const invRecv = await checkInventoryConsistency(token, companyId, deviceId, productId);
  if (!(invRecv.ok && receiveAndSell[0].ok)) {
    console.log('DEBUG S09a:', {
      invRecv,
      receiveStatus: receiveAndSell[0].status,
      receiveData: receiveAndSell[0].data,
    });
  }
  record(
    'S09a',
    'Receive during parallel sales',
    invRecv.ok && receiveAndSell[0].ok,
    `stock=${invRecv.stock} delta=${invRecv.delta} recvOk=${receiveAndSell[0].ok}`,
  );

  // S08a — Refresh token
  if (refreshToken) {
    const ref = await request('POST', '/auth/refresh', {
      body: { refreshToken },
    });
    record(
      'S08a',
      'Refresh token rotation',
      ref.ok && Boolean(ref.data?.accessToken),
      `status=${ref.status}`,
    );
  } else {
    record('S08a', 'Refresh token rotation', false, 'no refresh token');
  }

  // S10a — Company isolation
  const wrongCo = await request('GET', '/products', {
    token,
    companyId: uuid(),
    deviceId,
  });
  record(
    'S10a',
    'Wrong X-Company-Id rejected',
    wrongCo.status === 403,
    `status=${wrongCo.status}`,
  );

  // S06 — Void idempotency (create dedicated sale)
  const voidKey = uuid();
  const forVoid = await createCashSale(session, productId, 1, unitPrice, voidKey);
  if (forVoid.ok) {
    const voidIdem = uuid();
    const v1 = await request('POST', `/sales/${forVoid.data.id}/void`, {
      token,
      companyId,
      deviceId,
      headers: { 'Idempotency-Key': voidIdem },
      body: { note: 'staging void' },
    });
    const v2 = await request('POST', `/sales/${forVoid.data.id}/void`, {
      token,
      companyId,
      deviceId,
      headers: { 'Idempotency-Key': voidIdem },
      body: { note: 'staging void' },
    });
    record(
      'S06c',
      'Void idempotency replay',
      v1.ok && v2.ok && v1.data?.status === v2.data?.status,
      `status=${v1.data?.status}`,
    );
  } else {
    record('S06c', 'Void idempotency replay', false, 'setup sale failed');
  }

  // S05 — Partial return (if credit sale exists)
  if (creditOk && creditSale.data?.id) {
    const ret = await request('POST', `/sales/${creditSale.data.id}/returns`, {
      token,
      companyId,
      deviceId,
      headers: { 'Idempotency-Key': uuid() },
      body: {
        reason: 'staging partial',
        lineItems: [{ productId, quantity: money(1) }],
      },
    });
    if (ret.ok && ret.data?.status === 'PENDING') {
      const appr = await request('POST', `/sales/returns/${ret.data.id}/approve`, {
        token,
        companyId,
        deviceId,
        body: {},
      });
      const saleAfter = await request('GET', `/sales/${creditSale.data.id}`, {
        token,
        companyId,
        deviceId,
      });
      const st = saleAfter.data?.status;
      record(
        'S05a',
        'Return approve status',
        appr.ok && (st === 'RETURNED' || st === 'PARTIALLY_RETURNED'),
        `saleStatus=${st}`,
      );
    } else {
      record('S05a', 'Return approve status', false, JSON.stringify(ret.data));
    }
  }

  return { infra: true };
}

runSuite()
  .then((meta) => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    console.log(`\n=== SUMMARY: ${passed} PASS / ${failed} FAIL ===\n`);
    const exitCode = failed > 0 || meta?.aborted ? 1 : 0;
    process.exit(exitCode);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
