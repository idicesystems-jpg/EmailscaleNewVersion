const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');



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
            token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '7d' });
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

module.exports = {
  login,
  register
};
