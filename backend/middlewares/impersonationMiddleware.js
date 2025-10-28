const Impersonation  = require('../models/Impersonation');

const impersonationMiddleware = async (req, res, next) => {
  try {
    const adminId = req.user?.id; // Extract admin ID from token/session

    if (adminId) {
      const impersonation = await Impersonation.findOne({
        where: {
          admin_id: adminId,
          active: true,
        },
        attributes: ["impersonated_user_id", "impersonated_email"],
      });

      if (impersonation) {
        req.impersonatedUser = {
          id: impersonation.impersonated_user_id,
          email: impersonation.impersonated_email,
        };
      }
    }

    next();
  } catch (error) {
    console.error("Impersonation middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = impersonationMiddleware;