const { Client } = require("../models")

module.exports.submit_client_survey = async (req, res) => {
  try {
    // Who is making the request (from JWT middleware)
    const user_id = req.user.user_id

    // What did they send
    const {
      goal,
      typeWorkout,
      dietPreference,
      currentActivity,
      coachHelp,
      nutritionistHelp,
      workoutDay,
    } = req.body

    // Find their client record
    const client = await Client.findByPk(user_id)
    if (!client) {
      return res.status(404).json({ error: "Client not found!" })
    }

    const parsedWorkoutDay =
      workoutDay !== undefined && workoutDay !== null && workoutDay !== ""
        ? Number.parseInt(workoutDay, 10)
        : null

    if (parsedWorkoutDay !== null && Number.isNaN(parsedWorkoutDay)) {
      return res.status(400).json({ error: "workoutDay must be a number." })
    }

    // Update the record with survey answers
    await client.update({
      goal,
      type_workout: typeWorkout,
      diet_preference: dietPreference,
      current_activity: currentActivity,
      coach_help: coachHelp,
      nutritionist_help: nutritionistHelp,
      workout_day: parsedWorkoutDay,
      survey_completed: true,
    })

    // Send success response
    const updatedClient = await Client.findByPk(user_id)

    return res.status(201).json({
      message: "Survey submitted successfully!",
      client: updatedClient,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
