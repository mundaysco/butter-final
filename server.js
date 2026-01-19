// ============================================
// BUTTER CLOVER OAUTH - FIXED FOR SANDBOX
// ============================================

const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// Your Clover App Credentials - USE ENVIRONMENT VARIABLES
const CLIENT_ID = process.env.CLOVER_CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLOVER_CLIENT_SECRET || "";

// SANDBOX URLs (for testing)
const CLOVER_AUTH_URL = "https://api-sandbox.dev.clover.com/oauth/v2/authorize";
const CLOVER_TOKEN_URL = "https://api-sandbox.dev.clover.com/oauth/v2/token";

// ============ HOME PAGE ============
app.get("/", (req, res) => {
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
                code { background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>?? Butter Clover Integration</h1>
                <p><strong>Status:</strong> Server running on port ${PORT}</p>
                <p><strong>Callback URL:</strong> ${callbackUrl}</p>
                <a href="${authUrl}" class="btn" target="_blank">Start Clover OAuth</a>
                <a href="/callback?code=TEST123" class="btn">Test Callback</a>
                <hr>
                <h3>Setup Instructions:</h3>
                <p>1. In Clover Sandbox App Settings, set:</p>
                <p><code>Redirect URI: ${callbackUrl}</code></p>
                <p>2. Click "Start Clover OAuth" above</p>
                <p>3. Complete OAuth in popup window</p>
                <p>4. Check console for access token</p>
            </div>
        </body>
        </html>
    `);
});

// ============ OAUTH CALLBACK ============
app.get("/callback", async (req, res) => {
    const { code, state, error } = req.query;
    
    if (error) {
        return res.send(`<h1>? OAuth Error: ${error}</h1>`);
    }

    if (!code) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>No Authorization Code</title>
                <style>
                    body { font-family: Arial; padding: 40px; text-align: center; }
                    h1 { color: orange; }
                </style>
            </head>
            <body>
                <h1>?? No Authorization Code Received</h1>
                <p>Try the OAuth flow again.</p>
                <a href="/">Go Back</a>
            </body>
            </html>
        `);
    }

    // Exchange code for token
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

        const { access_token, merchant_id, employee_id } = tokenResponse.data;

        // SUCCESS - Show token info
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>? OAuth Success!</title>
                <style>
                    body { font-family: Arial; padding: 40px; background: #f0fff0; }
                    .success { color: green; }
                    .token { background: #e0ffe0; padding: 20px; border-radius: 10px; margin: 20px 0; word-break: break-all; }
                </style>
            </head>
            <body>
                <h1 class="success">? Clover OAuth Successful!</h1>
                <p><strong>Merchant ID:</strong> ${merchant_id}</p>
                <p><strong>Employee ID:</strong> ${employee_id}</p>
                <div class="token">
                    <strong>Access Token:</strong><br>
                    <code>${access_token}</code>
                </div>
                <p><a href="/">Back to Home</a></p>
                <script>
                    // Log to console for debugging
                    console.log("OAuth Success:", ${JSON.stringify(tokenResponse.data)});
                </script>
            </body>
            </html>
        `);

        // Also log to server console
        console.log("? OAuth Success!");
        console.log("Merchant ID:", merchant_id);
        console.log("Access Token (first 10 chars):", access_token.substring(0, 10) + "...");

    } catch (error) {
        console.error("? Token exchange error:", error.response?.data || error.message);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>? Token Exchange Failed</title>
                <style>body { font-family: Arial; padding: 40px; background: #fff0f0; }</style>
            </head>
            <body>
                <h1 style="color: red;">? Failed to Get Access Token</h1>
                <p><strong>Error:</strong> ${error.response?.data?.error || error.message}</p>
                <p><a href="/">Try Again</a></p>
            </body>
            </html>
        `);
    }
});

// ============ HEALTH CHECK ============
app.get("/health", (req, res) => {
    res.json({ 
        status: "healthy", 
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        client_id_set: !!CLIENT_ID,
        client_secret_set: !!CLIENT_SECRET
    });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`
?? BUTTER CLOVER OAUTH SERVER
=============================
? Server started on port: ${PORT}
? Homepage: http://localhost:${PORT}
? Callback: http://localhost:${PORT}/callback
? Health: http://localhost:${PORT}/health
? Ready for Clover OAuth!

?? Update Clover Sandbox App with:
Site URL: http://localhost:${PORT}
Redirect URI: http://localhost:${PORT}/callback
    `);
});
