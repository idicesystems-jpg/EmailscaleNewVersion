export const impersonationMiddleware = async (req, res, next) => {
  const adminId = req.user?.id; // from JWT or session

  if (adminId) {
    const [rows] = await db.query(
      "SELECT impersonated_user_id, impersonated_email FROM impersonations WHERE admin_id = ? AND active = TRUE LIMIT 1",
      [adminId]
    );
    if (rows.length > 0) {
      req.impersonatedUser = {
        id: rows[0].impersonated_user_id,
        email: rows[0].impersonated_email,
      };
    }
  }

  next();
};
