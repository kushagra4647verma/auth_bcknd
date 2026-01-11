import { supabase } from "../db.js"
import { tables } from "../utils/tableNames.js"

export async function getUpcomingEvents() {
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from(tables.restaurantEvents)
    .select("*")
    .gte("eventDate", today)
    .order("eventDate", { ascending: true })

  if (error) throw error
  return data
}

export async function getEventById(eventId) {
  const { data, error } = await supabase
    .from(tables.restaurantEvents)
    .select("*")
    .eq("id", eventId)
    .single()

  if (error) return null
  return data
}
