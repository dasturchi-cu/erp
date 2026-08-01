const axios = require('d:/proyektlar/erp/desktop/node_modules/axios');

async function test() {
  try {
    const res = await axios.post('https://powerseller-performer-clerk-marathon.trycloudflare.com/api/v1/auth/login', {
      email: 'admin@erp.uz',
      password: 'Admin123!',
      deviceInfo: {
        deviceId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Desktop ERP',
        platform: 'windows'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': '550e8400-e29b-41d4-a716-446655440000',
      }
    });
    console.log('SUCCESS:', res.status, Object.keys(res.data));
  } catch (err) {
    console.log('AXIOS ERROR:', err.message, err.response?.status, err.response?.data);
  }
}

test();
