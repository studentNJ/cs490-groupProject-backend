const express = require("express");
const router = express.Router();
const coachController = require("../controllers/coachController");
const auth = require("../middleware/authMiddleware");
const requireActiveCoachRelationship = require("../middleware/requireActiveCoachRelationship");

// Pending requests (coach-side)
router.get("/requests", auth, coachController.get_pending_requests);
router.post(
  "/requests/:clientUserId/approve",
  auth,
  coachController.approve_request
);
router.post(
  "/requests/:clientUserId/reject",
  auth,
  coachController.reject_request
);

// Active clients list (coach dashboard)
router.get("/clients", auth, coachController.get_active_clients);

// Client detail (Overview tab)
router.get(
  "/clients/:clientUserId",
  auth,
  requireActiveCoachRelationship,
  coachController.get_client_detail
);

// Workouts — read
router.get(
  "/clients/:clientUserId/workouts/logs",
  auth,
  requireActiveCoachRelationship,
  coachController.get_client_workout_logs
);
router.get(
  "/clients/:clientUserId/workouts/assigned",
  auth,
  requireActiveCoachRelationship,
  coachController.get_client_assigned_workouts
);

// Workouts — assign / unassign
router.post(
  "/clients/:clientUserId/workouts/assign",
  auth,
  requireActiveCoachRelationship,
  coachController.assign_workout
);
router.delete(
  "/assignments/:assignmentId",
  auth,
  coachController.unassign_workout
);

// Notes — list + create
router.get(
  "/clients/:clientUserId/notes",
  auth,
  requireActiveCoachRelationship,
  coachController.list_client_notes
);
router.post(
  "/clients/:clientUserId/notes",
  auth,
  requireActiveCoachRelationship,
  coachController.create_client_note
);

// Notes — edit + delete (use noteId, ownership checked in controller)
router.patch("/notes/:noteId", auth, coachController.update_note);
router.delete("/notes/:noteId", auth, coachController.delete_note);
router.delete("/clients/:clientUserId", auth, coachController.drop_client);

module.exports = router;
