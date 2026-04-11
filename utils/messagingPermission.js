const {
  ClientCoachRelationship,
  ClientNutritionistRelationship,
} = require("../models");
const { Op } = require("sequelize");

async function canMessage(senderId, recipientId) {
  if (senderId === recipientId) return false;

  const [coachRel, nutritionistRel] = await Promise.all([
    ClientCoachRelationship.findOne({
      where: {
        status: "active",
        [Op.or]: [
          { client_user_id: senderId, coach_user_id: recipientId },
          { client_user_id: recipientId, coach_user_id: senderId },
        ],
      },
    }),
    ClientNutritionistRelationship.findOne({
      where: {
        status: "active",
        [Op.or]: [
          { client_user_id: senderId, nutritionist_user_id: recipientId },
          { client_user_id: recipientId, nutritionist_user_id: senderId },
        ],
      },
    }),
  ]);

  return !!(coachRel || nutritionistRel);
}

module.exports = { canMessage };
