const { Op } = require("sequelize");
const Ticket = require("../models/Ticket");
const User = require("../models/User"); // assuming you have this model
const Reply = require("../models/Reply"); // if you have replies table
const Notification = require("../models/Notification"); // if notifications table exists
const nodemailer = require("nodemailer");
const GHL_API_KEY = process.env.GHL_API_KEY;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
// const { emailTemplate } = require('../utils/emailTemplate'); // your existing function
// const { syncTicketToGHL } = require('../utils/ghlSync'); // your existing sync function

function emailTemplate(title, content, bottomHtml = "") {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;padding:20px">
      <h2 style="background:#d946ef;color:#fff;padding:10px">${title}</h2>
      <div style="padding:10px 0">${content}</div>
      <hr/>
      ${
        bottomHtml
          ? `<p style="font-size:12px;color:#888">${bottomHtml}</p>`
          : `<p style="font-size:12px;color:#888">⚠️ Please do not reply to this email. replies are not monitored.</p>`
      }
    </div>
  `;
}

async function getGHLContactIdByEmail(email) {
  try {
    const resp = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/?query=${email}`,
      {
        headers: { Authorization: `Bearer ${GHL_API_KEY}` },
      }
    );
    const data = await resp.json();
    return data.contacts?.[0]?.id || null;
  } catch (err) {
    console.error("Error fetching GHL contact:", err.message);
    return null;
  }
}

async function createGHLContact(email, firstName = "Guest", lastName = "User") {
  try {
    const resp = await fetch("https://rest.gohighlevel.com/v1/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, firstName, lastName }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.msg || JSON.stringify(data));
    return data.id;
  } catch (err) {
    throw new Error(`Failed to create contact: ${err.message}`);
  }
}

async function createTicketInGHL(
  contactId,
  ticketId,
  subject,
  message,
  priority
) {
  try {
    // Step 1: Fetch existing tags
    const getResp = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/${contactId}`,
      {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const contactData = await getResp.json();
    if (!getResp.ok)
      throw new Error(contactData.msg || JSON.stringify(contactData));

    const existingTags = contactData.tags || contactData.contact?.tags || [];

    //console.log("Existing tags:", existingTags);

    let updatedTags = [...existingTags];

    // Add general "Support" tag if not already present
    if (!updatedTags.includes("support")) {
      updatedTags.push("support");
    }

    // 2️⃣ Add new ticket-specific tag
    const ticketTag = `ticket #${ticketId}`;
    if (!updatedTags.includes(ticketTag)) {
      updatedTags.push(ticketTag);
    }

    //const updatedTags = [...new Set([...existingTags, `Support ticket # ${ticketId}`])];

    //console.log("Updated Tags:", updatedTags);
    // const updatedTags = [
    //   ...new Set([
    //     ...existingTags,
    //     String(`Ticket #:${ticketId}`),
    //     // String(subject || ""),
    //     // String(message || ""),
    //     // String(priority || "")
    //   ]),
    // ];

    // Step 2: Update contact with new tags
    const updateResp = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/${contactId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: updatedTags }),
      }
    );

    const data = await updateResp.json();
    if (!updateResp.ok) throw new Error(data.msg || JSON.stringify(data));
    return data;
  } catch (err) {
    throw new Error(`Failed to create ticket: ${err.message}`);
  }
}

async function syncTicketToGHL(
  userEmail,
  ticketId,
  subject,
  message,
  priority = "Medium"
) {
  try {
    let contactId = await getGHLContactIdByEmail(userEmail);

    if (!contactId) {
      //console.log("⚠️ Contact not found in GHL. Creating...");
      contactId = await createGHLContact(userEmail);
      //console.log("✅ Contact created with ID:", contactId);
    }

    const ticket = await createTicketInGHL(
      contactId,
      ticketId,
      subject,
      message,
      priority
    );
    return { success: true, ticketId: ticket.id };
  } catch (err) {
    console.error("❌ GHL sync error:", err.message);
    return { success: false, error: err.message };
  }
}

