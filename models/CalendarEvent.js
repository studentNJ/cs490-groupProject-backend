"use strict"

module.exports = (sequelize, DataTypes) => {
  const CalendarEvent = sequelize.define(
    "CalendarEvent",
    {
      calendar_event_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      text: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "#6ca6ff",
      },
    },
    {
      tableName: "calendar_event",
      underscored: true,
      timestamps: false,
    }
  )

  CalendarEvent.associate = (models) => {
    CalendarEvent.belongsTo(models.User, { foreignKey: "user_id" })
  }

  return CalendarEvent
}
