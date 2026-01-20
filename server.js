const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// ========== BASIC ROUTES ==========
app.get("/", async (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/health", async (req, res) => {
    res.status(200).json({
        status: "healthy",
        service: "butter-final",
        timestamp: new Date().toISOString(),
        endpoints: {
            oauth: "/api/oauth/start",
            callback: "/oauth/success",
            api: "/api/clover/*",
            admin: "https://butter-final.onrender.com (donations app)"
        }
    });
});

// ========== OAUTH ROUTES ==========
// Start OAuth flow
app.get("/api/oauth/start", async (req, res) => {
    const clientId = "JD06DKTZ0E7MT";
    const redirectUri = encodeURIComponent("https://butter-final.onrender.com/oauth/success");
    const scopes = encodeURIComponent("merchant_read");
    
    const authUrl = `https://sandbox.dev.clover.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`;
    
    console.log("🔄 Redirecting to Clover OAuth");
    console.log("📝 Request params:", { 
        redirect_uri: "https://butter-final.onrender.com/oauth/success",
        has_client_secret: !!process.env.CLOVER_CLIENT_SECRET 
    });
    
    res.redirect(authUrl);
});

// OAuth Callback - IMPROVED VERSION
app.get("/oauth/success", async (req, res) => {
    console.log("=== 🎯 OAUTH CALLBACK ===");
    
    const { code, merchant_id, error, error_description } = req.query;
    console.log("📥 Code received:", !!code);
    console.log("🏪 Merchant ID from query:", merchant_id);
    
    if (error) {
        console.error("❌ OAuth error:", error, error_description);
        return res.status(400).send(`
            <h2>OAuth Error</h2>
            <p><strong>${error}</strong>: ${error_description}</p>
            <p><a href="/api/oauth/start">Try again</a></p>
        `);
    }
    
    if (!code) {
        return res.status(400).send(`
            <h2>Error: No authorization code</h2>
            <p>Please restart OAuth: <a href="/api/oauth/start">Click here</a></p>
        `);
    }
    
    try {
        // Exchange code for API token
        console.log("🔄 Exchanging code for API token...");
        
        const tokenResponse = await fetch("https://apisandbox.dev.clover.com/oauth/token", {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: "JD06DKTZ0E7MT",
                client_secret: process.env.CLOVER_CLIENT_SECRET,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: "https://butter-final.onrender.com/oauth/success"
            }).toString()
        });
        
        console.log("📊 Token exchange status:", tokenResponse.status);
        const tokenData = await tokenResponse.json();
        console.log("🔑 Token exchange result:", tokenData);
        
        if (!tokenData.access_token) {
            console.error("❌ ERROR: No access_token in response!");
            return res.send(`
                <h2>Token Exchange Failed</h2>
                <pre>${JSON.stringify(tokenData, null, 2)}</pre>
                <p><a href="/api/oauth/start">Try again</a></p>
            `);
        }
        
        // Determine merchant ID
        const finalMerchantId = merchant_id || tokenData.merchant_id || "Q82R0D2NSRR81";
        
        // IMPORTANT: Clover sandbox tokens expire in SECONDS
        console.log("⚠️ WARNING: Sandbox tokens expire quickly. Use immediately!");
        console.log("✅ Token:", tokenData.access_token.substring(0, 15) + "...");
        console.log("✅ Merchant ID:", finalMerchantId);
        
        // Return page that stores API token with BETTER JavaScript
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Connected to Clover</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        .success { color: #4CAF50; font-size: 24px; margin: 20px 0; }
        .token { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 20px; font-family: monospace; }
    </style>
    <script>
        console.log("=== 🎯 OAUTH SUCCESS ===");
        
        // Store the REAL API token
        const token = "${tokenData.access_token}";
        const merchantId = "${finalMerchantId}";
        
        localStorage.setItem("clover_access_token", token);
        localStorage.setItem("clover_merchant_id", merchantId);
        localStorage.setItem("clover_token_timestamp", Date.now());
        
        console.log("✅ Token stored:", token.substring(0, 15) + "...");
        console.log("✅ Merchant ID:", merchantId);
        console.log("⚠️ IMPORTANT: Use token within 30 seconds!");
        
        // Show status
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('tokenPreview').textContent = token.substring(0, 20) + '...';
            document.getElementById('merchantId').textContent = merchantId;
            
            // Countdown before redirect
            let countdown = 3;
            const countdownEl = document.getElementById('countdown');
            const interval = setInterval(() => {
                countdown--;
                countdownEl.textContent = countdown;
                if (countdown <= 0) {
                    clearInterval(interval);
                    console.log("🔄 Redirecting to donations app...");
                    window.location.href = "/";
                }
            }, 1000);
        });
    </script>
