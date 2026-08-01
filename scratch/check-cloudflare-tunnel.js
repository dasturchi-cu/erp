const https = require('https');

const data = JSON.stringify({
  email: 'admin@erp.uz',
  password: 'Admin123!',
  deviceInfo: {
    deviceId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Desktop ERP',
    platform: 'windows'
  }
});

const req = https.request('https://powerseller-performer-clerk-marathon.trycloudflare.com/api/v1/auth/login', {
  method: 'POST',
  rejectUnauthorized: false,
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('CLOUDFLARE TUNNEL STATUS:', res.statusCode, 'BODY:', body.slice(0, 200)));
});

req.on('error', (err) => console.log('CLOUDFLARE TUNNEL ERROR:', err.message));

req.write(data);
req.end();
