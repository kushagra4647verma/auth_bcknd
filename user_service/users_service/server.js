// user_services/user/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4005;

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
    status: "User Service running",
    timestamp: new Date().toISOString(),
  });
});

// ==================== USER PROFILE ====================
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

// ==================== BOOKMARKS ====================
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

// ==================== DIARY ====================
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

// ==================== FRIENDS ====================
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

app.listen(PORT, () => {
  console.log(`👤 User Service running on port ${PORT}`);
});
