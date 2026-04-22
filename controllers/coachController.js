const {
  User,
  Coach,
  Client,
  ClientCoachRelationship,
  Subscription,
} = require("../models");
const { Op, where } = require("sequelize");
const { stat } = require("fs");

// /api/coaches - public browse for clients
module.exports.browse_coaches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const coaches = await User.findAndCountAll({
      where: { role: "coach", is_active: true },
      attributes: ["user_id", "first_name", "last_name", "profile_pic"],
      include: [
        {
          model: Coach,
          required: true,
          attributes: [
            "bio",
            "specialization",
            "price",
            "experience_years",
            "is_verified",
          ],
        },
      ],
      limit,
      offset,
      order: [["user_id", "ASC"]],
    });

    return res.json({
      totalItems: coaches.count,
      totalPages: Math.ceil(coaches.count / limit),
      currentPage: page,
      data: coaches.rows,
    });
  } catch (error) {
    console.error("brose_coaches error: ", error);
    res.status(500).json({ error: error.message });
  }
};

// api/coaches/:coachUserId - coach detail, this shows the detail model when a client clicks a coach card.
module.exports.get_coach = async (req, res) => {
  try {
    const coachUserId = parseInt(req.params.coachUserId);

    if (isNaN(coachUserId)) {
      return res.status(400).json({ error: "Invalid coach id!" });
    }

    const coach = await User.findOne({
      where: { user_id: coachUserId, role: "coach", is_active: true },
      attributes: ["user_id", "first_name", "last_name", "profile_pic"],
      include: [
        {
          model: Coach,
          required: true,
          attributes: [
            "bio",
            "specialization",
            "price",
            "experience_years",
            "is_verified",
          ],
        },
      ],
    });
    if (!coach) {
      return res.status(404).json({ error: "Coach not found" });
    }

    return res.json(coach);
  } catch (error) {
    console.error("get_coach_error:", error);
    res.status(500).json({ error: error.message });
  }
};

