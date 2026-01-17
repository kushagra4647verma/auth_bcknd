import express from "express"
import crypto from "crypto"

const app = express()
app.use(express.json())

// ---------------- OTP STORE ----------------
const otpStore = new Map()

setInterval(() => {
  const now = Date.now()
  for (const [phone, data] of otpStore) {
    if (now - data.timestamp > 5 * 60 * 1000) {
      otpStore.delete(phone)
    }
  }
}, 5 * 60 * 1000)

// ---------------- HELPERS ----------------
function verifySupabaseSignature(payload, signature, secret) {
  if (!secret || !signature) return false

  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(JSON.stringify(payload))
  const expected = hmac.digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

async function sendSms(phone, message) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV SMS] ${phone}: ${message}`)
    return
  }

  // 🔁 Plug MessageBot / any provider here
}

// ---------------- ROUTES ----------------

/**
 * Supabase SMS Hook
 */
app.post("/auth/sms-hook", async (req, res) => {
  const signature = req.headers["x-supabase-signature"]
  const secret = process.env.SUPABASE_SMS_HOOK_SECRET

  if (secret && signature) {
    const valid = verifySupabaseSignature(req.body, signature, secret)
    if (!valid) return res.status(401).json({ error: "Invalid signature" })
  }

  const { user, sms } = req.body
  if (!user?.phone || !sms?.otp) {
    return res.status(400).json({ error: "Invalid payload" })
  }

  otpStore.set(user.phone, {
    otp: sms.otp,
    timestamp: Date.now()
  })

  await sendSms(
    user.phone,
    `Your SipZy OTP is ${sms.otp}`
  )

  res.json({ success: true })
})

/**
 * DEV OTP fetch
 */
app.get("/auth/dev-otp/:phone", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.sendStatus(403)
  }

  const phone = decodeURIComponent(req.params.phone)
  const data = otpStore.get(phone)

  if (!data) return res.sendStatus(404)
  res.json({ otp: data.otp })
})

/**
 * Token validation (used by gateway)
 */
app.get("/auth/verify", (req, res) => {
  const token = req.headers.authorization
  if (!token) return res.sendStatus(401)

  // 🔐 verify JWT / Supabase token here
  res.json({ valid: true, userId: "123" })
})

// ---------------- START ----------------
app.listen(5000, () => {
  console.log("Auth service running on :5000")
})
