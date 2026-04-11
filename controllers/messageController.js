const auth = require("../middleware/authMiddleware");
const { Op } = require("sequelize");
const { canMessage } = require("../utils/messagingPermission");
const sequelize = require("../config/database");

const {
  Message,
  User,
  ClientCoachRelationship,
  ClientNutritionistRelationship,
} = require("../models");
const { getIO } = require("../socket");

module.exports.list_conversations = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const messages = await Message.findAll({
      where: {
        is_deleted: false,
        [Op.or]: [{ from_id: userId }, { to_id: userId }],
      },
      order: [["created_at", "DESC"]],
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
      ],
    });

    // Count unread messages grouped by sender (from_id), where I'm the recipient
    const unreadCounts = await Message.findAll({
      where: {
        to_id: userId,
        is_read: false,
        is_deleted: false,
      },
      attributes: [
        "from_id",
        [sequelize.fn("COUNT", sequelize.col("message_id")), "count"],
      ],
      group: ["from_id"],
      raw: true,
    });

    // Turn the result into a lookup map: { senderUserId: count }
    const unreadMap = {};
    for (const row of unreadCounts) {
      unreadMap[row.from_id] = parseInt(row.count, 10);
    }

    const map = new Map();
    for (const message of messages) {
      const otherUser =
        message.from_id === userId ? message.receiver : message.sender;
      const otherUserId = otherUser.user_id;

      if (!map.has(otherUserId)) {
        map.set(otherUserId, {
          id: otherUserId,
          name: `${otherUser.first_name} ${otherUser.last_name}`,
          preview: message.message_content,
          lastMessageAt: message.created_at,
          profilePic: otherUser.profile_pic,
          unreadCount: unreadMap[otherUserId] || 0,
        });
      }
    }

    const conversations = Array.from(map.values());
    res.status(200).json({ conversations });
  } catch (error) {
    console.error("list_conversations error:", error);
    res.status(500).json({ error: error.message });
  }
};
module.exports.fetch_message_history_for_person = async (req, res) => {
  /* 
        Fetch message history with one person. When a user clicks a conversation in the sidebar, the UI needs to load all the messages between them and that other user. 
    */
  try {
    // 1. Fetch the userId and otherUserId from the req
    const userId = req.user.user_id;
    const otherUserId = parseInt(req.params.otherUserId, 10);
    if (isNaN(otherUserId)) {
      return res.status(400).json({ error: "invalid other user id." });
    }
    // prevents messaging yourself
    if (otherUserId === userId) {
      return res
        .status(400)
        .json({ error: "Cannot fetch conversation with yourself" });
    }

    // 2. Fetch the messages of specific user with logged-in user that are not-deleted and oldest-to-newest order
    const messagesWithPerson = await Message.findAll({
      where: {
        is_deleted: false,
        [Op.or]: [
          { from_id: userId, to_id: otherUserId },
          { from_id: otherUserId, to_id: userId },
        ],
      },
      order: [["created_at", "ASC"]],
    });
    // 3. Update the messages as read and read_at to now
    await Message.update(
      { read_at: new Date(), is_read: true },
      {
        where: {
          from_id: otherUserId,
          to_id: userId,
          is_read: false,
        },
      }
    );
    // 4. Return the messages
    res.status(200).json({ messages: messagesWithPerson });
  } catch (error) {
    console.error("fetch_message_history_for_person error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.send_message = async (req, res) => {
  try {
    // Fetch the logged-in user and the receiver user from req
    const fromId = req.user.user_id;
    const { to_id, message_content } = req.body;

    // Validate input
    const toId = parseInt(to_id, 10);
    if (isNaN(toId)) {
      return res.status(400).json({ error: "Invalid recipient id" });
    }

    if (
      typeof message_content !== "string" ||
      message_content.trim().length === 0
    ) {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }
    if (message_content.length > 5000) {
      return res.status(400).json({ error: "Message too long" });
    }

    // Verify recipient exists
    const recipient = await User.findByPk(toId);
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    // Check permission
    const allowed = await canMessage(fromId, toId);
    if (!allowed) {
      return res.status(403).json({
        error: "You are not allowed to message this user",
      });
    }

    // Create the message
    const message = await Message.create({
      from_id: fromId,
      to_id: toId,
      message_content: message_content.trim(),
      message_type: "text",
      is_read: false,
      is_deleted: false,
    });
    // Broadcast the new message to both the sender and recipient
    const io = getIO();
    io.to(`user_${toId}`).emit("new_message", message);
    io.to(`user_${fromId}`).emit("new_message", message);

    console.log(
      `[emit] sending new_message to user_${toId} and user_${fromId}`
    );
    console.log(
      `[emit] rooms currently active:`,
      Array.from(io.sockets.adapter.rooms.keys())
    );

    res.status(201).json({ message });
  } catch (error) {
    console.error("send_message error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.list_messageable_contacts = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const role = req.user.role; // make sure JWT includes this

    let contacts = [];

    if (role === "client") {
      // Fetch coaches + nutritionists assigned to this client
      const [coachRels, nutRels] = await Promise.all([
        ClientCoachRelationship.findAll({
          where: { client_user_id: userId, status: "active" },
          include: [
            {
              model: User,
              as: "coach",
              attributes: [
                "user_id",
                "first_name",
                "last_name",
                "profile_pic",
                "role",
              ],
            },
          ],
        }),
        ClientNutritionistRelationship.findAll({
          where: { client_user_id: userId, status: "active" },
          include: [
            {
              model: User,
              as: "nutritionist",
              attributes: [
                "user_id",
                "first_name",
                "last_name",
                "profile_pic",
                "role",
              ],
            },
          ],
        }),
      ]);
      contacts = [
        ...coachRels.map((r) => r.coach),
        ...nutRels.map((r) => r.nutritionist),
      ];
    } else if (role === "coach") {
      const rels = await ClientCoachRelationship.findAll({
        where: { coach_user_id: userId, status: "active" },
        include: [
          {
            model: User,
            as: "client",
            attributes: [
              "user_id",
              "first_name",
              "last_name",
              "profile_pic",
              "role",
            ],
          },
        ],
      });
      contacts = rels.map((r) => r.client);
    } else if (role === "nutritionist") {
      const rels = await ClientNutritionistRelationship.findAll({
        where: { nutritionist_user_id: userId, status: "active" },
        include: [
          {
            model: User,
            as: "client",
            attributes: [
              "user_id",
              "first_name",
              "last_name",
              "profile_pic",
              "role",
            ],
          },
        ],
      });
      contacts = rels.map((r) => r.client);
    }

    res.status(200).json({ contacts });
  } catch (error) {
    console.error("list_messageable_contacts error:", error);
    res.status(500).json({ error: error.message });
  }
};
