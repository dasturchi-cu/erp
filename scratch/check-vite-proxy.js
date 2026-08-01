const http = require('http');

const data = JSON.stringify({
  email: 'admin@erp.uz',
  password: 'Admin123!',
  deviceInfo: {
    deviceId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Desktop ERP',
    platform: 'windows'
  }
});

const req = http.request('http://127.0.0.1:5173/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('VITE PROXY STATUS:', res.statusCode, 'BODY:', body.slice(0, 200)));
});

req.on('error', (err) => console.log('VITE PROXY ERROR:', err.message));

req.write(data);
req.end();
