const { Op, fn, col, literal } = require('sequelize');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const sequelize = require('../config/database');

// const getEmailProviderCounts = async (req, res) => {
//   try {
//     const userId = parseInt(req.query.userId); // or req.params.userId
//     const { search = '', page = 1, limit = 10 } = req.query;
//     const offset = (page - 1) * limit;

//     const providers = {
//       gmail: ['gmail.com'],
//       microsoft: ['outlook.com', 'hotmail.com', 'live.com'],
//       aol: ['aol.com'],
//       yahoo: ['yahoo.com']
//     };

//     // Build base query
//     const whereCondition = {
//       smtp_username: { [Op.ne]: null }
//     };

//     if (userId && userId !== 1) {
//       whereCondition[Op.or] = [
//         { user_id: userId },
//         { previous_user_id: userId }
//       ];
//     }

//     if (search) {
//       whereCondition.smtp_username = { [Op.like]: `%${search}%` };
//     }

//     // Get counts grouped by domain
//     const results = await Campaign.findAll({
//       attributes: [
//         [literal("LOWER(SUBSTRING_INDEX(smtp_username, '@', -1))"), 'domain'],
//         [fn('COUNT', col('smtp_username')), 'count']
//       ],
//       where: whereCondition,
//       group: ['domain'],
//       offset: parseInt(offset),
//       limit: parseInt(limit),
//       raw: true,
//     });

//     // Initialize counts
//     const counts = {
//       gmail: 0,
//       microsoft: 0,
//       aol: 0,
//       yahoo: 0,
//       others: 0
//     };

//     results.forEach(row => {
//       const domain = row.domain.toLowerCase();
//       let matched = false;

//       for (const [key, domains] of Object.entries(providers)) {
//         if (domains.includes(domain)) {
//           counts[key] += parseInt(row.count);
//           matched = true;
//           break;
//         }
//       }

//       if (!matched) {
//         counts.others += parseInt(row.count);
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       page: parseInt(page),
//       limit: parseInt(limit),
//       totalRecords: results.length,
//       counts,
//       domains: results // optional: list of domains with counts
//     });
//   } catch (error) {
//     console.error("Error in getEmailProviderCounts:", error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };

const getEmailProviderCounts = async (userId) => {
  const providers = {
    gmail: ["gmail.com"],
    microsoft: ["outlook.com", "hotmail.com", "live.com"],
    aol: ["aol.com"],
    yahoo: ["yahoo.com"],
  };

  // Base query
  const whereClause =
    userId !== 1
      ? {
          [Op.or]: [{ user_id: userId }, { previous_user_id: userId }],
        }
      : {};

  const results = await Campaign.findAll({
    attributes: [
      [sequelize.fn("LOWER", sequelize.fn("SUBSTRING_INDEX", sequelize.col("smtp_username"), "@", -1)), "domain"],
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    where: { smtp_username: { [Op.ne]: null }, ...whereClause },
    group: ["domain"],
    raw: true,
  });

  const counts = { gmail: 0, microsoft: 0, aol: 0, yahoo: 0, others: 0 };

  results.forEach((row) => {
    let matched = false;
    for (let key in providers) {
      if (providers[key].includes(row.domain)) {
        counts[key] += parseInt(row.count, 10);
        matched = true;
        break;
      }
    }
    if (!matched) counts.others += parseInt(row.count, 10);
  });

  return counts;
};

// Main function
const emailWarmup = async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    const q = req.query.q || "";
    const healthRange = req.query.health_range || null;
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;

    // Base query for campaigns
    const baseWhere =
      userId != 1
        ? { [Op.or]: [{ user_id: userId }, { previous_user_id: userId }] }
        : {};

    // Warmup counts
    const warmupData = {
      warmup1: await Campaign.count({ where: { ...baseWhere, warmup_emails: { [Op.between]: [0, 25] } } }),
      warmup2: await Campaign.count({ where: { ...baseWhere, warmup_emails: { [Op.between]: [26, 45] } } }),
      warmup3: await Campaign.count({ where: { ...baseWhere, warmup_emails: { [Op.between]: [46, 75] } } }),
      warmup4: await Campaign.count({ where: { ...baseWhere, warmup_emails: { [Op.between]: [76, 90] } } }),
      warmup5: await Campaign.count({ where: { ...baseWhere, warmup_emails: { [Op.between]: [91, 100] } } }),
    };

    // Table query
    const whereClause = { ...baseWhere };

    if (healthRange) {
      const ranges = {
        "0-25%": [0, 25],
        "26-45%": [26, 45],
        "46-75%": [46, 75],
        "76-90%": [76, 90],
        "91-100%": [91, 100],
      };
      if (ranges[healthRange]) {
        whereClause.warmup_emails = { [Op.between]: ranges[healthRange] };
      }
    }

    if (q) {
      // Search campaign_name, smtp_username, id, or user email
      const matchedUserIds = (
        await User.findAll({
          where: { email: { [Op.like]: `%${q}%` } },
          attributes: ["id"],
          raw: true,
        })
      ).map((u) => u.id);

      whereClause[Op.or] = [
        { campaign_name: { [Op.like]: `%${q}%` } },
        { smtp_username: { [Op.like]: `%${q}%` } },
        { id: { [Op.like]: `%${q}%` } },
      ];

      if (matchedUserIds.length) whereClause[Op.or].push({ user_id: matchedUserIds });
    }

    // Pagination
    const { count: totalCount, rows: campaigns } = await Campaign.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [["created_at", "DESC"]],
      raw: false, // for including associations if needed later
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    // Process health scores and email stats
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const totalSent = campaign.is_send || 0;
        const spamCount = campaign.is_spam || 0;
        const bounceCount = campaign.is_send1 || 0;
        const inboxCount = totalSent - spamCount - bounceCount;

        const assignedUser = campaign.previous_user_id
          ? await User.findByPk(campaign.user_id)
          : null;

        return {
          ...campaign.toJSON(),
          inbox: totalSent > 0 ? Math.round((inboxCount / totalSent) * 100) : 0,
          spam: totalSent > 0 ? Math.round((spamCount / totalSent) * 100) : 0,
          bounce: totalSent > 0 ? Math.round((bounceCount / totalSent) * 100) : 0,
          health_score: campaign.warmup_emails,
          daily_volume: campaign.daily_limit || 100,
          assigned_user_name: assignedUser ? assignedUser.name : "Unassigned",
          domain: campaign.smtp_username ? campaign.smtp_username.split("@")[1] : null,
        };
      })
    );

    const users = await User.findAll({ raw: true });

    const counts = await getEmailProviderCounts(userId);
    const counts_pool = {}; // implement your pool email counts logic here

    res.status(200).json({
      success: true,
      data: {
        warmupData,
        campaigns: campaignsWithStats,
        users,
        counts,
        totalPages,
        counts_pool,
      },
    });
  } catch (error) {
    console.error("Error in emailWarmup:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const deleteWarmupEmail = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if campaign exists
    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return res.status(404).json({
        status: false,
        message: 'Email account not found!'
      });
    }

    // Delete campaign
    await Campaign.destroy({ where: { id } });

    // Return success JSON (instead of redirect, since this is an API)
    return res.status(200).json({
      status: true,
      message: 'Email account deleted successfully!'
    });

  } catch (error) {
    console.error('Delete Warmup Email Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Server error while deleting email account',
      error: error.message
    });
  }
};



module.exports = { getEmailProviderCounts, emailWarmup, deleteWarmupEmail };