</head>
<body>
    <h1>✅ Connected to Clover!</h1>
    <div class="success">Authentication Successful</div>
    
    <p>Token: <span id="tokenPreview" class="token">Loading...</span></p>
    <p>Merchant ID: <span id="merchantId">Loading...</span></p>
    
    <p><strong>⚠️ Important:</strong> Clover sandbox tokens expire quickly.<br>
    Use the token immediately for API calls.</p>
    
    <p>Redirecting to donations app in <span id="countdown">3</span> seconds...</p>
    <p><a href="/">Click here if not redirected</a></p>
    
    <script>
        // Test API immediately
        setTimeout(() => {
            const token = localStorage.getItem("clover_access_token");
            if (token) {
                console.log("🔍 Testing API with fresh token...");
                fetch('/api/clover/merchants/current', {
                    headers: { 'Authorization': 'Bearer ' + token }
                })
                .then(response => {
                    console.log("Test API status:", response.status);
                    if (response.ok) {
                        console.log("🎉 Fresh token works!");
                    } else {
                        console.log("❌ Token already expired?", response.status);
                    }
                })
                .catch(err => console.error("Test error:", err));
            }
        }, 100);
    </script>
</body>
</html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error("❌ OAuth error:", error);
        res.send(`
            <h2>OAuth Error</h2>
            <p><strong>${error.name}:</strong> ${error.message}</p>
            <p>Check Render logs for details.</p>
            <p><a href="/api/oauth/start">Try again</a></p>
        `);
    }
});

// ========== API PROXY ROUTES WITH PROPER ERROR HANDLING ==========
// Get current merchant
app.get("/api/clover/merchants/current", async (req, res) => {
    console.log("=== 📞 MERCHANT API CALL ===");
    console.log("🕒 Timestamp:", new Date().toISOString());
    
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("❌ ERROR: No Bearer token in header");
            return res.status(401).json({ 
                error: "no_token",
                message: "Authorization header missing or invalid",
                solution: "Visit /api/oauth/start to get a fresh token",
                required_format: "Authorization: Bearer YOUR_TOKEN_HERE"
            });
        }
        
        const token = authHeader.split(" ")[1];
        console.log("🔑 Token (first 10):", token.substring(0, 10) + "...");
        
        // Make API call with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const apiResponse = await fetch("https://apisandbox.dev.clover.com/v3/merchants/current", {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json",
                "User-Agent": "Butter-Final/1.0"
            },
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        console.log("📊 Clover API response status:", apiResponse.status);
        
        const data = await apiResponse.json();
        
        if (apiResponse.status === 401) {
            // TOKEN EXPIRED
            console.log("❌ TOKEN EXPIRED - Sandbox tokens expire in seconds");
            return res.status(401).json({
                error: "token_expired",
                message: "Clover sandbox token has expired",
                note: "Sandbox tokens expire very quickly (seconds to minutes)",
                solution: "Get a fresh token and use it immediately",
                refresh_url: "/api/oauth/start?refresh=true",
                sandbox_limitation: true
            });
        }
        
        // SUCCESS
        console.log("✅ API call successful");
        res.status(apiResponse.status).json({
            status: "success",
            clover_status: apiResponse.status,
            data: data,
            timestamp: new Date().toISOString(),
            note: apiResponse.status === 200 ? 
                "Token is valid (for now)" : 
                "API returned non-200 status"
        });
        
    } catch (error) {
        console.error("❌ API ERROR:", error.name, error.message);
        
        if (error.name === 'AbortError') {
            res.status(504).json({ 
                error: "timeout",
                message: "Clover API timeout after 10 seconds",
                note: "Sandbox API might be slow or unavailable"
            });
        } else {
            res.status(500).json({ 
                error: "server_error",
                message: error.message,
                note: "Clover sandbox is unreliable for testing"
            });
        }
    }
});

