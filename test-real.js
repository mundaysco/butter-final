const http = require('http');

console.log("=== REAL SERVER TEST ===");
console.log("Testing: https://butter-final.onrender.com");

const options = {
    hostname: 'butter-final.onrender.com',
    port: 443,
    path: '/health',
    method: 'GET',
    timeout: 10000
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log(`RESPONSE: ${data}`);
        console.log("=== TEST COMPLETE ===");
        if (res.statusCode === 200) {
            console.log("✅ SERVER IS REALLY WORKING");
        } else {
            console.log("❌ SERVER RETURNED ERROR");
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