// ============================================
// BUTTER CLOVER OAUTH + DASHBOARD UI
// ============================================

const express = require("express");
const axios = require("axios");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(express.static(path.join(__dirname, 'public')));  // Serve static files

// ============ ENVIRONMENT VARIABLES ============
const CLIENT_ID = process.env.CLOVER_CLIENT_ID;
const CLIENT_SECRET = process.env.CLOVER_CLIENT_SECRET;

// ============ SANDBOX URLs ============
const CLOVER_AUTH_URL = "https://sandbox.dev.clover.com/oauth/v2/authorize";
const CLOVER_TOKEN_URL = "https://sandbox.dev.clover.com/oauth/v2/token";

console.log("?? Butter Server Starting...");
console.log("?? Serving static files from /public");
console.log("?? Auth URL:", CLOVER_AUTH_URL);
console.log("?? Client ID configured?", !!CLIENT_ID);

// ============ ROUTES ============

// Route 1: Dashboard Home (NEW UI)
app.get("/", (req, res) => {
    // If this is an OAuth callback (has code parameter), handle it
    if (req.query.code || req.query.error) {
        // Delegate to OAuth callback handler
        return handleOAuthCallback(req, res);
    }
    
    // Check for OAuth success redirect
    if (req.query.oauth_success) {
        return res.sendFile(path.join(__dirname, 'public/index.html'));
    }
    
    // Otherwise serve the dashboard
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Route 2: OAuth Initiation Endpoint
app.get("/api/oauth/start", (req, res) => {
    const protocol = "https";
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;
    const callbackUrl = `${baseUrl}/api/oauth/callback`;
    const encodedCallback = encodeURIComponent(callbackUrl);

    const authUrl = `${CLOVER_AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodedCallback}&response_type=code&state=butter_${Date.now()}`;
    
    res.json({
        success: true,
        auth_url: authUrl,
        redirect_uri: callbackUrl
    });
});

// Route 3: OAuth Callback Endpoint
app.get("/api/oauth/callback", handleOAuthCallback);

// Route 4: Health Check
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        dashboard: true,
        credentials_configured: !!(CLIENT_ID && CLIENT_SECRET),
        timestamp: new Date().toISOString()
    });
});

// Route 5: API endpoint for dashboard to check auth status
app.get("/api/auth/status", (req, res) => {
    res.json({
        authenticated: false, // In real app, check session/token
        dashboard_available: true,
        oauth_configured: !!(CLIENT_ID && CLIENT_SECRET)
    });
});

// ============ OAUTH CALLBACK HANDLER ============
async function handleOAuthCallback(req, res) {
    const { code, error } = req.query;
    
    if (error) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>? OAuth Error</title>
                <style>
                    body { font-family: Arial; padding: 40px; background: #fff0f0; text-align: center; }
                    .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 style="color: red;">? OAuth Error</h1>
                    <p><strong>Error:</strong> ${error}</p>
                    <a href="/" class="btn">Return to Dashboard</a>
                </div>
            </body>
            </html>
        `);
    }

    if (!code) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>No Code</title></head>
            <body style="text-align: center; padding: 40px;">
                <h1>?? No authorization code received</h1>
                <a href="/">Back to Dashboard</a>
            </body>
            </html>
        `);
    }

    try {
        const protocol = "https";
        const host = req.get("host");
        const baseUrl = `${protocol}://${host}`;
        const redirectUri = `${baseUrl}/api/oauth/callback`;

        console.log("?? Exchanging code for token...");
        
        const tokenData = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
        };

        console.log("Token request to:", CLOVER_TOKEN_URL);
        
        const tokenResponse = await axios.post(CLOVER_TOKEN_URL, tokenData, {
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        const { access_token, merchant_id } = tokenResponse.data;
        
        console.log("? OAuth Success! Merchant ID:", merchant_id);
        
        // Create a success page that redirects to dashboard
        const successPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>? OAuth Successful</title>
                <style>
                    body { font-family: Arial; padding: 40px; background: #f0fff0; text-align: center; }
                    .container { max-width: 600px; margin: 100px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                    .success { color: #4CAF50; font-size: 48px; margin-bottom: 20px; }
                    .loading { margin-top: 30px; color: #666; }
                    .token-info { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; word-break: break-all; }
                </style>
                <script>
                    // Store token in localStorage and redirect to dashboard
                    setTimeout(function() {
                        localStorage.setItem('clover_access_token', '${access_token}');
                        localStorage.setItem('clover_merchant_id', '${merchant_id}');
                        localStorage.setItem('clover_oauth_time', new Date().toISOString());
                        window.location.href = '/?oauth_success=true';
                    }, 2000);
                </script>
            </head>
            <body>
                <div class="container">
                    <div class="success">?</div>
                    <h1>Successfully Connected to Clover!</h1>
                    <p>Merchant ID: <strong>${merchant_id}</strong></p>
                    <div class="token-info">
                        Access Token: ${access_token.substring(0, 30)}...
                    </div>
                    <p class="loading">Redirecting to dashboard in 2 seconds...</p>
                    <p><a href="/">Click here if not redirected</a></p>
                </div>
            </body>
            </html>
        `;
        
        res.send(successPage);

    } catch (error) {
        console.error("? Token exchange failed:", error.response?.data || error.message);
        
        const errorPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>? Token Exchange Failed</title>
                <style>
                    body { font-family: Arial; padding: 40px; background: #fff0f0; text-align: center; }
                    .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 style="color: red;">? Token Exchange Failed</h1>
                    <p><strong>Error:</strong> ${error.response?.data?.error_description || error.message}</p>
                    <p><strong>Details:</strong> ${JSON.stringify(error.response?.data || {})}</p>
                    <a href="/" class="btn">Return to Dashboard</a>
                </div>
            </body>
            </html>
        `;
        res.send(errorPage);
    }
}

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`
?? BUTTER DASHBOARD + CLOVER OAUTH
==================================
? Port: ${PORT}
? Dashboard: http://localhost:${PORT}
? Health: http://localhost:${PORT}/health
? OAuth: http://localhost:${PORT}/api/oauth/start
? Ready to serve beautiful dashboard!
    `);
});
