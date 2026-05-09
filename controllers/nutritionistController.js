const { Nutritionist, User, Client, ClientNutritionistRelationship } = require("../models");

const { createNotification } = require("../services/notificationService");
const { Op } = require("sequelize");

module.exports.get_nutritionist = async (req, res) => {
  try {
    const nutritionistUserId = parseInt(req.params.nutritionistUserId);
    if (isNaN(nutritionistUserId)) {
      return res.status(400).json({ error: "Invalid nutritionist id!" });
    }

    const nutritionist = await User.findOne({
      where: {
        user_id: nutritionistUserId,
        role: "nutritionist",
        is_active: true,
      },
      attributes: ["user_id", "first_name", "last_name", "profile_pic"],
      include: [
        {
          model: Nutritionist,
          required: true,
          attributes: ["price", "is_approved"],
        },
      ],
    });

    if (!nutritionist) {
      return res.status(404).json({ error: "Nutritionist not found" });
    }

    return res.json(nutritionist);
  } catch (error) {
    console.error("get_nutritionist error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.request_nutritionist = async (req, res) => {
  try {
    const nutritionistUserId = parseInt(req.params.nutritionistUserId);
    const clientUserId = req.user.user_id;

    if (isNaN(nutritionistUserId)) {
      return res.status(400).json({ error: "Invalid nutritionist id" });
    }

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "client") {
      return res
        .status(403)
        .json({ error: "Only clients can request nutritionists" });
    }

    const nutritionist = await User.findOne({
      where: {
        user_id: nutritionistUserId,
        role: "nutritionist",
        is_active: true,
      },
      include: [{ model: Nutritionist, required: true }],
    });

    if (!nutritionist) {
      return res.status(404).json({ error: "Nutritionist not found" });
    }

    const existing = await ClientNutritionistRelationship.findOne({
      where: {
        client_user_id: clientUserId,
        status: { [Op.in]: ["pending", "active"] },
      },
    });

    if (existing) {
      return res.status(409).json({
        error:
          existing.status === "pending"
            ? "You already have a pending nutritionist request."
            : "You already have an active nutritionist. Unhire them first.",
      });
    }

    await Client.findOrCreate({
      where: { user_id: clientUserId },
      defaults: { user_id: clientUserId },
    });

    const [relationship, created] =
      await ClientNutritionistRelationship.findOrCreate({
        where: {
          client_user_id: clientUserId,
          nutritionist_user_id: nutritionistUserId,
        },
        defaults: { status: "pending" },
      });

    if (!created) {
      await relationship.update({
        status: "pending",
        start_date: null,
        end_date: null,
      });
    }

    return res.status(201).json({
      message: "Request sent. Awaiting approval.",
    });
  } catch (error) {
    console.error("request_nutritionist error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.get_my_nutritionist = async (req, res) => {
  try {
    const clientUserId = req.user.user_id;

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "client") {
      return res.status(403).json({ error: "Clients only" });
    }

    const relationship = await ClientNutritionistRelationship.findOne({
      where: {
        client_user_id: clientUserId,
        status: { [Op.in]: ["pending", "active"] },
      },
      include: [
        {
          model: User,
          as: "nutritionist",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
      ],
    });

    if (!relationship) {
      return res.json({ state: "none", nutritionist: null });
    }

    return res.json({
      state: relationship.status,
      nutritionist: relationship.nutritionist,
    });
  } catch (error) {
    console.error("get_my_nutritionist error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.unhire_nutritionist = async (req, res) => {
  try {
    const clientUserId = req.user.user_id;

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "client") {
      return res.status(403).json({ error: "Clients only" });
    }

    const active = await ClientNutritionistRelationship.findOne({
      where: { client_user_id: clientUserId, status: "active" },
    });

    if (!active) {
      return res
        .status(404)
        .json({ error: "You don't have an active nutritionist to unhire" });
    }

    active.status = "inactive";
    active.end_date = new Date().toISOString().split("T")[0];
    await active.save();

    return res.status(204).send();
  } catch (error) {
    console.error("unhire_nutritionist error:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports.browse_nutritionists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const nutritionists = await User.findAndCountAll({
      where: { role: "nutritionist", is_active: true },
      attributes: ["user_id", "first_name", "last_name", "profile_pic"],
      include: [
        {
          model: Nutritionist,
          required: true,
          attributes: ["price", "is_approved"],
        },
      ],
      limit,
      offset,
      order: [["user_id", "ASC"]],
    });

    return res.json({
      totalItems: nutritionists.count,
      totalPages: Math.ceil(nutritionists.count / limit),
      currentPage: page,
      data: nutritionists.rows,
    });
  } catch (error) {
    console.error("browse_nutritionists error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.get_pending_requests = async (req, res) => {
  try {
    const nutritionistUserId = req.user.user_id;

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "nutritionist") {
      return res.status(403).json({ error: "Nutritionists only" });
    }

    const requests = await ClientNutritionistRelationship.findAll({
      where: {
        nutritionist_user_id: nutritionistUserId,
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
                "diet_preference",
                "current_activity",
                "nutritionist_help",
              ],
            },
          ],
        },
      ],
    });

    const data = requests.map((r) => {
      const clientUser = r.client;
      const clientProfile = clientUser?.Client;

      return {
        relationship_id: r.client_user_id,
        requested_at: null, // no requested_at column on this table
        client: {
          user_id: clientUser.user_id,
          first_name: clientUser.first_name,
          last_name: clientUser.last_name,
          profile_pic: clientUser.profile_pic,
          goal: clientProfile?.goal || null,
          diet_preference: clientProfile?.diet_preference || null,
          current_activity: clientProfile?.current_activity || null,
          nutritionist_help: clientProfile?.nutritionist_help || null,
        },
      };
    });

    return res.json({ totalItems: data.length, data });
  } catch (error) {
    console.error("get_pending_requests error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.approve_request = async (req, res) => {
  try {
    const nutritionistUserId = req.user.user_id;
    const clientUserId = parseInt(req.params.clientUserId);

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "nutritionist") {
      return res.status(403).json({ error: "Nutritionists only" });
    }
    if (isNaN(clientUserId)) {
      return res.status(400).json({ error: "Invalid client id" });
    }

    const relationship = await ClientNutritionistRelationship.findOne({
      where: {
        nutritionist_user_id: nutritionistUserId,
        client_user_id: clientUserId,
        status: "pending",
      },
    });

    if (!relationship) {
      return res
        .status(404)
        .json({ error: "No pending request from this client" });
    }

    const conflict = await ClientNutritionistRelationship.findOne({
      where: { client_user_id: clientUserId, status: "active" },
    });
    if (conflict) {
      return res
        .status(409)
        .json({ error: "This client already has an active nutritionist." });
    }

    relationship.status = "active";
    relationship.start_date = new Date().toISOString().split("T")[0];
    await relationship.save();

    try {
      await createNotification({
        recipient_user_id: clientUserId,
        actor_user_id: nutritionistUserId,
        for_role: "client",
        type: "nutritionist_request_approved",
        link: "/dashboard",
        related_id: clientUserId,
        related_type: "client_nutritionist_relationship",
      });
    } catch (e) {
      console.error("Notification (nutritionist_request_approved) failed:", e);
    }

    return res.json({ message: "Request approved" });
  } catch (error) {
    console.error("approve_request error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.reject_request = async (req, res) => {
  try {
    const nutritionistUserId = req.user.user_id;
    const clientUserId = parseInt(req.params.clientUserId);

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "nutritionist") {
      return res.status(403).json({ error: "Nutritionists only" });
    }
    if (isNaN(clientUserId)) {
      return res.status(400).json({ error: "Invalid client id" });
    }

    const relationship = await ClientNutritionistRelationship.findOne({
      where: {
        nutritionist_user_id: nutritionistUserId,
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

    try {
      await createNotification({
        recipient_user_id: clientUserId,
        actor_user_id: nutritionistUserId,
        for_role: "client",
        type: "nutritionist_request_rejected",
        link: "/dashboard",
        related_id: clientUserId,
        related_type: "client_nutritionist_relationship",
      });
    } catch (e) {
      console.error("Notification (nutritionist_request_rejected) failed:", e);
    }

    return res.status(204).send();
  } catch (error) {
    console.error("reject_request error:", error);
    return res.status(500).json({ error: error.message });
  }
};


module.exports.get_active_clients = async (req, res) => {
  try {
    const nutritionistUserId = req.user.user_id;

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "nutritionist") {
      return res.status(403).json({ error: "Nutritionists only" });
    }

    const relationships = await ClientNutritionistRelationship.findAll({
      where: {
        nutritionist_user_id: nutritionistUserId,
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
              attributes: ["goal", "diet_preference"],
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
        relationship_id: r.client_user_id,
        start_date: r.start_date,
        user_id: clientUser.user_id,
        first_name: clientUser.first_name,
        last_name: clientUser.last_name,
        profile_pic: clientUser.profile_pic,
        goal: clientProfile?.goal || null,
        diet_preference: clientProfile?.diet_preference || null,
      };
    });

    return res.json({ totalItems: data.length, data });
  } catch (error) {
    console.error("get_active_clients error:", error);
    res.status(500).json({ error: error.message });
  }
};


module.exports.drop_client = async (req, res) => {
  try {
    const nutritionistUserId = req.user.user_id;
    const clientUserId = parseInt(req.params.clientUserId);

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "nutritionist") {
      return res.status(403).json({ error: "Nutritionists only" });
    }
    if (isNaN(clientUserId)) {
      return res.status(400).json({ error: "Invalid client id" });
    }

    const active = await ClientNutritionistRelationship.findOne({
      where: {
        nutritionist_user_id: nutritionistUserId,
        client_user_id: clientUserId,
        status: "active",
      },
    });

    if (!active) {
      return res
        .status(404)
        .json({ error: "No active relationship with this client" });
    }

    active.status = "inactive";
    active.end_date = new Date().toISOString().split("T")[0];
    await active.save();

    try {
      await createNotification({
        recipient_user_id: clientUserId,
        actor_user_id: nutritionistUserId,
        for_role: "client",
        type: "nutritionist_dropped_client",
        link: "/dashboard",
        related_id: clientUserId,
        related_type: "client_nutritionist_relationship",
      });
    } catch (e) {
      console.error("Notification (nutritionist_dropped_client) failed:", e);
    }

    return res.status(204).send();
  } catch (error) {
    console.error("drop_client error:", error);
    return res.status(500).json({ error: error.message });
  }
};