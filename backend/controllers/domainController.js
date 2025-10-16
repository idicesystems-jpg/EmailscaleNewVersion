const User = require("../models/User");
const RegisterPayment = require("../models/RegisterPayment");
// const { Domain, User } = require("../models");
const Domain = require("../models/Domain");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const dayjs = require("dayjs");
const fs = require("fs");
const csv = require("csv-parser");
const { Parser } = require("json2csv");

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
      company_name,
    } = req.body;

    // 1️⃣ Check if domain already exists
    const existingDomain = await Domain.findOne({
      where: { domain: domain_name },
    });
    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: "This domain already exists and is assigned.",
      });
    }

    // 2️⃣ Validate required fields (manual basic validation)
    if (!domain_name)
      return res
        .status(422)
        .json({ success: false, message: "Domain name is required." });
    if (create_new_user && (!fname || !lname || !email || !password)) {
      return res.status(422).json({
        success: false,
        message: "User details are required when creating a new user.",
      });
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
          updatedAt: new Date(),
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
          email_verified_at: new Date(),
        });

        userId = newUser.id;
        userData = newUser;
      }
    } else {
      // 4️⃣ Existing user
      const user = await User.findByPk(user_id);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found." });

      userId = user.id;
      userData = user;
    }

    // 5️⃣ Previous domains for this user
    const prevDomains = await Domain.findAll({
      where: { user_id: userId },
      attributes: ["request_info"],
    });

    const previousDomains = prevDomains
      .map((d) => {
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
        result: allDomains,
      }),
    };

    await Domain.create(domainData);

    return res
      .status(200)
      .json({ success: true, message: "Domain saved successfully." });
  } catch (error) {
    console.error("Error saving domain:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error.", error: error.message });
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
const getDomainCreateData = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    // Build search condition
    const domainWhere = search
      ? {
          [Op.or]: [
            { domain: { [Op.like]: `%${search}%` } },
            { fname: { [Op.like]: `%${search}%` } },
            { lname: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    // Fetch domains with pagination and search
    const { rows: domains, count: total } = await Domain.findAndCountAll({
      where: domainWhere,
      order: [["id", "DESC"]],
      offset: parseInt(offset),
      limit: parseInt(limit),
      raw: true,
    });

    // Group domains by user_id
    const groupedDomains = domains.reduce((acc, domain) => {
      if (!acc[domain.user_id]) acc[domain.user_id] = [];
      acc[domain.user_id].push(domain);
      return acc;
    }, {});

    // Get first domain from first user group (if exists)
    const firstUserId = Object.keys(groupedDomains)[0];
    const firstDomain = firstUserId ? groupedDomains[firstUserId][0] : null;

    // Handle purchaseDate and expiryDate similar to Laravel logic
    const purchaseDate = req.query.purchase_date
      ? req.query.purchase_date
      : firstDomain
      ? dayjs(firstDomain.created_at).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");

    const expiryDate = req.query.expiry_date
      ? req.query.expiry_date
      : firstDomain
      ? dayjs(firstDomain.created_at).add(1, "year").format("YYYY-MM-DD")
      : dayjs().add(1, "year").format("YYYY-MM-DD");

    // Get all users who have domains_tool = 1 and match search
    const userWhere = search
      ? {
          domains_tool: 1,
          [Op.or]: [
            { fname: { [Op.like]: `%${search}%` } },
            { lname: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        }
      : { domains_tool: 1 };

    const users = await User.findAll({
      where: userWhere,
      attributes: ["id", "fname", "lname", "email"],
      order: [["fname", "ASC"]],
    });

    // Return data
    return res.status(200).json({
      success: true,
      data: {
        domains: groupedDomains,
        users,
        firstDomain,
        purchaseDate,
        expiryDate,
      },
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error in getDomainCreateData:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// const getDomainCreateData = async (req, res) => {
//   try {
//     // Fetch all domains ordered by ID descending
//     const domains = await Domain.findAll({
//       order: [["id", "DESC"]],
//       raw: true,
//     });

//     // Group domains by user_id
//     const groupedDomains = domains.reduce((acc, domain) => {
//       if (!acc[domain.user_id]) acc[domain.user_id] = [];
//       acc[domain.user_id].push(domain);
//       return acc;
//     }, {});

//     // Get first domain from first user group (if exists)
//     const firstUserId = Object.keys(groupedDomains)[0];
//     const firstDomain = firstUserId ? groupedDomains[firstUserId][0] : null;

//     // Handle purchaseDate and expiryDate similar to Laravel logic
//     const purchaseDate = req.query.purchase_date
//       ? req.query.purchase_date
//       : firstDomain
//       ? dayjs(firstDomain.created_at).format("YYYY-MM-DD")
//       : dayjs().format("YYYY-MM-DD");

//     const expiryDate = req.query.expiry_date
//       ? req.query.expiry_date
//       : firstDomain
//       ? dayjs(firstDomain.created_at).add(1, "year").format("YYYY-MM-DD")
//       : dayjs().add(1, "year").format("YYYY-MM-DD");

//     // Get all users who have domains_tool = 1
//     const users = await User.findAll({
//       where: { domains_tool: 1 },
//       attributes: ["id", "fname", "lname", "email"],
//       order: [["fname", "ASC"]],
//     });

//     // Return same data Laravel passes to Blade view
//     return res.status(200).json({
//       success: true,
//       data: {
//         domains: groupedDomains,
//         users,
//         firstDomain,
//         purchaseDate,
//         expiryDate,
//       },
//     });
//   } catch (error) {
//     console.error("Error in getDomainCreateData:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server Error",
//       error: error.message,
//     });
//   }
// };

const importDomainsCsv = async (req, res) => {
  try {
    const file = req.file;

    // Validate file
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "Missing CSV file upload." });
    }

    const filePath = file.path;
    const csvData = [];
    const errors = [];
    let importedCount = 0;

    // Read CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => csvData.push(row))
      .on("end", async () => {
        for (let index = 0; index < csvData.length; index++) {
          const row = csvData[index];
          const domainName = row["domainName"] || row["Domain Name"];
          const userName = row["userName"] || row["User Name"];
          const email = row["email"] || row["Email"];
          const purchaseDate = row["purchaseDate"] || row["Purchase Date"];
          const expiryDate = row["expiryDate"] || row["Expiry Date"];
          const statusLabel = row["statusLabel"] || row["Status"];

          // Check minimum required columns
          if (!domainName || !email || !purchaseDate || !expiryDate) {
            errors.push(`Row ${index + 2} skipped: incomplete data.`);
            continue;
          }

          // Validate and format dates
          let purchaseDateFormatted, expiryDateFormatted;
          try {
            purchaseDateFormatted = dayjs(purchaseDate, "MMMM D, YYYY").format(
              "YYYY-MM-DD"
            );
            expiryDateFormatted = dayjs(expiryDate, "MMMM D, YYYY").format(
              "YYYY-MM-DD"
            );
          } catch (e) {
            errors.push(`Row ${index + 2}: Invalid date format.`);
            continue;
          }

          // Find user by email
          const user = await User.findOne({ where: { email: email.trim() } });
          if (!user) {
            errors.push(
              `Row ${index + 2}: User not found with email ${email}.`
            );
            continue;
          }

          // Check if domain already exists
          const existingDomain = await Domain.findOne({
            where: { domain: domainName.trim() },
          });
          if (existingDomain) {
            errors.push(
              `Row ${index + 2}: Domain ${domainName} already exists.`
            );
            continue;
          }

          // Set user details
          const fname = user.fname || userName?.split(" ")[0] || "N/A";
          const lname = user.lname || userName?.split(" ")[1] || "N/A";
          const isActive =
            String(statusLabel).toLowerCase().trim() === "active" ? 1 : 0;

          // Get previous domains for this user
          const previousDomains = await Domain.findAll({
            where: { user_id: user.id },
            attributes: ["request_info"],
          });

          const allPrevious = previousDomains
            .map((d) => {
              try {
                const info = JSON.parse(d.request_info || "{}");
                return info.result || [];
              } catch {
                return [];
              }
            })
            .flat();

          const allDomains = [...new Set([...allPrevious, domainName.trim()])];

          // Insert new domain
          await Domain.create({
            fname,
            lname,
            email: email.trim(),
            phone: user.phone || null,
            user_id: user.id,
            domain: domainName.trim(),
            registered: isActive,
            purchase_date: purchaseDateFormatted,
            expiry_date: expiryDateFormatted,
            request_info: JSON.stringify({
              user_id: user.id,
              fname,
              lname,
              email,
              phone: user.phone || null,
              domain_name: domainName.trim(),
              result: allDomains,
            }),
            created_at: new Date(),
            updated_at: new Date(),
          });

          importedCount++;
        }

        // Delete the uploaded file after processing
        fs.unlinkSync(filePath);

        if (importedCount > 0 && errors.length === 0) {
          return res.status(200).json({
            success: true,
            message: `${importedCount} domains imported successfully.`,
          });
        } else if (importedCount > 0) {
          return res.status(200).json({
            success: true,
            message: `${importedCount} domains imported. Some rows had issues.`,
            details: errors,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "No domains were imported.",
            details: errors,
          });
        }
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
};

const updateDomainStatus = async (req, res) => {
  try {
    const { id } = req.params; // Domain ID from params
    const { status } = req.body; // Status from request body

    // Validation: status must be 0 or 1
    if (status !== 0 && status !== 1 && status !== "0" && status !== "1") {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Must be 0 or 1.",
      });
    }

    // Find the domain
    const domain = await Domain.findByPk(id);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found.",
      });
    }

    // Update the registered column
    domain.registered = status;
    await domain.save();

    // Send success response (like redirect in Laravel)
    return res.json({
      success: true,
      message: "Domain status updated successfully!",
      domain,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: err.message,
    });
  }
};

const destroyDomain = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the domain by ID
    const domain = await Domain.findByPk(id);
    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found.",
      });
    }

    // Get all domains for the same user
    const domains = await Domain.findAll({
      where: { user_id: domain.user_id },
    });

    let deletedCount = 0;
    let skippedCount = 0;

    for (const d of domains) {
      let registeredInfo = d.registered_info
        ? JSON.parse(d.registered_info)
        : {};
      let attributes = registeredInfo.data?.["@attributes"] || {};
      let isRegistered = attributes.Registered || "false";

      // Calculate expiry date: created_at + 1 year
      const expiryDate = dayjs(d.created_at).add(1, "year");
      const isExpired = dayjs().isAfter(expiryDate);

      // Delete only if not active or expired
      if (isRegistered !== "true" || isExpired) {
        await d.destroy(); // permanent delete
        deletedCount++;
      } else {
        skippedCount++;
      }
    }

    if (deletedCount > 0) {
      return res.json({
        success: true,
        message: `Deleted ${deletedCount} domain(s). ${
          skippedCount > 0
            ? `${skippedCount} domain(s) were active and not deleted.`
            : ""
        }`,
      });
    } else {
      return res.json({
        success: false,
        message: "No deletable domains found (active and non-expired).",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: err.message,
    });
  }
};

