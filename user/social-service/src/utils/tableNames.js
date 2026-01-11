const isDev = process.env.NODE_ENV !== "production"
const suffix = isDev ? "_duplicate" : ""

export const tables = {
  friends: `friends${suffix}`,
  profiles: `profiles${suffix}`,
  badges: `badges${suffix}`,
}
