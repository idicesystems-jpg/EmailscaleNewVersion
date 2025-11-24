const Transaction = require("../models/Transaction");
const User = require("../models/User");
const SmtpAccount = require("../models/SmtpAccount");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { encrypt } = require('../utils/encryption');

const getAllSmtps = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? req.query.search.trim() : "";

    const offset = (page - 1) * limit;

    const whereCondition = search
      ? {
          [Op.or]: [
            { label: { [Op.like]: `%${search}%` } },
            { from_name: { [Op.like]: `%${search}%` } },
            { from_email: { [Op.like]: `%${search}%` } },
            { smtp_host: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { rows, count } = await SmtpAccount.findAndCountAll({
      attributes: [
        "id",
        "label",
        "from_name",
        "from_email",
        "smtp_host",
        "smtp_port",
        "smtp_secure",
        "daily_limit",
        "sent_today",
        "sent_today_date",
        "enabled",
        "last_verified_at",
        "created_at",
      ],
      order: [["id", "DESC"]],
      limit,
      offset,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      status: true,
      message: "SMTP accounts fetched successfully",
      data: rows,
      pagination: {
        totalRecords: count,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
      
    });
  } catch (error) {
    console.error(" Error fetching SMTP accounts:", error);
    res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const createSmtp = async (req, res) => {
  try {
    const b = req.body;

    // Encrypt password before saving
    // const enc = bcrypt(b.smtp_pass);
    //const saltRounds = 10; // or whatever you prefer
    //const enc = await bcrypt.hash(b.smtp_pass, saltRounds);

    // Insert into database
    const newSmtp = await SmtpAccount.create({
      label: b.label || null,
      from_name: b.from_name || "",
      from_email: b.from_email,
      smtp_host: b.smtp_host,
      smtp_port: b.smtp_port || 465,
      smtp_secure: b.smtp_port == 465 ? 1 : 0,
      smtp_user: b.smtp_user || b.from_email,
      smtp_pass: encrypt(b.smtp_pass),
      daily_limit: b.daily_limit || 40,
      enabled: b.enabled ? 1 : 1,
    });

    res.status(201).json({
      status: true,
      message: "SMTP account created successfully",
      id: newSmtp.id,
    });
  } catch (error) {
    console.error("Error creating SMTP account:", error);
    res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const createSmtpBulk = async (req, res) => {
  const errors = [];

  try {
    let items = Array.isArray(req.body) ? req.body : [req.body];

    if (!items.length) {
      return res
        .status(400)
        .json({ status: false, message: "No items provided" });
    }

    // Skip header row if present
    items = items.slice(1);

    if (!items.length) {
      return res.status(400).json({
        status: false,
        message: "No valid data rows after skipping header",
      });
    }

    const verifiedItems = [];

    // Verify each SMTP account
    for (const b of items) {
      try {
        await verifySmtp({
          host: b.smtp_host,
          port: b.smtp_port || 465,
          secure: !!b.smtp_secure,
          user: b.smtp_user || b.from_email,
          pass: b.smtp_pass,
        });
        verifiedItems.push(b);
      } catch (e) {
        errors.push(
          `Failed to verify ${b.from_email || b.smtp_user}: ${e.message}`
        );
      }
    }

    if (!verifiedItems.length) {
      return res.status(400).json({
        status: false,
        message: "No accounts verified successfully",
        errors,
      });
    }

    // Prepare records for bulk insert
    const records = verifiedItems.map((b) => ({
      label: b.label || null,
      from_name: b.from_name || "",
      from_email: b.from_email,
      smtp_host: b.smtp_host,
      smtp_port: b.smtp_port || 465,
      smtp_secure: b.smtp_secure ? 1 : 0,
      smtp_user: b.smtp_user || b.from_email,
      smtp_pass: encrypt(b.smtp_pass),
      daily_limit: b.daily_limit || 40,
      enabled: b.enabled !== undefined ? (b.enabled ? 1 : 0) : 1,
      last_verified_at: new Date(),
    }));

    const inserted = await SmtpAccount.bulkCreate(records);

    res.status(201).json({
      status: true,
      message: `Inserted ${inserted.length} verified records successfully (skipped header, ${errors.length} failed verification)`,
      errors,
      firstId: inserted[0]?.id,
      insertedCount: inserted.length,
    });
  } catch (err) {
    console.error("Bulk import error:", err);
    res.status(500).json({
      status: false,
      message: "Bulk insert failed",
      details: err.message,
      errors,
    });
  }
};

module.exports = { getAllSmtps, createSmtp, createSmtpBulk };
