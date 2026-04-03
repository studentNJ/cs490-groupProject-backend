const { where } = require("sequelize");
const { User, Client } = require("../models");
const { signJWToken } = require("../utils/jwt");

module.exports.google_redirect = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "email profile",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  res.redirect(googleAuthUrl);
};

module.exports.google_callback = async (req, res) => {
  try {
    console.log("Full query:", req.query);

    // Get the code from the callback url that Google returned
    const code = req.query.code;
    if (!code) {
      res.status(400).json({ message: "No authorization code provided!" });
    }
    console.log("Authorization code received: ", code);

    // Exchange code with Google to get an access token
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
    });

    const tokenData = await tokenResponse.json();
    console.log("Token response: ", tokenData);

    // Send the access token to Google API for user information
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const userInfo = await userInfoResponse.json();
    console.log("User info: ", userInfo);

    // Check if the user already exists
    let user = await User.findOne({
      where: { email: userInfo.email },
    });
    // if it's new user, create account
    if (!user) {
      // Generate a base username
      const baseUsername = userInfo.email.split("@")[0];

      // Check if the username is already taken
      let finalUsername = `${baseUsername}_g`;
      let existingUser = await User.findOne({
        where: { username: finalUsername },
      });

      if (existingUser) {
        // If taken, append a slice of google id (last 4 digits)
        const suffix = userInfo.id.slice(-4);
        finalUsername = `${baseUsername}_g${suffix}`;
      }

      user = await User.create({
        first_name: userInfo.given_name,
        last_name: userInfo.family_name,
        username: finalUsername,
        email: userInfo.email,
        google_id: userInfo.id,
        profile_pic: userInfo.picture,
        password_hash: null,
      });

      await Client.create({ user_id: user.user_id });
    } else {
      // Existing user — update profile pic if they don't have one
      if (!user.profile_pic && userInfo.picture) {
        await user.update({ profile_pic: userInfo.picture });
      }
    }

    // Create a JWT token
    const token = signJWToken(user);

    // Redirect user to callback page
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
