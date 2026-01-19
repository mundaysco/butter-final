// Enhanced Butter Dashboard with Real-Time Inventory Management
class ButterDashboard {
    constructor() {
        this.token = localStorage.getItem('clover_access_token');
        this.merchantId = localStorage.getItem('clover_merchant_id');
        this.inventoryMonitor = null;
        this.init();
    }

    init() {
        this.setupButtons();
        this.checkAuth();
        this.updateUI();
        this.setupEventListeners();
        
        // Start real-time monitoring if connected
        if (this.token && this.merchantId) {
            setTimeout(() => this.startRealTimeMonitor(), 2000);
        }
    }

    setupButtons() {
        // Connect to Clover button
        const connectBtn = document.getElementById('connectCloverBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                window.location.href = '/api/oauth/start';
            });
        }
    }

    setupEventListeners() {
        // Setup test buttons
        this.setupTestButton('testConnectionBtn', () => this.testLiveConnection());
        this.setupTestButton('loadInventoryBtn', () => this.loadInventory());
        this.setupTestButton('createItemBtn', () => this.createSampleItem());
        this.setupTestButton('createMenuBtn', () => this.createSampleMenu());
        this.setupTestButton('startMonitorBtn', () => this.startRealTimeMonitor());
        this.setupTestButton('stopMonitorBtn', () => this.stopRealTimeMonitor());
        
        // Setup form submission
        const createItemForm = document.getElementById('createItemForm');
        if (createItemForm) {
            createItemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createCustomItem();
            });
        }
    }

    setupTestButton(buttonId, handler) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', handler);
        }
    }

    checkAuth() {
        const statusEl = document.getElementById('authStatus');
        if (statusEl) {
            if (this.token) {
                statusEl.innerHTML = '<span class="status-dot"></span><span>? Connected to Clover</span>';
                statusEl.classList.add('connected');
                document.getElementById('apiStatus').textContent = '? Online';
                document.getElementById('apiStatus').style.color = '#4CAF50';
            } else {
                statusEl.innerHTML = '<span class="status-dot"></span><span>?? Not connected</span>';
                document.getElementById('apiStatus').textContent = '?? Offline';
                document.getElementById('apiStatus').style.color = '#ff9800';
            }
        }
    }

    updateUI() {
        if (this.token && this.merchantId) {
            // Update merchant info
            const merchantInfo = document.getElementById('merchantInfo');
            if (merchantInfo) {
                merchantInfo.innerHTML = `
                    <div class="merchant-details">
                        <h4><i class="fas fa-store"></i> Clover Merchant</h4>
                        <p><i class="fas fa-id-card"></i> ID: ${this.merchantId.substring(0, 8)}...</p>
                        <p><i class="fas fa-key"></i> Token: ${this.token.substring(0, 10)}...</p>
                        <p><i class="fas fa-clock"></i> Connected: ${new Date().toLocaleTimeString()}</p>
                        <div class="action-buttons-small">
                            <button class="action-btn-small" id="testConnectionBtn">
                                <i class="fas fa-bolt"></i> Test Connection
                            </button>
                            <button class="action-btn-small" id="startMonitorBtn">
                                <i class="fas fa-play"></i> Start Monitor
                            </button>
                        </div>
                    </div>
                `;
            }

            // Enable all action buttons
            document.querySelectorAll('.action-btn:not(#connectCloverBtn)').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });

            // Show inventory tools
            const inventoryTools = document.getElementById('inventoryTools');
            if (inventoryTools) inventoryTools.style.display = 'block';

            // Load real data
            this.loadRealCloverData();
            
        } else {
            // Show disconnected state
            document.getElementById('todayRevenue').textContent = '$0.00';
            document.getElementById('totalOrders').textContent = '0';
            document.getElementById('newCustomers').textContent = '0';
            document.getElementById('avgOrderValue').textContent = '$0.00';
        }
    }

    // ============ REAL-TIME CONNECTION TEST ============
    async testLiveConnection() {
        const testBtn = document.getElementById('testConnectionBtn');
        const originalText = testBtn ? testBtn.innerHTML : '';
        
        if (testBtn) {
            testBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Testing...';
            testBtn.disabled = true;
        }
        
        this.showMessage('Testing live connection to Clover...', 'info');
        
        try {
            console.log('?? Testing real-time connection...');
            
            // Test 1: Fetch merchant info (basic GET)
            const merchantRes = await fetch(`/api/clover/merchants/${this.merchantId}`, {
                headers: {
                    'Authorization': 'Bearer ' + this.token,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!merchantRes.ok) throw new Error(`HTTP ${merchantRes.status}`);
            
            const merchantData = await merchantRes.json();
            
            // Test 2: Create a test item (POST)
            const testItem = {
                name: `Connection Test ${Date.now()}`,
                price: 100, // $1.00
                sku: `TEST-${Date.now()}`
            };
            
            const createRes = await fetch(`/api/clover/merchants/${this.merchantId}/items`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.token,
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify(testItem)
            });
            
            if (!createRes.ok) throw new Error(`Create failed: HTTP ${createRes.status}`);
            
            const createdItem = await createRes.json();
            
            // Test 3: Delete the test item (DELETE)
            const deleteRes = await fetch(`/api/clover/merchants/${this.merchantId}/items/${createdItem.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                }
            });
            
            // All tests passed!
            this.showMessage(`? REAL-TIME CONNECTION VERIFIED! Created and deleted test item. Merchant: ${merchantData.name || 'Clover Store'}`, 'success');
            
            console.log('? REAL-TIME TESTS PASSED:');
            console.log('  ? GET merchant data');
            console.log('  ? POST create item');
            console.log('  ? DELETE item');
            console.log('Merchant:', merchantData.name);
            console.log('Test item created/deleted:', createdItem.id);
            
            // Update button
            if (testBtn) {
                testBtn.innerHTML = '<i class="fas fa-check"></i> Connection Verified';
                testBtn.style.background = '#4CAF50';
                setTimeout(() => {
                    testBtn.innerHTML = originalText;
                    testBtn.style.background = '';
                    testBtn.disabled = false;
                }, 3000);
            }
            
            return true;
            
        } catch (error) {
            console.error('? Real-time connection test failed:', error);
            this.showMessage(`? Connection test failed: ${error.message}`, 'error');
            
            if (testBtn) {
                testBtn.innerHTML = '<i class="fas fa-times"></i> Test Failed';
                testBtn.style.background = '#f44336';
                setTimeout(() => {
                    testBtn.innerHTML = originalText;
                    testBtn.style.background = '';
                    testBtn.disabled = false;
                }, 3000);
            }
            return false;
        }
    }

    // ============ INVENTORY MANAGEMENT ============
    async loadInventory() {
        try {
            this.showMessage('Loading inventory...', 'info');
            console.log('?? Fetching inventory...');
            
            const response = await fetch(`/api/clover/merchants/${this.merchantId}/items?limit=50`, {
                headers: {
                    'Authorization': 'Bearer ' + this.token
                }
            });
            
            const data = await response.json();
            
            if (data.elements && data.elements.length > 0) {
                this.displayInventory(data.elements);
                this.showMessage(`? Loaded ${data.elements.length} inventory items`, 'success');
                console.log(`Found ${data.elements.length} items`);
            } else {
                this.showMessage('?? Inventory is empty. Create some items!', 'info');
                this.displayInventory([]);
                console.log('Inventory is empty');
            }
            
        } catch (error) {
            console.error('Failed to load inventory:', error);
            this.showMessage('? Failed to load inventory', 'error');
        }
    }

    displayInventory(items) {
        // Create or get inventory section
        let inventorySection = document.getElementById('inventorySection');
        if (!inventorySection) {
            inventorySection = document.createElement('div');
            inventorySection.className = 'section';
            inventorySection.id = 'inventorySection';
            document.querySelector('.content-area').appendChild(inventorySection);
        }
        
        let html = `
            <h3><i class="fas fa-boxes"></i> Inventory Items (${items.length})</h3>
            <div class="inventory-controls">
                <button class="btn" onclick="butterDashboard.createSampleItem()">
                    <i class="fas fa-plus"></i> Add Test Item
                </button>
                <button class="btn" onclick="butterDashboard.loadInventory()">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
        `;
        
        if (items.length === 0) {
            html += '<div class="empty-state"><i class="fas fa-inbox"></i><p>No items in inventory</p></div>';
        } else {
            html += `
                <div class="inventory-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Price</th>
                                <th>SKU</th>
                                <th>ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            items.forEach(item => {
                const price = item.price ? '$' + (item.price / 100).toFixed(2) : '$0.00';
                const shortId = item.id ? item.id.substring(0, 8) + '...' : 'N/A';
                html += `
                    <tr>
                        <td><strong>${item.name || 'Unnamed'}</strong></td>
                        <td>${price}</td>
                        <td><code>${item.sku || 'N/A'}</code></td>
                        <td><small>${shortId}</small></td>
                        <td>
                            <button class="btn-small" onclick="butterDashboard.editItemPrompt('${item.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-small btn-danger" onclick="butterDashboard.deleteItem('${item.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table></div>';
        }
        
        inventorySection.innerHTML = html;
        
        // Show this section
        this.showSection('inventory');
    }

    async createSampleItem() {
        const itemName = `Test Item ${new Date().toLocaleTimeString()}`;
        const itemPrice = Math.floor(Math.random() * 2000) + 100; // $1.00 - $20.00
        const itemSku = `TEST-${Date.now()}`;
        
        await this.createInventoryItem(itemName, itemPrice, itemSku);
    }

    async createCustomItem() {
        const name = document.getElementById('itemName')?.value || `Custom Item ${Date.now()}`;
        const price = parseInt(document.getElementById('itemPrice')?.value) || 999;
        const sku = document.getElementById('itemSku')?.value || `CUSTOM-${Date.now()}`;
        
        await this.createInventoryItem(name, price, sku);
        
        // Clear form
        if (document.getElementById('itemName')) document.getElementById('itemName').value = '';
        if (document.getElementById('itemPrice')) document.getElementById('itemPrice').value = '';
        if (document.getElementById('itemSku')) document.getElementById('itemSku').value = '';
    }

    async createInventoryItem(name, price, sku) {
        try {
            this.showMessage(`Creating item: ${name}...`, 'info');
            console.log(`Creating item: ${name}, Price: $${(price/100).toFixed(2)}`);
            
            const response = await fetch(`/api/clover/merchants/${this.merchantId}/items`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.token,
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    price: price,
                    sku: sku
                })
            });
            
            const data = await response.json();
            
            if (data.id) {
                this.showMessage(`? Created: ${data.name} for $${(data.price/100).toFixed(2)}`, 'success');
                console.log('? Item created:', data);
                
                // Refresh inventory after a short delay
                setTimeout(() => this.loadInventory(), 1000);
                return data;
            } else {
                throw new Error('Item creation failed - no ID returned');
            }
            
        } catch (error) {
            console.error('Failed to create item:', error);
            this.showMessage(`? Failed to create item: ${error.message}`, 'error');
            return null;
        }
    }

    async createSampleMenu() {
        this.showMessage('Creating sample menu...', 'info');
        
        const sampleItems = [
            { name: "Classic Burger", price: 1299, sku: "BURGER-001" },
            { name: "Cheese Burger", price: 1499, sku: "BURGER-002" },
            { name: "French Fries", price: 499, sku: "FRY-001" },
            { name: "Soda", price: 299, sku: "DRINK-001" },
            { name: "Ice Cream", price: 699, sku: "DESSERT-001" }
        ];
        
        let createdCount = 0;
        
        for (const item of sampleItems) {
            try {
                await this.createInventoryItem(item.name, item.price, item.sku);
                createdCount++;
                await new Promise(resolve => setTimeout(resolve, 500)); // Delay between creations
            } catch (error) {
                console.error(`Failed to create ${item.name}:`, error);
            }
        }
        
        this.showMessage(`? Created ${createdCount} sample menu items`, 'success');
    }

    async editItemPrompt(itemId) {
        const newName = prompt('Enter new item name:');
        if (!newName) return;
        
        const newPrice = prompt('Enter new price in cents (e.g., 999 for $9.99):');
        if (!newPrice) return;
        
        try {
            this.showMessage('Updating item...', 'info');
            
            const response = await fetch(`/api/clover/merchants/${this.merchantId}/items/${itemId}`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newName,
                    price: parseInt(newPrice)
                })
            });
            
            const data = await response.json();
            this.showMessage(`? Updated: ${data.name}`, 'success');
            console.log('? Item updated:', data);
            
            // Refresh inventory
            setTimeout(() => this.loadInventory(), 500);
            
        } catch (error) {
            console.error('Failed to edit item:', error);
            this.showMessage('? Failed to edit item', 'error');
        }
    }

    async deleteItem(itemId) {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            this.showMessage('Deleting item...', 'info');
            
            const response = await fetch(`/api/clover/merchants/${this.merchantId}/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                }
            });
            
            if (response.ok) {
                this.showMessage('? Item deleted successfully', 'success');
                console.log('? Item deleted:', itemId);
                
                // Refresh inventory
                setTimeout(() => this.loadInventory(), 500);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.error('Failed to delete item:', error);
            this.showMessage('? Failed to delete item', 'error');
        }
    }

    // ============ REAL-TIME MONITORING ============
    startRealTimeMonitor() {
        if (this.inventoryMonitor) {
            clearInterval(this.inventoryMonitor);
        }
        
        this.showMessage('?? Starting real-time inventory monitor...', 'info');
        
        this.inventoryMonitor = setInterval(async () => {
            if (!this.token || !this.merchantId) {
                this.stopRealTimeMonitor();
                return;
            }
            
            try {
                const response = await fetch(`/api/clover/merchants/${this.merchantId}/items?limit=5`, {
                    headers: {
                        'Authorization': 'Bearer ' + this.token
                    }
                });
                
                const data = await response.json();
                const itemCount = data.elements ? data.elements.length : 0;
                
                // Update monitor display
                const monitorEl = document.getElementById('liveMonitor');
                if (monitorEl) {
                    const now = new Date().toLocaleTimeString();
                    monitorEl.innerHTML = `
                        <div class="live-monitor">
                            <i class="fas fa-sync fa-spin"></i>
                            <span>Live: ${itemCount} items | Last update: ${now}</span>
                        </div>
                    `;
                }
                
                console.log(`?? Real-time monitor: ${itemCount} items at ${new Date().toLocaleTimeString()}`);
                
            } catch (error) {
                console.error('Monitor error:', error);
            }
        }, 5000); // Update every 5 seconds
        
        this.showMessage('? Real-time monitoring active (updates every 5s)', 'success');
    }

    stopRealTimeMonitor() {
        if (this.inventoryMonitor) {
            clearInterval(this.inventoryMonitor);
            this.inventoryMonitor = null;
            
            const monitorEl = document.getElementById('liveMonitor');
            if (monitorEl) {
                monitorEl.innerHTML = '<div class="live-monitor"><i class="fas fa-pause"></i> Monitoring stopped</div>';
            }
            
            this.showMessage('Monitoring stopped', 'info');
        }
    }

    // ============ REAL DATA LOADING ============
    async loadRealCloverData() {
        if (!this.token || !this.merchantId) return;
        
        try {
            console.log('Loading real Clover data...');
            
            // Get merchant info
            const merchantRes = await fetch(`/api/clover/merchants/${this.merchantId}`, {
                headers: { 'Authorization': 'Bearer ' + this.token }
            });
            
            if (merchantRes.ok) {
                const merchantData = await merchantRes.json();
                console.log('Merchant:', merchantData.name);
                
                // Update merchant display
                const merchantIdDisplay = document.getElementById('merchantIdDisplay');
                if (merchantIdDisplay) {
                    merchantIdDisplay.textContent = merchantData.name || this.merchantId.substring(0, 8) + '...';
                }
            }
            
            // Try to get today's orders
            try {
                const today = new Date();
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                const ordersRes = await fetch(`/api/clover/merchants/${this.merchantId}/orders?filter=createdTime>=${startOfDay}&limit=10`, {
                    headers: { 'Authorization': 'Bearer ' + this.token }
                });
                
                if (ordersRes.ok) {
                    const ordersData = await ordersRes.json();
                    
                    let totalRevenue = 0;
                    let orderCount = 0;
                    
                    if (ordersData.elements) {
                        ordersData.elements.forEach(order => {
                            if (order.total && order.total > 0) {
                                totalRevenue += order.total;
                                orderCount++;
                            }
                        });
                    }
                    
                    // Update dashboard with REAL data
                    document.getElementById('todayRevenue').textContent = '$' + (totalRevenue / 100).toFixed(2);
                    document.getElementById('totalOrders').textContent = orderCount;
                    document.getElementById('avgOrderValue').textContent = orderCount > 0 ? '$' + ((totalRevenue / orderCount) / 100).toFixed(2) : '$0.00';
                    
                    console.log(`Real data: $${(totalRevenue/100).toFixed(2)} revenue, ${orderCount} orders`);
                }
            } catch (orderError) {
                console.log('No order data available (normal for new sandbox)');
            }
            
        } catch (error) {
            console.error('Error loading real data:', error);
        }
    }

    // ============ UI HELPERS ============
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show requested section
        const targetSection = document.getElementById(sectionId + 'Section');
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });
    }

    showMessage(text, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${text}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Add styles if not already added
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                    max-width: 400px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                .toast-success { background: #4CAF50; }
                .toast-error { background: #f44336; }
                .toast-info { background: #2196F3; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .action-btn-small {
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                    margin: 5px;
                }
                .btn-small {
                    padding: 6px 12px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 2px;
                    font-size: 12px;
                }
                .btn-danger {
                    background: #e74c3c;
                }
                .empty-state {
                    padding: 40px;
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 16px;
                }
                .live-monitor {
                    background: #2c3e50;
                    color: white;
                    padding: 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    margin-top: 10px;
                }
                .inventory-table {
                    margin-top: 20px;
                    overflow-x: auto;
                }
                .inventory-table table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .inventory-table th {
                    background: #f8f9fa;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid #eee;
                }
                .inventory-table td {
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                }
                .inventory-table tr:hover {
                    background: #f9f9f9;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Make it globally available
window.butterDashboard = null;

// Start when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.butterDashboard = new ButterDashboard();
});
