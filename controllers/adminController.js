const bcrypt = require("bcrypt")
const { Op } = require("sequelize")
const {
  Admin,
  AdminAuditLog,
  Client,
  Coach,
  CoachReport,
  Exercise,
  Nutritionist,
  User,
  CoachCertification,
  CoachQualification
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

const coachReportIncludes = [
  {
    model: User,
    as: "reporter",
    attributes: ["user_id", "first_name", "last_name", "email", "role"],
  },
  {
    model: User,
    as: "coach",
    attributes: ["user_id", "first_name", "last_name", "email", "role"],
  },
  {
    model: User,
    as: "reviewedBy",
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

const sortUsersById = (users) => {
  return [...users].sort((leftUser, rightUser) => leftUser.user_id - rightUser.user_id)
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
      include: [
      { model: Client },
      { model: Coach, include: [{model: CoachCertification,},{model: CoachQualification,},],},
      { model: Nutritionist },
      { model: Admin },
    ],
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

    const updatedUser = await sanitizeUser(user.user_id)

    res.status(200).json({ message: "Approval status updated.", user: updatedUser })
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
    const { limit, offset, page } = parsePagination(_req.query)
    const requestedRole = _req.query.role
    const shouldLoadCoaches = !requestedRole || requestedRole === "coach"
    const shouldLoadNutritionists =
      !requestedRole || requestedRole === "nutritionist"

    const [coaches, nutritionists] = await Promise.all([
      shouldLoadCoaches
        ? User.findAll({
            where: { role: "coach" },
            attributes: userAttributes,
            include: [{ model: Coach, where: { is_approved: false },
            include: [{model: CoachCertification,},
              {model: CoachQualification,}
            ] }],
          })
        : Promise.resolve([]),
      shouldLoadNutritionists
        ? User.findAll({
            where: { role: "nutritionist" },
            attributes: userAttributes,
            include: [{ model: Nutritionist, where: { is_approved: false } }],
          })
        : Promise.resolve([]),
    ])

    const pending = sortUsersById([...coaches, ...nutritionists])

    res.status(200).json({
      pending: pending.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total: pending.length,
        totalPages: Math.ceil(pending.length / limit) || 1,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.getExercises = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query)
    const where = {}

    const isActive = parseBoolean(req.query.is_active)
    if (isActive !== undefined) {
      where.is_active = isActive
    }

    if (req.query.category) {
      where.category = req.query.category
    }

    if (req.query.equipment) {
      where.equipment = req.query.equipment
    }

    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { category: { [Op.like]: `%${req.query.search}%` } },
        { equipment: { [Op.like]: `%${req.query.search}%` } },
        { pirmary_muscles: { [Op.like]: `%${req.query.search}%` } },
      ]
    }

    const { count, rows } = await Exercise.findAndCountAll({
      where,
      order: [["exercise_id", "ASC"]],
      limit,
      offset,
    })

    res.status(200).json({
      exercises: rows,
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

module.exports.createExercise = async (req, res) => {
  const transaction = await User.sequelize.transaction()

  try {
    const {
      name,
      category,
      equipment,
      pirmary_muscles,
      instructions,
      video_url,
      image_url,
    } = req.body

    if (
      !name ||
      !category ||
      !equipment ||
      !pirmary_muscles ||
      !instructions ||
      !image_url
    ) {
      await transaction.rollback()
      return res.status(400).json({
        message:
          "name, category, equipment, pirmary_muscles, instructions, and image_url are required.",
      })
    }

    const exercise = await Exercise.create(
      {
        name,
        category,
        equipment,
        pirmary_muscles,
        instructions,
        video_url,
        image_url,
      },
      { transaction },
    )

    await createAuditLog({
      actorUserId: req.user.user_id,
      action: "exercise.create",
      metadata: {
        exercise_id: exercise.exercise_id,
        name: exercise.name,
      },
      transaction,
    })

    await transaction.commit()

    res.status(201).json({
      message: "Exercise created successfully.",
      exercise,
    })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
}

module.exports.updateExercise = async (req, res) => {
  const transaction = await User.sequelize.transaction()

  try {
    const exercise = await Exercise.findByPk(req.params.id, { transaction })

    if (!exercise) {
      await transaction.rollback()
      return res.status(404).json({ message: "Exercise not found!" })
    }

    const allowedFields = [
      "name",
      "category",
      "equipment",
      "pirmary_muscles",
      "instructions",
      "video_url",
      "image_url",
    ]

    const updates = allowedFields.reduce((accumulator, field) => {
      if (req.body[field] !== undefined) {
        accumulator[field] = req.body[field]
      }

      return accumulator
    }, {})

    if (Object.keys(updates).length === 0) {
      await transaction.rollback()
      return res.status(400).json({ message: "No exercise fields provided." })
    }

    await exercise.update(updates, { transaction })

    await createAuditLog({
      actorUserId: req.user.user_id,
      action: "exercise.update",
      metadata: {
        exercise_id: exercise.exercise_id,
        updated_fields: Object.keys(updates),
      },
      transaction,
    })

    await transaction.commit()

    res.status(200).json({
      message: "Exercise updated successfully.",
      exercise,
    })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
}

module.exports.deleteExercise = async (req, res) => {
  const transaction = await User.sequelize.transaction()

  try {
    const exercise = await Exercise.findByPk(req.params.id, { transaction })

    if (!exercise) {
      await transaction.rollback()
      return res.status(404).json({ message: "Exercise not found!" })
    }

    await createAuditLog({
      actorUserId: req.user.user_id,
      action: "exercise.deactivate",
      metadata: {
        exercise_id: exercise.exercise_id,
        name: exercise.name,
      },
      transaction,
    })

    await exercise.update({ is_active: false }, { transaction })

    await transaction.commit()

    res.status(200).json({
      message: "Exercise deactivated successfully.",
      exercise,
    })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
}

module.exports.reactivateExercise = async (req, res) => {
  const transaction = await User.sequelize.transaction()

  try {
    const exercise = await Exercise.findByPk(req.params.id, { transaction })

    if (!exercise) {
      await transaction.rollback()
      return res.status(404).json({ message: "Exercise not found!" })
    }

    await exercise.update({ is_active: true }, { transaction })

    await createAuditLog({
      actorUserId: req.user.user_id,
      action: "exercise.reactivate",
      metadata: {
        exercise_id: exercise.exercise_id,
        name: exercise.name,
      },
      transaction,
    })

    await transaction.commit()

    res.status(200).json({
      message: "Exercise reactivated successfully.",
      exercise,
    })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
}

module.exports.getCoachReports = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query)
    const where = {}

    if (req.query.status) {
      where.status = req.query.status
    }

    if (req.query.severity) {
      where.severity = req.query.severity
    }

    if (req.query.coach_user_id) {
      where.coach_user_id = req.query.coach_user_id
    }

    const { count, rows } = await CoachReport.findAndCountAll({
      where,
      include: coachReportIncludes,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    })

    res.status(200).json({
      reports: rows,
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

module.exports.getCoachReportById = async (req, res) => {
  try {
    const report = await CoachReport.findByPk(req.params.id, {
      include: coachReportIncludes,
    })

    if (!report) {
      return res.status(404).json({ message: "Coach report not found!" })
    }

    res.status(200).json({ report })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports.updateCoachReportStatus = async (req, res) => {
  const transaction = await User.sequelize.transaction()

  try {
    const { status, resolution_notes } = req.body
    const allowedStatuses = [
      "open",
      "under_review",
      "resolved",
      "dismissed",
      "escalated",
    ]

    if (!allowedStatuses.includes(status)) {
      await transaction.rollback()
      return res.status(400).json({ message: "Invalid report status." })
    }

    if (
      (status === "resolved" || status === "dismissed") &&
      (!resolution_notes || !String(resolution_notes).trim())
    ) {
      await transaction.rollback()
      return res.status(400).json({
        message: "resolution_notes is required when resolving or dismissing a report.",
      })
    }

    const report = await CoachReport.findByPk(req.params.id, { transaction })

    if (!report) {
      await transaction.rollback()
      return res.status(404).json({ message: "Coach report not found!" })
    }

    const updates = {
      status,
      admin_reviewed_by_user_id: req.user.user_id,
      resolution_notes: resolution_notes ?? report.resolution_notes,
      reviewed_at: new Date(),
    }

    if (status === "resolved" || status === "dismissed") {
      updates.resolved_at = new Date()
    }

    await report.update(updates, { transaction })

    await createAuditLog({
      actorUserId: req.user.user_id,
      targetUserId: report.coach_user_id,
      action:
        status === "resolved"
          ? "report.resolve"
          : status === "dismissed"
            ? "report.dismiss"
            : "report.status_change",
      metadata: {
        report_id: report.report_id,
        previous_status: report.previous("status"),
        new_status: status,
      },
      transaction,
    })

    await transaction.commit()

    const updatedReport = await CoachReport.findByPk(report.report_id, {
      include: coachReportIncludes,
    })

    res.status(200).json({
      message: "Coach report status updated.",
      report: updatedReport,
    })
  } catch (error) {
    await transaction.rollback()
    res.status(500).json({ error: error.message })
  }
}
