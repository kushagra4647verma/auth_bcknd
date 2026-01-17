import express from "express"
import proxy from "express-http-proxy"
import { authenticate } from "./authMiddleware.js"

const router = express.Router()

// ---- service proxies ----
const restaurantService = proxy("http://onboarding-restaurant-service:5001", {
  proxyReqPathResolver: req => req.originalUrl
})

const beverageService = proxy("http://onboarding-beverage-service:5002", {
  proxyReqPathResolver: req => req.originalUrl
})

const eventService = proxy("http://onboarding-event-service:5003", {
  proxyReqPathResolver: req => req.originalUrl
})

// ---- routing ----

// beverages
router.use(
  ["/restaurants/:restaurantId/beverages", "/beverages"],
  authenticate,
  beverageService
)

// events
router.use(
  ["/restaurants/:restaurantId/events", "/events"],
  authenticate,
  eventService
)

// restaurants
router.use(
  "/restaurants",
  authenticate,
  restaurantService
)

export default router
