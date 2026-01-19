// user_services/event/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4003;

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
    status: "Event Service running",
    timestamp: new Date().toISOString(),
  });
});

// Get all upcoming events
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

// Get single event
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

app.listen(PORT, () => {
  console.log(`📅 Event Service running on port ${PORT}`);
});
