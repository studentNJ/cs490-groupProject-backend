const bcrypt = require("bcrypt")
const { Op } = require("sequelize")
const {
  Admin,
  AdminAuditLog,
  Client,
  Coach,
  Nutritionist,
  User,
} = require("../models")

const roleModels = {
  admin: Admin,
  client: Client,
  coach: Coach,
  nutritionist: Nutritionist,
}

const userAttributes = {
  exclude: ["password_hash"],
}

const userIncludes = [
  { model: Client },
  { model: Coach },
  { model: Nutritionist },
  { model: Admin },
]

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1)
  const limit = Math.min(
    Math.max(Number.parseInt(query.limit, 10) || 20, 1),
    100,
  )

  return {
    limit,
    offset: (page - 1) * limit,
    page,
  }
}

const parseBoolean = (value) => {
  if (value === undefined) return undefined
  if (value === "true" || value === true) return true
  if (value === "false" || value === false) return false
  return undefined
}

const sanitizeUser = async (userId) => {
  return User.findByPk(userId, {
    attributes: userAttributes,
    include: userIncludes,
  })
}

const auditLogIncludes = [
  {
    model: User,
    as: "actor",
    attributes: ["user_id", "first_name", "last_name", "email", "role"],
  },
  {
    model: User,
    as: "target",
    attributes: ["user_id", "first_name", "last_name", "email", "role"],
  },
]

const createAuditLog = async ({
  actorUserId,
  targetUserId = null,
  action,
  metadata = null,
  transaction,
}) => {
  return AdminAuditLog.create(
    {
      actor_user_id: actorUserId,
      target_user_id: targetUserId,
      action,
      metadata,
    },
    { transaction },
  )
}

const createRoleRecordIfMissing = async (userId, role, transaction) => {
  const RoleModel = roleModels[role]

  if (!RoleModel) return

  const defaults = { user_id: userId }
  if (role === "coach" || role === "nutritionist") {
    defaults.is_approved = false
  }

  await RoleModel.findOrCreate({
    where: { user_id: userId },
    defaults,
    transaction,
  })
}

const deleteRoleRecords = async (userId, transaction) => {
  await Promise.all(
    Object.values(roleModels).map((RoleModel) =>
      RoleModel.destroy({ where: { user_id: userId }, transaction }),
    ),
  )
}

