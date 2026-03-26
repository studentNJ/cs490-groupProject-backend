// ─── middleware/requireRole.js ────────────────────────────────────────────────
// Usage: router.get('/admin/...', auth, requireRole('admin'), controller)
//        router.get('/coach/...', auth, requireRole('coach', 'admin'), controller)

module.exports =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated." });

    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ message: "Access denied." });

    next();
  };
