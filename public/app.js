// Enhanced Butter Dashboard with Merchant ID Auto-Fetch
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
    }

    setupButtons() {
        const connectBtn = document.getElementById('connectCloverBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                window.location.href = '/api/oauth/start';
            });
        }

        // Test connection button
        const testBtn = document.getElementById('testConnectionBtn');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testConnection());
        }
    }

    checkAuth() {
        const statusEl = document.getElementById('authStatus');
        if (statusEl) {
            if (this.token) {
                statusEl.innerHTML = '<span class="status-dot"></span><span>? Connected to Clover</span>';
                statusEl.classList.add('connected');
            } else {
                statusEl.innerHTML = '<span class="status-dot"></span><span>?? Not connected</span>';
            }
        }
    }

    updateUI() {
        if (this.token) {
            // Enable action buttons
            document.querySelectorAll('.action-btn:not(#connectCloverBtn)').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });

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

    // ============ MERCHANT ID AUTO-FETCH ============
    async fetchMerchantId() {
        if (!this.token) {
            console.error('? No token available');
            return null;
        }

        console.log('?? Fetching merchant ID from Clover API...');
        
        try {
            // Try endpoint for current merchant
            const response = await fetch('/api/clover/merchants/me', {
                headers: {
                    'Authorization': 'Bearer ' + this.token,
                    'accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('API response:', data);

                // Handle different response formats
                let merchantId = null;
                
                if (data.id) {
                    merchantId = data.id; // Direct ID
                } else if (data.elements && data.elements[0] && data.elements[0].id) {
                    merchantId = data.elements[0].id; // Array format
                } else if (data.merchant && data.merchant.id) {
                    merchantId = data.merchant.id; // Nested format
                }

                if (merchantId) {
                    console.log('? Found merchant ID:', merchantId);
                    localStorage.setItem('clover_merchant_id', merchantId);
                    this.merchantId = merchantId;
                    return merchantId;
                }
            }

            // If /me doesn't work, try to list merchants
            console.log('Trying merchants list endpoint...');
            const listResponse = await fetch('/api/clover/merchants?limit=1', {
                headers: {
                    'Authorization': 'Bearer ' + this.token
                }
            });

            if (listResponse.ok) {
                const listData = await listResponse.json();
                if (listData.elements && listData.elements[0] && listData.elements[0].id) {
                    const merchantId = listData.elements[0].id;
                    console.log('? Found merchant ID from list:', merchantId);
                    localStorage.setItem('clover_merchant_id', merchantId);
                    this.merchantId = merchantId;
                    return merchantId;
                }
            }

            console.warn('?? Could not find merchant ID in API response');
            return null;

        } catch (error) {
            console.error('? Failed to fetch merchant ID:', error);
            return null;
        }
    }

    async ensureMerchantId() {
        // If we have a valid merchant ID, use it
        if (this.merchantId && this.merchantId !== 'unknown' && this.merchantId.length > 10) {
            return true;
        }

        // Try to fetch it
        const fetchedId = await this.fetchMerchantId();
        if (fetchedId) {
            this.merchantId = fetchedId;
            return true;
        }

        console.error('? Cannot proceed without merchant ID');
        this.showMessage('?? Cannot find merchant - try reconnecting', 'error');
        return false;
    }

    // ============ REAL DATA LOADING ============
    async loadRealCloverData() {
        if (!this.token) return;

        try {
            console.log('Loading real Clover data...');

            // Ensure we have merchant ID first
            const hasMerchantId = await this.ensureMerchantId();
            if (!hasMerchantId) {
                console.log('Skipping data load - no merchant ID');
                return;
            }

            // Get merchant info
            const merchantRes = await fetch(`/api/clover/merchants/${this.merchantId}`, {
                headers: { 'Authorization': 'Bearer ' + this.token }
            });

            if (merchantRes.ok) {
                const merchantData = await merchantRes.json();
                console.log('Merchant:', merchantData.name || 'Clover Store');

                // Update merchant display
                const merchantInfo = document.getElementById('merchantInfo');
                if (merchantInfo) {
                    merchantInfo.innerHTML = `
                        <div class="merchant-details">
                            <h4><i class="fas fa-store"></i> ${merchantData.name || 'Clover Merchant'}</h4>
                            <p><i class="fas fa-id-card"></i> ID: ${this.merchantId.substring(0, 8)}...</p>
                            <p><i class="fas fa-key"></i> Token: ${this.token.substring(0, 10)}...</p>
                            <button class="action-btn-small" onclick="butterDashboard.testConnection()">
                                <i class="fas fa-bolt"></i> Test Connection
                            </button>
                        </div>
                    `;
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

                    // Update dashboard
                    document.getElementById('todayRevenue').textContent = '$' + (totalRevenue / 100).toFixed(2);
                    document.getElementById('totalOrders').textContent = orderCount;
                    document.getElementById('avgOrderValue').textContent = orderCount > 0 ? '$' + ((totalRevenue / orderCount) / 100).toFixed(2) : '$0.00';

                    console.log(`Real data: $${(totalRevenue/100).toFixed(2)} revenue, ${orderCount} orders`);
                }
            } catch (orderError) {
                console.log('No order data available');
            }

            // Start monitoring after data is loaded
            this.startRealTimeMonitor();

        } catch (error) {
            console.error('Error loading real data:', error);
        }
    }

    // ============ CONNECTION TEST ============
    async testConnection() {
        console.log('?? Testing connection...');

        if (!this.token) {
            this.showMessage('? No token found - reconnect to Clover', 'error');
            return;
        }

        const hasMerchantId = await this.ensureMerchantId();
        if (!hasMerchantId) {
            this.showMessage('? Cannot find merchant ID', 'error');
            return;
        }

        try {
            // Test 1: GET merchant info
            const response = await fetch(`/api/clover/merchants/${this.merchantId}`, {
                headers: { 'Authorization': 'Bearer ' + this.token }
            });

            if (response.ok) {
                const data = await response.json();
                this.showMessage(`? Connection OK! Merchant: ${data.name || this.merchantId.substring(0, 8)}...`, 'success');
                console.log('? Connection test passed');
                return true;
            } else {
                this.showMessage(`? Connection failed: ${response.status}`, 'error');
                return false;
            }

        } catch (error) {
            this.showMessage(`? Connection error: ${error.message}`, 'error');
            return false;
        }
    }

    // ============ REAL-TIME MONITOR ============
    startRealTimeMonitor() {
        if (this.inventoryMonitor) {
            clearInterval(this.inventoryMonitor);
        }

        if (!this.token || !this.merchantId) {
            console.warn('Cannot start monitor - missing token or merchant ID');
            return;
        }

        console.log('Starting real-time monitor...');

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

                if (response.ok) {
                    const data = await response.json();
                    const itemCount = data.elements ? data.elements.length : 0;
                    const now = new Date().toLocaleTimeString();

                    // Update monitor display if it exists
                    const monitorEl = document.getElementById('liveMonitor');
                    if (monitorEl) {
                        monitorEl.innerHTML = `
                            <div style="background:#2c3e50;color:white;padding:8px;border-radius:4px;font-size:12px;">
                                <i class="fas fa-sync fa-spin"></i>
                                Live: ${itemCount} items | ${now}
                            </div>
                        `;
                    }

                    console.log(`?? Real-time monitor: ${itemCount} items at ${now}`);
                }
            } catch (error) {
                console.error('Monitor error:', error.message);
            }
        }, 5000); // Every 5 seconds

        this.showMessage('? Real-time monitoring started', 'info');
    }

    stopRealTimeMonitor() {
        if (this.inventoryMonitor) {
            clearInterval(this.inventoryMonitor);
            this.inventoryMonitor = null;
            console.log('Monitoring stopped');
        }
    }

    // ============ INVENTORY MANAGEMENT ============
    async createTestItem() {
        if (!this.token) {
            this.showMessage('? Not connected to Clover', 'error');
            return;
        }

        const hasMerchantId = await this.ensureMerchantId();
        if (!hasMerchantId) {
            this.showMessage('? Cannot find merchant', 'error');
            return;
        }

        const testItem = {
            name: `Test Item ${new Date().toLocaleTimeString()}`,
            price: 999, // $9.99
            sku: `TEST-${Date.now()}`
        };

        console.log('Creating item:', testItem);

        try {
            const response = await fetch(`/api/clover/merchants/${this.merchantId}/items`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.token,
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify(testItem)
            });

            const responseText = await response.text();
            console.log('Response:', responseText);

            if (response.ok) {
                const data = JSON.parse(responseText);
                this.showMessage(`? Created: ${data.name}`, 'success');
                console.log('? Item created:', data);
                return data;
            } else {
                this.showMessage(`? Failed: ${response.status}`, 'error');
                console.error('Item creation failed:', responseText);
                return null;
            }

        } catch (error) {
            this.showMessage(`? Error: ${error.message}`, 'error');
            console.error('Network error:', error);
            return null;
        }
    }

    // ============ UI HELPERS ============
    showMessage(text, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${text}</span>
        `;

        document.body.appendChild(toast);

        // Add styles if needed
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
                    margin-top: 10px;
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

// Make globally available
window.butterDashboard = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.butterDashboard = new ButterDashboard();
});
