const fs = require('fs');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-local-jwt-secret-min-32-chars-key';
const NEXT_HOST = 'http://localhost:3000';
const BACKEND_HOST = 'http://localhost:4000';

// Helper function to recursively find page files in NextJS app router
function findPages(dir, baseRoute = '', routes = []) {
  if (!fs.existsSync(dir)) return routes;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Avoid scanning internal next folders or api folders
      if (file.startsWith('.') || file === 'api') continue;
      
      // Handle dynamic routes and path segment mapping
      let nextSegment = file;
      if (file.startsWith('(') && file.endsWith(')')) {
        // Next.js route groups, don't add to path
        findPages(fullPath, baseRoute, routes);
      } else {
        findPages(fullPath, `${baseRoute}/${nextSegment}`, routes);
      }
    } else if (file.startsWith('page.')) {
      // Found a page file (page.tsx, page.js, page.ts, etc.)
      routes.push(baseRoute === '' ? '/' : baseRoute);
    }
  }
  return routes;
}

// Helper to make http/https requests using standard node http client
function makeRequest(urlStr, options = {}) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const reqOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: options.timeout || 10000
      };

      const req = http.request(reqOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });

      req.on('error', (err) => {
        resolve({
          status: 0,
          error: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 0,
          error: 'TIMEOUT'
        });
      });

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    } catch (err) {
      resolve({
        status: 0,
        error: err.message
      });
    }
  });
}

