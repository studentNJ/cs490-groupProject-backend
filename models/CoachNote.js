module.exports = (sequelize, DataTypes) => {
  const CoachNote = sequelize.define(
    "CoachNote",
    {
      coach_note_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      coach_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      client_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "coach_note",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  CoachNote.associate = (models) => {
    CoachNote.belongsTo(models.User, {
      as: "coach",
      foreignKey: "coach_user_id",
    });
    CoachNote.belongsTo(models.User, {
      as: "client",
      foreignKey: "client_user_id",
    });
  };

  return CoachNote;
};
