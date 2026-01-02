import { Router } from "express"
import {
  getAllRestaurants,
  getTrendingRestaurants,
  getRestaurantById,
  getRestaurantBeverages
} from "../controllers/restaurantController.js"

const router = Router()

router.get("/", getAllRestaurants)
router.get("/restaurants/trending", getTrendingRestaurants)
router.get("/restaurants/:restaurantId", getRestaurantById)
router.get("/restaurants/:restaurantId/beverages", getRestaurantBeverages)

export default router
