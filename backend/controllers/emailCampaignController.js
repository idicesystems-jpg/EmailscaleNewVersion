const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const EmailCampaign = require('../models/EmailCampaign');
const EmailCampaignStatus  = require('../models/EmailCampaignStatus');
const { Op, fn, col, literal } = require("sequelize");
const dayjs = require("dayjs");
const imaps = require('imap-simple');


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
      attributes: [
        "campaign_id",
        [fn("SUM", col("is_send")), "today_run"],
      ],
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
        totalEmails > 0 ? Math.floor(((totalEmails - spamEmails) / totalEmails) * 100) : 0;

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

    const inboxPlacement = totalSend > 0 ? ((totalSend - totalSpam) / totalSend) * 100 : 0;
    const averageHealthScore7Days = totalSend > 0 ? ((totalSend - totalSpam) / totalSend) * 100 : 0;

    // Calculate average health score
    const average_health_score = totalAccounts > 0 ? totalHealthScore / totalAccounts : 0;

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
        ? ((totalEmailsLast7Days - totalSpamEmails) / totalEmailsLast7Days) * 100
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
        const userId = parseInt(req.query.user_id);
        const q = req.query.q || '';
        const q1 = q.split(' ');
        let sortKey = req.query.sortKey || 'id';
        const sortDirection = req.query.sortDirection || 'ASC';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = limit * (page - 1);

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (sortKey === 'full_name') sortKey = 'first_name';

        // Base where condition
        let where = {};
        if (userId !== 1) where.user_id = userId;

        // Search
        if (q) {
            if (q1.length === 2) {
                where = { 
                    ...where, 
                    first_name: { [Op.like]: `%${q1[0]}%` }, 
                    last_name: { [Op.like]: `%${q1[1]}%` } 
                };
            } else {
                where = { 
                    ...where, 
                    [Op.or]: [
                        { first_name: { [Op.like]: `%${q}%` } },
                        { last_name: { [Op.like]: `%${q}%` } },
                        { smtp_username: { [Op.like]: `%${q}%` } }
                    ] 
                };
            }
        }

        // Count total records
        const total = await Campaign.count({ where });

        const campaigns = await Campaign.findAll({
            where,
            order: [[sortKey, sortDirection]],
            offset,
            limit
        });

        const campaignIds = campaigns.map(c => c.id);

        // Fetch Email stats
        const sendEmails = await EmailCampaignStatus.findAll({
            attributes: [
                'campaign_id',
                [fn('SUM', col('is_send')), 'total_send'],
                [fn('SUM', col('is_spam')), 'total_spam']
            ],
            where: {
                campaign_id: { [Op.in]: campaignIds },
                is_send: { [Op.ne]: 0 },
                created_at: { [Op.between]: [dayjs().subtract(7, 'day').startOf('day').toDate(), dayjs().endOf('day').toDate()] }
            },
            group: ['campaign_id']
        });

        const todayRuns = await EmailCampaignStatus.findAll({
            attributes: [
                'campaign_id',
                [fn('SUM', col('is_send')), 'today_run']
            ],
            where: {
                campaign_id: { [Op.in]: campaignIds },
                is_send: { [Op.ne]: 0 },
                created_at: { [Op.gte]: dayjs().startOf('day').toDate() }
            },
            group: ['campaign_id']
        });

        const userIds = [...new Set(campaigns.map(c => c.user_id))];
        const users = await User.findAll({ where: { id: userIds } });

        const sendEmailsMap = {};
        sendEmails.forEach(e => sendEmailsMap[e.campaign_id] = e.dataValues);

        const todayRunsMap = {};
        todayRuns.forEach(e => todayRunsMap[e.campaign_id] = e.dataValues);

        const userMap = {};
        users.forEach(u => userMap[u.id] = u.name);

        const data = campaigns.map(c => {
            const sendData = sendEmailsMap[c.id] || {};
            const todayData = todayRunsMap[c.id] || {};
            const totalEmails = parseInt(sendData.total_send) || 0;
            const spamEmails = parseInt(sendData.total_spam) || 0;
            const warmupPercentage = totalEmails > 0 ? Math.floor(((totalEmails - spamEmails) / totalEmails) * 100) : 0;

            return {
                ...c.toJSON(),
                warmup_emails: warmupPercentage,
                total_emails: totalEmails,
                spam_email: spamEmails,
                send_email: totalEmails,
                todayrunCampaign: parseInt(todayData.today_run) || 0,
                username: userMap[c.user_id] || null
            };
        });

        res.json({
            data,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
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
            warmup_limit
        } = req.body;

        if (!user_id || !smtp_username || !smtp_password || !smtp_host) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        // Check if campaign already exists
        const existingRecord = await Campaign.findOne({ where: { smtp_username } });
        if (existingRecord) {
            return res.status(400).json({ message: 'Email account already exists' });
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
                authTimeout: 5000
            }
        };

        // Try to connect to IMAP
        try {
            const connection = await imaps.connect(config);
            await connection.end(); // Close connection
        } catch (err) {
            return res.status(400).json({ message: `IMAP connection failed: ${err.message}` });
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
            user_id
        });

        return res.status(200).json({ message: 'Email account added successfully' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const emailCampaign = async (req, res) => {
    const { row, user_id, cName, subject, cMsg } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'User ID is missing' });
    }

    if (!Array.isArray(row) || row.length === 0) {
        return res.status(400).json({ error: 'Data is required and should be an array' });
    }

    try {
        let ids = '';

        // For simplicity, assuming row is a single object, same as your Laravel code
        const r = row; // if multiple rows, wrap in loop

        // Check for duplicate email
        const existingRecord = await Campaign.findOne({ where: { smtp_username: r['SMTP Username'] } });

        if (!existingRecord) {
            const host = r['SMTP Host'];
            const port = 993; // IMAP SSL
            const ssl = true;

            // SMTP IMAP check
            const smtpConfig = {
                imap: {
                    user: r['SMTP Username'],
                    password: r['SMTP Password'],
                    host,
                    port,
                    tls: true,
                    tlsOptions: { rejectUnauthorized: false },
                    authTimeout: 5000
                }
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
                    user: r['IMAP Username'],
                    password: r['IMAP Password'],
                    host,
                    port,
                    tls: true,
                    tlsOptions: { rejectUnauthorized: false },
                    authTimeout: 5000
                }
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
                    first_name: r['First Name'],
                    last_name: r['Last Name'],
                    smtp_username: r['IMAP Username'],
                    smtp_password: r['IMAP Password'],
                    smtp_host: r['IMAP Host'],
                    smtp_port: r['SMTP Port'],
                    daily_limit: 10,
                    warmup_enabled: r['Warmup Enabled'],
                    warmup_limit: r['Warmup Limit'],
                    user_id
                });
                ids = campaign.id;
                return res.status(200).json({ status: true, message: 'IMAP connection successful: ' + r['SMTP Username'], ids });
            } else {
                return res.status(200).json({ status: false, message: 'IMAP connection failed: ' + r['SMTP Username'], ids });
            }
        } else {
            return res.status(200).json({ status: true, message: 'Already exist: ' + r['SMTP Username'], ids });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to upload data', details: err.message });
    }
};
module.exports = { getAllEmailCampaigns, getEmailCampaigns, singleEmailCampaign, emailCampaign };