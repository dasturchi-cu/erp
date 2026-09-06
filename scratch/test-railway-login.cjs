const https = require('https');

const data = JSON.stringify({
  email: 'admin@erp.uz',
  password: 'Admin123!',
  deviceInfo: {
    deviceId: 'test-device-uuid',
    name: 'Desktop App',
    platform: 'windows',
    osVersion: '10'
  }
});

const req = https.request('https://erp-backend-production-08e3.up.railway.app/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response Body:', body));
});

req.on('error', (e) => console.error('Request error:', e));
req.write(data);
req.end();
