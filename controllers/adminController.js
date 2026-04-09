const { Admin, Client, Coach, Nutritionist, User } = require("../models");

const roleModels = {
  admin: Admin,
  client: Client,
  coach: Coach,
  nutritionist: Nutritionist,
};

const userAttributes = {
  exclude: ["password_hash"],
};

const userIncludes = [
  { model: Client },
  { model: Coach },
  { model: Nutritionist },
  { model: Admin },
];

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);

  return {
    limit,
    offset: (page - 1) * limit,
    page,
  };
};

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return undefined;
};

const createRoleRecordIfMissing = async (userId, role) => {
  const RoleModel = roleModels[role];

  if (!RoleModel) return;

  const defaults = { user_id: userId };
  if (role === "coach" || role === "nutritionist") {
    defaults.is_approved = false;
  }

  await RoleModel.findOrCreate({
    where: { user_id: userId },
    defaults,
  });
};

const deleteRoleRecords = async (userId) => {
  await Promise.all(
    Object.values(roleModels).map((RoleModel) =>
      RoleModel.destroy({ where: { user_id: userId } })
    )
  );
};

module.exports.getAllUsers = async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const where = {};

    if (req.query.role) {
      where.role = req.query.role;
    }

    const isActive = parseBoolean(req.query.is_active);
    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: userAttributes,
      include: userIncludes,
      limit,
      offset,
      order: [["user_id", "ASC"]],
    });

    res.status(200).json({
      users: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: userAttributes,
      include: userIncludes,
    });

    if (!user) return res.status(404).json({ message: "User not found!" });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.setUserStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== "boolean") {
      return res.status(400).json({ message: "is_active must be a boolean." });
    }

    if (Number(req.params.id) === req.user.user_id) {
      return res.status(403).json({ message: "Admins cannot change their own active status." });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found!" });

    await user.update({ is_active });

    const updatedUser = await User.findByPk(user.user_id, {
      attributes: userAttributes,
      include: userIncludes,
    });

    res.status(200).json({ message: "User status updated.", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!roleModels[role]) {
      return res.status(400).json({ message: "Invalid role." });
    }

    if (Number(req.params.id) === req.user.user_id) {
      return res.status(403).json({ message: "Admins cannot change their own role." });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found!" });

    await user.update({ role });
    await createRoleRecordIfMissing(user.user_id, role);

    const updatedUser = await User.findByPk(user.user_id, {
      attributes: userAttributes,
      include: userIncludes,
    });

    res.status(200).json({ message: "User role updated.", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.approveRegistration = async (req, res) => {
  try {
    const { approved } = req.body;
    if (typeof approved !== "boolean") {
      return res.status(400).json({ message: "approved must be a boolean." });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found!" });

    if (user.role !== "coach" && user.role !== "nutritionist") {
      return res.status(400).json({ message: "Approval only applies to coach or nutritionist accounts." });
    }

    const RoleModel = roleModels[user.role];
    const roleRecord = await RoleModel.findByPk(user.user_id);
    if (!roleRecord) {
      return res.status(404).json({ message: "Role record not found!" });
    }

    await roleRecord.update({ is_approved: approved });
    res.status(200).json({ message: "Approval status updated." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.user_id) {
      return res.status(403).json({ message: "Admins cannot delete their own account." });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found!" });

    await deleteRoleRecords(user.user_id);
    await user.destroy();

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.getStats = async (_req, res) => {
  try {
    const [totalUsers, activeUsers, inactiveUsers, roleCounts, pendingCoaches, pendingNutritionists] =
      await Promise.all([
        User.count(),
        User.count({ where: { is_active: true } }),
        User.count({ where: { is_active: false } }),
        User.findAll({
          attributes: ["role", [User.sequelize.fn("COUNT", User.sequelize.col("role")), "count"]],
          group: ["role"],
          raw: true,
        }),
        Coach.count({ where: { is_approved: false } }),
        Nutritionist.count({ where: { is_approved: false } }),
      ]);

    const usersByRole = roleCounts.reduce((accumulator, row) => {
      accumulator[row.role] = Number(row.count);
      return accumulator;
    }, {});

    res.status(200).json({
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      users_by_role: usersByRole,
      pending_approvals: pendingCoaches + pendingNutritionists,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
    ]);

    res.status(200).json({ pending: [...coaches, ...nutritionists] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};