const {
  User,
  Coach,
  Client,
  Workout,
  ClientCoachRelationship,
  Subscription,
  WorkoutLog,
  AssignedWorkout,
  CoachNote,
} = require("../models");

const { createNotification } = require("../services/notificationService");

const { Op, where } = require("sequelize");
const { stat } = require("fs");
const { profile } = require("console");

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
            "is_approved",
            "is_approved",
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
            "is_approved",
            "is_approved",
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
            : "You already have an active coach. Unhire them first.",
        current_coach_user_id: existing.coach_user_id,
        current_status: existing.status,
      });
    }

    // Ensure this user has a client row (supports coaches acting as clients)
    await Client.findOrCreate({
      where: { user_id: clientUserId },
      defaults: { user_id: clientUserId },
    });

    // Rule 5: create OR reactivate the request row
    // findOrCreate handles the unique constraint — if an inactive/rejected row
    // exists for (client, coach), we reuse and reactivate it instead of INSERT'ing
    const [relationship, created] = await ClientCoachRelationship.findOrCreate({
      where: {
        client_user_id: clientUserId,
        coach_user_id: coachUserId,
      },
      defaults: {
        status: "pending",
        requested_at: new Date(),
      },
    });

    if (!created) {
      // Row already existed (e.g., previously rejected or inactive) — reactivate
      await relationship.update({
        status: "pending",
        requested_at: new Date(),
        responded_at: null,
        start_date: null,
        end_date: null,
      });
    }

    try {
      await createNotification({
        recipient_user_id: coachUserId, // whatever variable holds the coach's id in this scope
        actor_user_id: req.user.user_id,
        for_role: "coach",
        type: "coach_request_received",
        link: "/dashboard",
        related_id: relationship.relationship_id, // adjust to actual variable name
        related_type: "client_coach_relationship",
      });
    } catch (e) {
      console.error("Notification (coach_request_received) failed:", e);
    }

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

    try {
      await createNotification({
        recipient_user_id: parseInt(req.params.clientUserId),
        actor_user_id: req.user.user_id,
        for_role: "client",
        type: "coach_request_approved",
        link: "/dashboard",
        related_id: relationship.relationship_id,
        related_type: "client_coach_relationship",
      });
    } catch (e) {
      console.error("Notification (coach_request_approved) failed:", e);
    }

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
    try {
        await createNotification({
          recipient_user_id: parseInt(req.params.clientUserId),
          actor_user_id: req.user.user_id,
          for_role: "client",
          type: "coach_request_rejected",
          link: "/dashboard",
          related_id: relationship.relationship_id,
          related_type: "client_coach_relationship",
        });
    } catch (e) {
      console.error("Notification (coach_request_rejected) failed:", e);
    } 
    
    return res.status(204).send();
  } catch (error) {
    console.error("reject_request error:", error);
    return res.status(500).json({ error: error.message });
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
    return res.status(500).json({ error: error.message });
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

// GET /api/coach/clients/:clientUserId — overview tab data
module.exports.get_client_detail = async (req, res) => {
  try {
    // Middleware already validated the relationship and attached req.client
    const clientUserId = req.client.user_id;

    // Fetch full client profile + survey data
    const clientUser = await User.findOne({
      where: { user_id: clientUserId },
      attributes: [
        "user_id",
        "first_name",
        "last_name",
        "profile_pic",
        "email",
      ],
      include: [
        {
          model: Client,
          attributes: [
            "height",
            "weight",
            "goal_weight",
            "goal",
            "type_workout",
            "diet_preference",
            "current_activity",
            "coach_help",
            "nutritionist_help",
            "workout_day",
            "survey_completed",
          ],
        },
      ],
    });

    if (!clientUser) {
      return res.status(404).json({ error: "Client not found" });
    }

    const clientProfile = clientUser.Client;
    return res.json({
      user_id: clientUser.user_id,
      first_name: clientUser.first_name,
      last_name: clientUser.last_name,
      profile_pic: clientUser.profile_pic,
      email: clientUser.email,
      relationship: {
        start_date: req.relationship.start_date,
        status: req.relationship.status,
      },
      profile: clientProfile
        ? {
            height: clientProfile.height,
            weight: clientProfile.weight,
            goal_weight: clientProfile.goal_weight,
            goal: clientProfile.goal,
            type_workout: clientProfile.type_workout,
            diet_preference: clientProfile.diet_preference,
            current_activity: clientProfile.current_activity,
            coach_help: clientProfile.coach_help,
            nutritionist_help: clientProfile.nutritionist_help,
            workout_day: clientProfile.workout_day,
            survey_completed: clientProfile.survey_completed,
          }
        : null,
    });
  } catch (error) {
    console.error("get_client_detail error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/coach/clients/:clientUserId/workouts/logs - reads workout_log entries for client, joined with workout info so the coach sees what the client did
module.exports.get_client_workout_logs = async (req, res) => {
  try {
    const clientUserId = req.client.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const logs = await WorkoutLog.findAndCountAll({
      where: { client_id: clientUserId },
      include: [
        {
          model: Workout,
          attributes: [
            "workout_id",
            "title",
            "description",
            "estimated_minutes",
          ],
        },
      ],
      order: [["date", "DESC"]],
      limit,
      offset,
    });

    return res.json({
      totalItems: logs.count,
      totalPages: Math.max(1, Math.ceil(logs.count / limit)),
      currentPage: page,
      data: logs.rows,
    });
  } catch (error) {
    console.error("get_client_workout_logs error", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/coach/clients/:clientUserId/workouts/assigned — assigned workouts for this client
module.exports.get_client_assigned_workouts = async (req, res) => {
  try {
    const clientUserId = req.client.user_id;
    const coachUserId = req.user.user_id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.page) || 20;
    const offset = (page - 1) * limit;

    const statusFilter = req.query.status;
    const validStatuses = ["assigned", "completed", "skipped"];
    const where = {
      coach_user_id: coachUserId,
      client_user_id: clientUserId,
    };
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
        },
      ],
      order: [
        ["status", "ASC"],
        ["assigned_at", "DESC"],
      ],
      limit,
      offset,
    });

    try {
      await createNotification({
        recipient_user_id: parseInt(req.params.clientUserId),
        actor_user_id: req.user.user_id,
        for_role: "client",
        type: "workout_assigned",
        link: "/dashboard",
        related_id: newAssignment.assigned_workout_id,
        related_type: "assigned_workout",
        context: { workout_title: workout.title }, // workout already loaded for ownership check
      });
    } catch (e) {
      console.error("Notification (workout_assigned) failed:", e);
    }
    return res.json({
      totalItems: assignments.count,
      totalPages: Math.max(1, Math.ceil(assignments.count / limit)),
      currentPage: page,
      data: assignments.rows,
    });
  } catch (error) {
    console.error("get_client_assigned_workouts error", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/coach/clients/:clientUserId/workouts/assign Coach assigns one of their own workouts to this client. This is the action endpoint — it creates a new assigned_workout row

module.exports.assign_workout = async (req, res) => {
  try {
    const clientUserId = req.client.user_id;
    const coachUserId = req.user.user_id;
    const { workout_id, due_date, coach_notes } = req.body;

    if (!workout_id) {
      return res.status(400).json({ error: "workout_id is required" });
    }

    // verify the workout exists and was created by this coach
    const workout = await Workout.findOne({
      where: {
        workout_id,
        created_by_user_id: coachUserId,
      },
    });

    if (!workout) {
      return res.status(404).json({
        error: "Workout not found or you don't own this workout",
      });
    }

    // Prevent duplicate active assignment of the same workout
    const existing = await AssignedWorkout.findOne({
      where: {
        coach_user_id: coachUserId,
        client_user_id: clientUserId,
        workout_id,
        status: "assigned",
      },
    });

    if (existing) {
      return res.status(409).json({
        error: "This workout is already assigned to this client",
        existing_assignment_id: existing.assigned_workout_id,
      });
    }

    // validate due_date format (YYYY-MM-DD)
    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return res.status(400).json({
        error: "due_date must be in YYYY-MM-DD format",
      });
    }
    const assignment = await AssignedWorkout.create({
      coach_user_id: coachUserId,
      client_user_id: clientUserId,
      workout_id,
      due_date: due_date || null,
      coach_notes: coach_notes || null,
    });

    return res.status(201).json({
      message: "Workout assigned successfully.",
      assignment: {
        assigned_workout_id: assignment.assigned_workout_id,
        workout_id: assignment.workout_id,
        workout_title: workout.title,
        due_date: assignment.due_date,
        coach_notes: assignment.coach_notes,
        status: assignment.status,
        assigned_at: assignment.assigned_at,
      },
    });
  } catch (error) {
    console.error("assign_workout error:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/coach/assignments/:assignmentId — coach unassigns a workout
module.exports.unassign_workout = async (req, res) => {
  try {
    const coachUserId = req.user.user_id;
    const assignmentId = parseInt(req.params.assignmentId);

    // Mode check - coach only
    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }

    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: "Invalid assignment id" });
    }

    // verify assignment exists AND belongs to this coach
    const assignment = await AssignedWorkout.dinfOne({
      where: {
        assinged_workout_id: assignmentId,
        coach_user_id: coachUserId,
      },
    });
    if (!assignment) {
      return res.status(404).json({
        error: "Assignment not found or you don't own this assignment",
      });
    }
    await assignment.destroy();

    return res.json({ message: "Assignment removed!" });
  } catch (error) {
    console.error("unassign_workout_error:", err);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/coach/clients/:clientUserId/notes — list all notes for this client
module.exports.list_client_notes = async (req, res) => {
  try {
    const clientUserId = req.client.user_id;
    const coachUserId = req.user.user_id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const notes = await CoachNote.findAndCountAll({
      where: {
        coach_user_id: coachUserId,
        client_user_id: clientUserId,
      },
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return res.json({
      totalItems: notes.count,
      totalPages: Math.max(1, Math.ceil(notes.count / limit)),
      currentPage: page,
      data: notes.rows,
    });
  } catch (error) {
    console.error("list_client_notes error:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/coach/clients/:clientUserId/notes — coach adds a note about this client
module.exports.create_client_note = async (req, res) => {
  try {
    const clientUserId = req.client.user_id;
    const coachUserId = req.user.user_id;
    const { note } = req.body;

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return res.status(400).json({ error: "Note text is required" });
    }

    if (note.length > 5000) {
      return res
        .status(400)
        .json({ error: "Note is too long(max 5000 characters)" });
    }

    const newNote = await CoachNote.create({
      coach_user_id: coachUserId,
      client_user_id: clientUserId,
      note: note.trim(),
    });

    return res.status(201).json({
      message: "Note created successfully.",
      note: newNote,
    });
  } catch (error) {
    console.error("create_client_note error:", error);
    res.status(500).json({ error: error.message });
  }
};
// PATCH /api/coach/notes/:noteId — coach edits a note they own
module.exports.update_note = async (req, res) => {
  try {
    const coachUserId = req.user.user_id;
    const noteId = parseInt(req.params.noteId);
    const { note } = req.body;

    // Mode check - coaches only
    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "coach") {
      return res.status(403).json({ error: "Coaches only" });
    }
    if (isNaN(noteId)) {
      return res.status(400).json({ error: "Invalid note id" });
    }
    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return res.status(400).json({ error: "Note text is required" });
    }
    if (note.length > 5000) {
      return res
        .status(400)
        .json({ error: "Note is too long (max 5000 character)" });
    }

    // Verify the note exists AND belongs to this coach
    const existingNote = await CoachNote.findOne({
      where: {
        coach_note_id: noteId,
        coach_user_id: coachUserId,
      },
    });

    if (!existingNote) {
      return res.status(400).json({
        error: "Note not foind or you don't own this note.",
      });
    }
    await existingNote.update({ note: note.trim() });

    return res.json({
      message: "Note updated",
      note: existingNote,
    });
  } catch (error) {
    console.error("udpate_note error: ", error);
    res.status(500).json({ eror: error.message });
  }
};

// DELETE /api/coach/notes/:noteId — coach deletes a note they own
module.exports.delete_note = async (req, res) => {
  try {
    const coachUserId = req.user.user_id;
    const noteId = parseInt(req.params.noteId);

    // Mode check
    const activeRole = req.headers["x-active-role"] || req.user.role;
    if (activeRole !== "coach") {
      return res.status(403).json({ error: "coaches only" });
    }
    if (isNaN(noteId)) {
      return res.status(400).json({ error: "Invalid note id" });
    }
    // Verify the note exists AND belongs to this coach
    const note = await CoachNote.findOne({
      where: {
        coach_note_id: noteId,
        coach_user_id: coachUserId,
      },
    });
    if (!note) {
      return res.status(404).json({
        error: "note not found or you don't own this note",
      });
    }
    await note.destroy();
    return res.json({ message: "Note deleted" });
  } catch (error) {
    console.error("delete_note error:", error);
    res.status(500).json({ error: error.message });
  }
};
