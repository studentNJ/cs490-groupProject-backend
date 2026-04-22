const { User, Client } = require("../models")
const { signJWToken } = require("../utils/jwt")

module.exports.google_redirect = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "email profile",
  })

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`

  res.redirect(googleAuthUrl)
}

module.exports.google_callback = async (req, res) => {
  try {
    const code = req.query.code
    if (!code) {
      return res.status(400).json({ message: "No authorization code provided!" })
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok || !tokenData.access_token) {
      return res.status(502).json({
        message: "Google token exchange failed.",
        error: tokenData.error || null,
      })
    }

    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    )
    const userInfo = await userInfoResponse.json()

    if (!userInfoResponse.ok || !userInfo.email || !userInfo.id) {
      return res.status(502).json({
        message: "Google user info lookup failed.",
        error: userInfo.error || null,
      })
    }

    let user = await User.findOne({
      where: { email: userInfo.email },
    })

    if (!user) {
      const baseUsername = userInfo.email.split("@")[0]

      let finalUsername = `${baseUsername}_g`
      let existingUser = await User.findOne({
        where: { username: finalUsername },
      })

      if (existingUser) {
        const suffix = userInfo.id.slice(-4)
        finalUsername = `${baseUsername}_g${suffix}`
      }

      user = await User.create({
        first_name: userInfo.given_name,
        last_name: userInfo.family_name,
        username: finalUsername,
        email: userInfo.email,
        google_id: userInfo.id,
        profile_pic: userInfo.picture,
        password_hash: null,
        role: "client",
      })

      await Client.create({ user_id: user.user_id })
    } else {
      if (!user.profile_pic && userInfo.picture) {
        await user.update({ profile_pic: userInfo.picture })
      }
    }

    const token = signJWToken(user)

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
