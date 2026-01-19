import dotenv from "dotenv"
dotenv.config()

import express from "express"
import crypto from "crypto"

app.use(cors())
app.options("*", cors())
app.use(express.json())

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
  console.log("[SMS-HOOK] Received headers:", req.headers)
  console.log("[SMS-HOOK] Received body:", JSON.stringify(req.body, null, 2))

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

  // ✅ Normalize phone ONCE
  const normalizedPhone = user.phone.replace(/\D/g, "")

  // ✅ Store OTP
  otpStore.set(normalizedPhone, {
    otp: sms.otp,
    timestamp: Date.now()
  })

  // ✅ LOG AFTER SET (this was the bug)
  console.log(
    `[SMS-HOOK] Storing OTP for ${normalizedPhone}. Current Store Size: ${otpStore.size}`
  )

  console.log(
    `[SMS-HOOK] OTP content:`,
    { otp: sms.otp, phone: normalizedPhone }
  )

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
  // if (process.env.NODE_ENV !== "development") {
  //   return res.sendStatus(403)
  // }

  const phone = req.params.phone.replace(/\D/g, "")
  const entry = otpStore.get(phone)

  if (!entry) {
    return res.status(404).json({ error: "OTP not found" })
  }

  return res.json({ otp: entry.otp })
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
