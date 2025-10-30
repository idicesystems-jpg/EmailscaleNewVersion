const UserActivityLog = require('../models/UserActivityLog');

const logUserActivity = async (req, user, activity) => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const {timezone,resolution}= req.body;

    await UserActivityLog.create({
      user_id: user.id,
      email: user.email,
      activity,
      browser: userAgent,
      platform: userAgent, // you can later parse this if needed
      timezone,
      resolution,
    });
  } catch (error) {
    console.error('Error logging user activity:', error.message);
  }
};

module.exports = logUserActivity;