module.exports.getAllUsers = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query)
    const where = {}

    if (req.query.role) {
      where.role = req.query.role
    }

    const isActive = parseBoolean(req.query.is_active)
    if (isActive !== undefined) {
      where.is_active = isActive
    }

    if (req.query.search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${req.query.search}%` } },
        { last_name: { [Op.like]: `%${req.query.search}%` } },
        { email: { [Op.like]: `%${req.query.search}%` } },
        { username: { [Op.like]: `%${req.query.search}%` } },
      ]
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: userAttributes,
      include: userIncludes,
      limit,
      offset,
      order: [["user_id", "ASC"]],
    })

    res.status(200).json({
      users: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.getUserById = async (req, res) => {
  try {
    const user = await sanitizeUser(req.params.id)

    if (!user) return res.status(404).json({ message: "User not found!" })

    res.status(200).json({ user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.createAdmin = async (req, res) => {
  const transaction = await User.sequelize.transaction()

  try {
    const { first_name, last_name, username, email, password, phone } = req.body

    if (!first_name || !last_name || !username || !email || !password) {
      await transaction.rollback()
      return res.status(400).json({
        message:
          "first_name, last_name, username, email, and password are required.",
      })
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
      transaction,
    })

    if (existingUser) {
      await transaction.rollback()
      return res.status(409).json({
        message:
          existingUser.email === email
            ? "Email is already in use!"
            : "Username is already taken!",
      })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const user = await User.create(
      {
        first_name,
        last_name,
        username,
        email,
        password_hash,
        phone,
        role: "admin",
      },
      { transaction },
    )

    await Admin.create(
      {
        user_id: user.user_id,
      },
      { transaction },
    )

    await createAuditLog({
      actorUserId: req.user.user_id,
      targetUserId: user.user_id,
      action: "admin.create",
      metadata: {
        role: user.role,
        email: user.email,
      },
      transaction,
    })

    await transaction.commit()

    const createdUser = await sanitizeUser(user.user_id)

    res.status(201).json({
      message: "Admin created successfully.",
      user: createdUser,
    })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
}

module.exports.setUserStatus = async (req, res) => {
  const transaction = await User.sequelize.transaction()

  try {
    const { is_active } = req.body
    if (typeof is_active !== "boolean") {
      await transaction.rollback()
      return res.status(400).json({ message: "is_active must be a boolean." })
    }

    if (Number(req.params.id) === req.user.user_id) {
      await transaction.rollback()
      return res
        .status(403)
        .json({ message: "Admins cannot change their own active status." })
    }

    const user = await User.findByPk(req.params.id, { transaction })
    if (!user) {
      await transaction.rollback()
      return res.status(404).json({ message: "User not found!" })
    }

    await user.update({ is_active }, { transaction })

    await createAuditLog({
      actorUserId: req.user.user_id,
      targetUserId: user.user_id,
      action: is_active ? "user.activate" : "user.deactivate",
      metadata: {
        role: user.role,
      },
      transaction,
    })

    await transaction.commit()

    const updatedUser = await sanitizeUser(user.user_id)

    res.status(200).json({ message: "User status updated.", user: updatedUser })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
}

module.exports.changeUserRole = async (req, res) => {
  const transaction = await User.sequelize.transaction()

  try {
    const { role } = req.body
    if (!roleModels[role]) {
      await transaction.rollback()
      return res.status(400).json({ message: "Invalid role." })
    }

    if (Number(req.params.id) === req.user.user_id) {
      await transaction.rollback()
      return res
        .status(403)
        .json({ message: "Admins cannot change their own role." })
    }

    const user = await User.findByPk(req.params.id, { transaction })
    if (!user) {
      await transaction.rollback()
      return res.status(404).json({ message: "User not found!" })
    }

    if (user.role === role) {
      await transaction.rollback()
      return res.status(200).json({
        message: "User already has this role.",
        user: await sanitizeUser(user.user_id),
      })
    }

    const previousRole = user.role

    await user.update({ role }, { transaction })
    await createRoleRecordIfMissing(user.user_id, role, transaction)

    await createAuditLog({
      actorUserId: req.user.user_id,
      targetUserId: user.user_id,
      action: "user.role_change",
      metadata: {
        previous_role: previousRole,
        new_role: role,
      },
      transaction,
    })

    await transaction.commit()

    const updatedUser = await sanitizeUser(user.user_id)

    res.status(200).json({ message: "User role updated.", user: updatedUser })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
}

module.exports.approveRegistration = async (req, res) => {
  const transaction = await User.sequelize.transaction()

  try {
    const { approved } = req.body
    if (typeof approved !== "boolean") {
      await transaction.rollback()
      return res.status(400).json({ message: "approved must be a boolean." })
    }

    const user = await User.findByPk(req.params.id, { transaction })
    if (!user) {
      await transaction.rollback()
      return res.status(404).json({ message: "User not found!" })
    }

    if (user.role !== "coach" && user.role !== "nutritionist") {
      await transaction.rollback()
      return res
        .status(400)
        .json({
          message: "Approval only applies to coach or nutritionist accounts.",
        })
    }

    const RoleModel = roleModels[user.role]
    const roleRecord = await RoleModel.findByPk(user.user_id, { transaction })
    if (!roleRecord) {
      await transaction.rollback()
      return res.status(404).json({ message: "Role record not found!" })
    }

    await roleRecord.update({ is_approved: approved }, { transaction })

    await createAuditLog({
      actorUserId: req.user.user_id,
      targetUserId: user.user_id,
      action: approved ? "user.approve" : "user.unapprove",
      metadata: {
        role: user.role,
      },
      transaction,
    })

    await transaction.commit()

    res.status(200).json({ message: "Approval status updated." })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
}

module.exports.deleteUser = async (req, res) => {
  const transaction = await User.sequelize.transaction()

  try {
    if (Number(req.params.id) === req.user.user_id) {
      await transaction.rollback()
      return res
        .status(403)
        .json({ message: "Admins cannot delete their own account." })
    }

    const user = await User.findByPk(req.params.id, { transaction })
    if (!user) {
      await transaction.rollback()
      return res.status(404).json({ message: "User not found!" })
    }

    await createAuditLog({
      actorUserId: req.user.user_id,
      targetUserId: user.user_id,
      action: "user.delete",
      metadata: {
        email: user.email,
        role: user.role,
      },
      transaction,
    })

    await deleteRoleRecords(user.user_id, transaction)
    await user.destroy({ transaction })

    await transaction.commit()

    res.status(200).json({ message: "User deleted successfully." })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
}

module.exports.getAuditLogs = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query)
    const where = {}

    if (req.query.action) {
      where.action = req.query.action
    }

    const { count, rows } = await AdminAuditLog.findAndCountAll({
      where,
      include: auditLogIncludes,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    })

    res.status(200).json({
      logs: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.getUserAuditLogs = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["user_id"],
    })

    if (!user) {
      return res.status(404).json({ message: "User not found!" })
    }

    const { limit, offset, page } = parsePagination(req.query)
    const { count, rows } = await AdminAuditLog.findAndCountAll({
      where: {
        target_user_id: req.params.id,
      },
      include: auditLogIncludes,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    })

    res.status(200).json({
      logs: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.getStats = async (_req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleCounts,
      pendingCoaches,
      pendingNutritionists,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { is_active: true } }),
      User.count({ where: { is_active: false } }),
      User.findAll({
        attributes: [
          "role",
          [User.sequelize.fn("COUNT", User.sequelize.col("role")), "count"],
        ],
        group: ["role"],
        raw: true,
      }),
      Coach.count({ where: { is_approved: false } }),
      Nutritionist.count({ where: { is_approved: false } }),
    ])

    const usersByRole = roleCounts.reduce((accumulator, row) => {
      accumulator[row.role] = Number(row.count)
      return accumulator
    }, {})

    res.status(200).json({
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      users_by_role: usersByRole,
      pending_approvals: pendingCoaches + pendingNutritionists,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.getPendingApprovals = async (_req, res) => {
  try {
    const [coaches, nutritionists] = await Promise.all([
      User.findAll({
        where: { role: "coach" },
        attributes: userAttributes,
        include: [{ model: Coach, where: { is_approved: false } }],
        order: [["user_id", "ASC"]],
      }),
      User.findAll({
        where: { role: "nutritionist" },
        attributes: userAttributes,
        include: [{ model: Nutritionist, where: { is_approved: false } }],
        order: [["user_id", "ASC"]],
      }),
    ])

    res.status(200).json({ pending: [...coaches, ...nutritionists] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
