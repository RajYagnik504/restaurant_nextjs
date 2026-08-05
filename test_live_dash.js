const http = require('https');

async function test() {
  // 1. Login
  const loginRes = await fetch('https://restaurant-nextjs.pages.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '7999620244', password: 'shivshakti@2000' })
  });
  
  if (!loginRes.ok) {
    console.error("Login failed:", await loginRes.text());
    return;
  }
  
  const cookies = loginRes.headers.get('set-cookie');
  console.log("Logged in, cookie:", cookies);
  
  // 2. Fetch dashboard
  const dashRes = await fetch('https://restaurant-nextjs.pages.dev/admin/dashboard', {
    headers: { 'Cookie': cookies }
  });
  
  console.log("Dashboard status:", dashRes.status);
  const text = await dashRes.text();
  if (text.includes('Application error')) {
    console.log("Found Application error in response HTML");
  } else {
    console.log("Response OK. Length:", text.length);
  }
}

test().catch(console.error);
