const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 4000,
  path: '/api/v1/hostel/complaints',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sandbox_warden'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Response Body:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
