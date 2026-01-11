import { supabase } from "../db.js"
import { tables } from "../utils/tableNames.js"

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from(tables.profiles)
    .select("id, name, phone")
    .eq("id", userId)
    .single()

  if (error) throw error
  return data
}

export async function getUserBadges(userId) {
  const { data, error } = await supabase
    .from(tables.badges)
    .select("*")
    .eq("userId", userId)
    .single()

  if (error) return {}
  return data
}

export async function insertBookmark(userId, restaurantId) {
  const { error } = await supabase
    .from(tables.bookmarks)
    .insert({ userId, restaurantId })

  if (error) throw error
}

export async function deleteBookmark(userId, restaurantId) {
  const { error } = await supabase
    .from(tables.bookmarks)
    .delete()
    .eq("userId", userId)
    .eq("restaurantId", restaurantId)

  if (error) throw error
}

export async function getBookmarks(userId) {
  const { data, error } = await supabase
    .from(tables.bookmarks)
    .select(`restaurantId`)
    .eq("userId", userId)

  if (error) throw error

  if (!data || data.length === 0) return []

  // Fetch restaurant details separately
  const restaurantIds = data.map(b => b.restaurantId)
  const { data: restaurants, error: restError } = await supabase
    .from(tables.restaurants)
    .select("*")
    .in("id", restaurantIds)

  if (restError) throw restError
  return restaurants
}

export async function recalculateBookmarkCount(userId) {
  const { count } = await supabase
    .from(tables.bookmarks)
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)

  await supabase
    .from(tables.badges)
    .upsert({
      userId,
      bookmarkCount: count
    })
}

export async function insertDiary(userId, payload) {
  const { data, error } = await supabase
    .from(tables.diary)
    .insert({ userId, ...payload })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getDiary(userId) {
  const { data, error } = await supabase
    .from(tables.diary)
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })

  if (error) throw error
  return data
}

export async function updateDiary(userId, entryId, payload) {
  const { data, error } = await supabase
    .from(tables.diary)
    .update(payload)
    .eq("entryId", entryId)
    .eq("userId", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDiary(userId, entryId) {
  const { error } = await supabase
    .from(tables.diary)
    .delete()
    .eq("entryId", entryId)
    .eq("userId", userId)

  if (error) throw error
  return { message: "Diary entry deleted" }
}
