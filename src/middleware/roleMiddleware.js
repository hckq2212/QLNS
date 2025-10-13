// middleware to require one or more roles
export default function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role;
    // Allow admin to perform any action
    if (userRole === 'admin') {
      return next();
    }

    if (allowedRoles.includes(userRole)) {
      return next();
    }
  };
}
