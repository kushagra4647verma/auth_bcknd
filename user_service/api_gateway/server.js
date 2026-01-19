// user_services/gateway/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Service URLs
const SERVICES = {
  restaurant: process.env.RESTAURANT_SERVICE_URL || "http://localhost:4001",
  beverage: process.env.BEVERAGE_SERVICE_URL || "http://localhost:4002",
  event: process.env.EVENT_SERVICE_URL || "http://localhost:4003",
  expert: process.env.EXPERT_SERVICE_URL || "http://localhost:4004",
  user: process.env.USER_SERVICE_URL || "http://localhost:4005",
};

// Proxy helper
async function proxyRequest(req, res, serviceUrl) {
  try {
    const url = `${serviceUrl}${req.url}`;
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization || "",
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

app.get("/health", (req, res) => {
  res.json({
    status: "API Gateway running",
    timestamp: new Date().toISOString(),
  });
});

// Restaurant routes
app.all("/api/restaurants*", (req, res) =>
  proxyRequest(req, res, SERVICES.restaurant),
);

// Beverage routes
app.all("/api/beverages*", (req, res) =>
  proxyRequest(req, res, SERVICES.beverage),
);

// Event routes
app.all("/api/events*", (req, res) => proxyRequest(req, res, SERVICES.event));

// Expert routes
app.all("/api/experts*", (req, res) => proxyRequest(req, res, SERVICES.expert));

// User routes (profile, bookmarks, diary, friends)
app.all("/api/users*", (req, res) => proxyRequest(req, res, SERVICES.user));
app.all("/api/bookmarks*", (req, res) => proxyRequest(req, res, SERVICES.user));
app.all("/api/diary*", (req, res) => proxyRequest(req, res, SERVICES.user));
app.all("/api/friends*", (req, res) => proxyRequest(req, res, SERVICES.user));

app.listen(PORT, () => {
  console.log(`🌐 API Gateway running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log("\n📡 Routing to services:");
  console.log(`  Restaurant: ${SERVICES.restaurant}`);
  console.log(`  Beverage: ${SERVICES.beverage}`);
  console.log(`  Event: ${SERVICES.event}`);
  console.log(`  Expert: ${SERVICES.expert}`);
  console.log(`  User: ${SERVICES.user}`);
});
