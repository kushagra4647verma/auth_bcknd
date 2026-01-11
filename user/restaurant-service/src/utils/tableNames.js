const isDev = process.env.NODE_ENV !== "production"
const suffix = isDev ? "_duplicate" : ""

export const tables = {
  restaurants: `restaurants${suffix}`,
  trendingRestaurants: `trendingRestaurants${suffix}`,
  beverages: `beverages${suffix}`,
}
