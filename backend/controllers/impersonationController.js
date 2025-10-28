const Impersonation = require('../models/Impersonation');

// Start impersonation
const startImpersonation = async (req, res) => {
  const { adminId, userId, userEmail } = req.body;

  try {
    // Deactivate previous impersonations by this admin
    await Impersonation.update(
      { active: false },
      { where: { admin_id: adminId } }
    );

    // Create new impersonation entry
    await Impersonation.create({
      admin_id: adminId,
      impersonated_user_id: userId,
      impersonated_email: userEmail,
      active: true,
      started_at: new Date(),
    });

    res.status(200).json({ success: true, message: 'Impersonation started successfully' });
  } catch (error) {
    console.error('Error starting impersonation:', error);
    res.status(500).json({ error: 'Failed to start impersonation' });
  }
};

// Stop impersonation
const stopImpersonation = async (req, res) => {
  const { adminId } = req.body;

  try {
    await Impersonation.update(
      { active: false, ended_at: new Date() },
      { where: { admin_id: adminId } }
    );
    res.status(200).json({ success: true, message: 'Impersonation stopped successfully' });
  } catch (error) {
    console.error('Error stopping impersonation:', error);
    res.status(500).json({ error: 'Failed to stop impersonation' });
  }
};

// Get active impersonation
const getActiveImpersonation = async (req, res) => {
  try {
    const record = await Impersonation.findOne({
      where: {
        admin_id: req.params.adminId,
        active: true,
      },
      attributes: ['impersonated_user_id', 'impersonated_email'],
    });

    res.status(200).json(record || null);
  } catch (error) {
    console.error('Error fetching active impersonation:', error);
    res.status(500).json({ error: 'Failed to fetch active impersonation' });
  }
};
module.exports = {
  startImpersonation,
  stopImpersonation,
  getActiveImpersonation,
};