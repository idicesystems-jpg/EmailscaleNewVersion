// helpers/mailHelpers.js
const nodemailer = require('nodemailer');

/**
 * --------------------------------------------------------------------------
 * send_mail() — Regular SMTP mail sender (like Laravel's send_mail helper)
 * --------------------------------------------------------------------------
 * Args required:
 *  - bodyMessage
 *  - to_name
 *  - to
 *  - subject
 *  - from_name
 *  - from_email
 *  - smtp_username
 *  - smtp_password
 *  - smtp_host
 *  - smtp_port
 */
async function send_mail(args) {
  try {
    const transporter = nodemailer.createTransport({
      host: args.smtp_host,
      port: args.smtp_port,
      secure: args.smtp_port === 465, // true for 465, false for others
      auth: {
        user: args.smtp_username,
        pass: args.smtp_password,
      },
    });

    const mailOptions = {
      from: `"${args.from_name}" <${args.from_email}>`,
      to: `"${args.to_name}" <${args.to}>`,
      subject: args.subject,
      text: args.bodyMessage,
      html: `<div>${args.bodyMessage}</div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Mail sent to ${args.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error in send_mail:', error.message);
  }
}

/**
 * --------------------------------------------------------------------------
 * send_mail1() — Gmail / G-Suite OAuth mail sender (like Laravel's send_mail1)
 * --------------------------------------------------------------------------
 * Args required:
 *  - bodyMessage
 *  - to_name
 *  - to
 *  - subject
 *  - from_name
 *  - from_email
 *  - smtp_username
 *  - smtp_password
 *  - smtp_host
 *  - smtp_port
 *  - refresh_token
 *  - id  (campaign ID)
 */
async function send_mail1(args) {
  try {
    // OAuth2 transport for G-Suite / Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: args.smtp_username,
        clientId: process.env.GSUITE_CLIENT_ID,        // set in .env
        clientSecret: process.env.GSUITE_CLIENT_SECRET, // set in .env
        refreshToken: args.refresh_token,
      },
    });

    const mailOptions = {
      from: `"${args.from_name}" <${args.from_email}>`,
      to: `"${args.to_name}" <${args.to}>`,
      subject: args.subject,
      text: args.bodyMessage,
      html: `<div>${args.bodyMessage}</div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`G-Suite mail sent to ${args.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error in send_mail1:', error.message);
  }
}

module.exports = { send_mail, send_mail1 };
