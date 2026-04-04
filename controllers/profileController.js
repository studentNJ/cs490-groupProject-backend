const { User, Client } = require("../models");

module.exports.update_profile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { first_name, last_name, phone, goal } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      phone: phone || user.phone,
    });

    // update goal on client if the user is a client
    if (user.role === "client" && goal !== undefined) {
      const client = await Client.findByPk(user_id);
      if (client) {
        await client.update({ goal });
      }
    }

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
        goal: goal || null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
