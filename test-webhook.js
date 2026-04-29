const https = require('https');
const crypto = require('crypto');

const webhookUrl = 'http://localhost:3000/api/eduzz-webhook'; // or deployed URL
const secret = process.env.EDUZZ_SECRET || 'testsecret';
const payload = JSON.stringify({
  transaction: {
    id: 'test123',
    status: 'approved',
    created_at: '2024-09-10T12:00:00Z',
    buyer: { email: 'test@example.com' }
  }
});

const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('base64');

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-eduzz-signature': signature,
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(webhookUrl.replace('http', 'https'), options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, data));
});

req.on('error', e => console.error(e));
req.write(payload);
req.end();
