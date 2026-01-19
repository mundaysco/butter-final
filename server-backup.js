// ============================================
// BUTTER CLOVER OAUTH - CLEAN WORKING VERSION
// ============================================

const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// Your Clover App Credentials
const CLIENT_ID = "JD06DKTZ0E7MT";
const CLIENT_SECRET = "fd9a48ba-4357-c812-9558-62c27b182680";

// ============ HOME PAGE ============
app.get("/", (req, res) => {
    const host = req.get("host");
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;
    const callbackUrl = `${baseUrl}/callback`;
    const encodedCallback = encodeURIComponent(callbackUrl);
    
    const authUrl = `https://www.clover.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodedCallback}&response_type=code&state=butter_${Date.now()}`;
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🧈 Butter - Clover Integration</title>
            <style>
                body { font-family: Arial; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; }
                .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.95); padding: 40px; border-radius: 20px; color: #333; }
                h1 { color: #00A859; }
                .btn { background: #00A859; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; display: inline-block; margin: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✅ Butter v3.0 - Ready</h1>
                <p>Professional Clover OAuth Dashboard</p>
                <p><strong>Status:</strong> Server running on port ${PORT}</p>
                <p><strong>Callback URL:</strong> ${callbackUrl}</p>
                <a href="${authUrl}" class="btn" target="_blank">Start Clover OAuth</a>
                <a href="/callback?code=TEST123" class="btn">Test Callback</a>
                <a href="/health" class="btn">Health Check</a>
            </div>
        </body>
        </html>
    `);
});

// ============ OAUTH CALLBACK ============
app.get("/callback", async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;
    const error = req.query.error;

    console.log("[OAUTH] Callback received - Code:", code, "State:", state, "Error:", error);

    if (error) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>OAuth Error</title></head>
            <body style="font-family: Arial; padding: 40px;">
                <h1 style="color: red;">❌ OAuth Error: ${error}</h1>
                <p>The authorization was denied.</p>
                <a href="/">← Back to Butter</a>
            </body>
            </html>
        `);
    }

    if (!code) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>No Code</title></head>
            <body style="font-family: Arial; padding: 40px;">
                <h1 style="color: orange;">⚠️ No Authorization Code</h1>
                <p>No code was provided in the callback.</p>
                <a href="/">← Back to Butter</a>
            </body>
            </html>
        `);
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post("https://apisandbox.dev.clover.com/oauth/token", null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code
            }
        });

        const accessToken = tokenResponse.data.access_token;
        
        // SUCCESS
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>✅ OAuth Success!</title>
                <style>
                    body { font-family: Arial; padding: 40px; text-align: center; }
                    .success { color: green; font-size: 2rem; }
                    .token { background: #f5f5f5; padding: 20px; margin: 20px auto; max-width: 600px; border-radius: 5px; word-break: break-all; }
                </style>
            </head>
            <body>
                <h1 class="success">✅ OAuth Successful!</h1>
                <p>Authorization code received and exchanged for token.</p>
                <div class="token">
                    <strong>Access Token:</strong><br>
                    ${accessToken}
                </div>
                <p><a href="/">← Back to Butter</a></p>
            </body>
            </html>
        `);

    } catch (error) {
        console.error("Token exchange error:", error.message);
        
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Token Error</title></head>
            <body style="font-family: Arial; padding: 40px;">
                <h1 style="color: red;">❌ Token Exchange Failed</h1>
                <p>Error: ${error.message}</p>
                <a href="/">← Back to Butter</a>
            </body>
            </html>
        `);
    }
});

// ============ HEALTH CHECK ============
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "butter-clover-oauth",
        version: "3.0.0",
        timestamp: new Date().toISOString(),
        client_id: CLIENT_ID,
        endpoints: {
            home: "/",
            callback: "/callback",
            health: "/health"
        }
    });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`
🧈 BUTTER CLOVER OAUTH SERVER
=============================
✅ Server started on port: ${PORT}
✅ Homepage: http://localhost:${PORT}
✅ Callback: http://localhost:${PORT}/callback
✅ Health: http://localhost:${PORT}/health
✅ Ready for Clover OAuth!

🎯 Update Clover with:
Site URL: http://localhost:${PORT}
Redirect URI: http://localhost:${PORT}/callback
    `);
});