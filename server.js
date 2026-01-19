const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Basic routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ========== CLOVER API ENDPOINTS ==========

// API endpoint: Get current merchant
app.get('/api/clover/merchants/current', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No access token provided' });
        }
        
        const response = await fetch('https://apisandbox.dev.clover.com/v3/merchants/current', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('Merchant API error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API endpoint: Get specific merchant
app.get('/api/clover/merchants/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const merchantId = req.params.id;
        
        if (!token) {
            return res.status(401).json({ message: 'No access token provided' });
        }
        
        const response = await fetch(`https://apisandbox.dev.clover.com/v3/merchants/${merchantId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('Merchant API error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ========== CLOVER OAUTH ENDPOINTS ==========

// OAuth Success Callback - SIMPLIFIED VERSION
app.get('/oauth/success', async (req, res) => {
    try {
        const { code, merchant_id } = req.query;
        
        console.log('OAuth callback received');
        console.log('Code:', code ? 'Yes' : 'No');
        
        if (!code) {
            return res.send('<h2>Error: No authorization code</h2>');
        }
        
        // Exchange code for token
        const tokenResponse = await fetch('https://apisandbox.dev.clover.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: 'JD06DKTZ0E7MT',
                client_secret: process.env.CLOVER_CLIENT_SECRET,
                code: code,
                redirect_uri: 'https://butter-final.onrender.com/oauth/success'
            })
        });
        
        const tokenData = await tokenResponse.json();
        console.log('Token response:', tokenData);
        
        if (!tokenData.access_token) {
            return res.send('<h2>Error: Token exchange failed</h2><p>' + JSON.stringify(tokenData) + '</p>');
        }
        
        // Return simple HTML page with JavaScript
        const html = `<html>
<head>
    <title>Connected to Clover</title>
    <script>
        // Store the access token
        localStorage.setItem('clover_access_token', '${tokenData.access_token}');
        
        // Store merchant ID
        const merchantId = '${merchant_id || "Q82R0D2NSRR81"}';
        localStorage.setItem('clover_merchant_id', merchantId);
        
        console.log('OAuth successful!');
        console.log('Token stored');
        console.log('Merchant ID:', merchantId);
        
        // Redirect to main app
        window.location.href = '/';
    </script>
</head>
<body>
    <h2>Connected to Clover!</h2>
    <p>Storing credentials and redirecting...</p>
</body>
</html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('OAuth error:', error);
        res.send('<h2>OAuth Error</h2><p>' + error.message + '</p>');
    }
});

// API endpoint for token exchange (for manual testing)
app.post('/api/clover/token', express.json(), async (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'No code provided' });
        }
        
        const response = await fetch('https://apisandbox.dev.clover.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: 'JD06DKTZ0E7MT',
                client_secret: process.env.CLOVER_CLIENT_SECRET,
                code: code,
                redirect_uri: 'https://butter-final.onrender.com/oauth/success'
            })
        });
        
        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});

// Start server
app.listen(PORT, () => {
    console.log('BUTTER SERVER RUNNING on port', PORT);
});