async function removeTicketFromGHL(userEmail, ticketId) {
  try {
    let contactId = await getGHLContactIdByEmail(userEmail);
    // Step 1: Fetch contact details (to get current tags)
    const getResp = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/${contactId}`,
      {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const contactData = await getResp.json();
    if (!getResp.ok)
      throw new Error(contactData.msg || JSON.stringify(contactData));

    // ✅ Safely extract existing tags
    const existingTags = contactData.tags || contactData.contact?.tags || [];

    let updatedTags = [...existingTags];

    //console.log("Existing Tags before removal:", existingTags);

    // Step 2: Filter out the ticket tag you want to remove
    const tagToRemove = `ticket #${ticketId}`.toLowerCase();
    updatedTags = updatedTags.filter(
      (tag) => tag.toLowerCase() !== tagToRemove.toLowerCase()
    );

    // Check if any ticket-specific tags remain
    const hasOtherTickets = updatedTags.some((tag) =>
      tag.toLowerCase().startsWith("ticket #")
    );

    // remove the general "Support" tag
    if (!hasOtherTickets) {
      updatedTags = updatedTags.filter(
        (tag) => tag.toLowerCase() !== "support"
      );
    }

    //console.log("Updated Tags after removal:", updatedTags);

    // Step 3: Update contact with the new tag list
    const updateResp = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/${contactId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: updatedTags }),
      }
    );

    const data = await updateResp.json();
    if (!updateResp.ok) throw new Error(data.msg || JSON.stringify(data));

    console.log(`Removed tag "${tagToRemove}" from contact ${contactId}`);
    //return data;
    return { success: true, contactId, removedTag: tagToRemove };
  } catch (err) {
    console.error("Error removing ticket tag:", err);
    throw new Error(`Failed to remove ticket from GHL: ${err.message}`);
  }
}

