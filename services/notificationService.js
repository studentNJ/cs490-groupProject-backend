const { User, Notification } = require("../models");

const TEMPLATES = {
  coach_request_received: ({ actorName }) => ({
    title: "New coaching request",
    body: `${actorName} sent you a coaching request`,
  }),
  coach_request_approved: ({ actorName }) => ({
    title: "Coaching request accepted",
    body: `${actorName} accepted your coaching request.`,
  }),
  coach_request_rejected: ({ actorName }) => ({
    title: "Coaching request rejected",
    body: `${actorName} rejected your coaching request.`,
  }),
  workout_assigned: ({ actorName, context }) => ({
    title: "New workout assigned",
    body: `${actorName} assigned you "${context.workout_title}"`,
  }),
  workout_completed: ({ actorName, context }) => ({
    title: "Client completed workout",
    body: `${actorName} completed "${context.workout_title}"`,
  }),
  client_unhired: ({ actorName }) => ({
    title: "Client ended coaching",
    body: `${actorName} is no longer working with you.`,
  }),
  coach_dropped_client: ({ actorName }) => ({
    title: "Coaching relationship ended",
    body: `${actorName} ended your coaching relationship.`,
  }),
  progress_photo_uploaded: ({ actorName }) => ({
    title: "New progress photo",
    body: `${actorName} uploaded a new progress photo.`,
  }),
};

async function createNotification({
  recipient_user_id,
  actor_user_id = null,
  for_role,
  type,
  link = null,
  related_id = null,
  related_type = null,
  context = {},
}) {
  if (!TEMPLATES[type]) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  let actorName = "Someone";
  if (actor_user_id) {
    const actor = await User.findByPk(actor_user_id, {
      attributes: ["first_name"],
    });
    if (actor?.first_name) actorName = actor.first_name;
  }

  const { title, body } = TEMPLATES[type]({ actorName, context });

  return Notification.create({
    recipient_user_id,
    actor_user_id,
    for_role,
    type,
    title,
    body,
    link,
    related_id,
    related_type,
  });
}

module.exports = { createNotification };
