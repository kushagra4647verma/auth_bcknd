// user_services/expert/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4004;

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
    status: "Expert Service running",
    timestamp: new Date().toISOString(),
  });
});

// Get all experts
app.get("/api/experts", authenticate, async (req, res) => {
  try {
    const { data: experts, error } = await supabase.from("experts").select("*");

    if (error) throw error;

    const expertsWithRatings = await Promise.all(
      experts.map(async (expert) => {
        const { data: ratings } = await supabase
          .from("expertRatings")
          .select(
            "presentationRating, tasteRating, ingredientsRating, accuracyRating",
          )
          .eq("expertId", expert.userid);

        const totalRatings = ratings?.length || 0;
        let avgRating = 0;

        if (totalRatings > 0) {
          const sumRatings = ratings.reduce((sum, rating) => {
            const avgForThisRating =
              (rating.presentationRating +
                rating.tasteRating +
                rating.ingredientsRating +
                rating.accuracyRating) /
              4;
            return sum + avgForThisRating;
          }, 0);
          avgRating = Math.round((sumRatings / totalRatings) * 10) / 10;
        }

        return { ...expert, avgRating, totalRatings };
      }),
    );

    res.json({ success: true, data: expertsWithRatings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single expert
app.get("/api/experts/:expertId", authenticate, async (req, res) => {
  try {
    const { expertId } = req.params;
    const { data: expert, error } = await supabase
      .from("experts")
      .select("*")
      .eq("userid", expertId)
      .single();

    if (error || !expert) {
      return res
        .status(404)
        .json({ success: false, message: "Expert not found" });
    }

    const { data: ratings } = await supabase
      .from("expertRatings")
      .select(
        "presentationRating, tasteRating, ingredientsRating, accuracyRating, createdAt",
      )
      .eq("expertId", expertId);

    const totalRatings = ratings?.length || 0;
    let avgRating = 0;

    if (totalRatings > 0) {
      const sumRatings = ratings.reduce((sum, rating) => {
        const avgForThisRating =
          (rating.presentationRating +
            rating.tasteRating +
            rating.ingredientsRating +
            rating.accuracyRating) /
          4;
        return sum + avgForThisRating;
      }, 0);
      avgRating = Math.round((sumRatings / totalRatings) * 10) / 10;
    }

    const yearsExp = expert.createdat
      ? Math.max(
          1,
          new Date().getFullYear() - new Date(expert.createdat).getFullYear(),
        )
      : 1;

    res.json({
      success: true,
      data: { ...expert, avgRating, totalRatings, yearsExp },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get expert ratings
app.get("/api/experts/:expertId/ratings", authenticate, async (req, res) => {
  try {
    const { expertId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const { data, error } = await supabase
      .from("expertRatings")
      .select(
        `
        expertId,
        beverageId,
        presentationRating,
        tasteRating,
        ingredientsRating,
        accuracyRating,
        createdAt,
        beverages!expertRatings_beverageId_fkey (
          id,
          name,
          category,
          restaurantid
        )
      `,
      )
      .eq("expertId", expertId)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`👨‍🍳 Expert Service running on port ${PORT}`);
});
