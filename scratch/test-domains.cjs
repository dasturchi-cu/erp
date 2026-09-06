const https = require('https');

async function testDomain(domain) {
  return new Promise((resolve) => {
    const req = https.request(`https://${domain}/api/v1/health`, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ domain, status: res.statusCode, data }));
    });
    req.on('error', (e) => resolve({ domain, error: e.message }));
    req.end();
  });
}

async function run() {
  const candidates = [
    'erp-backend-production-08e3.up.railway.app',
    'erp-backend-production-d08e.up.railway.app',
    'erp-backend-production-d8e3.up.railway.app',
    'erp-backend-production-08e.up.railway.app',
    'erp-backend-production-8e3.up.railway.app'
  ];
  for (const c of candidates) {
    const res = await testDomain(c);
    console.log(res);
  }
}

run();
