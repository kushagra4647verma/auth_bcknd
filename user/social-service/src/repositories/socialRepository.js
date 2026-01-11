import { supabase } from "../db.js"
import { tables } from "../utils/tableNames.js"

export async function insertFriend(userId, friendId) {
  const { error } = await supabase
    .from(tables.friends)
    .upsert({ userId, friendId })

  if (error) throw error
}

export async function deleteFriend(userId, friendId) {
  const { error } = await supabase
    .from(tables.friends)
    .delete()
    .eq("userId", userId)
    .eq("friendId", friendId)

  if (error) throw error
}

export async function getFriends(userId) {
  const { data, error } = await supabase
    .from(tables.friends)
    .select(`friendId`)
    .eq("userId", userId)

  if (error) throw error

  if (!data || data.length === 0) return []

  // Fetch friend profiles separately
  const friendIds = data.map(f => f.friendId)
  const { data: profiles, error: profileError } = await supabase
    .from(tables.profiles)
    .select("id, name, phone")
    .in("id", friendIds)

  if (profileError) throw profileError
  return profiles
}

export async function recalculateFriendCount(userId) {
  const { count } = await supabase
    .from(tables.friends)
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)

  await supabase
    .from(tables.badges)
    .upsert({
      userId,
      friendsCount: count
    })
}
