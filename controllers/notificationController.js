const { Notification } = require("../models");
const { Op } = require("sequelize");

// GET /api/notifications?for_role=coach&page=1&limit=20
async function list_notifications(req, res) {
  try {
    const userId = req.user.user_id;
    const for_role =
      req.query.for_role || req.headers["x-active-role"] || "client";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows, count } = await Notification.findAndCountAll({
      where: { recipient_user_id: userId, for_role },
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return res.json({
      notifications: rows,
      page,
      limit,
      total: count,
      hasMore: offset + rows.length < count,
    });
  } catch (err) {
    console.error("list_notifications error:", err);
    return res.status(500).json({ error: "Failed to load notifications" });
  }
}

// GET /api/notifications/unread-count?for_role=coach
async function unread_count(req, res) {
  try {
    const userId = req.user.user_id;
    const for_role =
      req.query.for_role || req.headers["x-active-role"] || "client";

    const count = await Notification.count({
      where: { recipient_user_id: userId, for_role, is_read: false },
    });

    return res.json({ count });
  } catch (err) {
    console.error("unread_count error:", err);
    return res.status(500).json({ error: "Failed to load unread count" });
  }
}

// PATCH /api/notifications/:id/read
async function mark_read(req, res) {
  try {
    const userId = req.user.user_id;
    const id = parseInt(req.params.id);

    const notif = await Notification.findOne({
      where: { notification_id: id, recipient_user_id: userId },
    });
    if (!notif)
      return res.status(404).json({ error: "Notification not found" });

    if (!notif.is_read) {
      notif.is_read = true;
      notif.read_at = new Date();
      await notif.save();
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("mark_read error:", err);
    return res.status(500).json({ error: "Failed to mark as read" });
  }
}

// PATCH /api/notifications/read-all?for_role=coach
async function mark_all_read(req, res) {
  try {
    const userId = req.user.user_id;
    const for_role =
      req.query.for_role || req.headers["x-active-role"] || "client";

    const [updated] = await Notification.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          recipient_user_id: userId,
          for_role,
          is_read: false,
        },
      }
    );
    return res.json({ updated });
  } catch (err) {
    console.error("mark_all_read error:", err);
    return res.status(500).json({ error: "Failed to mark all as read" });
  }
}

// DELETE /api/notifications/:id
async function delete_notification(req, res) {
  try {
    const userId = req.user.user_id;
    const id = parseInt(req.params.id);

    const deleted = await Notification.destroy({
      where: { notification_id: id, recipient_user_id: userId },
    });
    if (!deleted)
      return res.status(404).json({ error: "Notification not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("delete_notification error:", err);
    return res.status(500).json({ error: "Failed to delete notification" });
  }
}

module.exports = {
  list_notifications,
  unread_count,
  mark_read,
  mark_all_read,
  delete_notification,
};
