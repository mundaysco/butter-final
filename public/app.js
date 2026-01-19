// Simple Butter Dashboard
class ButterDashboard {
    constructor() {
        this.token = localStorage.getItem('clover_access_token');
        this.merchantId = localStorage.getItem('clover_merchant_id');
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
        if (this.token && this.merchantId) {
            // Update merchant info
            const merchantInfo = document.getElementById('merchantInfo');
            if (merchantInfo) {
                merchantInfo.innerHTML = `
                    <div class="merchant-details">
                        <h4><i class="fas fa-store"></i> Clover Merchant</h4>
                        <p>ID: ${this.merchantId.substring(0, 8)}...</p>
                        <p>Token: ${this.token.substring(0, 10)}...</p>
                    </div>
                `;
            }

            // Enable buttons
            document.querySelectorAll('.action-btn:not(#connectCloverBtn)').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });

            // Try to load real data
            this.loadCloverData();
        } else {
            // Show sample data
            document.getElementById('todayRevenue').textContent = '$0.00';
            document.getElementById('totalOrders').textContent = '0';
            document.getElementById('newCustomers').textContent = '0';
            document.getElementById('avgOrderValue').textContent = '$0.00';
        }
    }

    async loadCloverData() {
        try {
            // This would call your Clover API via proxy
            // For now, just show placeholders
            console.log('Would load data with token:', this.token.substring(0, 20) + '...');
        } catch (error) {
            console.error('Failed to load Clover data:', error);
        }
    }
}

// Start when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ButterDashboard();
});

