// controllers/emailController.js
const fs = require('fs');
const csv = require('csv-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const EmailCampaign = require('../models/EmailCampaign');

// File upload setup (same as Laravel file upload validation)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage }).single('file');

const saveEmailNew = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ status: false, message: 'File upload error: ' + err.message });
      }

      if (!req.file) {
        return res.status(400).json({ status: false, message: 'No file uploaded.' });
      }

      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

      if (lines.length <= 1) {
        return res.status(400).json({ status: false, message: 'CSV is empty or has only headers.' });
      }

      const headers = lines.shift().split(',').map(h => h.trim());
      const requiredHeaders = [
        'email', 'first_name', 'last_name',
        'imap_username', 'imap_password', 'imap_host', 'imap_port'
      ];

      // Validate headers
      for (const header of requiredHeaders) {
        if (!headers.includes(header)) {
          return res.status(400).json({ status: false, message: `Missing header: ${header}` });
        }
      }

      let successCount = 0;
      let errors = [];

      for (let i = 0; i < lines.length; i++) {
        const row = lines[i].split(',').map(col => col.trim());
        if (row.length < 7) continue;

        const [
          email, first_name, last_name,
          imap_username, imap_password, imap_host, imap_port
        ] = row;

        const rowNum = i + 2; // because line 1 is header

        //  Validation
        if (!imap_username || !imap_password || !email) {
          errors.push(`Row ${rowNum}: Missing required fields.`);
          continue;
        }

        //  Check for duplicate IMAP username
        const exists = await EmailCampaign.findOne({ where: { imap_username } });
        
        if (exists) {
          errors.push(`Row ${rowNum}: IMAP username '${imap_username}' already exists.`);
          continue;
        }

        try {
          //  Verify SMTP connection
          const transporter = nodemailer.createTransport({
            host: imap_host || 'smtp.gmail.com',
            port: imap_port ? parseInt(imap_port) : 587,
            secure: false,
            auth: {
              user: imap_username,
              pass: imap_password
            }
          });

          await transporter.verify();

          //  Save record to DB
          await EmailCampaign.create({
            email,
            first_name,
            last_name,
            imap_username,
            imap_password,
            imap_host,
            imap_port,
            campaign_id: 1,
            user_id: 1, // Replace with dynamic user ID if needed
            message: 'Imported successfully',
            email_status: 1
          });

          successCount++;
        } catch (smtpErr) {
          errors.push(`Row ${rowNum}: Connection failed - ${smtpErr.message}`);
        }
      }

      return res.json({
        status: successCount > 0,
        message: `${successCount} record(s) imported successfully.`,
        errors: errors
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Server Error: ' + error.message
    });
  }
};

const deleteEmailAccount = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if record exists
    const record = await EmailCampaign.findByPk(id);
    if (!record) {
      return res.status(404).json({ status: false, message: 'Email record not found.' });
    }

    // Delete the record
    await EmailCampaign.destroy({ where: { id } });

    return res.json({ status: true, message: 'Email deleted successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Server error.' });
  }
};


module.exports = { saveEmailNew, deleteEmailAccount };
