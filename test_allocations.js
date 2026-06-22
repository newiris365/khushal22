const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/hostel/allocations?studentId=c0000000-0000-0000-0000-000000000006',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer mock-sandbox-jwt-token-value.eyJpZCI6ImMwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwNiIsImluc3RpdHV0aW9uX2lkIjoiYTAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwMSIsInJvbGUiOiJTdHVkZW50IiwiZW1haWwiOiJraHVzaGFsQGlyaXMuZWR1In0='
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
