import 'dotenv/config'
import express from "express"
import beverageRoutes from "./routes/beverageRoutes.js"
import { authenticate } from "./middleware/authMiddleware.js"

const app = express()
app.use(express.json())
app.use(authenticate)
app.use(beverageRoutes)

const PORT = process.env.PORT || 3002

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Beverage service running on port ${PORT}`)
})

