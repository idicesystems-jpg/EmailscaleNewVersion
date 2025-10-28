const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SmtpAccount = require('../models/SmtpAccount');
const bcrypt = require("bcrypt");


const createPaymentIntent = async (req, res) => {
  try {
    const {
      save_contact_details,
      fname,
      lname,
      email,
      organization,
      address1,
      address2,
      postal_code,
      city,
      state,
      country,
      name,
      user_id,
      amount,
      paymentMethodId,
      result,
      allamout
    } = req.body;

    if (save_contact_details) {
      const contact_details = {
        fname,
        lname,
        email,
        organization,
        line1: `${address1 || ""} ${address2 || ""}`.trim(),
        postal_code,
        city,
        state,
        country,
      };

      await User.update(
        { contact_details: JSON.stringify(contact_details) },
        { where: { id: user_id } }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in smallest currency unit (e.g., pence)
      currency: "gbp",
      payment_method: paymentMethodId,
      confirmation_method: "manual",
      confirm: true,
      return_url: `${process.env.APP_URL || "https://yourdomain.com"}/api/payment_confirm`,
      description: "Software development services",
      shipping: {
        name: name || `${fname} ${lname}`,
        address: {
          line1: `${address1 || ""} ${address2 || ""}`.trim(),
          postal_code,
          city,
          state,
          country,
        },
      },
    });

    if (result && Array.isArray(result)) {
      for (let i = 0; i < result.length; i++) {
        const domainName = result[i];
        if (!domainName) continue;

        // Save domain
        await Domain.create({
          fname,
          lname,
          email,
          user_id,
          domain_type: "auto",
          domain: domainName,
          order_id: paymentMethodId,
          request_info: JSON.stringify(req.body),
        });

  
        await Transaction.create({
          user_id,
          txn_id: paymentIntent.id,
          email,
          domain: domainName,
          response: JSON.stringify(paymentIntent),
          txn_amount: allamout ? allamout[i] : amount,
          txn_status: paymentIntent.status,
        });
      }
    }

    return res.json({
      success: true,
      paymentIntent,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentIntent,
};