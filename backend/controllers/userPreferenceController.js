const UserPreference = require('../models/UserPreference');
const User = require('../models/User');


const checkOnboarding = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ status: false, message: "user_id is required" });
    }

    // Ensure user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Check if preferences exist
    let preference = await UserPreference.findOne({ where: { user_id } });

    if (!preference) {
      // Create a new record for first-time user
      preference = await UserPreference.create({
        user_id,
        onboarding_completed: false,
      });
      return res.json({
        status: true,
        onboarding_completed: false,
        message: "First-time user, onboarding created.",
      });
    }

    // Return current onboarding status
    return res.json({
      status: true,
      onboarding_completed: preference.onboarding_completed,
      message: preference.onboarding_completed
        ? "Onboarding already completed."
        : "Onboarding pending.",
    });
  } catch (error) {
    console.error("Error checking onboarding:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const completeOnboarding = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const updated = await UserPreference.update(
      { onboarding_completed: true },
      { where: { user_id } }
    );

    if (!updated[0]) {
      return res.status(404).json({ message: 'User preference not found' });
    }

    res.json({
      message: 'Onboarding marked as completed successfully',
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  checkOnboarding,
  completeOnboarding,
};
