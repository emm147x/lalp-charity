// LALP Initiative — website + donation server
// Serves the static site and creates Stripe Checkout Sessions for donations.
//
// Setup:
//   1. npm install
//   2. Copy .env.example to .env and fill in your own Stripe keys
//   3. npm start
//   4. Open http://localhost:3000

require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
const paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY || '';
const paymentProvider = (process.env.PAYMENT_PROVIDER || (paystackSecretKey ? 'paystack' : 'stripe')).toLowerCase();

const smtpHost = process.env.EMAIL_HOST;
const smtpPort = Number(process.env.EMAIL_PORT || 587);
const smtpUser = process.env.EMAIL_USER;
const smtpPass = process.env.EMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM || smtpUser || 'noreply@example.com';
const contactTo = process.env.CONTACT_TO || emailFrom;

const mailTransport = smtpHost && smtpUser && smtpPass
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
  : null;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'lalp-initiative',
    paymentProvider,
    stripeConfigured: Boolean(stripe),
    paystackConfigured: Boolean(paystackSecretKey),
    emailConfigured: Boolean(mailTransport)
  });
});

const designationLabels = {
  general: "Where it's needed most",
  maternal: 'Maternal Health Support',
  child: 'Child Welfare & Protection',
  justice: 'Access to Justice',
  welfare: 'Social & Welfare Empowerment'
};

const getOrigin = (req) => req.headers.origin || `${req.protocol}://${req.get('host')}`;

// ---------------------------------------------------------------
// POST /api/create-checkout-session
// Body: { amount (number), currency, frequency, name, email, designation }
// Returns: { url } — redirect the browser here to complete payment.
// ---------------------------------------------------------------
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { amount, currency = 'ngn', frequency = 'once', name, email, designation } = req.body || {};

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 1) {
      return res.status(400).json({ message: 'Please provide a valid donation amount.' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address.' });
    }

    const normalizedCurrency = String(currency || 'ngn').toLowerCase();
    const designationLabel = designationLabels[designation] || designationLabels.general;
    const origin = getOrigin(req);

    if (paymentProvider === 'paystack') {
      if (!paystackSecretKey) {
        return res.status(500).json({
          message: 'Paystack is not configured yet. Add PAYSTACK_SECRET_KEY to your .env file.'
        });
      }

      const paystackCurrency = normalizedCurrency === 'usd' ? 'USD' : 'NGN';
      const amountInLowestUnit = Math.round(numericAmount * 100);

      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: amountInLowestUnit,
          currency: paystackCurrency,
          reference: `lalp_${Date.now()}`,
          callback_url: `${origin}/success.html`,
          metadata: {
            custom_fields: [
              { display_name: 'Donor Name', variable_name: 'donor_name', value: name || '' },
              { display_name: 'Designation', variable_name: 'designation', value: designationLabel },
              { display_name: 'Donation Frequency', variable_name: 'frequency', value: frequency }
            ]
          }
        })
      });

      const paystackData = await paystackResponse.json();
      if (!paystackResponse.ok || !paystackData.status) {
        throw new Error(paystackData.message || 'Could not start Paystack checkout.');
      }

      return res.json({ url: paystackData.data.authorization_url, provider: 'paystack' });
    }

    if (!stripe) {
      return res.status(500).json({
        message: 'Payments are not configured yet. Add STRIPE_SECRET_KEY or PAYSTACK_SECRET_KEY to your .env file.'
      });
    }

    const unitAmount = Math.round(numericAmount * 100);
    const lineItem = {
      price_data: {
        currency: normalizedCurrency,
        product_data: {
          name: `Donation to LALP Initiative — ${designationLabel}`,
          description: 'Legal Aid for the Less Privileged Initiative — Egbeda pilot programme'
        },
        unit_amount: unitAmount,
        ...(frequency === 'monthly' ? { recurring: { interval: 'month' } } : {})
      },
      quantity: 1
    };

    const session = await stripe.checkout.sessions.create({
      mode: frequency === 'monthly' ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [lineItem],
      customer_email: email,
      metadata: {
        donor_name: name || '',
        designation: designationLabel
      },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`
    });

    res.json({ url: session.url, provider: 'stripe' });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ message: 'Something went wrong starting checkout. Please try again shortly.' });
  }
});

// ---------------------------------------------------------------
// POST /api/contact
// This is production-ready when SMTP settings are configured in .env.
// Without SMTP, the site will respond with a clear setup message instead
// of pretending the contact form is live.
// ---------------------------------------------------------------
app.post('/api/contact', async (req, res) => {
  try {
    const { name = '', email = '', reason = '', message = '' } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({
        message: 'Please complete the required fields before sending your message.'
      });
    }

    const trimmedEmail = String(email).trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return res.status(400).json({
        message: 'Please enter a valid email address.'
      });
    }

    if (!mailTransport) {
      console.warn('Contact email service is not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS, and CONTACT_TO in .env.');
      return res.status(503).json({
        message: 'Contact email service is not configured. Add SMTP settings to .env before going live.'
      });
    }

    const subject = reason ? `Website enquiry: ${reason}` : 'Website enquiry';
    const emailBody = `
Name: ${name}
Email: ${trimmedEmail}
Reason: ${reason || 'General enquiry'}

Message:
${message}
    `.trim();

    await mailTransport.sendMail({
      from: emailFrom,
      to: contactTo,
      replyTo: trimmedEmail,
      subject,
      text: emailBody,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${trimmedEmail}</p><p><strong>Reason:</strong> ${reason || 'General enquiry'}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`
    });

    res.json({ ok: true, message: 'Thank you — your message has been sent.' });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({
      message: 'Something went wrong while sending your message. Please try again shortly.'
    });
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`LALP Initiative website running at http://localhost:${PORT}`);
  if (!stripe) {
    console.log('⚠️  Stripe is not configured — the donate page will show a setup message until you add STRIPE_SECRET_KEY to .env');
  }
  if (!mailTransport) {
    console.log('⚠️  Email delivery is not configured — contact form is ready for live setup via SMTP settings in .env');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close the running process or set a different PORT in your .env file.`);
    process.exit(1);
  }

  console.error('Server startup failed:', error.message);
  process.exit(1);
});