const exportDomainsCsv = async (req, res) => {
  try {
    console.log(req.query.selected_ids);
    const selectedIds = (req.query.selected_ids || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    // Fetch selected domains or all
    const domains = selectedIds.length
      ? await Domain.findAll({ where: { id: selectedIds } })
      : await Domain.findAll();

    const filename = `domains_list_${dayjs().format("YYYY-MM-DD")}.csv`;

    const csvFields = [
      "Domain",
      "User Name",
      "User Email",
      "Purchase Date",
      "Expiry Date",
      "Status",
    ];

    const csvData = [];
    const exportedDomainNames = [];

    domains.forEach((domain) => {
      const requestInfo = domain.request_info
        ? JSON.parse(domain.request_info)
        : {};
      let domainNames = [];
      if (Array.isArray(requestInfo.result)) {
        domainNames = requestInfo.result;
      } else if (requestInfo.domain_name) {
        domainNames = [requestInfo.domain_name];
      }

      const registeredInfo = domain.registered_info
        ? JSON.parse(domain.registered_info)
        : {};
      const attributes = registeredInfo.data?.["@attributes"] || null;
      const statusText = domain.registered === 1 ? "Active" : "Inactive";

      domainNames.forEach((domainName) => {
        if (!domainName || exportedDomainNames.includes(domainName)) return;
        exportedDomainNames.push(domainName);

        csvData.push({
          Domain: domainName,
          "User Name": `${domain.fname} ${domain.lname}`,
          "User Email": domain.email,
          "Purchase Date": dayjs(domain.created_at).format("MMM DD, YYYY"),
          "Expiry Date": dayjs(domain.created_at)
            .add(1, "year")
            .format("MMM DD, YYYY"),
          Status: statusText,
        });
      });
    });

    const json2csvParser = new Parser({ fields: csvFields });
    const csv = json2csvParser.parse(csvData);

    res.header("Content-Type", "text/csv");
    res.attachment(filename);
    return res.send(csv);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
};

module.exports = {
  saveDomainAndUser,
  getUserDomains,
  getDomainCreateData,
  importDomainsCsv,
  updateDomainStatus,
  destroyDomain,
  exportDomainsCsv,
};
