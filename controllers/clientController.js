const {
  User,
  Client,
  ClientCoachRelationship,
  Coach,
  Workout,
  AssignedWorkout,
  Exercise,
} = require("../models");
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
      where: {
        client_user_id: clientUserId,
        status: "active",
      },
    });

    if (!active) {
      return res
        .status(404)
        .json({ error: "You don't have an active coach to unhire" });
    }

    active.status = "inactive";
    active.end_date = new Date().toISOString().split("T")[0];
    await active.save();

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

    return res.json({ assignment });
  } catch (error) {
    console.error("complete_assignment error:", error);
    res.status(500).json({ error: error.message });
  }
};