// Get specific merchant
app.get("/api/clover/merchants/:id", async (req, res) => {
    console.log(`=== 📞 MERCHANT BY ID API: ${req.params.id} ===`);
    
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ 
                error: "no_token",
                message: "Authorization header missing"
            });
        }
        
        const token = authHeader.split(" ")[1];
        const merchantId = req.params.id;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const apiResponse = await fetch(`https://apisandbox.dev.clover.com/v3/merchants/${merchantId}`, {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        const data = await apiResponse.json();
        
        if (apiResponse.status === 401) {
            return res.status(401).json({
                error: "token_expired",
                message: "Token expired - sandbox limitation",
                solution: "Get fresh token and use immediately"
            });
        }
        
        res.status(apiResponse.status).json({
            status: apiResponse.status === 200 ? "success" : "api_error",
            data: data
        });
        
    } catch (error) {
        console.error("Merchant by ID error:", error.message);
        
        if (error.name === 'AbortError') {
            res.status(504).json({ error: "timeout" });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// ========== ITEMS AND ORDERS ROUTES ==========
// Get merchant items
app.get("/api/clover/merchants/:id/items", async (req, res) => {
    try {
        console.log(`=== 📦 ITEMS API: ${req.params.id} ===`);
        
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ 
                error: "no_token",
                message: "Token required"
            });
        }
        
        const token = authHeader.split(" ")[1];
        const merchantId = req.params.id;
        const query = req.url.split("?")[1] || "";
        
        let url = "https://apisandbox.dev.clover.com/v3/merchants/" + merchantId + "/items";
        if (query) {
            url = url + "?" + query;
        }
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        const data = await response.json();
        
        if (response.status === 401) {
            return res.status(401).json({
                error: "token_expired",
                sandbox_issue: true,
                message: "Token expired too quickly"
            });
        }
        
        res.status(response.status).json({
            status: response.status,
            item_count: data.elements ? data.elements.length : 0,
            data: data
        });
        
    } catch (error) {
        console.error("Items API error:", error.message);
        res.status(500).json({ 
            error: "server_error",
            message: error.message
        });
    }
});

// Get merchant orders
app.get("/api/clover/merchants/:id/orders", async (req, res) => {
    try {
        console.log(`=== 🧾 ORDERS API: ${req.params.id} ===`);
        
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "no_token" });
        }
        
        const token = authHeader.split(" ")[1];
        const merchantId = req.params.id;
        const query = req.url.split("?")[1] || "";
        
        let url = "https://apisandbox.dev.clover.com/v3/merchants/" + merchantId + "/orders";
        if (query) {
            url = url + "?" + query;
        }
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        const data = await response.json();
        
        if (response.status === 401) {
            return res.status(401).json({
                error: "token_expired",
                note: "Clover sandbox limitation"
            });
        }
        
        res.status(response.status).json({
            status: response.status,
            order_count: data.elements ? data.elements.length : 0,
            data: data
        });
        
    } catch (error) {
        console.error("Orders API error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ========== DIAGNOSTIC ROUTES ==========
app.get("/api/debug", (req, res) => {
    res.json({
        service: "butter-final",
        environment: process.env.NODE_ENV || "development",
        port: PORT,
        timestamp: new Date().toISOString(),
        issues: [
            "Clover sandbox tokens expire quickly",
            "Use tokens immediately after OAuth",
            "Production tokens last longer"
        ],
        endpoints: {
            home: "/",
            health: "/health",
            oauth_start: "/api/oauth/start",
            oauth_callback: "/oauth/success",
            api_merchant: "/api/clover/merchants/current",
            api_items: "/api/clover/merchants/:id/items",
            api_orders: "/api/clover/merchants/:id/orders"
        }
    });
});

app.get("/api/debug/env", (req, res) => {
    // Show non-sensitive env info
    res.json({
        node_env: process.env.NODE_ENV,
        port: process.env.PORT,
        has_clover_secret: !!process.env.CLOVER_CLIENT_SECRET,
        clover_secret_length: process.env.CLOVER_CLIENT_SECRET ? process.env.CLOVER_CLIENT_SECRET.length : 0
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log("========================================");
    console.log("✅ BUTTER SERVER RUNNING on port " + PORT);
    console.log("========================================");
    console.log("📌 Donations App: /");
    console.log("📌 Health Check: /health");
    console.log("📌 OAuth Start: /api/oauth/start");
    console.log("📌 OAuth Callback: /oauth/success");
    console.log("📌 Debug Info: /api/debug");
    console.log("📌 Clover API: /api/clover/*");
    console.log("========================================");
    console.log("⚠️  NOTE: Clover sandbox tokens expire quickly!");
    console.log("⚠️  Use tokens immediately after OAuth.");
    console.log("========================================");
});