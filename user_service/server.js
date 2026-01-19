import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "API running", timestamp: new Date().toISOString() });
});

// ==================== RESTAURANT ROUTES ====================
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

// ==================== BEVERAGE ROUTES ====================
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

// ==================== EVENT ROUTES ====================
app.get("/api/events", authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("restaurantEvents")
      .select("*")
      .gte("date", today)
      .order("eventDate", { ascending: true });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/events/:eventId", authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { data, error } = await supabase
      .from("restaurantEvents")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== USER ROUTES ====================
app.get("/api/users/me", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, phone")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    const { data: badges } = await supabase
      .from("badges")
      .select("*")
      .eq("userId", userId)
      .single();

    res.json({ success: true, data: { ...profile, badges: badges || {} } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== BOOKMARK ROUTES ====================
app.get("/api/bookmarks", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data, error } = await supabase
      .from("bookmarks")
      .select(`restaurantId, restaurants (*)`)
      .eq("userId", userId);

    if (error) throw error;
    const restaurants = data.map((b) => b.restaurants);
    res.json({ success: true, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/bookmarks/:restaurantId", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { restaurantId } = req.params;

    const { error } = await supabase
      .from("bookmarks")
      .insert({ userId, restaurantId });

    if (error) throw error;

    // Recalculate bookmark count
    const { count } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId);

    await supabase.from("badges").upsert({ userId, bookmarkCount: count });

    res.json({ success: true, data: { message: "Bookmarked" } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/bookmarks/:restaurantId", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { restaurantId } = req.params;

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("userId", userId)
      .eq("restaurantId", restaurantId);

    if (error) throw error;

    // Recalculate bookmark count
    const { count } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId);

    await supabase.from("badges").upsert({ userId, bookmarkCount: count });

    res.json({ success: true, data: { message: "Bookmark removed" } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== DIARY ROUTES ====================
app.get("/api/diary", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data, error } = await supabase
      .from("diary")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/diary", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data, error } = await supabase
      .from("diary")
      .insert({ userId, ...req.body })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch("/api/diary/:entryId", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { entryId } = req.params;

    const { data, error } = await supabase
      .from("diary")
      .update(req.body)
      .eq("entryId", entryId)
      .eq("userId", userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/diary/:entryId", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { entryId } = req.params;

    const { error } = await supabase
      .from("diary")
      .delete()
      .eq("entryId", entryId)
      .eq("userId", userId);

    if (error) throw error;
    res.json({ success: true, data: { message: "Diary entry deleted" } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== FRIENDS ROUTES ====================
app.get("/api/friends", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data, error } = await supabase
      .from("friends")
      .select(
        `friendId, users:userId!friends_friendId_fkey (userId, name, phone)`,
      )
      .eq("userId", userId);

    if (error) throw error;
    const friends = data.map((f) => f.users);
    res.json({ success: true, data: friends });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/friends/:friendId", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId } = req.params;

    if (userId === friendId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot add yourself as friend" });
    }

    // Mutual friendship
    await Promise.all([
      supabase.from("friends").upsert({ userId, friendId }),
      supabase.from("friends").upsert({ userId: friendId, friendId: userId }),
    ]);

    // Recalculate counts
    const [{ count: count1 }, { count: count2 }] = await Promise.all([
      supabase
        .from("friends")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId),
      supabase
        .from("friends")
        .select("*", { count: "exact", head: true })
        .eq("userId", friendId),
    ]);

    await Promise.all([
      supabase.from("badges").upsert({ userId, friendsCount: count1 }),
      supabase
        .from("badges")
        .upsert({ userId: friendId, friendsCount: count2 }),
    ]);

    res.json({ success: true, data: { message: "Friend added" } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/friends/:friendId", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId } = req.params;

    await Promise.all([
      supabase
        .from("friends")
        .delete()
        .eq("userId", userId)
        .eq("friendId", friendId),
      supabase
        .from("friends")
        .delete()
        .eq("userId", friendId)
        .eq("friendId", userId),
    ]);

    // Recalculate counts
    const [{ count: count1 }, { count: count2 }] = await Promise.all([
      supabase
        .from("friends")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId),
      supabase
        .from("friends")
        .select("*", { count: "exact", head: true })
        .eq("userId", friendId),
    ]);

    await Promise.all([
      supabase.from("badges").upsert({ userId, friendsCount: count1 }),
      supabase
        .from("badges")
        .upsert({ userId: friendId, friendsCount: count2 }),
    ]);

    res.json({ success: true, data: { message: "Friend removed" } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== EXPERT ROUTES ====================
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
