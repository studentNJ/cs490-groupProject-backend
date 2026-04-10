// models/message.js
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "Message",
    {
      message_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      from_id: { type: DataTypes.INTEGER, allowNull: false },
      to_id: { type: DataTypes.INTEGER, allowNull: false },
      message_content: { type: DataTypes.TEXT, allowNull: false },
      message_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "text",
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      read_at: { type: DataTypes.DATE, allowNull: true },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "message",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }
  );

  Message.associate = (models) => {
    Message.belongsTo(models.User, { as: "sender", foreignKey: "from_id" });
    Message.belongsTo(models.User, { as: "receiver", foreignKey: "to_id" });
  };

  return Message;
};
