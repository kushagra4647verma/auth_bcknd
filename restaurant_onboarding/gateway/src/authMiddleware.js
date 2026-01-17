import axios from "axios"

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization
    if (!token) {
      return res.status(401).json({ error: "Missing token" })
    }

    await axios.get("http://auth_service:5000/auth/verify", {
      headers: { authorization: token }
    })

    next()
  } catch {
    return res.status(401).json({ error: "Unauthorized" })
  }
}