const createTicket = async (req, res) => {
  //check impersonation first
  const isImpersonating = !!req.impersonatedUser;

  const impersonatedUserId = req.impersonatedUser?.id;
  const impersonatedEmail = req.impersonatedUser?.email;

  try {
    const { subject, message, priority, user_id } = req.body;
    const createdBy = req.user.id;
    const file = req.file ? req.file.filename : null;
    //const userId = req.user.role_id === 1 && user_id ? user_id : req.user.id;
    let userId;

    // If impersonation is active, use impersonated user ID
    if (req.impersonatedUser) {
      userId = req.impersonatedUser.id;
    }
    // If logged-in user is an admin and provided user_id exists, use that
    else if (req.user.role_id === 1 || req.user.role_id === 0  && req.body?.user_id) {
      userId = req.body.user_id;
    }
    // Otherwise, use the logged-in user’s own ID
    else {
      userId = req.user.id;
    }

    //  Create ticket record
    const newTicket = await Ticket.create({
      user_id: userId,
      created_by: createdBy,
      subject,
      message,
      priority,
      file,
    });

    //  Create first reply
    if (message) {
      await Reply.create({
        ticket_id: newTicket.id,
        user_id: userId,
        message,
        file,
      });
    }

    //  Fetch user info
    const user = await User.findByPk(userId, {
      attributes: ["id", "email", "name", "role_id"],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userEmail = user.email;
    const userName = user.name;

    //  Fetch all admins except the creator
    const admins = await User.findAll({
      where: {
        role_id: 1,
        id: { [Op.ne]: userId },
      },
      attributes: ["id", "email"],
    });

    //  Create notifications for all admins
    for (const admin of admins) {
      await Notification.create({
        user_id: admin.id,
        email: admin.email,
        ticket_id: newTicket.id,
        type: "ticket_created",
        message: `${userName} created a new ticket #${newTicket.id}: ${subject}`,
        is_read: 0,
      });
    }

    //  Create notification for the ticket owner
    await Notification.create({
      user_id: userId,
      email: userEmail,
      ticket_id: newTicket.id,
      type: "ticket_created",
      message:
        req.user.role_id === 1
          ? `Admin created a new ticket #${newTicket.id} for you: ${subject}`
          : `Your ticket #${newTicket.id} has been created successfully: ${subject}`,
      is_read: 0,
    });

    //  Prepare email content
    const ticketId = newTicket.id;

    const adminContent = `
      <p><strong>Ticket #${ticketId}</strong> created by User : ${userName}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br/>${message}</p>
      <a href="https://help.emailscale.io/ticket/${ticketId}"
        style="background-color:#d946ef; border-color:#d946ef; display:inline-block; text-align:center; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;">
        Reply to Ticket #${ticketId}
      </a>`;

    const userContent = `
      <h2> We’ve Received Your Support Ticket</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for reaching out! We’ve received your support ticket.</p>
      <p>We use <strong>human support only — no AI</strong> — so you always get the personal touch you deserve.</p>
      <p><strong>Our support hours:</strong><br/>
      🕗 Monday to Friday, 8 AM – 8 PM (UK time)<br/>
      📅 Limited support on weekends.</p>
      <a href="https://help.emailscale.io/ticket/${ticketId}"
        style="background-color:#d946ef; border-color:#d946ef; display:inline-block; text-align:center; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;">
        Reply to Ticket #${ticketId}
      </a>
      <p>Thanks for your patience,<br><strong>The Support Team</strong></p>
    `;

    const bottomHtml = `⚠️ Please do not reply to this email. Replies are not monitored.
                        To get a response, click “Reply to Ticket” and log into your support dashboard.`;

    //  Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    //  Send admin email
    await transporter.sendMail({
      from: `"Ticket System" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `New Ticket #${ticketId}: ${subject}`,
      html: emailTemplate("New Ticket Submitted", adminContent, bottomHtml),
    });

    //  Send user confirmation email
    await transporter.sendMail({
      from: `"Ticket System" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Ticket Received: #${ticketId}`,
      html: emailTemplate("Ticket Confirmation", userContent, bottomHtml),
    });

    //  Sync with GHL (if applicable)
    const ghlResult = await syncTicketToGHL(
      userEmail,
      ticketId,
      subject,
      message,
      priority
    );
    if (!ghlResult.success) {
      return res.status(500).json({
        message: "Ticket created locally but failed to sync with GHL",
        ticket_id: ticketId,
        ghl_error: ghlResult.error,
      });
    }

    return res.json({
      status: true,
      message: "Ticket created and synced to GHL",
      ticket_id: ticketId,
      ghl_ticket_id: ghlResult.ticketId,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({
      status: false,
      message: "Server error: " + error.message,
    });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;

    const whereClause = {
      status: { [Op.ne]: "delete" }, // exclude deleted tickets
    };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch paginated tickets
    const { count, rows } = await Ticket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    return res.status(200).json({
      status: true,
      message: "Tickets fetched successfully.",
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching tickets",
      error: error.message,
    });
  }
};

const getTicketDetailById = async (req, res) => {
  try {
    const ticketId = req.params.id;

    if (!ticketId) {
      return res.status(400).json({
        status: false,
        message: "Ticket ID is required.",
        data: [],
      });
    }

    // Find ticket by ID (excluding deleted)
    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        status: { [Op.ne]: "delete" }, // not equal to 'delete'
      },
    });

    if (!ticket) {
      return res.status(404).json({
        status: false,
        message: "Ticket not found.",
        data: [],
      });
    }

    return res.status(200).json({
      status: true,
      message: "Ticket fetched successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
      data: [],
    });
  }
};

const replyTicket = async (req, res) => {
  try {
    const { ticket_id, message } = req.body;
    const userId = req.user.id;
    //console.log("req.file", req.file);
    const file = req.file ? req.file.filename : null;

    // 1️⃣ Insert reply
    await Reply.create({
      ticket_id,
      user_id: userId,
      message,
      file,
    });

    // 2️⃣ Fetch sender details
    const sender = await User.findByPk(userId, {
      attributes: ["id", "role_id", "email", "name"],
    });

    if (!sender) {
      return res.json({ message: "Reply posted" });
    }

    // 3️⃣ Determine recipient based on role_id
    let recipient;

    if (sender.role_id === 1) {
      // If admin, get the user who created the ticket
      const ticket = await Ticket.findOne({
        where: { id: ticket_id },
        include: [{ model: User, as: "user", attributes: ["id", "email"] }],
      });
      recipient = ticket?.user;
    } else {
      // If not admin, get the first admin user
      recipient = await User.findOne({
        where: { role_id: 1 },
        attributes: ["id", "email"],
      });
    }

    if (!recipient) {
      return res.json({ message: "Reply posted" });
    }

    // 4️⃣ Send email notification
    const replyContent = `
      <p><strong>${sender.name}</strong> replied to Ticket #${ticket_id}</p>
      <p><strong>Message:</strong><br/>${message}</p>
      <a 
        href="https://help.emailscale.io/ticket/${ticket_id}" 
        class="btn btn-primary w-100" 
        style="background-color:#d946ef; border-color:#d946ef; display:inline-block; text-align:center; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;"
      >
        Reply to Ticket #${ticket_id}
      </a>
    `;

    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: recipient.email,
      subject: `Reply to Ticket #${ticket_id}`,
      html: emailTemplate("New Reply", replyContent),
    });

    // 5️⃣ Create notifications for both
    await Notification.bulkCreate([
      {
        user_id: recipient.id,
        email: recipient.email,
        ticket_id,
        type: "ticket_reply",
        message: `${sender.name} replied on ticket #${ticket_id}`,
        is_read: 0,
      },
      {
        user_id: sender.id,
        email: sender.email,
        ticket_id,
        type: "ticket_reply",
        message: `You replied on ticket #${ticket_id}`,
        is_read: 0,
      },
    ]);

    // 6️⃣ Sync with GHL
    const subject = `Reply to Ticket #${ticket_id}`;

    const ghlResult = await syncTicketToGHL(
      recipient.email,
      ticket_id,
      "ticket_reply",
      message,
      "Medium"
    );

    await syncTicketToGHL(
      sender.email,
      ticket_id,
      "ticket_reply",
      message,
      "Medium"
    );

    if (ghlResult.success) {
      return res.json({
        message: "Reply posted and synced to GHL",
        ticket_id,
        ghl_ticket_id: ghlResult.ticketId,
      });
    } else {
      return res.status(500).json({
        message: "Reply posted but failed to create in GHL",
        ticket_id,
        ghl_error: ghlResult.error,
      });
    }
  } catch (error) {
    console.error("Error posting reply:", error);
    return res.status(500).json({
      message: "Reply failed",
      error: error.message,
    });
  }
};

