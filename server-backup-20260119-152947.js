// ============================================
// BUTTER CLOVER OAUTH - FIXED URLS
// ============================================

const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// ENVIRONMENT VARIABLES
const CLIENT_ID = process.env.CLOVER_CLIENT_ID;
const CLIENT_SECRET = process.env.CLOVER_CLIENT_SECRET;

// CORRECT SANDBOX URLs (try these)
const CLOVER_AUTH_URL = "https://sandbox.dev.clover.com/oauth/v2/authorize";
const CLOVER_TOKEN_URL = "https://sandbox.dev.clover.com/oauth/v2/token";

// Alternative if above doesn't work:
// const CLOVER_AUTH_URL = "https://apisandbox.dev.clover.com/oauth/v2/authorize";
// const CLOVER_TOKEN_URL = "https://apisandbox.dev.clover.com/oauth/v2/token";

console.log("Using Auth URL:", CLOVER_AUTH_URL);

// ... rest of your existing server.js code ...
console.log("- CLIENT_ID present?", !!CLIENT_ID ? "? YES" : "? NO - Set in Render!");
console.log("- CLIENT_SECRET present?", !!CLIENT_SECRET ? "? YES" : "? NO - Set in Render!");

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("?? CRITICAL: Missing credentials in environment variables!");
    console.error("Go to Render ? Your service ? Environment tab");
    console.error("Add: CLOVER_CLIENT_ID and CLOVER_CLIENT_SECRET");
}

// ============ HOME PAGE WITH VALIDATION ============
app.get("/", (req, res) => {
    // Check if credentials are loaded
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Setup Required</title></head>
            <body style="font-family: Arial; padding: 40px;">
                <h1 style="color: red;">?? Setup Required</h1>
                <p>Credentials not configured in environment variables.</p>
                <h3>To fix:</h3>
                <ol>
                    <li>Go to <a href="https://dashboard.render.com" target="_blank">Render Dashboard</a></li>
                    <li>Select your "butter" service</li>
                    <li>Click "Environment" tab</li>
                    <li>Add these variables:</li>
                </ol>
                <ul>
                    <li><strong>CLOVER_CLIENT_ID</strong> = JD06DKTZ0E7MT</li>
                    <li><strong>CLOVER_CLIENT_SECRET</strong> = fd9a48ba-4357-c812-9558-62c27b182680</li>
                </ul>
                <p><a href="/">Refresh after adding</a></p>
            </body>
            </html>
        `);
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;
    const callbackUrl = `${baseUrl}/callback`;
    const encodedCallback = encodeURIComponent(callbackUrl);

    const authUrl = `${CLOVER_AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodedCallback}&response_type=code&state=butter_${Date.now()}`;

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>?? Butter - Clover Integration</title>
            <style>
                body { font-family: Arial; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; }
                .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; }
                .btn { display: inline-block; background: white; color: #764ba2; padding: 15px 30px; margin: 10px; border-radius: 10px; text-decoration: none; font-weight: bold; }
                .success { background: rgba(0,255,0,0.2); padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success">
                    <h2>? Credentials Loaded!</h2>
                    <p>Ready for Clover OAuth</p>
                </div>
                <h1>?? Butter Clover Integration</h1>
                <p><strong>Callback URL:</strong> ${callbackUrl}</p>
                <a href="${authUrl}" class="btn">Start Clover OAuth</a>
                <p><em>Make sure Clover App Settings match this URL</em></p>
            </div>
        </body>
        </html>
    `);
});

// ============ OAUTH CALLBACK ============
app.get("/callback", async (req, res) => {
    const { code, error } = req.query;
    
    if (error) {
        return res.send(`<h1>? OAuth Error: ${error}</h1>`);
    }

    if (!code) {
        return res.send(`<h1>?? No authorization code received</h1>`);
    }

    try {
        const host = req.get("host");
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;
        const redirectUri = `${baseUrl}/callback`;

        const tokenResponse = await axios.post(CLOVER_TOKEN_URL, new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
        }), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const { access_token, merchant_id } = tokenResponse.data;
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>? Success!</title>
                <style>
                    body { font-family: Arial; padding: 40px; background: #f0fff0; }
                    .token { background: #e0ffe0; padding: 20px; border-radius: 10px; margin: 20px 0; word-break: break-all; }
                </style>
            </head>
            <body>
                <h1 style="color: green;">? Clover OAuth Successful!</h1>
                <p><strong>Merchant ID:</strong> ${merchant_id}</p>
                <div class="token">
                    <strong>Access Token:</strong><br>
                    <code>${access_token}</code>
                </div>
                <p><em>Check Render logs for full token details</em></p>
                <p><a href="/">Back to Home</a></p>
            </body>
            </html>
        `);

        console.log("? OAuth Success!");
        console.log("Merchant ID:", merchant_id);
        console.log("Access Token:", access_token);

    } catch (error) {
        console.error("? Token exchange failed:", error.response?.data || error.message);
        res.send(`
            <h1 style="color: red;">? Token Exchange Failed</h1>
            <p>${error.response?.data?.error_description || error.message}</p>
            <a href="/">Try Again</a>
        `);
    }
});

// ============ HEALTH CHECK ============
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        credentials_configured: !!(CLIENT_ID && CLIENT_SECRET),
        timestamp: new Date().toISOString()
    });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`
?? BUTTER CLOVER OAUTH SERVER
=============================
? Port: ${PORT}
? Health: http://localhost:${PORT}/health
? Credentials: ${CLIENT_ID && CLIENT_SECRET ? "LOADED" : "MISSING!"}
    `);
});
