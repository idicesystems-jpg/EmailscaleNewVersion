// const { User, Domain, Transaction } = require("../models");
const Stripe = require("stripe");
const User = require("../models/User");
const Domain = require("../models/Domain");
const Transaction = require("../models/Transaction");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      user_id,
      amount,
      paymentMethodId,
      result,
      allamout,
    } = req.body;

    // 1 Save contact details
    if (save_contact_details) {
      const contactDetails = {
        fname,
        lname,
        email,
        organization,
        line1: `${address1} ${address2}`,
        postal_code,
        city,
        state,
        country,
      };
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // await User.update(
      //   { contact_details: JSON.stringify(contactDetails) },
      //   { where: { id: user_id } }
      // );
    }

    // ------------------------------------------------------
    // 2) Create Customer (REQUIRED FOR INDIA EXPORT)
    // ------------------------------------------------------
    const customer = await stripe.customers.create({
      name: `${fname} ${lname}`,
      email,
      address: {
        line1: `${address1} ${address2}`,
        postal_code,
        city,
        state,
        country,
      },
      shipping: {
        name: `${fname} ${lname}`,
        address: {
          line1: `${address1} ${address2}`,
          postal_code,
          city,
          state,
          country,
        },
      },
    });

    // 2) Set payment method as default for the customer
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // 2️ Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method: paymentMethodId,
      confirmation_method: "manual",
      confirm: true,
      return_url: "https://your-domain/api/payment_confirm",
      description: "Software development services",
      shipping: {
        name: `${fname} ${lname}`,
        address: {
          line1: `${address1} ${address2}`,
          postal_code,
          city,
          state,
          country,
        },
      },
    });

    // 3️ Store domains + transactions
    if (result && Array.isArray(result)) {
      for (let index = 0; index < result.length; index++) {
        const domainValue = result[index];

        const emailsForDomain = req.body.domainEmails
          ? req.body.domainEmails[domainValue] || []
          : [];

        if (domainValue) {
          await Domain.create({
            fname,
            lname,
            email,
            user_id,
            domain_type: "auto",
            domain: domainValue,
            order_id: paymentMethodId,
            request_info: JSON.stringify(req.body),
            domain_emails: JSON.stringify(emailsForDomain),
          });

          await Transaction.create({
            user_id,
            txn_id: paymentIntent.id,
            email,
            domain: domainValue,
            response: JSON.stringify(paymentIntent),
            txn_amount: allamout[index],
            txn_status: paymentIntent.status,
          });
        }
      }
    }

    return res.json({
      success: true,
      paymentIntent,
    });
  } catch (error) {
    console.error(error);

    return res.json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentIntent,
};