const getReplies = async (req, res) => {
  const ticketId = req.params.id;

  if (!ticketId) {
    return res.status(400).json({ message: "Ticket ID is required" });
  }

  try {
    const replies = await Reply.findAll({
      where: { ticket_id: ticketId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"], // only fetch id and name
        },
      ],
      order: [["created_at", "ASC"]], // ascending order by created_at
    });

    res.json(replies);
  } catch (error) {
    console.error("Error fetching replies:", error);
    res
      .status(500)
      .json({ message: "Error fetching replies", error: error.message });
  }
};

const getUserTickets = async (req, res) => {
   //check impersonation first
  const isImpersonating = !!req.impersonatedUser;

  const impersonatedUserId = req.impersonatedUser?.id;
  const impersonatedEmail = req.impersonatedUser?.email;
  
   //const userId = req.user.role_id === 1 && user_id ? user_id : req.user.id;
    let userId;

    // If impersonation is active, use impersonated user ID
    if (req.impersonatedUser) {
      userId = req.impersonatedUser.id;
    }
    // If logged-in user is an admin and provided user_id exists, use that
    else if (req.user.role_id === 1 || req.user.role_id === 0  && req.body?.user_id) {
      userId = req.body.user_id;
    }
    // Otherwise, use the logged-in user’s own ID
    else {
      userId = req.user.id;
    }

  //const userId = req.user.id;
  const { status, priority, page = 1, limit = 10 } = req.query;

  try {
    // Build query conditions
    const where = {
      user_id: userId,
      status: { [Op.ne]: "delete" }, // exclude deleted tickets
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    // Fetch tickets with pagination
    const { count: total, rows: tickets } = await Ticket.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json({
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    res
      .status(500)
      .json({ message: "Error fetching tickets", error: error.message });
  }
};
const closeTicket = async (req, res) => {
  const ticketId = req.params.id;

  try {
    // 1️ Update ticket status
    const ticket = await Ticket.findOne({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = "closed";
    await ticket.save();

    // 2️ Fetch user details
    const user = await User.findByPk(ticket.user_id);
    const userName = user?.name || "User";
    const userEmail = user?.email;

    // 3️ Prepare email content
    const userContent = `
      <h2>Subject:  Your Support Ticket Has Been Closed</h2>
      <p>Hi ${userName},</p>
      <p>We hope we’ve resolved your issue. This ticket has now been closed.</p>
      <p>If you feel your issue hasn’t been fully resolved, don’t worry — you can simply open a new ticket, and we’ll be happy to help further.</p>
      <p>Thank you for contacting support,</p>
      <p><strong>The Support Team</strong></p>
    `;

    const adminContent = `<p>Your ticket <strong>#${ticketId}</strong> (<em>${ticket.subject}</em>) has been closed.</p>
     <p>Thank you for using our support system.</p>`;

    // 4️ Send emails
    const mailOptions = {
      from: `"Ticket System" <${process.env.SMTP_USER}>`,
      subject: `Ticket Closed: #${ticketId}`,
    };

    if (userEmail) {
      transporter.sendMail(
        {
          ...mailOptions,
          to: userEmail,
          html: emailTemplate("Ticket Closed", userContent),
        },
        (errU) => {
          if (errU) console.error("Failed to email user:", errU.message);
          else console.log(" Ticket closed email sent to user");
        }
      );
    }

    transporter.sendMail(
      {
        ...mailOptions,
        to: process.env.SMTP_USER,
        html: emailTemplate("Ticket Closed", adminContent),
      },
      (errA) => {
        if (errA) console.error(" Failed to email admin:", errA.message);
        else console.log(" Ticket closed email sent to admin");
      }
    );

    // 5️⃣ Notifications
    if (userEmail) {
      await Notification.create({
        user_id: ticket.user_id,
        email: userEmail,
        ticket_id: ticketId,
        type: "ticket_closed",
        message: `Your ticket #${ticketId} has been closed.`,
        is_read: 0,
      });
    }

    // Notify all admins (role_id = 1)
    const admins = await User.findAll({ where: { role_id: 1 } });
    const adminNotifications = admins.map((admin) => ({
      user_id: admin.id,
      email: admin.email,
      ticket_id: ticketId,
      type: "ticket_closed",
      message: `Ticket #${ticketId} has been closed by system`,
      is_read: 0,
    }));
    if (adminNotifications.length) {
      await Notification.bulkCreate(adminNotifications);
    }

    // 6️ Remove from GHL
    const ghlResult = await removeTicketFromGHL(userEmail, ticketId);

    res.json({
      message: "Ticket closed, all notified, GHL tags removed",
      ticketId,
      ghlResult,
    });
  } catch (error) {
    console.error(" closeTicket error:", error);
    res
      .status(500)
      .json({ message: "Failed to close ticket", error: error.message });
  }
};

const rateTicket = async (req, res) => {
  const ticketId = req.params.id;
  const { rating, feedback } = req.body;

  try {
    // Find the ticket and ensure it's closed
    const ticket = await Ticket.findOne({
      where: { id: ticketId, status: "closed" },
    });

    if (!ticket) {
      return res
        .status(404)
        .json({ message: "Ticket not found or not closed" });
    }

    // Update rating & feedback
    ticket.rating = rating;
    ticket.feedback = feedback;
    await ticket.save();

    res.json({ message: "Thank you for your feedback!" });
  } catch (error) {
    console.error(" rateTicket error:", error);
    res
      .status(500)
      .json({ message: "Failed to save rating", error: error.message });
  }
};

const deleteTicket = async (req, res) => {
  const ticketId = req.params.id;

  try {
    // Find the ticket
    const ticket = await Ticket.findOne({
      where: { id: ticketId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role_id"],
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Soft delete
    ticket.status = "delete";
    await ticket.save();

    const userEmail = ticket.user.email;
    const userName = ticket.user.name || "User";
    const subject = ticket.subject;

    //  User email content
    const userContent = `
      <h2>🧹 Ticket Deleted for System Tidiness</h2>
      <p>Hi ${userName},</p>
      <p>Don’t panic — we’ve deleted your ticket from our system to keep things clean and organised.</p>
      <p>This doesn’t affect your support in any way. If you need help again in the future, you can always open a new ticket.</p>
      <p>Best,</p>
      <p><strong>The Support Team</strong></p>
    `;

    //  Admin email content
    const adminContent = `
      <p>Your ticket <strong>#${ticketId}</strong> (<em>${subject}</em>) has been deleted.</p>
      <p>If you did not request this action, please contact support immediately.</p>
    `;

    const userHtml = emailTemplate("Ticket Deleted", userContent);
    const adminHtml = emailTemplate("Ticket Deleted", adminContent);

    const mailOptions = {
      from: `"Ticket System" <${process.env.SMTP_USER}>`,
      subject: `Ticket Deleted: #${ticketId}`,
    };

    // Send email to user
    transporter.sendMail(
      { ...mailOptions, to: userEmail, html: userHtml },
      (errU) => {
        if (errU) console.error(" Failed to email user:", errU.message);
        else console.log(" Ticket deleted email sent to user");
      }
    );

    // Send email to admin
    transporter.sendMail(
      { ...mailOptions, to: process.env.SMTP_USER, html: adminHtml },
      (errA) => {
        if (errA) console.error(" Failed to email admin:", errA.message);
        else console.log(" Ticket deleted email sent to admin");
      }
    );

    res.json({ message: "Ticket deleted and both notified" });
  } catch (error) {
    console.error(" deleteTicket error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete ticket", error: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const count = await Notification.count({
      where: {
        email,
        is_read: 0,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error(" getUnreadCount error:", error);
    res
      .status(500)
      .json({ message: "Error fetching count", error: error.message });
  }
};

const getNotificationsByEmail = async (req, res) => {
  const { email } = req.params;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const notifications = await Notification.findAll({
      where: { email },
      order: [["created_at", "DESC"]],
      attributes: [
        "id",
        "user_id",
        "email",
        "ticket_id",
        "type",
        "message",
        "is_read",
        "created_at",
      ],
    });

    res.json({ notifications });
  } catch (error) {
    console.error(" getNotificationsByEmail error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: error.message });
  }
};

const markNotificationsRead = async (req, res) => {
  const email = req.params.email;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    await Notification.update({ is_read: 1 }, { where: { email } });

    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications read:", error);
    res.status(500).json({
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
};

const assignTicket = async (req, res) => {
  try {
    const { ticket_id, assigned_to } = req.body;
    const roleId = req.user?.role_id;

    // Only Super Admin (role_id = 0) can assign
    if (roleId !== 0) {
      return res
        .status(403)
        .json({ message: "Only super admin can assign tickets" });
    }

    if (!ticket_id || !assigned_to) {
      return res
        .status(400)
        .json({ message: "ticket_id and assigned_to are required" });
    }

    // Find the ticket
    const ticket = await Ticket.findByPk(ticket_id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Verify the assigned user is an admin (role_id = 1)
    const adminUser = await User.findOne({
      where: { id: assigned_to, role_id: 1 },
    });

    if (!adminUser) {
      return res
        .status(400)
        .json({ message: "Assigned user must be an admin" });
    }

    // Update assignment
    ticket.assigned_to = assigned_to;
    await ticket.save();

    return res.status(200).json({
      message: `Ticket #${ticket_id} successfully assigned to admin (${adminUser.name})`,
      data: ticket,
    });
  } catch (err) {
    console.error("Error assigning ticket:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAdminList = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role_id: 1 },
      attributes: ["id", "name", "email"],
    });

    if (!admins.length) {
      return res.status(404).json({
        message: "No Admins Found",
        data: [],
      });
    }
    return res.status(200).json({
      status: true,
      message: "Admins fetched successfully",
      data: admins,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "internal Server Error",
      error: err.message,
    });
  }
};

const getTicketStatsCounter = async (req, res) => {
  try {
    // Current date
    const now = new Date();

    // Calculate date ranges
    const last24Hours = new Date(now);
    last24Hours.setDate(now.getDate() - 1);

    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 7);

    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);

    // Queries
    const last24hCount = await Ticket.count({
      where: { created_at: { [Op.gte]: last24Hours } },
    });

    const last7DaysCount = await Ticket.count({
      where: { created_at: { [Op.gte]: last7Days } },
    });

    const last30DaysCount = await Ticket.count({
      where: { created_at: { [Op.gte]: last30Days } },
    });

    // Response
    return res.status(200).json({
      status: true,
      message: "Ticket statistics fetched successfully",
      data: {
        last_24_hours: last24hCount,
        last_7_days: last7DaysCount,
        last_30_days: last30DaysCount,
      },
    });
  } catch (error) {
    console.error("Error fetching ticket stats:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching ticket statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicketDetailById,
  replyTicket,
  getReplies,
  getUserTickets,
  closeTicket,
  rateTicket,
  deleteTicket,
  getUnreadCount,
  getNotificationsByEmail,
  markNotificationsRead,
  assignTicket,
  getAdminList,
  getTicketStatsCounter
};
