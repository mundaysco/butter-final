const https = require('https');

console.log("=== REAL HTTPS TEST ===");
console.log("Testing: https://butter-final.onrender.com");

const options = {
    hostname: 'butter-final.onrender.com',
    port: 443,
    path: '/health',
    method: 'GET',
    timeout: 10000,
    rejectUnauthorized: false // For testing only
};

const req = https.request(options, (res) => {
    console.log(`✅ CONNECTED! STATUS: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log(`📦 RESPONSE: ${data}`);
        console.log("=== TEST COMPLETE ===");
        
        if (res.statusCode === 200) {
            console.log("🎉 SERVER IS WORKING PROPERLY!");
        } else if (res.statusCode === 404) {
            console.log("⚠️  /health endpoint not found (check server.js)");
        } else {
            console.log(`❌ SERVER ERROR: ${res.statusCode}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ CONNECTION FAILED: ${e.message}`);
});

req.on('timeout', () => {
    console.error('❌ TIMEOUT: Server took too long to respond');
    req.destroy();
});

req.end();