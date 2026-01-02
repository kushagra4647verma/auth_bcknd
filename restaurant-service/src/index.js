import express from "express"
import dotenv from "dotenv"
import restaurantRoutes from "./routes/restaurantRoutes.js"
import { errorHandler } from "./middleware/errorMiddleware.js"

dotenv.config()

const app = express()
app.use(express.json())

// Health check (optional but recommended)
app.get("/health", (_, res) => {
  res.json({ status: "restaurant service running" })
})

// Main routes
app.use("/", restaurantRoutes)

// Error handler (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 4001
app.listen(PORT, () => {
  console.log(`🍽️ Restaurant service running on port ${PORT}`)
})
