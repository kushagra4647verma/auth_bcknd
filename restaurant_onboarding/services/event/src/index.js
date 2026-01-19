import 'dotenv/config'
import express from "express"
import eventRoutes from "./routes/eventRoutes.js"
import { authenticate } from "./middleware/authMiddleware.js"

const app = express()
app.use(express.json())
app.use(authenticate)
app.use(eventRoutes)

const PORT = process.env.PORT || 3003

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Restaurant service running on port ${PORT}`)
})