// Generate JWT token for various roles
function getAuthHeader(role) {
  const payload = {
    id: `test-user-id-${role}`,
    institution_id: 'inst-test-123',
    role: role,
    email: `test-${role}@example.com`
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  return { 'Authorization': `Bearer ${token}` };
}

async function runDiagnostics() {
  console.log('====================================================');
  console.log('    IRIS 365 LOCALHOST TESTING & DIAGNOSTICS TEAM   ');
  console.log('====================================================');
  console.log(`Using JWT_SECRET: ${JWT_SECRET.substring(0, 10)}...`);
  console.log(`Testing frontend target: ${NEXT_HOST}`);
  console.log(`Testing backend target:  ${BACKEND_HOST}\n`);

  // 1. Scan frontend routes
  const appDir = path.join(__dirname, '..', 'src', 'app');
  console.log(`Scanning Next.js routes in: ${appDir}`);
  const rawRoutes = findPages(appDir);
  // Sort and unique
  const routes = [...new Set(rawRoutes)].sort();
  console.log(`Found ${routes.length} frontend portal routes.\n`);

  const report = {
    frontend: [],
    backend: []
  };

  // 2. Test frontend routes
  console.log('----------------------------------------------------');
  console.log('      STAGE 1: TESTING FRONTEND PORTAL PAGES        ');
  console.log('----------------------------------------------------');
  
  const keyPortals = [
    '/', '/login', '/dashboard', '/profile',
    '/admin/dashboard', '/admin/settings', '/admin/users',
    '/student/dashboard', '/student/attendance', '/student/fees',
    '/teacher/assignments', '/teacher/attendance',
    '/director', '/director/alerts', '/director/analytics',
    '/parent/dashboard', '/parent/fees',
    '/warden/dashboard', '/warden/rooms',
    '/canteen', '/canteen/meal-plans',
    '/library', '/library/books',
    '/transit', '/transit/routes',
    '/gate', '/gate/visitors',
    '/hr/my/dashboard', '/hr/hod/team',
    '/tpo/companies', '/tpo/drives',
    '/driver/dashboard',
    '/iqac/dashboard', '/iqac/documents'
  ];

  for (const route of keyPortals) {
    const url = `${NEXT_HOST}${route}`;
    console.log(`Testing Portal Page [GET] ${route}...`);
    const res = await makeRequest(url);
    
    let statusText = 'UNKNOWN';
    let details = '';
    
    if (res.status === 200) {
      statusText = 'WORKING';
      console.log(`   \x1b[32m✔ SUCCESS\x1b[0m (Status 200)`);
    } else if (res.status === 302 || res.status === 307 || res.status === 308) {
      statusText = 'REDIRECT';
      details = `Redirects to ${res.headers.location || 'unknown'}`;
      console.log(`   \x1b[36mℹ REDIRECT\x1b[0m (${res.status}) -> ${details}`);
    } else if (res.status === 404) {
      statusText = 'NOT OPENING / NOT FOUND';
      details = 'Route returns 404. Might be missing file/export or dynamic path segment requiring params.';
      console.log(`   \x1b[31m✖ NOT FOUND\x1b[0m (Status 404)`);
    } else if (res.status === 500) {
      statusText = 'SERVER/COMPILATION ISSUE';
      details = 'Route failed with 500. Compilation error or backend render crash.';
      console.log(`   \x1b[31m✖ COMPILATION/SERVER ERROR\x1b[0m (Status 500)`);
    } else if (res.status === 0) {
      statusText = 'OFFLINE';
      details = `Failed to connect: ${res.error}`;
      console.log(`   \x1b[31m✖ CONNECTION FAILED\x1b[0m: ${res.error}`);
    } else {
      statusText = `STATUS ${res.status}`;
      details = `Returned status code: ${res.status}`;
      console.log(`   \x1b[33m⚠ WARNING\x1b[0m (Status ${res.status})`);
    }

    report.frontend.push({ route, url, status: statusText, details, statusCode: res.status });
  }

  // 3. Test backend endpoints
  console.log('\n----------------------------------------------------');
  console.log('       STAGE 2: TESTING BACKEND API ENDPOINTS        ');
  console.log('----------------------------------------------------');

  const backendAPIs = [
    { name: 'Health Check', path: '/health', method: 'GET', role: null },
    { name: 'Director Overview', path: '/api/v1/director/overview', method: 'GET', role: 'Director' },
    { name: 'Director Alerts', path: '/api/v1/director/alerts', method: 'GET', role: 'Director' },
    { name: 'Students List', path: '/api/v1/core/students', method: 'GET', role: 'Admin' },
    { name: 'Student Timetable', path: '/api/v1/core/timetable/student/test-student-id', method: 'GET', role: 'Student' },
    { name: 'Canteen Menu', path: '/api/v1/canteen/menu', method: 'GET', role: 'Student' },
    { name: 'Canteen Student Orders', path: '/api/v1/canteen/orders/student/test-student-id', method: 'GET', role: 'Student' },
    { name: 'Hostel Rooms', path: '/api/v1/hostel/rooms', method: 'GET', role: 'Warden' },
    { name: 'Transit Routes', path: '/api/v1/transit/routes', method: 'GET', role: 'Student' },
    { name: 'Transit GPS', path: '/api/v1/transit/buses', method: 'GET', role: 'Student' },
    { name: 'Library Books List', path: '/api/library/books', method: 'GET', role: 'Student' },
    { name: 'Library Student Issues', path: '/api/library/issues/student/test-student-id', method: 'GET', role: 'Student' },
    { name: 'Gate Visitors Today', path: '/api/v1/core/gate/visitors-today', method: 'GET', role: 'Security' },
    { name: 'Parent Child Info', path: '/api/v1/core/parent/child-info', method: 'GET', role: 'Parent' },
    { name: 'Admissions List', path: '/api/v1/core/admissions/list', method: 'GET', role: 'Admin' },
    { name: 'Placement Drives', path: '/api/v1/placements/drives', method: 'GET', role: 'Student' },
    { name: 'Teacher Assignments', path: '/api/v1/core/assignments', method: 'GET', role: 'Teacher' },
    { name: 'Consolidated Defaulters', path: '/api/v1/core/reports/defaulters', method: 'GET', role: 'Director' },
    { name: 'HR Employees', path: '/api/v1/hr/employees', method: 'GET', role: 'HR Admin' },
    { name: 'Attendance Methods', path: '/api/v1/core/attendance/methods', method: 'GET', role: 'Admin' }
  ];

  for (const api of backendAPIs) {
    const url = `${BACKEND_HOST}${api.path}`;
    const headers = { 'Content-Type': 'application/json' };
    
    if (api.role) {
      Object.assign(headers, getAuthHeader(api.role));
    }

    console.log(`Testing Backend API [${api.method}] ${api.path} (as role: ${api.role || 'public'})...`);
    const res = await makeRequest(url, { method: api.method, headers });
    
    let statusText = 'UNKNOWN';
    let details = '';
    
    if (res.status === 200) {
      statusText = 'WORKING';
      console.log(`   \x1b[32m✔ SUCCESS\x1b[0m (Status 200)`);
    } else if (res.status === 401) {
      statusText = 'AUTHENTICATION REQUIRED';
      details = 'Received 401 unauthorized. Token required or rejected.';
      console.log(`   \x1b[31m✖ AUTHENTICATION REQUIRED\x1b[0m (Status 401)`);
    } else if (res.status === 403) {
      statusText = 'FORBIDDEN';
      details = 'Received 403. Permission denied for this role (check role spelling/casing).';
      console.log(`   \x1b[31m✖ FORBIDDEN\x1b[0m (Status 403)`);
    } else if (res.status === 404) {
      statusText = 'API NOT FOUND';
      details = 'Endpoint returns 404. Route may not be mounted or path is incorrect.';
      console.log(`   \x1b[31m✖ NOT FOUND\x1b[0m (Status 404)`);
    } else if (res.status === 500) {
      statusText = 'BACKEND CRASH/DATABASE ISSUE';
      
      let errDetail = '';
      try {
        const json = JSON.parse(res.body);
        errDetail = json.message || json.error || '';
      } catch(e) {}
      
      details = `Backend failed with status 500. ${errDetail ? `Error details: ${errDetail}` : 'Usually a Supabase connectivity or schema issue.'}`;
      console.log(`   \x1b[31m✖ BACKEND CRASH\x1b[0m (Status 500) - ${details}`);
    } else if (res.status === 0) {
      statusText = 'OFFLINE';
      details = `Failed to connect to backend server: ${res.error}`;
      console.log(`   \x1b[31m✖ CONNECTION FAILED\x1b[0m: ${res.error}`);
    } else {
      statusText = `STATUS ${res.status}`;
      details = `Returned status code: ${res.status}. Body: ${res.body.substring(0, 100)}`;
      console.log(`   \x1b[33m⚠ WARNING\x1b[0m (Status ${res.status})`);
    }

    report.backend.push({
      name: api.name,
      path: api.path,
      method: api.method,
      role: api.role,
      status: statusText,
      statusCode: res.status,
      details
    });
  }

  // 4. Generate report markdown file
  console.log('\nGenerating portal_testing_report.md...');
  const reportPath = path.join(__dirname, '..', 'portal_testing_report.md');
  
  let md = `# IRIS 365 Localhost Diagnostic & Testing Report\n\n`;
  md += `**Timestamp:** ${new Date().toISOString()}\n`;
  md += `**Environment:** Localhost (Frontend: Port 3000, Backend: Port 4000)\n`;
  md += `**Database Connectivity:** Supabase offline simulation mode active\n\n`;

  md += `## Executive Summary\n\n`;
  const workingFront = report.frontend.filter(f => f.status === 'WORKING').length;
  const redirectFront = report.frontend.filter(f => f.status === 'REDIRECT').length;
  const issueFront = report.frontend.filter(f => f.status !== 'WORKING' && f.status !== 'REDIRECT').length;
  
  const workingBack = report.backend.filter(b => b.status === 'WORKING').length;
  const issueBack = report.backend.filter(b => b.status !== 'WORKING').length;

  md += `| Category | Total Tested | Working / Redirect | Broken / Issues | Success Rate |\n`;
  md += `| --- | --- | --- | --- | --- |\n`;
  md += `| **Frontend Portals / Pages** | ${report.frontend.length} | ${workingFront + redirectFront} | ${issueFront} | ${((workingFront + redirectFront) / report.frontend.length * 100).toFixed(1)}% |\n`;
  md += `| **Backend APIs** | ${report.backend.length} | ${workingBack} | ${issueBack} | ${(workingBack / report.backend.length * 100).toFixed(1)}% |\n\n`;

  md += `--- \n\n`;
  md += `## Summary of Core Issues Identified\n\n`;
  md += `1. **Case-Sensitive JWT Roles**: The Express backend enforces strictly case-sensitive role checking (e.g. \`requireRole(['Director', 'SuperAdmin'])\`). JWT payloads generated with lowercase roles result in 403 Forbidden. Using properly cased roles (e.g., \`Director\`, \`Student\`, \`Warden\`, \`HR Admin\`, \`Security\`, \`Parent\`) resolves these access restrictions.\n`;
  md += `2. **Supabase Connectivity Failures**: Because local database instances are not running and the configured remote Supabase instance (\`rfjwbhtskyntpowibub.supabase.co\`) is unreachable, all controller endpoints that query tables throw a \`TypeError: fetch failed\` database connectivity error. The backend starts successfully but requires a running db to process requests.\n`;
  md += `3. **Incorrect/Outdated API Routes**: Several routes tested in the previous run (like \`/api/v1/core/classes\`, \`/api/library/search\`) were 404 because they are not mounted. Correct routes exist under standard prefixes (e.g. \`/api/v1/students\`, \`/api/library/books\`).\n\n`;

  md += `--- \n\n`;
  md += `## Detailed Frontend Portal Results\n\n`;
  md += `| Route | Localhost URL | Status | Details / Issues |\n`;
  md += `| --- | --- | --- | --- |\n`;
  for (const f of report.frontend) {
    const statusEmoji = f.status === 'WORKING' ? '🟢 WORKING' : f.status === 'REDIRECT' ? '🔵 REDIRECT' : '🔴 BROKEN';
    md += `| \`${f.route}\` | [Link](${f.url}) | **${statusEmoji}** (${f.statusCode}) | ${f.details || 'N/A'} |\n`;
  }

  md += `\n--- \n\n`;
  md += `## Detailed Backend API Results\n\n`;
  md += `| API Name | Method & Path | Auth Role | Status | Details / Issues |\n`;
  md += `| --- | --- | --- | --- | --- |\n`;
  for (const b of report.backend) {
    const statusEmoji = b.status === 'WORKING' ? '🟢 WORKING' : '🔴 BROKEN';
    md += `| ${b.name} | \`${b.method} ${b.path}\` | \`${b.role || 'public'}\` | **${statusEmoji}** (${b.statusCode}) | ${b.details || 'N/A'} |\n`;
  }

  fs.writeFileSync(reportPath, md);
  console.log(`\x1b[32m✔ SUCCESS\x1b[0m: Diagnostic report successfully written to ${reportPath}\n`);
}

runDiagnostics().catch(err => {
  console.error('CRITICAL DIAGNOSTICS FAILURE:', err);
});
