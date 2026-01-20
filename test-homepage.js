const https = require('https');

console.log("=== TESTING HOMEPAGE ===");

const options = {
    hostname: 'butter-final.onrender.com',
    port: 443,
    path: '/',
    method: 'GET',
    timeout: 5000,
    rejectUnauthorized: false
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log("\n=== FIRST 500 CHARACTERS ===");
        console.log(data.substring(0, 500));
        console.log("...");
        
        if (data.includes('html') || data.includes('HTML')) {
            console.log("✅ HOMEPAGE IS HTML (Good!)");
        } else {
            console.log("❌ HOMEPAGE MIGHT BE EMPTY");
        }
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

req.end();