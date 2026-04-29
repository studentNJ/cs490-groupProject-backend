// ─── middleware/requireRole.js ────────────────────────────────────────────────
// Updated to support active role (e.g., for role-switching via X-Active-Role header)
// Usage: router.get('/client-only', auth, requireRole('client'), controller)
//        router.get('/coach-only', auth, requireRole('coach', 'admin'), controller)

module.exports =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated." });

    // Check active role first (supports role-switching), fallback to base role
    const activeRole = req.headers["x-active-role"] || req.user.role;

    if (!allowedRoles.includes(activeRole))
      return res.status(403).json({ message: "Access denied." });

    next();
  };
