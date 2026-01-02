import express from "express"
import dotenv from "dotenv"
import { authenticate } from "./authMiddleware.js"
import { createProxy } from "./proxy.js"

dotenv.config()

const app = express()
app.use(express.json())

/**
 * Health check (no auth)
 */
app.get("/health", (_, res) => {
  res.json({ status: "API Gateway running" })
})

/**
 * ===== RESTAURANTS =====
 */

// Base route (fixes 404 on /restaurants)
app.get("/restaurants", authenticate, (req, res) => {
  res.json({ message: "Restaurants API root" })
})

// Proxy all sub-routes
app.use(
  "/restaurants",
  authenticate,
  createProxy(process.env.RESTAURANT_SERVICE_URL)
)

/**
 * ===== BEVERAGES =====
 */
app.get("/beverages", authenticate, (_, res) => {
  res.json({ message: "Beverages API root" })
})

app.use(
  "/beverages",
  authenticate,
  createProxy(process.env.BEVERAGE_SERVICE_URL)
)

/**
 * ===== EVENTS =====
 */
app.get("/events", authenticate, (_, res) => {
  res.json({ message: "Events API root" })
})

app.use(
  "/events",
  authenticate,
  createProxy(process.env.EVENT_SERVICE_URL)
)

/**
 * ===== USERS =====
 */
app.get("/users", authenticate, (_, res) => {
  res.json({ message: "Users API root" })
})

app.use(
  "/users",
  authenticate,
  createProxy(process.env.USER_SERVICE_URL)
)

/**
 * ===== USER SUB-RESOURCES =====
 */
app.use(
  "/bookmarks",
  authenticate,
  createProxy(process.env.USER_SERVICE_URL)
)

app.use(
  "/diary",
  authenticate,
  createProxy(process.env.USER_SERVICE_URL)
)

/**
 * ===== SOCIAL =====
 */
app.get("/friends", authenticate, (_, res) => {
  res.json({ message: "Friends API root" })
})

app.use(
  "/friends",
  authenticate,
  createProxy(process.env.SOCIAL_SERVICE_URL)
)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`)
})
