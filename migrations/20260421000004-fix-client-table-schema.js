"use strict"

const ensureTableName = async (queryInterface) => {
  let hasClientTable = true
  let hasCapitalizedClientTable = true

  try {
    await queryInterface.describeTable("client")
  } catch (_error) {
    hasClientTable = false
  }

  try {
    await queryInterface.describeTable("Client")
  } catch (_error) {
    hasCapitalizedClientTable = false
  }

  if (!hasClientTable && hasCapitalizedClientTable) {
    await queryInterface.renameTable("Client", "client")
  }
}

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  const table = await queryInterface.describeTable(tableName)

  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition)
  }
}

const removeColumnIfPresent = async (queryInterface, tableName, columnName) => {
  const table = await queryInterface.describeTable(tableName)

  if (table[columnName]) {
    await queryInterface.removeColumn(tableName, columnName)
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await ensureTableName(queryInterface)

    await addColumnIfMissing(queryInterface, "client", "goal", {
      type: Sequelize.STRING,
      allowNull: true,
    })

    await addColumnIfMissing(queryInterface, "client", "type_workout", {
      type: Sequelize.STRING,
      allowNull: true,
    })

    await addColumnIfMissing(queryInterface, "client", "diet_preference", {
      type: Sequelize.STRING,
      allowNull: true,
    })

    await addColumnIfMissing(queryInterface, "client", "current_activity", {
      type: Sequelize.STRING,
      allowNull: true,
    })

    await addColumnIfMissing(queryInterface, "client", "coach_help", {
      type: Sequelize.STRING,
      allowNull: true,
    })

    await addColumnIfMissing(queryInterface, "client", "nutritionist_help", {
      type: Sequelize.STRING,
      allowNull: true,
    })

    await addColumnIfMissing(queryInterface, "client", "workout_day", {
      type: Sequelize.INTEGER,
      allowNull: true,
    })

    await addColumnIfMissing(queryInterface, "client", "survey_completed", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
  },

  async down(queryInterface) {
    await ensureTableName(queryInterface)

    await removeColumnIfPresent(queryInterface, "client", "survey_completed")
    await removeColumnIfPresent(queryInterface, "client", "workout_day")
    await removeColumnIfPresent(queryInterface, "client", "nutritionist_help")
    await removeColumnIfPresent(queryInterface, "client", "coach_help")
    await removeColumnIfPresent(queryInterface, "client", "current_activity")
    await removeColumnIfPresent(queryInterface, "client", "diet_preference")
    await removeColumnIfPresent(queryInterface, "client", "type_workout")
    await removeColumnIfPresent(queryInterface, "client", "goal")
  },
}