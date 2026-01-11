const isDev = process.env.NODE_ENV !== "production"
const suffix = isDev ? "_duplicate" : ""

export const tables = {
  beverages: `beverages${suffix}`,
  beverageRatings: `beverageRatings${suffix}`,
  userRatings: `userRatings${suffix}`,
}
