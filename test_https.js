/* eslint-env node */
const https = require('https');

const options = {
  hostname: 'gmfhnszfhxejmwdcbt1l.supabase.co',
  port: 443,
  path: '/rest/v1/',
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error('Error details:', e);
});

req.end();