// api/coaches/:coachUserId/request - client request a coach
module.exports.request_coach = async (req, res) => {
  try {
    const coachUserId = parseInt(req.params.coachUserId);
    const clientUserId = req.user.user_id;

    if (isNaN(coachUserId)) {
      return res.status(400).json({ error: "Invalid coach id" });
    }

    // Rule 2: caller must be a client
    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "client") {
      return res
        .status(403)
        .json({ error: "Only clients can request coaches" });
    }

    // Rule 3: coach must exist + be valid
    const coach = await User.findOne({
      where: {
        user_id: coachUserId,
        role: "coach",
        is_active: true,
      },
      include: [{ model: Coach, required: true }],
    });

    if (!coach) {
      return res.status(404).json({ error: "Coach not found" });
    }
    // Rule 4: client can't already have a pending OR active relationship
    const existing = await ClientCoachRelationship.findOne({
      where: {
        client_user_id: clientUserId,
        status: { [Op.in]: ["pending", "active"] },
      },
    });

    if (existing) {
      return res.status(409).json({
        error:
          existing.status === "pending"
            ? "You already have a pending request. Cancel it before requesting another coach."
            : "You alrady have an active coach. Unhire them first.",
        current_coach_user_id: existing.coach_user_id,
        current_status: existing.status,
      });
    }
    // Ensure this user has a client row (supports coaches acting as clients)
    await Client.findOrCreate({
      where: { user_id: clientUserId },
      defaults: { user_id: clientUserId },
    });

    // Rule 5: create the pending request
    const relationship = await ClientCoachRelationship.create({
      client_user_id: clientUserId,
      coach_user_id: coachUserId,
      status: "pending",
    });

    return res.status(201).json({
      message: "Request sent. Awaiting coach approval.",
      relationship: {
        id: relationship.client_coach_relationship_id,
        coach_user_id: relationship.coach_user_id,
        status: relationship.status,
        requested_at: relationship.requested_at,
      },
    });
  } catch (error) {
    console.error("request_coach error: ", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.cancel_request = async (req, res) => {
  try {
    const clientUserId = req.user.user_id;
    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "client") {
      return res
        .status(403)
        .json({ error: "Only clients can cancel requests." });
    }

    const pending = await ClientCoachRelationship.findOne({
      where: {
        client_user_id: clientUserId,
        status: "pending",
      },
    });

    if (!pending) {
      return res.status(404).json({ error: "No pending request to cancel!" });
    }

    await pending.destroy();

    return res.status(204).send();
  } catch (error) {
    console.error("cancel_request error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.get_my_coach = async (req, res) => {
  try {
    const clientUserId = req.user.user_id;

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "client") {
      return res
        .status(403)
        .json({ error: "Only clients can request coaches" });
    }

    const relationship = await ClientCoachRelationship.findOne({
      where: {
        client_user_id: clientUserId,
        status: { [Op.in]: ["pending", "active"] },
      },
      include: [
        {
          model: User,
          as: "coach",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
          include: [
            {
              model: Coach,
              required: true,
              attributes: [
                "bio",
                "specialization",
                "price",
                "experience_years",
                "is_verified",
              ],
            },
          ],
        },
      ],
    });

    if (!relationship) {
      return res.json({ state: "none", coach: null });
    }

    const coachUser = relationship.coach;
    const coachProfile = coachUser.Coach;

    return res.json({
      state: relationship.status,
      relationship_id: relationship.client_coach_relationship_id,
      requested_at: relationship.requested_at,
      responded_at: relationship.responded_at,
      coach: {
        user_id: coachUser.user_id,
        first_name: coachUser.first_name,
        last_name: coachUser.last_name,
        profile_pic: coachUser.profile_pic,
        bio: coachProfile.bio,
        specialization: coachProfile.specialization,
        price: coachProfile.price,
        experience_years: coachProfile.experience_years,
        is_verified: coachProfile.is_verified,
      },
    });
  } catch (error) {
    console.error("get_my_coach error", error);
    res.status(500).json({ error: error.message });
  }
};

// /api/coach/requests - return the list of clients who've requested this coach and are waiting for approval
module.exports.get_pending_requests = async (req, res) => {
  try {
    const coachUserId = req.user.user_id;

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    const requests = await ClientCoachRelationship.findAll({
      where: {
        coach_user_id: coachUserId,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "client",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
          include: [
            {
              model: Client,
              attributes: [
                "goal",
                "type_workout",
                "diet_preference",
                "current_activity",
                "coach_help",
                "workout_day",
                "height",
                "weight",
                "goal_weight",
              ],
            },
          ],
        },
      ],
      order: [["requested_at", "ASC"]], // oldest first
    });

    const data = requests.map((r) => {
      const clientUser = r.client;
      const clientProfile = clientUser?.Client;

      return {
        relationship_id: r.client_coach_relationship_id,
        requested_at: r.requested_at,
        client: {
          user_id: clientUser.user_id,
          first_name: clientUser.first_name,
          last_name: clientUser.last_name,
          profile_pic: clientUser.profile_pic,
          // survey data — might all be null if client skipped survey
          goal: clientProfile?.goal || null,
          type_workout: clientProfile?.type_workout || null,
          diet_preference: clientProfile?.diet_preference || null,
          current_activity: clientProfile?.current_activity || null,
          coach_help: clientProfile?.coach_help || null,
          workout_day: clientProfile?.workout_day || null,
          height: clientProfile?.height || null,
          weight: clientProfile?.weight || null,
          goal_weight: clientProfile?.goal_weight || null,
        },
      };
    });
    return res.json({
      totalItems: data.length,
      data,
    });
  } catch (error) {
    console.error("get_pending_requests error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.approve_request = async (req, res) => {
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

    const relationship = await ClientCoachRelationship.findOne({
      where: {
        coach_user_id: coachUserId,
        client_user_id: clientUserId,
        status: "pending",
      },
    });
    if (!relationship) {
      return res
        .status(404)
        .json({ error: "No pending request from this client" });
    }
    const conflict = await ClientCoachRelationship.findOne({
      where: {
        client_user_id: clientUserId,
        status: "active",
      },
    });
    if (conflict) {
      return res.status(409).json({
        error: "This client already has an active coach.",
      });
    }

    const now = new Date();
    relationship.status = "active";
    relationship.responded_at = now;
    relationship.start_date = now.toISOString().split("T")[0];
    await relationship.save();

    return res.json({
      message: "Request approved",
      relationship: {
        id: relationship.client_coach_relationship_id,
        client_user_id: relationship.client_user_id,
        status: relationship.status,
        start_date: relationship.start_date,
        responded_at: relationship.responded_at,
      },
    });
  } catch (error) {
    console.error("approve_request error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.reject_request = async (req, res) => {
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
    const relationship = await ClientCoachRelationship.findOne({
      where: {
        coach_user_id: coachUserId,
        client_user_id: clientUserId,
        status: "pending",
      },
    });
    if (!relationship) {
      return res
        .status(404)
        .json({ error: "No pending request from this client." });
    }
    await relationship.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error("reject_request error:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/client/my-coach — client ends their active coaching relationship
module.exports.unhire_coach = async (req, res) => {
  const transaction = await ClientCoachRelationship.sequelize.transaction();

  try {
    const clientUserId = req.user.user_id;

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "client") {
      return res.status(403).json({ error: "Clients only" });
    }

    const active = await ClientCoachRelationship.findOne({
      where: {
        client_user_id: clientUserId,
        status: "active",
      },
      transaction,
    });

    if (!active) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "You don't have an active coach to unhire" });
    }

    active.status = "inactive";
    active.end_date = new Date().toISOString().split("T")[0];
    await active.save({ transaction });

    await Subscription.update(
      {
        status: "cancelled",
        cancelled_at: new Date(),
      },
      {
        where: {
          client_id: clientUserId,
          coach_id: active.coach_user_id,
          status: "active",
        },
        transaction,
      },
    );

    await transaction.commit();

    return res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error("unhire_coach error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/coach/clients — list active clients for this coach
module.exports.get_active_clients = async (req, res) => {
  try {
    const coachUserId = req.user.user_id;

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    const relationships = await ClientCoachRelationship.findAll({
      where: {
        coach_user_id: coachUserId,
        status: "active",
      },
      include: [
        {
          model: User,
          as: "client",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
          include: [
            {
              model: Client,
              attributes: [
                "goal",
                "type_workout",
                "current_activity",
                "height",
                "weight",
                "goal_weight",
              ],
            },
          ],
        },
      ],
      order: [["start_date", "DESC"]],
    });

    const data = relationships.map((r) => {
      const clientUser = r.client;
      const clientProfile = clientUser?.Client;

      return {
        relationship_id: r.client_coach_relationship_id,
        start_date: r.start_date,
        user_id: clientUser.user_id,
        first_name: clientUser.first_name,
        last_name: clientUser.last_name,
        profile_pic: clientUser.profile_pic,
        goal: clientProfile?.goal || null,
        current_activity: clientProfile?.current_activity || null,
        height: clientProfile?.height || null,
        weight: clientProfile?.weight || null,
        goal_weight: clientProfile?.goal_weight || null,
      };
    });

    return res.json({
      totalItems: data.length,
      data,
    });
  } catch (error) {
    console.error("get_active_clients error:", error);
    res.status(500).json({ error: error.message });
  }
};
