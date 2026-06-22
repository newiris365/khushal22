const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 4000,
  path: '/api/v1/hostel/complaints',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer mock-sandbox-jwt-token-value.eyJpZCI6ImQwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImluc3RpdHV0aW9uX2lkIjoiYTAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwicm9sZSI6IldhcmRlbiIsImVtYWlsIjoid2FyZGVuQGlyaXMuZWR1In0='
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const parsed = JSON.parse(data);
    if(parsed.complaints && parsed.complaints.length > 0) {
      console.log('First complaint ID:', parsed.complaints[0].id);
      
      // Test assign
      const assignData = JSON.stringify({ staff_id: 'b0000000-0000-0000-0000-000000000012' });
      const assignReq = http.request({
        hostname: '127.0.0.1',
        port: 4000,
        path: `/api/v1/hostel/complaints/${parsed.complaints[0].id}/assign`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(assignData),
          'Authorization': 'Bearer mock-sandbox-jwt-token-value.eyJpZCI6ImQwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImluc3RpdHV0aW9uX2lkIjoiYTAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwicm9sZSI6IldhcmRlbiIsImVtYWlsIjoid2FyZGVuQGlyaXMuZWR1In0='
        }
      }, assignRes => {
         let aData = '';
         assignRes.on('data', chunk => aData += chunk);
         assignRes.on('end', () => {
            console.log('Assign Status:', assignRes.statusCode);
            console.log('Assign Response:', aData);
         });
      });
      assignReq.write(assignData);
      assignReq.end();
      
    } else {
      console.log('No complaints found or error:', data);
    }
  });
});
req.on('error', e => console.error(e));
req.end();
