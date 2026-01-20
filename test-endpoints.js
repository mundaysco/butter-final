const https = require('https');

const endpoints = [
    { path: '/', name: 'Homepage' },
    { path: '/health', name: 'Health Check' },
    { path: '/api/oauth/start', name: 'OAuth Start' },
    { path: '/api/clover/merchants/current', name: 'Clover API' }
];

console.log("=== TESTING ALL ENDPOINTS ===");

endpoints.forEach(({ path, name }) => {
    const options = {
        hostname: 'butter-final.onrender.com',
        port: 443,
        path: path,
        method: 'GET',
        timeout: 5000,
        rejectUnauthorized: false
    };
    
    const req = https.request(options, (res) => {
        console.log(`${name.padEnd(20)} (${path}) → ${res.statusCode}`);
    });
    
    req.on('error', (e) => {
        console.log(`${name.padEnd(20)} (${path}) → ❌ FAILED: ${e.message}`);
    });
    
    req.on('timeout', () => {
        console.log(`${name.padEnd(20)} (${path}) → ⏰ TIMEOUT`);
        req.destroy();
    });
    
    req.end();
});