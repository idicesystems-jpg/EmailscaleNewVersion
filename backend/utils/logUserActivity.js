const UAParser = require('ua-parser-js');
const UserActivityLog = require('../models/UserActivityLog');


const logUserActivity = async (req, user, activity) => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();
    const {timezone,resolution}= req.body;

    // Extract clean info
    const browser = uaResult.browser.name || 'Unknown';
    const platform = uaResult.os.name || 'Unknown';

    await UserActivityLog.create({
      user_id: user.id,
      email: user.email,
      activity,
      browser,
      platform, // you can later parse this if needed
      timezone,
      resolution,
    });
  } catch (error) {
    console.error('Error logging user activity:', error.message);
  }
};

module.exports = logUserActivity;
