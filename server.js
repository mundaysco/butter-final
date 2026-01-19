// ============================================
// BUTTER CLOVER OAUTH - FINAL WORKING VERSION
// ============================================

const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// ENVIRONMENT VARIABLES
const CLIENT_ID = process.env.CLOVER_CLIENT_ID;
const CLIENT_SECRET = process.env.CLOVER_CLIENT_SECRET;

// CORRECT SANDBOX URLs
const CLOVER_AUTH_URL = "https://sandbox.dev.clover.com/oauth/v2/authorize";
const CLOVER_TOKEN_URL = "https://sandbox.dev.clover.com/auth-token/oauth/v2/token";

console.log("? Server starting...");
console.log("?? Auth URL:", CLOVER_AUTH_URL);

// ============ HOME PAGE ============
app.get("/", (req, res) => {
    const protocol = "https";
    const host = req.get("host");
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
            </style>
        </head>
        <body>
            <div class="container">
                <h1>?? Butter Clover Integration</h1>
                <p><strong>Callback URL:</strong> ${callbackUrl}</p>
                <a href="${authUrl}" class="btn">Start Clover OAuth</a>
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
        return res.send(`<h1>?? No authorization code received</h1><a href="/">Go Back</a>`);
    }

    try {
        const protocol = "https";
        const host = req.get("host");
        const baseUrl = `${protocol}://${host}`;
        const redirectUri = `${baseUrl}/callback`;

        console.log("?? Exchanging code for token...");
        
        // IMPORTANT: Clover expects JSON payload
        const tokenData = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
        };

        console.log("Token request data:", JSON.stringify(tokenData));
        
        const tokenResponse = await axios.post(CLOVER_TOKEN_URL, tokenData, {
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        const { access_token, merchant_id } = tokenResponse.data;
        
        console.log("? OAuth Success! Merchant ID:", merchant_id);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>? Success!</title>
                <style>
                    body { font-family: Arial; padding: 40px; background: #f0fff0; }
                    .token { background: #e0ffe0; padding: 20px; border-radius: 10px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1 style="color: green;">? Clover OAuth Successful!</h1>
                <p><strong>Merchant ID:</strong> ${merchant_id}</p>
                <div class="token">
                    <strong>Access Token:</strong><br>
                    <code style="word-break: break-all;">${access_token}</code>
                </div>
                <p><a href="/">Back to Home</a></p>
            </body>
            </html>
        `);

    } catch (error) {
        console.error("? Token exchange failed:", error.response?.data || error.message);
        console.error("Full error:", error.response?.config?.data || "No request data");
        
        res.send(`
            <h1 style="color: red;">? Token Exchange Failed</h1>
            <p><strong>Error:</strong> ${error.response?.data?.error_description || error.message}</p>
            <p><strong>Details:</strong> ${JSON.stringify(error.response?.data || {})}</p>
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
? Ready for Clover OAuth!
    `);
});
