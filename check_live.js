const https = require('https');

https.get('https://restaurant-nextjs.pages.dev/admin/login', (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Body length:', data.length);
    console.log('Body snippet:', data.substring(0, 500));
  });
}).on('error', (e) => {
  console.error(e);
});
