const isDev = process.env.NODE_ENV !== "production"
const suffix = isDev ? "_duplicate" : ""

export const tables = {
  restaurantEvents: `restaurantEvents${suffix}`,
}
