// ============================================
// BUTTER CLOVER OAUTH + DASHBOARD UI - COMPLETE
// ============================================

const express = require("express");
const axios = require("axios");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// ============ ENVIRONMENT VARIABLES ============
const CLIENT_ID = process.env.CLOVER_CLIENT_ID;
const CLIENT_SECRET = process.env.CLOVER_CLIENT_SECRET;

// ============ SANDBOX URLs ============
const CLOVER_AUTH_URL = "https://sandbox.dev.clover.com/oauth/v2/authorize";
const CLOVER_TOKEN_URL = "https://sandbox.dev.clover.com/oauth/v2/token";

console.log("?? Butter Server Starting...");
console.log("?? Serving static files from /public");
console.log("?? Client ID:", CLIENT_ID ? "Configured" : "NOT CONFIGURED");

// ============ ROUTES ============

// Dashboard Home
app.get("/", (req, res) => {
    if (req.query.code || req.query.error) {
        return handleOAuthCallback(req, res);
    }
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// OAuth Start
app.get("/api/oauth/start", (req, res) => {
    const protocol = "https";
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;
    const callbackUrl = `${baseUrl}/api/oauth/callback`;
    const encodedCallback = encodeURIComponent(callbackUrl);

    const authUrl = `${CLOVER_AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodedCallback}&response_type=code&state=butter_${Date.now()}`;
    
    res.redirect(authUrl);
});

// OAuth Callback
app.get("/api/oauth/callback", handleOAuthCallback);

// Health Check
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        dashboard: true,
        credentials_configured: !!CLIENT_ID,
        timestamp: new Date().toISOString()
    });
});

// Clover API Proxy
app.get("/api/clover/*", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "No access token" });
    }
    
    const cloverPath = req.path.replace("/api/clover", "");
    const url = `https://sandbox.dev.clover.com/v3${cloverPath}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Clover API proxy error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============ OAUTH HANDLER ============
async function handleOAuthCallback(req, res) {
    const { code, error } = req.query;
    
    if (error) {
        return res.send(`<h1>OAuth Error: ${error}</h1><a href="/">Back</a>`);
    }

    if (!code) {
        return res.send(`<h1>No code received</h1><a href="/">Back</a>`);
    }

    try {
        const protocol = "https";
        const host = req.get("host");
        const baseUrl = `${protocol}://${host}`;
        const redirectUri = `${baseUrl}/api/oauth/callback`;

        console.log("Exchanging code for token...");
        
        const tokenResponse = await axios.post(CLOVER_TOKEN_URL, {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
        }, {
            headers: { "Content-Type": "application/json" }
        });

        const { access_token, merchant_id } = tokenResponse.data;
        
        console.log("OAuth Success! Token received.");
        
        // Success page with redirect
        const successPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>? Success</title>
                <style>
                    body { font-family: Arial; padding: 40px; text-align: center; background: #f0fff0; }
                    .container { max-width: 500px; margin: 100px auto; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                </style>
                <script>
                    localStorage.setItem('clover_access_token', '${access_token}');
                    localStorage.setItem('clover_merchant_id', '${merchant_id || "unknown"}');
                    setTimeout(() => window.location.href = '/?oauth_success=true', 1500);
                </script>
            </head>
            <body>
                <div class="container">
                    <h1 style="color: green;">? Connected to Clover!</h1>
                    <p>Redirecting to dashboard...</p>
                </div>
            </body>
            </html>
        `;
        
        res.send(successPage);

    } catch (error) {
        console.error("Token exchange failed:", error.response?.data || error.message);
        res.send(`<h1>Token Error</h1><pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre><a href="/">Back</a>`);
    }
}

// ============ START SERVER ============
// ========== CLOVER OAuth ENDPOINTS ==========

// OAuth Success Callback Handler
app.get('/oauth/success', async (req, res) => {
    try {
        const { code, merchant_id } = req.query;
        
        console.log('=== OAuth Callback Received ===');
        console.log('Code:', code ? '✓' : '✗');
        console.log('Merchant ID:', merchant_id || 'Not provided');
        
        if (!code) {
            return res.status(400).send('No authorization code received');
        }
        
        // 1. Exchange code for access token
        const tokenResponse = await fetch('https://apisandbox.dev.clover.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: 'JD06DKTZ0E7MT',
                client_secret: process.env.CLOVER_CLIENT_SECRET,
                code: code,
                redirect_uri: 'https://butter-final.onrender.com/oauth/success'
            })
        });
        
        const tokenData = await tokenResponse.json();
        console.log('Token exchange result:', tokenData);
        
        if (!tokenData.access_token) {
            throw new Error('No access token in response: ' + JSON.stringify(tokenData));
        }
        
        // 2. Return HTML that stores tokens and redirects
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Connection Successful</title>
            <script>
                // Store the access token in localStorage
                localStorage.setItem('clover_access_token', '\');
                
                // Store merchant ID (from query or fallback)
                const merchantId = '\';
                localStorage.setItem('clover_merchant_id', merchantId);
                
                console.log('✅ OAuth Successful!');
                console.log('- Token stored:', '\...');
                console.log('- Merchant ID:', merchantId);
                
                // Redirect to main app
                window.location.href = '/';
            </script>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>✓ Connected to Clover!</h2>
            <p>Storing credentials and redirecting to your app...</p>
            <p>If nothing happens, <a href="/">click here</a>.</p>
        </body>
        </html>
        \;
        
        res.send(html);
        
    } catch (error) {
        console.error('OAuth Error:', error);
        res.status(500).send(\
            <h2>Connection Failed</h2>
            <p>Error: \</p>
            <p>Check server logs for details.</p>
            <a href="/">Return to app</a>
        \);
    }
});

// API endpoint for token exchange
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
        console.error('Token endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`
?? BUTTER SERVER RUNNING
=======================
? Port: ${PORT}
? Dashboard: http://localhost:${PORT}
? Health: /health
? OAuth: /api/oauth/start
? API Proxy: /api/clover/*
    `);
});



