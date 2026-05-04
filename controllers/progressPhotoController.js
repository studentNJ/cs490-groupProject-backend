const { ProgressPhoto, ClientCoachRelationship } = require("../models");
const { Op } = require("sequelize");
const { createNotification } = require("../services/notificationService");

// POST /api/photos
module.exports.upload_photo = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { image_data, caption, taken_date } = req.body;

    if (!image_data) {
      return res.status(400).json({ error: "image_data is required" });
    }

    if (typeof image_data !== "string" || image_data.length < 50) {
      return res.status(400).json({ error: "Invalid image data" });
    }

    if (taken_date && !/^\d{4}-\d{2}-\d{2}$/.test(taken_date)) {
      return res
        .status(400)
        .json({ error: "taken_date must be in YYYY-MM-DD format" });
    }

    const photo = await ProgressPhoto.create({
      user_id: userId,
      image_data,
      caption: caption || null,
      taken_date: taken_date || null,
    });

    // Notify coach if this client has an active coach
    try {
      const relationship = await ClientCoachRelationship.findOne({
        where: { client_user_id: userId, status: "active" },
      });

      if (relationship) {
        await createNotification({
          recipient_user_id: relationship.coach_user_id,
          actor_user_id: userId,
          for_role: "coach",
          type: "progress_photo_uploaded",
          link: `/coach/client/${userId}`,
          related_id: photo.photo_id,
          related_type: "progress_photo",
        });
      }
    } catch (e) {
      console.error("Notification (progress_photo_uploaded) failed:", e);
    }

    return res.status(201).json({
      photo_id: photo.photo_id,
      caption: photo.caption,
      taken_date: photo.taken_date,
      created_at: photo.created_at,
    });
  } catch (err) {
    console.error("upload_photo error:", err);
    return res.status(500).json({ error: err.message });
  }
};
// GET /api/photos
// Query params: page, limit, from_date, to_date
module.exports.list_photos = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const offset = (page - 1) * limit;

    const { from_date, to_date } = req.query;
    const where = { user_id: userId };
    const dateConditions = [];

    if (from_date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from_date)) {
        return res.status(400).json({ error: "from_date must be YYYY-MM-DD" });
      }
      dateConditions.push({
        [Op.or]: [
          { taken_date: { [Op.gte]: from_date } },
          {
            [Op.and]: [
              { taken_date: null },
              { created_at: { [Op.gte]: `${from_date} 00:00:00` } },
            ],
          },
        ],
      });
    }
    if (to_date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(to_date)) {
        return res.status(400).json({ error: "to_date must be YYYY-MM-DD" });
      }
      dateConditions.push({
        [Op.or]: [
          { taken_date: { [Op.lte]: to_date } },
          {
            [Op.and]: [
              { taken_date: null },
              { created_at: { [Op.lte]: `${to_date} 23:59:59` } },
            ],
          },
        ],
      });
    }
    if (dateConditions.length > 0) {
      where[Op.and] = dateConditions;
    }

    const result = await ProgressPhoto.findAndCountAll({
      where,
      order: [
        ["taken_date", "DESC"],
        ["created_at", "DESC"],
      ],
      limit,
      offset,
    });

    return res.json({
      data: result.rows,
      totalItems: result.count,
      totalPages: Math.max(1, Math.ceil(result.count / limit)),
      currentPage: page,
      limit,
    });
  } catch (err) {
    console.error("list_photos error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /api/photos/:photoId
module.exports.delete_photo = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const photoId = parseInt(req.params.photoId);

    if (isNaN(photoId)) {
      return res.status(400).json({ error: "Invalid photo id" });
    }

    const deleted = await ProgressPhoto.destroy({
      where: { photo_id: photoId, user_id: userId },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Photo not found" });
    }

    return res.json({ message: "Photo deleted" });
  } catch (err) {
    console.error("delete_photo error:", err);
    return res.status(500).json({ error: err.message });
  }
};
