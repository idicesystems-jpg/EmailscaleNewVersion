const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Campaign = require("../models/Campaign");
const EmailCampaign = require("../models/EmailCampaign");
const EmailCampaignStatus = require("../models/EmailCampaignStatus");
const AiReplyMessage = require("../models/AiReplyMessage");
const { Op, fn, col, literal } = require("sequelize");
const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require('path');
const moment = require('moment');
const dayjs = require("dayjs");
const imaps = require("imap-simple");
const multer = require("multer");
const { parse } = require("csv-parse");
const { send_mail, send_mail1 } = require('../helpers/mailHelpers');

const getAllEmailCampaigns = async (req, res) => {
  try {
    const userId = req.body.user_id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch campaigns
    const campaignQuery = {
      order: [["id", "DESC"]],
    };

    if (userId != 1) {
      campaignQuery.where = { user_id: userId };
    }

    const campaigns = await Campaign.findAll(campaignQuery);

    const campaignIds = campaigns.map((c) => c.id);

    // Total emails all time
    const totalEmailsAllTime = await EmailCampaignStatus.sum("is_send", {
      where: {
        campaign_id: { [Op.in]: campaignIds },
        is_send: { [Op.ne]: 0 },
      },
    });

    // Last 7 days send and spam
    const last7Days = await EmailCampaignStatus.findAll({
      attributes: [
        "campaign_id",
        [fn("SUM", col("is_send")), "total_send"],
        [fn("SUM", col("is_spam")), "total_spam"],
      ],
      where: {
        campaign_id: { [Op.in]: campaignIds },
        is_send: { [Op.ne]: 0 },
        created_at: {
          [Op.between]: [
            dayjs().subtract(7, "day").startOf("day").toDate(),
            dayjs().endOf("day").toDate(),
          ],
        },
      },
      group: ["campaign_id"],
    });

    const sendEmailsMap = {};
    last7Days.forEach((row) => {
      sendEmailsMap[row.campaign_id] = {
        total_send: parseInt(row.dataValues.total_send),
        total_spam: parseInt(row.dataValues.total_spam),
      };
    });

    // Today's sent counts
    const todayRunsRaw = await EmailCampaignStatus.findAll({
      attributes: ["campaign_id", [fn("SUM", col("is_send")), "today_run"]],
      where: {
        campaign_id: { [Op.in]: campaignIds },
        is_send: { [Op.ne]: 0 },
        created_at: {
          [Op.between]: [
            dayjs().startOf("day").toDate(),
            dayjs().endOf("day").toDate(),
          ],
        },
      },
      group: ["campaign_id"],
    });

    const todayRunsMap = {};
    todayRunsRaw.forEach((row) => {
      todayRunsMap[row.campaign_id] = parseInt(row.dataValues.today_run);
    });

    // Load usernames
    const users = await User.findAll({
      attributes: ["id", "name"],
      where: { id: { [Op.in]: campaigns.map((c) => c.user_id) } },
    });
    const userNamesMap = {};
    users.forEach((u) => {
      userNamesMap[u.id] = u.name;
    });

    let totalHealthScore = 0;
    let totalAccounts = 0;

    const campaignsWithStats = campaigns.map((campaign) => {
      const sendData = sendEmailsMap[campaign.id] || {};
      const todayData = todayRunsMap[campaign.id] || 0;

      const totalEmails = sendData.total_send || 0;
      const spamEmails = sendData.total_spam || 0;

      const warmupPercentage =
        totalEmails > 0
          ? Math.floor(((totalEmails - spamEmails) / totalEmails) * 100)
          : 0;

      totalHealthScore += warmupPercentage;
      totalAccounts++;

      return {
        ...campaign.dataValues,
        warmup_emails: warmupPercentage,
        total_emails: totalEmails,
        spam_email: spamEmails,
        send_email: totalEmails,
        todayrunCampaign: todayData,
        username: userNamesMap[campaign.user_id] || null,
      };
    });

    // 7 days calculation
    let totalSend = 0;
    let totalSpam = 0;
    let totalHealthScore7Days = 0;
    let totalCampaigns = 0;

    Object.values(sendEmailsMap).forEach((stat) => {
      const send = stat.total_send || 0;
      const spam = stat.total_spam || 0;
      const health = send > 0 ? ((send - spam) / send) * 100 : 0;

      totalSend += send;
      totalSpam += spam;
      totalHealthScore7Days += health;
      totalCampaigns++;
    });

    const inboxPlacement =
      totalSend > 0 ? ((totalSend - totalSpam) / totalSend) * 100 : 0;
    const averageHealthScore7Days =
      totalSend > 0 ? ((totalSend - totalSpam) / totalSend) * 100 : 0;

    // Calculate average health score
    const average_health_score =
      totalAccounts > 0 ? totalHealthScore / totalAccounts : 0;

    // Total emails last 7 days
    const totalEmailsLast7Days = Object.values(sendEmailsMap).reduce(
      (acc, stat) => acc + (stat.total_send || 0),
      0
    );

    const totalEmailsToday = await Campaign.sum("daily_limit", {
      where: { user_id: userId, warmup_enabled: "TRUE" },
    });

    const totalSpamEmails = Object.values(sendEmailsMap).reduce(
      (acc, stat) => acc + (stat.total_spam || 0),
      0
    );

    const finalInboxPercent =
      totalEmailsLast7Days > 0
        ? ((totalEmailsLast7Days - totalSpamEmails) / totalEmailsLast7Days) *
          100
        : 0;

    return res.json({
      average_health_score: Number(average_health_score.toFixed(2)),
      inbox_rate: Number(finalInboxPercent.toFixed(2)),
      total_emails_today: totalEmailsToday,
      total_campaigns: totalAccounts,
      total_emails_sent: totalEmailsLast7Days,
      total_spam_emails: totalSpamEmails,
      total_emails_sent_7_days: totalSend,
      spam_count_7_days: totalSpam,
      inbox_placement_7_days: Number(inboxPlacement.toFixed(2)),
      average_health_score_7_days: Number(averageHealthScore7Days.toFixed(2)),
      // total_all_time_emails: totalEmailsAllTime, // Uncomment if needed
    });
  } catch (err) {
    console.error("Error in getAllEmailCampaigns:", err);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

// const getEmailCampaigns = async (req, res) => {
//     try {
//         const userId = parseInt(req.query.user_id);
//         const q = req.query.q || '';
//         const q1 = q.split(' ');
//         let sortKey = req.query.sortKey || 'id';
//         const sortDirection = req.query.sortDirection || 'ASC';
//         const p = parseInt(req.query.p) || 1;
//         const perPage = 10;
//         const offset = perPage * (p - 1);

//         if (!userId) {
//             return res.status(400).json({ error: 'User ID is required' });
//         }

//         if (sortKey === 'full_name') sortKey = 'first_name';

//         // Base where condition
//         let where = {};
//         if (userId !== 1) where.user_id = userId;

//         // Search
//         if (q) {
//             if (q1.length === 2) {
//                 where = {
//                     ...where,
//                     first_name: { [Op.like]: `%${q1[0]}%` },
//                     last_name: { [Op.like]: `%${q1[1]}%` }
//                 };
//             } else {
//                 where = {
//                     ...where,
//                     [Op.or]: [
//                         { first_name: { [Op.like]: `%${q}%` } },
//                         { last_name: { [Op.like]: `%${q}%` } },
//                         { smtp_username: { [Op.like]: `%${q}%` } }
//                     ]
//                 };
//             }
//         }

//         const campaigns = await Campaign.findAll({
//             where,
//             order: [[sortKey, sortDirection]],
//             offset,
//             limit: perPage
//         });

//         const campaignIds = campaigns.map(c => c.id);

//         // Fetch Email stats
//         const sendEmails = await EmailCampaignStatus.findAll({
//             attributes: [
//                 'campaign_id',
//                 [fn('SUM', col('is_send')), 'total_send'],
//                 [fn('SUM', col('is_spam')), 'total_spam']
//             ],
//             where: {
//                 campaign_id: { [Op.in]: campaignIds },
//                 is_send: { [Op.ne]: 0 },
//                 created_at: { [Op.between]: [dayjs().subtract(7, 'day').startOf('day').toDate(), dayjs().endOf('day').toDate()] }
//             },
//             group: ['campaign_id']
//         });

//         const todayRuns = await EmailCampaignStatus.findAll({
//             attributes: [
//                 'campaign_id',
//                 [fn('SUM', col('is_send')), 'today_run']
//             ],
//             where: {
//                 campaign_id: { [Op.in]: campaignIds },
//                 is_send: { [Op.ne]: 0 },
//                 created_at: { [Op.gte]: dayjs().startOf('day').toDate() }
//             },
//             group: ['campaign_id']
//         });

//         const userIds = [...new Set(campaigns.map(c => c.user_id))];
//         const users = await User.findAll({ where: { id: userIds } });

//         const sendEmailsMap = {};
//         sendEmails.forEach(e => sendEmailsMap[e.campaign_id] = e.dataValues);

//         const todayRunsMap = {};
//         todayRuns.forEach(e => todayRunsMap[e.campaign_id] = e.dataValues);

//         const userMap = {};
//         users.forEach(u => userMap[u.id] = u.name);

//         const result = campaigns.map(c => {
//             const sendData = sendEmailsMap[c.id] || {};
//             const todayData = todayRunsMap[c.id] || {};
//             const totalEmails = parseInt(sendData.total_send) || 0;
//             const spamEmails = parseInt(sendData.total_spam) || 0;
//             const warmupPercentage = totalEmails > 0 ? Math.floor(((totalEmails - spamEmails) / totalEmails) * 100) : 0;

//             return {
//                 ...c.toJSON(),
//                 warmup_emails: warmupPercentage,
//                 total_emails: totalEmails,
//                 spam_email: spamEmails,
//                 send_email: totalEmails,
//                 todayrunCampaign: parseInt(todayData.today_run) || 0,
//                 username: userMap[c.user_id] || null
//             };
//         });

//         res.json(result);

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

const getEmailCampaigns = async (req, res) => {
  try {
    //check impersonation first
    const isImpersonating = !!req.impersonatedUser;
    
    const impersonatedUserId = req.impersonatedUser?.id;
    const impersonatedEmail = req.impersonatedUser?.email;

    // Extract logged-in admin or user from JWT
    const loggedInUserId = req.user?.id;
    const roleId = req.user?.role_id;

    const userId = parseInt(req.query.user_id);
    const q = req.query.q || "";
    const q1 = q.split(" ");
    let sortKey = req.query.sortKey || "id";
    const sortDirection = req.query.sortDirection || "ASC";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = limit * (page - 1);

    if (!loggedInUserId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // if (!userId) {
    //     return res.status(400).json({ error: 'User ID is required' });
    // }

    if (sortKey === "full_name") sortKey = "first_name";

    // Base where condition
    let where = {};

    /**
     *  Impersonation-aware filtering:
     * - If admin impersonates a user → use impersonated user ID
     * - If regular user → filter by their own ID
     * - If super admin (role_id = 1) → see all users
     *
     */
    if (isImpersonating) {
      where.user_id = impersonatedUserId;
      // console.log(
      //   `Admin ${loggedInUserId} impersonating user ${impersonatedUserId} (${impersonatedEmail})`
      // );
    } else if (roleId !== 1) {
      where.user_id = loggedInUserId;
    }

    //console.log("where.user_id", where.user_id);
    //if (userId !== 1) where.user_id = userId;

    // Search
    if (q) {
      if (q1.length === 2) {
        where = {
          ...where,
          first_name: { [Op.like]: `%${q1[0]}%` },
          last_name: { [Op.like]: `%${q1[1]}%` },
        };
      } else {
        where = {
          ...where,
          [Op.or]: [
            { first_name: { [Op.like]: `%${q}%` } },
            { last_name: { [Op.like]: `%${q}%` } },
            { smtp_username: { [Op.like]: `%${q}%` } },
          ],
        };
      }
    }

    // Count total records
    const total = await Campaign.count({ where });

    const campaigns = await Campaign.findAll({
      where,
      order: [[sortKey, sortDirection]],
      offset,
      limit,
    });

    const campaignIds = campaigns.map((c) => c.id);

    // Fetch Email stats
    const sendEmails = await EmailCampaignStatus.findAll({
      attributes: [
        "campaign_id",
        [fn("SUM", col("is_send")), "total_send"],
        [fn("SUM", col("is_spam")), "total_spam"],
      ],
      where: {
        campaign_id: { [Op.in]: campaignIds },
        is_send: { [Op.ne]: 0 },
        created_at: {
          [Op.between]: [
            dayjs().subtract(7, "day").startOf("day").toDate(),
            dayjs().endOf("day").toDate(),
          ],
        },
      },
      group: ["campaign_id"],
    });

    const todayRuns = await EmailCampaignStatus.findAll({
      attributes: ["campaign_id", [fn("SUM", col("is_send")), "today_run"]],
      where: {
        campaign_id: { [Op.in]: campaignIds },
        is_send: { [Op.ne]: 0 },
        created_at: { [Op.gte]: dayjs().startOf("day").toDate() },
      },
      group: ["campaign_id"],
    });

    const userIds = [...new Set(campaigns.map((c) => c.user_id))];
    const users = await User.findAll({ where: { id: userIds } });

    const sendEmailsMap = {};
    sendEmails.forEach((e) => (sendEmailsMap[e.campaign_id] = e.dataValues));

    const todayRunsMap = {};
    todayRuns.forEach((e) => (todayRunsMap[e.campaign_id] = e.dataValues));

    const userMap = {};
    users.forEach((u) => (userMap[u.id] = u.name));

    const data = campaigns.map((c) => {
      const sendData = sendEmailsMap[c.id] || {};
      const todayData = todayRunsMap[c.id] || {};
      const totalEmails = parseInt(sendData.total_send) || 0;
      const spamEmails = parseInt(sendData.total_spam) || 0;
      const warmupPercentage =
        totalEmails > 0
          ? Math.floor(((totalEmails - spamEmails) / totalEmails) * 100)
          : 0;

      return {
        ...c.toJSON(),
        warmup_emails: warmupPercentage,
        total_emails: totalEmails,
        spam_email: spamEmails,
        send_email: totalEmails,
        todayrunCampaign: parseInt(todayData.today_run) || 0,
        username: userMap[c.user_id] || null,
      };
    });

    res.json({
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const singleEmailCampaign = async (req, res) => {
  try {
    const {
      user_id,
      smtp_username,
      smtp_password,
      smtp_host,
      smtp_port,
      cName,
      subject,
      cMsg,
      first_name,
      last_name,
      warmup_enabled,
      warmup_limit,
    } = req.body;

    if (!user_id || !smtp_username || !smtp_password || !smtp_host) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if campaign already exists
    const existingRecord = await Campaign.findOne({ where: { smtp_username } });
    if (existingRecord) {
      return res.status(400).json({ message: "Email account already exists" });
    }

    // IMAP configuration
    const config = {
      imap: {
        user: smtp_username,
        password: smtp_password,
        host: smtp_host,
        port: smtp_port || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 5000,
      },
    };

    // Try to connect to IMAP
    try {
      const connection = await imaps.connect(config);
      await connection.end(); // Close connection
    } catch (err) {
      return res
        .status(400)
        .json({ message: `IMAP connection failed: ${err.message}` });
    }

    // Create campaign record
    await Campaign.create({
      campaign_name: cName,
      subject,
      campaign_message: cMsg,
      first_name,
      last_name,
      smtp_username,
      smtp_password,
      smtp_host,
      smtp_port: smtp_port || 993,
      daily_limit: 10,
      warmup_enabled,
      warmup_limit,
      user_id,
    });

    return res
      .status(200)
      .json({ message: "Email account added successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// const emailCampaign = async (req, res) => {
//     const { row, user_id, cName, subject, cMsg } = req.body;

//     if (!user_id) {
//         return res.status(400).json({ error: 'User ID is missing' });
//     }

//     if (!Array.isArray(row) || row.length === 0) {
//         return res.status(400).json({ error: 'Data is required and should be an array' });
//     }

//     try {
//         let ids = '';

//         // For simplicity, assuming row is a single object, same as your Laravel code
//         const r = row; // if multiple rows, wrap in loop

//         // Check for duplicate email
//         const existingRecord = await Campaign.findOne({ where: { smtp_username: r['SMTP Username'] } });

//         if (!existingRecord) {
//             const host = r['SMTP Host'];
//             const port = 993; // IMAP SSL
//             const ssl = true;

//             // SMTP IMAP check
//             const smtpConfig = {
//                 imap: {
//                     user: r['SMTP Username'],
//                     password: r['SMTP Password'],
//                     host,
//                     port,
//                     tls: true,
//                     tlsOptions: { rejectUnauthorized: false },
//                     authTimeout: 5000
//                 }
//             };

//             let smtpConnected = false;
//             try {
//                 const smtpConn = await imaps.connect(smtpConfig);
//                 await smtpConn.end();
//                 smtpConnected = true;
//             } catch (err) {
//                 smtpConnected = false;
//             }

//             // IMAP check
//             const imapConfig = {
//                 imap: {
//                     user: r['IMAP Username'],
//                     password: r['IMAP Password'],
//                     host,
//                     port,
//                     tls: true,
//                     tlsOptions: { rejectUnauthorized: false },
//                     authTimeout: 5000
//                 }
//             };

//             let imapConnected = false;
//             try {
//                 const imapConn = await imaps.connect(imapConfig);
//                 await imapConn.end();
//                 imapConnected = true;
//             } catch (err) {
//                 imapConnected = false;
//             }

//             if (smtpConnected && imapConnected) {
//                 const campaign = await Campaign.create({
//                     campaign_name: cName,
//                     subject,
//                     campaign_message: cMsg,
//                     first_name: r['First Name'],
//                     last_name: r['Last Name'],
//                     smtp_username: r['IMAP Username'],
//                     smtp_password: r['IMAP Password'],
//                     smtp_host: r['IMAP Host'],
//                     smtp_port: r['SMTP Port'],
//                     daily_limit: 10,
//                     warmup_enabled: r['Warmup Enabled'],
//                     warmup_limit: r['Warmup Limit'],
//                     user_id
//                 });
//                 ids = campaign.id;
//                 return res.status(200).json({ status: true, message: 'IMAP connection successful: ' + r['SMTP Username'], ids });
//             } else {
//                 return res.status(200).json({ status: false, message: 'IMAP connection failed: ' + r['SMTP Username'], ids });
//             }
//         } else {
//             return res.status(200).json({ status: true, message: 'Already exist: ' + r['SMTP Username'], ids });
//         }

//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ error: 'Failed to upload data', details: err.message });
//     }
// };

const emailCampaign = async (req, res) => {
  const { user_id, cName, subject, cMsg } = req.body;
  const file = req.file;

  if (!user_id) return res.status(400).json({ error: "User ID is missing" });
  if (!file) return res.status(400).json({ error: "CSV file is required" });

  try {
    // Read uploaded file
    const fileContent = fs.readFileSync(file.path);

    // Parse CSV
    parse(fileContent, { columns: true, trim: true }, async (err, rows) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Failed to parse CSV", details: err.message });

      let results = [];

      for (const r of rows) {
        let ids = "";

        // Check for duplicate email
        const existingRecord = await Campaign.findOne({
          where: { smtp_username: r["SMTP Username"] },
        });
        if (existingRecord) {
          results.push({
            status: true,
            message: "Already exist: " + r["SMTP Username"],
            ids,
          });
          continue;
        }

        const host = r["SMTP Host"];
        const port = 993; // IMAP SSL

        // SMTP IMAP check
        const smtpConfig = {
          imap: {
            user: r["SMTP Username"],
            password: r["SMTP Password"],
            host,
            port,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 5000,
          },
        };

        let smtpConnected = false;
        try {
          const smtpConn = await imaps.connect(smtpConfig);
          await smtpConn.end();
          smtpConnected = true;
        } catch (err) {
          smtpConnected = false;
        }

        // IMAP check
        const imapConfig = {
          imap: {
            user: r["IMAP Username"],
            password: r["IMAP Password"],
            host,
            port,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 5000,
          },
        };

        let imapConnected = false;
        try {
          const imapConn = await imaps.connect(imapConfig);
          await imapConn.end();
          imapConnected = true;
        } catch (err) {
          imapConnected = false;
        }

        if (smtpConnected && imapConnected) {
          const campaign = await Campaign.create({
            campaign_name: cName,
            subject,
            campaign_message: cMsg,
            first_name: r["First Name"],
            last_name: r["Last Name"],
            smtp_username: r["IMAP Username"],
            smtp_password: r["IMAP Password"],
            smtp_host: r["IMAP Host"],
            smtp_port: r["SMTP Port"],
            daily_limit: 10,
            warmup_enabled: r["Warmup Enabled"],
            warmup_limit: r["Warmup Limit"],
            user_id,
          });
          ids = campaign.id;
          results.push({
            status: true,
            message: "IMAP connection successful: " + r["SMTP Username"],
            ids,
          });
        } else {
          results.push({
            status: false,
            message: "IMAP connection failed: " + r["SMTP Username"],
            ids,
          });
        }
      }

      // Remove uploaded file after processing
      fs.unlinkSync(file.path);

      return res.json({ data: results });
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Failed to upload data", details: err.message });
  }
};

const updateCampaignDetails = async (req, res) => {
  try {
    const { ids, subject, campaign_message } = req.body;

    // Validate request
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ msg: "ids is required and should be an array" });
    }
    if (!subject || typeof subject !== "string") {
      return res
        .status(400)
        .json({ msg: "subject is required and should be a string" });
    }
    if (!campaign_message || typeof campaign_message !== "string") {
      return res
        .status(400)
        .json({ msg: "campaign_message is required and should be a string" });
    }

    // Update campaigns
    const [updatedCount] = await Campaign.update(
      { subject, campaign_message },
      { where: { id: ids } }
    );

    if (updatedCount > 0) {
      return res.json({ msg: "Campaign details updated successfully" });
    } else {
      return res.status(500).json({ msg: "Failed to update campaign details" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ msg: "Internal server error", error: err.message });
  }
};

const deleteCampaigns = async (req, res) => {
  try {
    const { ids } = req.body;

    // Validate request
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "number")) {
      return res
        .status(400)
        .json({ error: "'ids' must be an array of integers" });
    }

    // Delete campaigns
    const deleted = await Campaign.destroy({
      where: {
        id: ids,
      },
    });

    if (deleted) {
      return res
        .status(200)
        .json({ message: "Selected campaigns deleted successfully" });
    } else {
      return res
        .status(404)
        .json({ message: "No campaigns found for the provided IDs" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Failed to delete campaigns", details: err.message });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || typeof id !== "number") {
      return res
        .status(400)
        .json({ error: "'id' is required and must be a number" });
    }

    const deleted = await Campaign.destroy({
      where: { id },
    });

    if (deleted) {
      return res
        .status(200)
        .json({ message: "Email account deleted successfully" });
    } else {
      return res.status(404).json({ message: "Campaign not found" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Failed to delete campaign", details: err.message });
  }
};

const updateLimits = async (req, res) => {
  try {
    const { ids, daily_limit, warmup_limit } = req.body;

    // Validate request body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "'ids' must be a non-empty array" });
    }

    // Fetch campaigns with given IDs
    const campaigns = await Campaign.findAll({ where: { id: ids } });

    if (!campaigns.length) {
      return res
        .status(404)
        .json({ error: "No campaigns found for the provided IDs" });
    }

    // Update each campaign
    for (const campaign of campaigns) {
      if (daily_limit !== undefined && daily_limit !== null) {
        campaign.daily_limit = daily_limit;
      }
      if (warmup_limit !== undefined && warmup_limit !== null) {
        campaign.warmup_limit = warmup_limit;
      }
      await campaign.save();
    }

    return res.status(200).json({
      message: "Campaign limits updated successfully",
      campaigns,
    });
  } catch (error) {
    console.error("Error updating limits:", error);
    return res.status(500).json({
      error: "Failed to update campaign limits",
      details: error.message,
    });
  }
};

const run_campaign = async (req, res) => {
  try {
    // Step 1: Get today's campaign IDs from EmailCampaignStatus
    const today = moment().format('YYYY-MM-DD');
    const todayRunIds = await EmailCampaignStatus.findAll({
      attributes: ['campaign_id'],
      where: Sequelize.where(
        Sequelize.fn('DATE', Sequelize.col('created_at')),
        today
      ),
    });

    let ids = todayRunIds.map(item => item.campaign_id);

    // Step 2: Log file path
    const file = path.join(__dirname, '../public/ids_logs/ids.log');
    const dir = path.dirname(file);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Step 3: Write log data
    const logStream = fs.createWriteStream(file, { flags: 'a' });
    logStream.write(`\n============== ${Date.now()} ===============\n`);
    logStream.write(JSON.stringify(ids) + '\n');

    // Step 4: Fetch campaigns not in today's IDs
    const campaigns = await Campaign.findAll({
      where: {
        warmup_enabled: 'TRUE',
        id: { [Op.notIn]: ids.length ? ids : [0] },
      },
      order: Sequelize.literal('RAND()'),
      limit: 50,
    });

    // Step 5: Process each campaign
    for (const campaign of campaigns) {
      const campaign_id = campaign.id;
      const user_id = campaign.user_id;
      const limit = campaign.daily_limit;
      const warmup_limit = campaign.warmup_limit;

      const eCampaigns = await EmailCampaign.findAll({
        order: Sequelize.literal('RAND()'),
        limit: limit,
      });

      if (eCampaigns.length > 0) {
        const senders = eCampaigns.map(e => e.id);

        const data = {
          campaign_id: campaign_id,
          is_spam: 0,
          is_send: 0,
          is_send1: 0,
          user_id: 1,
          senders: JSON.stringify(senders),
        };

        logStream.write(`======create======== ${Date.now()} ===============\n`);
        logStream.write(JSON.stringify(data) + '\n');

        await EmailCampaignStatus.create(data);
      }
    }

    logStream.end();

    return res.json({ status: true, msg: 'Campaign run successfully' });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, msg: 'Server Error', error: error.message });
  }
};



const  run_campaign_by_cron = async (req, res) => {
  try {
    // For testing — matches Laravel’s early return and die()
    // Comment this out if you want actual execution
    // return res.json({ status: true, msg: 'Campaign run successfully' });
    

    // Step 1: Fetch today's EmailCampaignStatus records
    const today = moment().format('YYYY-MM-DD');
    const todayUpdatedCampaigns = await EmailCampaignStatus.findAll({
      where: {
        [Op.and]: [
          Sequelize.where(Sequelize.fn('DATE', Sequelize.col('created_at')), today),
          { is_run: 0 },
          { senders: { [Op.ne]: null } }
        ]
      },
      order: Sequelize.literal('RAND()'),
      limit: 50
    });

    // Step 2: Prepare log file path
    const file = path.join(__dirname, '../public/run_campaign_by_cron_logs/run_campaign_by_cron.log');
    const dir = path.dirname(file);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const logStream = fs.createWriteStream(file, { flags: 'a' });
    logStream.write(`======create======== ${Date.now()} ===============\n`);

    // Step 3: Loop through campaigns
    for (const todayUpdatedCampaign of todayUpdatedCampaigns) {
      const ecsid = todayUpdatedCampaign.ecsid;
      const campaign_id = todayUpdatedCampaign.campaign_id;
      const t_spam = todayUpdatedCampaign.is_spam;
      let is_send = todayUpdatedCampaign.is_send;
      let is_send1 = todayUpdatedCampaign.is_send1;

      let senders = [];
      let reply_sender = [];
      let spam_data = [];

      try {
        senders = JSON.parse(todayUpdatedCampaign.senders || '[]');
        reply_sender = JSON.parse(todayUpdatedCampaign.reply_sender || '[]');
        spam_data = JSON.parse(todayUpdatedCampaign.spam_data || '[]');
      } catch (err) {
        senders = [];
        reply_sender = [];
        spam_data = [];
      }

      if (senders && senders.length > 0) {
        const campaign1 = await Campaign.findOne({
          where: { id: campaign_id, warmup_enabled: 'TRUE' }
        });

        if (campaign1) {
          const smtp_username = campaign1.smtp_username;
          const smtp_password = campaign1.smtp_password;
          const smtp_host = campaign1.smtp_host;
          const smtp_port = campaign1.smtp_port;
          const message_type = campaign1.message_type;

          const id = senders.shift();
          const campaign = await EmailCampaign.findOne({ where: { id } });

          const imap_username = `${campaign.first_name} ${campaign.last_name}`;
          const to = campaign.imap_username;

          // Fetch random message from AiReplyMessage
          const emailTemplate = await AiReplyMessage.findOne({
            order: Sequelize.literal('RAND()')
          });

          const subject1 = emailTemplate ? emailTemplate.subject : 'No Subject';
          const message1 = emailTemplate ? emailTemplate.message : 'No Message';

          if (campaign1.email_provider === 'G-Suite') {
            const args1 = {
              bodyMessage: message1,
              to_name: imap_username,
              to: to,
              subject: subject1,
              from_name: 'Automation Tool',
              from_email: smtp_username,
              smtp_username,
              smtp_password,
              smtp_host,
              smtp_port,
              refresh_token: campaign1.refresh_token,
              id: campaign1.id
            };
            await send_mail1(args1);
          } else {
            const args1 = {
              bodyMessage: message1,
              to_name: imap_username,
              to: to,
              subject: subject1,
              from_name: 'Automation Tool',
              from_email: smtp_username,
              smtp_username,
              smtp_password,
              smtp_host,
              smtp_port
            };
            await send_mail(args1);
          }

          // Save message record
          const sdata = {
            campaign_id: campaign_id,
            sender_id: id,
            message: message1
          };
          await SenderMessage.create(sdata);

          is_send1 = is_send1 + 1;
          reply_sender.push(id);

          const updateData = {
            senders: JSON.stringify(senders),
            reply_sender: JSON.stringify(reply_sender)
          };

          logStream.write(`${campaign_id}\n`);
          logStream.write(JSON.stringify(updateData) + '\n');

          await EmailCampaignStatus.update(updateData, {
            where: { ecsid }
          });
        }
      } else {
        const updateData = {
          is_run: 1,
          senders: null
        };

        logStream.write(JSON.stringify(updateData) + '\n');

        await EmailCampaignStatus.update(updateData, {
          where: { ecsid }
        });
      }
    }

    logStream.end();
    return res.json({ status: true, msg: 'Campaign run successfully' });
  } catch (error) {
    console.error('Error in run_campaign_by_cron:', error);
    return res.status(500).json({
      status: false,
      msg: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getAllEmailCampaigns,
  getEmailCampaigns,
  singleEmailCampaign,
  emailCampaign,
  updateCampaignDetails,
  deleteCampaigns,
  deleteCampaign,
  updateLimits,
  run_campaign,
  run_campaign_by_cron
};
