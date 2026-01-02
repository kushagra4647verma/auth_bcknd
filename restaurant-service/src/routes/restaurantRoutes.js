import { Router } from "express"
import {
  getAllRestaurants,
  getTrendingRestaurants,
  getRestaurantById,
  getRestaurantBeverages
} from "../controllers/restaurantController.js"

const router = Router()

// GET /restaurants
router.get("/", getAllRestaurants)

// GET /restaurants/trending
router.get("/trending", getTrendingRestaurants)

// GET /restaurants/:restaurantId
router.get("/:restaurantId", getRestaurantById)

// GET /restaurants/:restaurantId/beverages
router.get("/:restaurantId/beverages", getRestaurantBeverages)

export default router
