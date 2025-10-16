const User = require('../models/User');
const RegisterPayment = require('../models/RegisterPayment');
const Domain = require('../models/Domain');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const { crteate_crm_user } = require('../helpers/crmHelper');
const { Parser } = require('json2csv');


const login = async (req, res) => {
    try {
        // 1. Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                status: false,
                message: 'Validation Error',
                error: errors.array()[0].msg,
                data: []
            });
        }

        const { email, password } = req.body;

        // 2. Find user
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(200).json({
                status: false,
                message: 'User Not Found..!!',
                data: []
            });
        }

        if (!user.status) {
            return res.status(200).json({
                status: false,
                message: 'Account disabled by admin!!!',
                data: []
            });
        }

        // 3. Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(422).json({
                status: false,
                message: 'Invalid Login Details',
                data: []
            });
        }

        // 4. Generate emailscale_token if not exists
        let token = user.emailscale_token;
        if (!token) {
            token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1d' });
            user.emailscale_token = token;
            await user.save();
        }

        // 5. Google 2FA
        let google2fa_response = null;
        if (!user.google2fa_secret) {
            const secret = speakeasy.generateSecret({ name: 'EmailScale' });
            user.google2fa_secret = secret.base32;
            await user.save();

            google2fa_response = {
                qr_code: secret.otpauth_url, // Convert to QR image in frontend if needed
                secret: secret.base32,
                require_otp: true
            };
        } else {
            google2fa_response = {
                require_otp: true,
                email: user.email
            };
        }

        // 6. Return response
        return res.status(200).json({
            status: true,
            message: 'Login Successfully!!!',
            user: {
                id: user.id,
                name: user.name,
                fname: user.fname,
                lname: user.lname,
                email: user.email,
                payment_status: user.payment_status,
                role_id: user.role_id,
                status: user.status,
                email_tool: user.email_tool,
                domains_tool: user.domains_tool,
                warm_up_tool: user.warm_up_tool,
                ghl_tool: user.ghl_tool,
                ghl_apikey: user.ghl_apikey,
                google2fa_secret: user.google2fa_secret
            },
            emailscale_token: token,
            ...google2fa_response
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: 'Server Error', data: [] });
    }
};
const register = async (req, res) => {
    // Validate input
    await body('name').notEmpty().withMessage('Name is required').isLength({ max: 100 }).run(req);
    await body('email').notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email')
        .isLength({ max: 200 }).run(req);
    await body('password').notEmpty().withMessage('Password is required').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: false,
            message: 'Validation Error',
            error: errors.array()[0].msg,
            data: []
        });
    }

    const { name, email, password } = req.body;

    try {
        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(422).json({
                status: false,
                message: 'Validation Error',
                error: 'Email already exists',
                data: []
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            status: 1,
            email_verified_at: new Date()
        });

        return res.status(200).json({
            status: true,
            message: 'Registration successfully, Please login.',
            user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};


const getUsers = async (req, res) => {
    try {
        // Select all users
        const users = await User.findAll(); // SELECT * FROM users
        return res.status(200).json({
            status: true,
            users
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

const getUsersWithoutPagination = async (req, res) => {
    try {
        // Select all users
        const users = await User.findAll(); // SELECT * FROM users
        return res.status(200).json({
            status: true,
            users
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};


const addUser = async (req, res) => {
    try {
        const { fname, lname, email, password, company_name } = req.body;

        // 1️⃣ Validate request
        if (!fname || !lname || !email || !password) {
            return res.status(422).json({
                status: false,
                message: 'Validation error',
                error: 'fname, lname, email, and password are required',
            });
        }

        // Check unique email
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(422).json({
                status: false,
                message: 'Validation error',
                error: 'Email already exists',
            });
        }

        // 2️⃣ Generate random paymentMethodId
        const paymentMethodId = 'pm_' + crypto.randomBytes(10).toString('hex');

        // 3️⃣ Create the user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: `${fname} ${lname}`,
            fname,
            lname,
            email,
            company_name: company_name || null,
            password: hashedPassword,
            status: 1,
            payment_status: 1,
            email_tool: !!req.body.email_tool,
            domains_tool: !!req.body.domains_tool,
            warm_up_tool: !!req.body.warm_up_tool,
            email_verified_at: new Date() // set email_verified_at
        });

        // 4️⃣ Call CRM helper function
        await crteate_crm_user(req.body);

        // 5️⃣ Create related RegisterPayment record
        await RegisterPayment.create({
            name: `${fname} ${lname}`,
            paymentMethodId,
            amount: 0,
            fname,
            lname,
            email,
            payment_mode: 'manual'
        });

        // 6️⃣ Send response
        return res.status(200).json({
            status: true,
            message: 'User added successfully',
            user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params; 
        const {
            fname,
            lname,
            status,
            email_tool,
            domains_tool,
            warm_up_tool,
            ghl_tool,
            password,
            email,
            amount
        } = req.body;


        // Prepare user update data
        const data = {
            name: `${fname} ${lname}`,
            fname,
            lname,
            status,
            email_tool: !!email_tool,
            domains_tool: !!domains_tool,
            warm_up_tool: !!warm_up_tool,
            ghl_tool: !!ghl_tool
        };

        // Hash password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            data.password = hashedPassword;
        }

        // Update User
        await User.update(data, { where: { id } });

        // Update RegisterPayment
        if (amount && email) {
            const amountInCents = amount * 100;
            await RegisterPayment.update(
                { amount: amountInCents },
                { where: { email } }
            );
        }

        return res.json({
            status: true,
            message: 'User updated successfully',
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;         // <-- get id from URL
        const { status } = req.body;

        // Validate status
        if (![0, 1].includes(Number(status))) {
            return res.status(400).json({
                status: false,
                message: 'Invalid status. Must be 0 or 1.'
            });
        }

        // Check if user exists
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found'
            });
        }

        // Update status
        await User.update({ status }, { where: { id } });

        return res.json({
            status: true,
            message: 'User status updated successfully'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the user
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete associated records
        await RegisterPayment.destroy({ where: { email: user.email } });
        await Domain.destroy({ where: { user_id: id } });

        // Delete the user
        await user.destroy();

        // Return success response
        return res.json({
            success: true,
            name: user.name
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }
};

const exportCsv = async (req, res) => {
  try {
    // Fetch all users
    const users = await User.findAll();

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No users found",
      });
    }

    // Prepare CSV fields (header)
    const fields = [
      { label: 'User Name', value: 'name' },
      { label: 'Email', value: 'email' },
      { label: 'Company Name', value: row => row.company_name || 'N/A' },
      { label: 'Status', value: row => row.status === 1 ? 'Active' : 'Blocked' },
      { label: 'Main Domain', value: row => row.domain || 'No Domain' },
      { label: 'Email Verification', value: row => row.email_tool ? 'Enabled' : 'Disabled' },
      { label: 'Email Warmup', value: row => row.warm_up_tool ? 'Enabled' : 'Disabled' },
      { label: 'Inbox Setup', value: row => row.domains_tool ? 'Enabled' : 'Disabled' },
    ];

    // Convert to CSV
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(users);

    // Set headers for file download
    res.header('Content-Type', 'text/csv');
    res.attachment('users_data.csv');
    res.send(csv);

  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};



module.exports = {
  login,
  register,
  getUsers,
  updateUser,
  addUser,
  updateStatus,
  deleteUser,
  exportCsv,
  getUsersWithoutPagination
};
