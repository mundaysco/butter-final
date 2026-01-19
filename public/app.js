// Butter Dashboard Frontend Application
class ButterDashboard {
    constructor() {
        this.currentMerchant = null;
        this.accessToken = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.checkAuthStatus();
        this.updateCurrentYear();
        
        // Check URL for OAuth callback
        this.checkOAuthCallback();
    }

    setupEventListeners() {
        // Connect to Clover button
        document.getElementById('connectCloverBtn').addEventListener('click', () => {
            this.showOAuthModal();
        });

        // Other action buttons
        document.getElementById('viewOrdersBtn').addEventListener('click', () => {
            this.switchSection('orders');
        });

        document.getElementById('syncInventoryBtn').addEventListener('click', () => {
            this.syncInventory();
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        // OAuth modal buttons
        document.getElementById('cancelOauthBtn').addEventListener('click', () => {
            this.hideOAuthModal();
        });

        document.getElementById('confirmOauthBtn').addEventListener('click', () => {
            this.startOAuthFlow();
        });

        // Close modal on background click
        document.getElementById('oauthModal').addEventListener('click', (e) => {
            if (e.target.id === 'oauthModal') {
                this.hideOAuthModal();
            }
        });
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
                
                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    switchSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionId}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            const authStatus = document.getElementById('authStatus');
            const apiStatus = document.getElementById('apiStatus');
            
            if (data.credentials_configured) {
                authStatus.innerHTML = '<span class="status-dot"></span><span>? Backend configured</span>';
                authStatus.classList.add('connected');
                apiStatus.textContent = '? Online';
                apiStatus.style.color = '#4CAF50';
            } else {
                authStatus.innerHTML = '<span class="status-dot"></span><span>? Backend not configured</span>';
                authStatus.classList.add('error');
                apiStatus.textContent = '?? Configuration needed';
                apiStatus.style.color = '#ff9800';
            }
        } catch (error) {
            console.error('Health check failed:', error);
            document.getElementById('authStatus').innerHTML = '<span class="status-dot"></span><span>? Cannot reach server</span>';
            document.getElementById('apiStatus').textContent = '? Offline';
            document.getElementById('apiStatus').style.color = '#f44336';
        }
    }

    checkOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (code) {
            // We came back from OAuth with a code
            this.showMessage('Processing OAuth callback...', 'info');
            this.handleOAuthCallback(code);
        } else if (error) {
            this.showMessage(`OAuth Error: ${error}`, 'error');
        }
    }

    showOAuthModal() {
        document.getElementById('oauthModal').style.display = 'flex';
    }

    hideOAuthModal() {
        document.getElementById('oauthModal').style.display = 'none';
    }

    startOAuthFlow() {
        // This will redirect to your existing OAuth endpoint
        window.location.href = '/';
    }

    async handleOAuthCallback(code) {
        try {
            // In a real app, you would send this code to your backend
            // For now, we'll just show a success message
            this.showMessage('? Successfully connected to Clover!', 'success');
            this.hideOAuthModal();
            
            // Simulate fetching merchant data
            this.simulateMerchantData();
            
        } catch (error) {
            console.error('OAuth callback error:', error);
            this.showMessage(`Failed to complete OAuth: ${error.message}`, 'error');
        }
    }

    simulateMerchantData() {
        // Simulate API calls and update UI
        setTimeout(() => {
            document.getElementById('todayRevenue').textContent = '$1,234.56';
            document.getElementById('totalOrders').textContent = '42';
            document.getElementById('newCustomers').textContent = '8';
            document.getElementById('avgOrderValue').textContent = '$45.67';
            
            document.getElementById('merchantId').textContent = 'Connected';
            document.getElementById('merchantId').style.color = '#4CAF50';
            
            // Update merchant info panel
            const merchantInfo = document.getElementById('merchantInfo');
            merchantInfo.innerHTML = `
                <div class="merchant-details">
                    <h4><i class="fas fa-store"></i> Test Merchant</h4>
                    <p><i class="fas fa-map-marker-alt"></i> New York, NY</p>
                    <p><i class="fas fa-phone"></i> (555) 123-4567</p>
                    <p><i class="fas fa-calendar"></i> Joined: Today</p>
                </div>
            `;
            
            // Update activity list
            const activityList = document.getElementById('activityList');
            activityList.innerHTML = `
                <div class="activity-item">
                    <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
                    <p>Successfully connected to Clover</p>
                    <span class="activity-time">Just now</span>
                </div>
                <div class="activity-item">
                    <i class="fas fa-shopping-cart" style="color: #2196F3;"></i>
                    <p>New order #1001 for $45.99</p>
                    <span class="activity-time">5 minutes ago</span>
                </div>
                <div class="activity-item">
                    <i class="fas fa-user-plus" style="color: #FF9800;"></i>
                    <p>New customer registered: John Doe</p>
                    <span class="activity-time">1 hour ago</span>
                </div>
            `;
            
        }, 1000);
    }

    async syncInventory() {
        this.showMessage('Syncing inventory with Clover...', 'info');
        // Simulate API call
        setTimeout(() => {
            this.showMessage('? Inventory synced successfully!', 'success');
        }, 2000);
    }

    async exportData() {
        this.showMessage('Preparing data export...', 'info');
        // Simulate export process
        setTimeout(() => {
            this.showMessage('? Data exported successfully! Download starting...', 'success');
            // In real app, trigger download
        }, 1500);
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
        
        // Add styles dynamically
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
            `;
            document.head.appendChild(style);
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    updateCurrentYear() {
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.butterDashboard = new ButterDashboard();
});
