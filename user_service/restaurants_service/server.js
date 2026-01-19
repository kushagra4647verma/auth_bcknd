// user_services/restaurant/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

app.use(cors());
app.use(express.json());

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const payload = jwt.decode(token);
    req.user = payload;
    next();
  } catch {
    res.sendStatus(401);
  }
}

app.get("/health", (req, res) => {
  res.json({
    status: "Restaurant Service running",
    timestamp: new Date().toISOString(),
  });
});

// Get all verified restaurants
app.get("/api/restaurants", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("isVerified", true);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get trending restaurants
app.get("/api/restaurants/trending", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("trendingRestaurants")
      .select(`restaurantId, restaurants!inner (*)`)
      .eq("restaurants.isVerified", true);

    if (error) throw error;
    const restaurants = data.map((r) => r.restaurants);
    res.json({ success: true, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single restaurant
app.get("/api/restaurants/:restaurantId", authenticate, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .eq("isVerified", true)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🍽️ Restaurant Service running on port ${PORT}`);
});
