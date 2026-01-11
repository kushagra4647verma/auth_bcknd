import { supabase } from "../db.js"
import { tables } from "../utils/tableNames.js"

export async function getVerifiedRestaurants() {
  const { data, error } = await supabase
    .from(tables.restaurants)
    .select("*")
    .eq("isVerified", true)

  if (error) throw error
  return data
}

export async function getTrendingRestaurants() {
  const { data, error } = await supabase
    .from(tables.trendingRestaurants)
    .select(`
      restaurantId,
      ${tables.restaurants}!inner (*)
    `)
    .eq(`${tables.restaurants}.isVerified`, true)

  if (error) throw error

  return data.map(r => r.restaurants)
}


export async function getRestaurantById(restaurantId) {
  const { data, error } = await supabase
    .from(tables.restaurants)
    .select("*")
    .eq("id", restaurantId)
    .eq("isVerified", true)
    .single()

  if (error) return null
  return data
}

// export async function getRestaurantDocuments(restaurantId) {
//   const { data, error } = await supabase
//     .from("restaurantDocuments")
//     .select("*")
//     .eq("restaurantId", restaurantId)
//     .single()

//   if (error) return null
//   return data
// }

export async function getRestaurantBeverages(restaurantId) {
  const { data, error } = await supabase
    .from(tables.beverages)
    .select("*")
    .eq("restaurantid", restaurantId)

  if (error) throw error
  return data
}
