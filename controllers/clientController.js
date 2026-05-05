const {
  User,
  Client,
  ClientCoachRelationship,
  Coach,
  Workout,
  AssignedWorkout,
  Exercise,
} = require("../models");

const { createNotification } = require("../services/notificationService");

const { Op } = require("sequelize");

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
                "is_approved",
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
        is_approved: coachProfile.is_approved,
      },
    });
  } catch (error) {
    console.error("get_my_coach error", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/client/my-coach — client ends their active coaching relationship
module.exports.unhire_coach = async (req, res) => {
  try {
    const clientUserId = req.user.user_id;

    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "client") {
      return res.status(403).json({ error: "Clients only" });
    }

    const active = await ClientCoachRelationship.findOne({
      where: { client_user_id: clientUserId, status: "active" },
    });

    if (!active) {
      return res
        .status(404)
        .json({ error: "You don't have an active coach to unhire" });
    }

    active.status = "inactive";
    active.end_date = new Date().toISOString().split("T")[0];
    await active.save();

    // UC 6.6 — auto-cancel active subscription tied to this coach
    const { Subscription } = require("../models");
    const activeSub = await Subscription.findOne({
      where: {
        client_id: clientUserId,
        coach_id: active.coach_user_id,
        status: "active",
      },
    });

    if (activeSub) {
      await activeSub.update({
        status: "cancelled",
        cancelled_at: new Date(),
      });
    }

    try {
      await createNotification({
        recipient_user_id: coachUserId, // pull from the relationship row
        actor_user_id: req.user.user_id,
        for_role: "coach",
        type: "client_unhired",
        link: "/dashboard",
        related_id: relationship.relationship_id,
        related_type: "client_coach_relationship",
      });
    } catch (e) {
      console.error("Notification (client_unhired) failed:", e);
    }
    return res.status(204).send();
  } catch (error) {
    console.error("unhire_coach error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/client/my-assigned-workouts — workouts assigned to this client by their coach
module.exports.get_my_assigned_workouts = async (req, res) => {
  try {
    const clientUserId = req.user.user_id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const statusFilter = req.query.status;
    const validStatuses = ["assigned", "completed", "skipped"];
    const where = { client_user_id: clientUserId };
    if (statusFilter && validStatuses.includes(statusFilter)) {
      where.status = statusFilter;
    }

    const assignments = await AssignedWorkout.findAndCountAll({
      where,
      include: [
        {
          model: Workout,
          attributes: [
            "workout_id",
            "title",
            "description",
            "estimated_minutes",
          ],
          include: [
            {
              model: Exercise,
              through: { attributes: ["sets", "reps", "rest_seconds"] },
            },
          ],
        },
        {
          model: User,
          as: "coach",
          attributes: ["user_id", "first_name", "last_name", "profile_pic"],
        },
      ],
      order: [
        ["status", "ASC"],
        ["due_date", "ASC"],
        ["assigned_at", "DESC"],
      ],
      limit,
      offset,
    });

    return res.json({
      totalItems: assignments.count,
      totalPages: Math.max(1, Math.ceil(assignments.count / limit)),
      currentPage: page,
      data: assignments.rows,
    });
  } catch (err) {
    console.error("get_my_assigned_workouts error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.complete_assignment = async (req, res) => {
  try {
    const clientUserId = req.user.user_id;
    const assignmentId = parseInt(req.params.assignmentId);

    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignmnet ID" });
    }

    const assignment = await AssignedWorkout.findOne({
      where: {
        assigned_workout_id: assignmentId,
        client_user_id: clientUserId,
      },
    });
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    if (assignment.status === "completed") {
      return res.json({ message: "Already completed", assignment });
    }

    assignment.status = "completed";
    assignment.completed_at = new Date();
    await assignment.save();

    try {
      await createNotification({
        recipient_user_id: assignment.coach_user_id,
        actor_user_id: req.user.user_id,
        for_role: "coach",
        type: "workout_completed",
        link: `/coach/clients/${req.user.user_id}`,
        related_id: assignment.assigned_workout_id,
        related_type: "assigned_workout",
        context: {
          workout_title: assignment.Workout?.title || "their workout",
        },
      });
    } catch (e) {
      console.error("Notification (workout_completed) failed:", e);
    }

    return res.json({ assignment });
  } catch (error) {
    console.error("complete_assignment error:", error);
    res.status(500).json({ error: error.message });
  }
};

// client can accept assigned workout
module.exports.accept_assignment = async (req, res) => {
  try {
    const clientUserId = req.user.user_id;
    const assignmentId = parseInt(req.params.assignmentId);

    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment ID" });
    }

    const assignment = await AssignedWorkout.findOne({
      where: {
        assigned_workout_id: assignmentId,
        client_user_id: clientUserId,
        status: "assigned",
      },
      include: [{ model: Workout, attributes: ["title"] }],
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    await assignment.update({ 
      status: "accepted", 
      completed_at: new Date() });

    try {
      await createNotification({
        recipient_user_id: assignment.coach_user_id,
        actor_user_id: clientUserId,
        for_role: "coach",
        type: "workout_accepted",
        link: "/dashboard",
        related_id: assignment.assigned_workout_id,
        related_type: "assigned_workout",
        context: { workout_title: assignment.Workout?.title },
      });
    } catch (e) {
      console.error("Notification (workout_accepted) failed:", e);
    }

    return res.json({ message: "Workout accepted." });
  } catch (error) {
    console.error("accept_assignment error:", error);
    res.status(500).json({ error: error.message });
  }
};

// client can decline assigned workout
module.exports.decline_assignment = async (req, res) => {
  try {
    const clientUserId = req.user.user_id;
    const assignmentId = parseInt(req.params.assignmentId);
    const { decline_reason } = req.body;

    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment ID" });
    }

    if (!decline_reason || !decline_reason.trim()) {
      return res.status(400).json({ error: "decline_reason is required" });
    }

    const assignment = await AssignedWorkout.findOne({
      where: {
        assigned_workout_id: assignmentId,
        client_user_id: clientUserId,
        status: "assigned",
      },
      include: [{ model: Workout, attributes: ["title"] }],
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    await assignment.update({
      status: "declined",
      decline_reason: decline_reason.trim(),
    });

    try {
      await createNotification({
        recipient_user_id: assignment.coach_user_id,
        actor_user_id: clientUserId,
        for_role: "coach",
        type: "workout_declined",
        link: "/dashboard",
        related_id: assignment.assigned_workout_id,
        related_type: "assigned_workout",
        context: {
          workout_title: assignment.Workout?.title,
          decline_reason: decline_reason.trim(),
        },
      });
    } catch (e) {
      console.error("Notification (workout_declined) failed:", e);
    }

    return res.json({ message: "Workout declined." });
  } catch (error) {
    console.error("decline_assignment error:", error);
    res.status(500).json({ error: error.message });
  }
};
