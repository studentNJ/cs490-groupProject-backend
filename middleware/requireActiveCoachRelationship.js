const { ClientCoachRelationship, User } = require("../models");

async function requireActiveCoachRelationship(req, res, next) {
  try {
    const coachUserId = req.user.user_id;
    const clientUserId = parseInt(req.params.clientUserId);

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }
    if (isNaN(clientUserId)) {
      return res.status(400).json({ error: "Invalid client id" });
    }
    // confirm an active relationship exists, and load the client user inline
    const relationship = await ClientCoachRelationship.findOne({
      where: {
        coach_user_id: coachUserId,
        client_user_id: clientUserId,
        status: "active",
      },
      include: [
        {
          model: User,
          as: "client",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
      ],
    });

    if (!relationship) {
      return res.status(403).json({
        error: "You are not actively coaching this client",
      });
    }
    // Attach for downstream handlers - saves them re-querying
    req.client = relationship.client;
    req.relationship = relationship;
    next();
  } catch (error) {
    console.error("requireActiveCoachRelationship error:", error);
    res.status(500).json({ error: error.message });
  }
}
module.exports = requireActiveCoachRelationship;
