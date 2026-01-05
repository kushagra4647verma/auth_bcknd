import { supabase } from "../db.js"
import { assertRestaurantOwner } from "../utils/ownershipGuard.js"

/**
 * GET /restaurants/:restaurantId/bank
 */
export async function getBank(req, res) {
  const { restaurantId } = req.params

  await assertRestaurantOwner(req, restaurantId)

  const { data, error } = await supabase
    .from("restaurantBankDetails")
    .select("*")
    .eq("restaurantId", restaurantId)
    .single()

  if (error && error.code !== "PGRST116") {
    return res.status(500).json(error)
  }

  res.json(data ?? {})
}

/**
 * PATCH /restaurants/:restaurantId/bank
 */
export async function updateBank(req, res) {
  const { restaurantId } = req.params

  await assertRestaurantOwner(req, restaurantId)

  const { data, error } = await supabase
    .from("restaurantBankDetails")
    .upsert({
      restaurantId,
      ...req.body
    })
    .select()
    .single()

  if (error) return res.status(500).json(error)
  res.json(data)
}
