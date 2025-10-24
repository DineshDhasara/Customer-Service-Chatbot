const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5003,
  path: '/api/health',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Data length:', data.length);
    console.log('Data preview:', data.substring(0, 200));
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});

req.end();
