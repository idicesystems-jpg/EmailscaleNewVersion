const User = require('../models/User');
const RegisterPayment = require('../models/RegisterPayment');
const Domain = require('../models/Domain');
const { Op } = require("sequelize");
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require("uuid");



const saveDomainAndUser = async (req, res) => {
  try {
    const {
      purchase_date,
      expiry_date,
      domain_name,
      registered,
      create_new_user,
      user_id,
      fname,
      lname,
      email,
      password,
      phone,
      company_name
    } = req.body;
    console.log("Request Body:", req.body);

    // 1️⃣ Check if domain already exists
    const existingDomain = await Domain.findOne({ where: { domain: domain_name } });
    if (existingDomain) {
      return res.status(400).json({ success: false, message: "This domain already exists and is assigned." });
    }

    // 2️⃣ Validate required fields (manual basic validation)
    if (!domain_name) return res.status(422).json({ success: false, message: "Domain name is required." });
    if (create_new_user && (!fname || !lname || !email || !password)) {
      return res.status(422).json({ success: false, message: "User details are required when creating a new user." });
    }

    let userId;
    let userData = {};

    // 3️⃣ If create_new_user is true
    if (create_new_user) {
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        // Update existing user tools
        await existingUser.update({
          domains_tool: 1,
          email_verified_at: existingUser.email_verified_at || new Date(),
          updatedAt: new Date()
        });

        userId = existingUser.id;
        userData = existingUser;
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
          name: `${fname} ${lname}`,
          fname,
          lname,
          email,
          phone,
          company_name,
          password: hashedPassword,
          domains_tool: 1,
          role_id: 2,
          email_verified_at: new Date()
        });

        userId = newUser.id;
        userData = newUser;
      }
    } else {
      // 4️⃣ Existing user
      const user = await User.findByPk(user_id);
      if (!user) return res.status(404).json({ success: false, message: "User not found." });

      userId = user.id;
      userData = user;
    }

    // 5️⃣ Previous domains for this user
    const prevDomains = await Domain.findAll({
      where: { user_id: userId },
      attributes: ["request_info"]
    });

    const previousDomains = prevDomains
      .map(d => {
        try {
          const info = JSON.parse(d.request_info);
          return info?.result || [];
        } catch {
          return [];
        }
      })
      .flat();

    const allDomains = Array.from(new Set([...previousDomains, domain_name]));

    // 6️⃣ Create domain record
    const domainData = {
      order_id: "pm_" + uuidv4().replace(/-/g, "").slice(0, 24),
      domain: domain_name,
      purchase_date: purchase_date || null,
      expiry_date: expiry_date || null,
      registered,
      user_id: userId,
      fname: userData.fname || fname,
      lname: userData.lname || lname,
      email: userData.email || email,
      phone: userData.phone || phone,
      request_info: JSON.stringify({
        user_id: userId,
        fname: userData.fname || fname,
        lname: userData.lname || lname,
        email: userData.email || email,
        phone: userData.phone || phone,
        domain_name,
        result: allDomains
      })
    };

    await Domain.create(domainData);

    return res.status(200).json({ success: true, message: "Domain saved successfully." });

  } catch (error) {
    console.error("Error saving domain:", error);
    return res.status(500).json({ success: false, message: "Server error.", error: error.message });
  }
};

const getUserDomains = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate user_id
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Fetch domains for the given user_id
    const domains = await Domain.findAll({ where: { user_id } });

    if (domains.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No domains found for this user",
        data: [],
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: "Domains fetched successfully",
      data: domains,
    });
  } catch (error) {
    console.error("Error fetching user domains:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


module.exports = { saveDomainAndUser, getUserDomains };