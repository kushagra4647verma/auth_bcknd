const isDev = process.env.NODE_ENV !== "production"
const suffix = isDev ? "_duplicate" : ""

export const tables = {
  profiles: `profiles${suffix}`,
  badges: `badges${suffix}`,
  bookmarks: `bookmarks${suffix}`,
  restaurants: `restaurants${suffix}`,
  diary: `diary${suffix}`,
}
