module.exports = (sequelize, DataTypes) => {
  const AdminAuditLog = sequelize.define(
    "AdminAuditLog",
    {
      audit_log_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      actor_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      target_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "admin_audit_logs",
      underscored: true,
    },
  )

  AdminAuditLog.associate = (models) => {
    AdminAuditLog.belongsTo(models.User, {
      as: "actor",
      foreignKey: "actor_user_id",
    })

    AdminAuditLog.belongsTo(models.User, {
      as: "target",
      foreignKey: "target_user_id",
    })
  }

  return AdminAuditLog
}
