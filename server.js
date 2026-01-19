const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// ========== BASIC ROUTES ==========
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

// ========== OAUTH ROUTES ==========
// Start OAuth flow
app.get("/api/oauth/start", (req, res) => {
    const clientId = "JD06DKTZ0E7MT";
    const redirectUri = encodeURIComponent("https://butter-final.onrender.com/oauth/success");
    const scopes = encodeURIComponent("merchant_read");
    
    const authUrl = `https://sandbox.dev.clover.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`;
    
    console.log("Redirecting to Clover OAuth");
    res.redirect(authUrl);
});

// OAuth Callback - WORKING VERSION
app.get("/oauth/success", async (req, res) => {
    console.log("=== OAUTH CALLBACK ===");
    
    const { code, merchant_id } = req.query;
    console.log("Code received:", !!code);
    console.log("Merchant ID from query:", merchant_id);
    
    if (!code) {
        return res.status(400).send("<h2>Error: No authorization code</h2>");
    }
    
    try {
                // Exchange code for API token - CORRECT VERSION
        console.log("Exchanging code for API token...");
        
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
        
        console.log("Token exchange status:", tokenResponse.status);
        const tokenData = await tokenResponse.json();
        console.log("Token exchange result:", tokenData);
        
        if (!tokenData.access_token) {
            console.error("ERROR: No access_token in response!");
            // For debugging, send the error to browser
            return res.send("<h2>Token Exchange Failed</h2><pre>" + JSON.stringify(tokenData, null, 2) + "</pre>");
        }
        console.log("Token exchange result:", tokenData);
        
        if (!tokenData.access_token) {
            console.error("Token exchange failed:", tokenData);
            return res.send("<h2>Error getting API token</h2><pre>" + JSON.stringify(tokenData, null, 2) + "</pre>");
        }
        
        // Determine merchant ID
        const finalMerchantId = merchant_id || tokenData.merchant_id || "Q82R0D2NSRR81";
        
        // Return page that stores API token
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Connected to Clover</title>
    <script>
        // Store the REAL API token
        localStorage.setItem("clover_access_token", "${tokenData.access_token}");
        localStorage.setItem("clover_merchant_id", "${finalMerchantId}");
        
        console.log("✅ OAuth successful!");
        console.log("API token stored");
        console.log("Merchant ID:", "${finalMerchantId}");
        
        window.location.href = "/";
    </script>
</head>
<body>
    <h2>Connected to Clover!</h2>
    <p>Storing credentials and redirecting...</p>
</body>
</html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error("OAuth error:", error);
        res.send("<h2>OAuth Error</h2><p>" + error.message + "</p>");
    }
});

// ========== API PROXY ROUTES ==========
// Get current merchant
app.get("/api/clover/merchants/current", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token" });
        }
        
        const token = authHeader.split(" ")[1];
        const apiResponse = await fetch("https://apisandbox.dev.clover.com/v3/merchants/current", {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });
        
        const data = await apiResponse.json();
        res.status(apiResponse.status).json(data);
        
    } catch (error) {
        console.error("API error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get specific merchant
app.get("/api/clover/merchants/:id", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token" });
        }
        
        const token = authHeader.split(" ")[1];
        const merchantId = req.params.id;
        
        const apiResponse = await fetch(`https://apisandbox.dev.clover.com/v3/merchants/${merchantId}`, {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });
        
        const data = await apiResponse.json();
        res.status(apiResponse.status).json(data);
        
    } catch (error) {
        console.error("API error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ========== START SERVER ==========

// ========== ITEMS AND ORDERS ROUTES ==========

// Get merchant items
app.get("/api/clover/merchants/:id/items", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token" });
        }
        
        const token = authHeader.split(" ")[1];
        const merchantId = req.params.id;
        const query = req.url.split("?")[1] || "";
        
        const url = `https://apisandbox.dev.clover.com/v3/merchants/\${merchantId}/items\${query ? "?" + query : ""}`;
        
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });
        
        const data = await response.json();
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error("Items error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get merchant orders
app.get("/api/clover/merchants/:id/orders", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token" });
        }
        
        const token = authHeader.split(" ")[1];
        const merchantId = req.params.id;
        const query = req.url.split("?")[1] || "";
        
        const url = `https://apisandbox.dev.clover.com/v3/merchants/\${merchantId}/orders\${query ? "?" + query : ""}`;
        
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });
        
        const data = await response.json();
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error("Orders error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(PORT, () => {
    console.log("✅ BUTTER SERVER RUNNING on port " + PORT);
    console.log("📌 OAuth: /api/oauth/start");
    console.log("📌 Callback: /oauth/success");
    console.log("📌 API: /api/clover/*");
});





