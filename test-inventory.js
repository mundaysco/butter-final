// Test script for Clover inventory API
async function testInventoryAPI() {
    const token = localStorage.getItem('clover_access_token');
    const merchantId = localStorage.getItem('clover_merchant_id');
    
    if (!token || !merchantId) {
        console.error('? No token or merchant ID found');
        return;
    }
    
    console.log('Testing Clover Inventory API...');
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('Merchant ID:', merchantId);
    
    // Test 1: GET items (should always work if connected)
    try {
        const response = await fetch(`/api/clover/merchants/${merchantId}/items?limit=5`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('? GET Items Test: Success');
        console.log('Items found:', data.elements?.length || 0);
        
        if (data.elements && data.elements.length > 0) {
            console.log('First item:', data.elements[0].name);
        }
    } catch (error) {
        console.error('? GET Items Test Failed:', error);
    }
    
    // Test 2: POST - Create a test item
    try {
        const testItem = {
            name: `Test Item ${Date.now()}`,
            price: 999, // $9.99 in cents
            sku: `TEST-${Date.now()}`
        };
        
        const response = await fetch(`/api/clover/merchants/${merchantId}/items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(testItem)
        });
        
        const data = await response.json();
        console.log('? POST Create Item Test: Success');
        console.log('Created item:', data.name, 'ID:', data.id);
        
        // Store the item ID for later tests
        if (data.id) {
            localStorage.setItem('last_test_item_id', data.id);
            console.log('Saved item ID for update/delete tests');
        }
    } catch (error) {
        console.error('? POST Create Item Test Failed:', error);
    }
}

// Run the test
testInventoryAPI();
