const https = require('https');

const data = JSON.stringify({
  email: 'admin@erp.uz',
  password: 'Admin123!',
  deviceInfo: {
    deviceId: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    name: 'Desktop App',
    platform: 'windows',
    osVersion: '10'
  }
});

const req = https.request('https://erp-backend-production-e88a.up.railway.app/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  console.log('Status Code:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response Body:', body));
});

req.on('error', (e) => console.error('Request error:', e));
req.write(data);
req.end();
