const Transaction = require('../models/Transaction');
const User = require('../models/User');
const SmtpAccount = require('../models/SmtpAccount');

const getAllSmtps = async (req, res) => {
  try {
    const rows = await SmtpAccount.findAll({
      attributes: [
        'id',
        'label',
        'from_name',
        'from_email',
        'smtp_host',
        'smtp_port',
        'smtp_secure',
        'daily_limit',
        'sent_today',
        'sent_today_date',
        'enabled',
        'last_verified_at',
        'created_at'
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({
      status: true,
      message: 'SMTP accounts fetched successfully',
      data: rows
    });
  } catch (error) {
    console.error(' Error fetching SMTP accounts:', error);
    res.status(500).json({
      status: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const createSmtp = async (req, res) => {
  try {
    const b = req.body;

    // Encrypt password before saving
    const enc = encrypt(b.smtp_pass);

    // Insert into database
    const newSmtp = await SmtpAccount.create({
      label: b.label || null,
      from_name: b.from_name || '',
      from_email: b.from_email,
      smtp_host: b.smtp_host,
      smtp_port: b.smtp_port || 465,
      smtp_secure: b.smtp_secure ? 1 : 0,
      smtp_user: b.smtp_user || b.from_email,
      smtp_pass: enc,
      daily_limit: b.daily_limit || 40,
      enabled: b.enabled ? 1 : 1,
    });

    res.status(201).json({
      status: true,
      message: 'SMTP account created successfully',
      id: newSmtp.id,
    });
  } catch (error) {
    console.error('Error creating SMTP account:', error);
    res.status(500).json({
      status: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {getAllSmtps, createSmtp};