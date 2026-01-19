// Butter Dashboard Frontend Application
class ButterDashboard {
    constructor() {
        this.accessToken = localStorage.getItem('clover_access_token');
        this.merchantId = localStorage.getItem('clover_merchant_id');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.checkAuthStatus();
        this.updateCurrentYear();
        this.checkOAuthSuccess();
        
        // Initialize UI based on auth state
        this.updateUIForAuthState();
    }

    setupEventListeners() {
        // Connect to Clover button
        document.getElementById('connectCloverBtn').addEventListener('click', () => {
            this.showOAuthModal();
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

        // Other action buttons
        document.getElementById('viewOrdersBtn').addEventListener('click', () => {
            if (this.accessToken) {
                this.switchSection('orders');
            } else {
                this.showMessage('Please connect to Clover first', 'error');
            }
        });

        document.getElementById('syncInventoryBtn').addEventListener('click', () => {
            if (this.accessToken) {
                this.syncInventory();
            } else {
                this.showMessage('Please connect to Clover first', 'error');
            }
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            if (this.accessToken) {
                this.exportData();
            } else {
                this.showMessage('Please connect to Clover first', 'error');
            }
        });
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                
                // Check if section requires auth
                if (section !== 'dashboard' && !this.accessToken) {
                    this.showMessage('Please connect to Clover to access this section', 'error');
                    return;
                }
                
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
                authStatus.innerHTML = '<span class="status-dot"></span><span>? Backend ready</span>';
                authStatus.classList.add('connected');
                apiStatus.textContent = '? Online';
                apiStatus.style.color = '#4CAF50';
            } else {
                authStatus.innerHTML = '<span class="status-dot"></span><span>?? Backend needs config</span>';
                authStatus.classList.add('error');
                apiStatus.textContent = '?? Check config';
                apiStatus.style.color = '#ff9800';
            }
            
            // Update merchant ID display
            if (this.merchantId) {
                document.getElementById('merchantId').textContent = this.merchantId.substring(0, 8) + '...';
                document.getElementById('merchantId').style.color = '#4CAF50';
            }
            
        } catch (error) {
            console.error('Health check failed:', error);
            document.getElementById('authStatus').innerHTML = '<span class="status-dot"></span><span>? Server offline</span>';
            document.getElementById('apiStatus').textContent = '? Offline';
            document.getElementById('apiStatus').style.color = '#f44336';
        }
    }

    checkOAuthSuccess() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('oauth_success') === 'true') {
            this.showMessage('? Successfully connected to Clover!', 'success');
            this.updateUIForAuthState();
            
            // Clean URL
            window.history.replaceState({}, document.title, '/');
        }
    }

    updateUIForAuthState() {
        if (this.accessToken) {
            // User is authenticated
            document.getElementById('connectCloverBtn').innerHTML = '<i class="fas fa-check"></i><span>Connected to Clover</span>';
            document.getElementById('connectCloverBtn').style.background = '#4CAF50';
            
            // Update merchant info
            const merchantInfo = document.getElementById('merchantInfo');
            merchantInfo.innerHTML = `
                <div class="merchant-details">
                    <h4><i class="fas fa-store"></i> Merchant Connected</h4>
                    <p><i class="fas fa-id-card"></i> ID: ${this.merchantId ? this.merchantId.substring(0, 8) + '...' : 'N/A'}</p>
                    <p><i class="fas fa-key"></i> Token: ${this.accessToken.substring(0, 10)}...</p>
                    <p><i class="fas fa-clock"></i> Connected: Just now</p>
                </div>
            `;
            
            // Enable other sections
            document.querySelectorAll('.nav-item:not([data-section="dashboard"])').forEach(item => {
                item.style.opacity = '1';
                item.style.cursor = 'pointer';
            });
            
            // Load sample data
            this.loadSampleData();
            
        } else {
            // User not authenticated
            document.getElementById('connectCloverBtn').innerHTML = '<i class="fas fa-plug"></i><span>Connect to Clover</span>';
            document.getElementById('connectCloverBtn').style.background = '#3498db';
            
            // Disable other sections
            document.querySelectorAll('.nav-item:not([data-section="dashboard"])').forEach(item => {
                item.style.opacity = '0.5';
                item.style.cursor = 'not-allowed';
            });
        }
    }

    showOAuthModal() {
        if (this.accessToken) {
            this.showMessage('Already connected to Clover!', 'info');
            return;
        }
        document.getElementById('oauthModal').style.display = 'flex';
    }

    hideOAuthModal() {
        document.getElementById('oauthModal').style.display = 'none';
    }

    async startOAuthFlow() {
        this.hideOAuthModal();
        this.showMessage('Starting OAuth flow...', 'info');
        
        try {
            const response = await fetch('/api/oauth/start');
            const data = await response.json();
            
            if (data.success) {
                // Redirect to Clover OAuth
                window.location.href = data.auth_url;
            } else {
                this.showMessage('Failed to start OAuth', 'error');
            }
        } catch (error) {
            console.error('OAuth start error:', error);
            this.showMessage('Cannot reach server', 'error');
        }
    }

    loadSampleData() {
        // Simulate loading data
        setTimeout(() => {
            document.getElementById('todayRevenue').textContent = '$1,234.56';
            document.getElementById('totalOrders').textContent = '42';
            document.getElementById('newCustomers').textContent = '8';
            document.getElementById('avgOrderValue').textContent = '$45.67';
            
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
                <div class="activity-item">
                    <i class="fas fa-sync" style="color: #9C27B0;"></i>
                    <p>Inventory synced with Clover</p>
                    <span class="activity-time">2 hours ago</span>
                </div>
            `;
        }, 1000);
    }

    async syncInventory() {
        this.showMessage('Syncing inventory with Clover...', 'info');
        // Simulate API call
        setTimeout(() => {
            this.showMessage('? Inventory synced successfully!', 'success');
            // Add to activity list
            const activityList = document.getElementById('activityList');
            const newActivity = document.createElement('div');
            newActivity.className = 'activity-item';
            newActivity.innerHTML = `
                <i class="fas fa-sync" style="color: #9C27B0;"></i>
                <p>Manual inventory sync completed</p>
                <span class="activity-time">Just now</span>
            `;
            activityList.insertBefore(newActivity, activityList.firstChild);
        }, 2000);
    }

    async exportData() {
        this.showMessage('Preparing data export...', 'info');
        // Simulate export process
        setTimeout(() => {
            this.showMessage('? Data exported successfully!', 'success');
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
