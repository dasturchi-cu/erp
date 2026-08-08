const https = require('https');

const body = JSON.stringify({
  email: 'admin@erp.uz',
  password: 'Admin123!',
  deviceInfo: {
    deviceId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Flutter Mobile',
    platform: 'android',
    osVersion: 'android-14'
  }
});

const options = {
  hostname: 'erp-backend-r067.onrender.com',
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('KEYS:', Object.keys(parsed));
      if (parsed.accessToken) console.log('LOGIN: SUCCESS ✓');
      else console.log('RESPONSE:', JSON.stringify(parsed, null, 2));
    } catch(e) {
      console.log('RAW:', data);
    }
  });
});

req.on('error', (e) => console.log('NETWORK ERROR:', e.message));
req.write(body);
req.end();
