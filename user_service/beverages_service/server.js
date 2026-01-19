// user_services/beverage/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

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
    status: "Beverage Service running",
    timestamp: new Date().toISOString(),
  });
});

// Get all beverages for a restaurant
app.get(
  "/api/restaurants/:restaurantId/beverages",
  authenticate,
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { data, error } = await supabase
        .from("beverages")
        .select("*")
        .eq("restaurantid", restaurantId);

      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// Get all beverages (new endpoint)
app.get("/api/beverages", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from("beverages").select("*");

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single beverage
app.get("/api/beverages/:beverageId", authenticate, async (req, res) => {
  try {
    const { beverageId } = req.params;
    const { data, error } = await supabase
      .from("beverages")
      .select("*")
      .eq("id", beverageId)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ success: false, message: "Beverage not found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get beverage ratings
app.get(
  "/api/beverages/:beverageId/ratings",
  authenticate,
  async (req, res) => {
    try {
      const { beverageId } = req.params;
      const { data, error } = await supabase
        .from("beverageRatings")
        .select("*")
        .eq("beverageid", beverageId)
        .single();

      if (error) {
        return res.json({
          success: true,
          data: {
            avgHuman: 0,
            countHuman: 0,
            avgExpert: 0,
            countExpert: 0,
          },
        });
      }

      const ratings = {
        avgHuman: data.counthuman ? data.sumratingshuman / data.counthuman : 0,
        countHuman: data.counthuman,
        avgExpert: data.countexpert
          ? data.sumratingsexpert / data.countexpert
          : 0,
        countExpert: data.countexpert,
      };

      res.json({ success: true, data: ratings });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// Post beverage rating
app.post(
  "/api/beverages/:beverageId/ratings",
  authenticate,
  async (req, res) => {
    try {
      const { beverageId } = req.params;
      const userId = req.user.userId;
      const { rating, comments } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid rating" });
      }

      // Upsert user rating
      const { error: upsertError } = await supabase
        .from("userRatings")
        .upsert({ userId, beverageId, rating, comments });

      if (upsertError) throw upsertError;

      // Recalculate aggregates
      const { data: allRatings, error: fetchError } = await supabase
        .from("userRatings")
        .select("rating")
        .eq("beverageId", beverageId);

      if (fetchError) throw fetchError;

      const sum = allRatings.reduce((a, b) => a + b.rating, 0);
      const count = allRatings.length;

      await supabase.from("beverageRatings").upsert({
        beverageId,
        sumRatingsHuman: sum,
        countHuman: count,
      });

      res.json({ success: true, data: { message: "Rating saved" } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

app.listen(PORT, () => {
  console.log(`🍹 Beverage Service running on port ${PORT}`);
});
