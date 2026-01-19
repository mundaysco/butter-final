// Simple test to verify API connection
async function testAPIConnection() {
    console.log('?? Testing API connection...');
    
    const token = localStorage.getItem('clover_access_token');
    const merchantId = localStorage.getItem('clover_merchant_id');
    
    if (!token || !merchantId) {
        console.error('? No token or merchant ID');
        return;
    }
    
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('Merchant ID:', merchantId);
    
    // Test 1: Simple GET request
    try {
        console.log('\n?? Testing GET request...');
        const response = await fetch(`/api/clover/merchants/${merchantId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json'
            }
        });
        
        console.log('Status:', response.status);
        const text = await response.text();
        
        if (text.startsWith('{')) {
            // Looks like JSON
            try {
                const data = JSON.parse(text);
                console.log('? Success! Received JSON response');
                console.log('Merchant name:', data.name || 'Unknown');
                console.log('Currency:', data.currency || 'USD');
            } catch (e) {
                console.error('? Failed to parse JSON:', e.message);
                console.log('Response:', text.substring(0, 200));
            }
        } else if (text.startsWith('<')) {
            console.error('? ERROR: Received HTML!');
            console.error('First 150 chars:', text.substring(0, 150));
            console.error('This means wrong API URL or authentication issue');
        } else {
            console.log('Response:', text.substring(0, 200));
        }
        
    } catch (error) {
        console.error('? Network error:', error.message);
    }
    
    // Test 2: Check what URL the server is using
    console.log('\n?? Checking server configuration...');
    console.log('Server should use: https://apisandbox.dev.clover.com/v3');
    console.log('Check your server.js for the proxy endpoint URL');
}

// Run test
testAPIConnection();
