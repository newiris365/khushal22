const { apiGet } = require('./src/lib/api');
const fetch = require('node-fetch');

// Polyfill fetch
global.fetch = fetch;
global.window = { location: { origin: 'http://localhost:4000' } };
global.localStorage = { getItem: () => null }; // force mock token

async function testFetch() {
  const studentId = 'c0000000-0000-0000-0000-000000000006';
  const url = `http://localhost:4000/api/v1/hostel/allocations?studentId=${studentId}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-sandbox-jwt-token-value.eyJpZCI6ImMwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwNiIsImluc3RpdHV0aW9uX2lkIjoiYTAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwicm9sZSI6IlN0dWRlbnQiLCJlbWFpbCI6ImtodXNoYWxAaXJpcy5lZHUifQ=='
  };

  try {
    const res = await fetch(url, { headers });
    const json = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch(e) {
    console.log("Error:", e);
  }
}

testFetch();
