const { User, Client, Coach } = require("../models")

module.exports.update_client_profile = async (req, res) => {
  try {
    const user_id = req.user.user_id
    const { first_name, last_name, phone, goal } = req.body

    const user = await User.findByPk(user_id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role !== "client") {
      return res.status(403).json({ message: "Only clients can update this profile." })
    }

    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      phone: phone || user.phone,
    })

    // update goal on client if the user is a client
    const client = await Client.findByPk(user_id)
    if (!client) {
      return res.status(404).json({ message: "Client profile not found" })
    }

    if (goal !== undefined) {
      await client.update({ goal })
    }

    const refreshedClient = await Client.findByPk(user_id)

    res.status(200).json({
      message: "Profile updated successfully! ",
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        profile_pic: user.profile_pic,
        role: user.role,
        goal: refreshedClient.goal || null,
      },
      client: refreshedClient,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.update_coach_profile = async (req, res) => {
  try {
    const user_id = req.user.user_id
    const {
      first_name,
      last_name,
      phone,
      bio,
      experience_years,
      specialization,
      price,
    } = req.body

    const user = await User.findByPk(user_id)
    if (!user) return res.status(404).json({ message: "User is not found!" })

    if (user.role !== "coach") {
      return res
        .status(403)
        .json({ message: "Only coaches can update coach profile!" })
    }

    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      phone: phone || user.phone,
    })

    const coach = await Coach.findByPk(user_id)
    if (coach) {
      await coach.update({
        bio: bio !== undefined ? bio : coach.bio,
        experience_years:
          experience_years !== undefined && experience_years !== ""
            ? parseInt(experience_years)
            : coach.experience_years,
        specialization:
          specialization !== undefined ? specialization : coach.specialization,
        price: price !== undefined ? price : coach.price,
      })
    }
    res.status(200).json({
      message: "Coach profile updated successfully!",
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        profile_pic: user.profile_pic,
        role: user.role,
      },
      coach: {
        bio: coach.bio,
        experience_years: coach.experience_years,
        specialization: coach.specialization,
        price: coach.price,
        is_approved: coach.is_approved,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.get_coach_profile = async (req, res) => {
  try {
    const user_id = req.user.user_id

    const user = await User.findByPk(user_id, {
      attributes: [
        "user_id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "profile_pic",
        "role",
      ],
    })

    const coach = await Coach.findByPk(user_id)

    if (!user || !coach) {
      return res.status(404).json({ message: "Coach not found" })
    }

    res.status(200).json({
      user: user.toJSON(),
      coach: {
        bio: coach.bio,
        experience_years: coach.experience_years,
        specialization: coach.specialization,
        price: coach.price,
        is_approved: coach.is_approved,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
