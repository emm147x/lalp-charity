# LALP Initiative — Website & Donation System

A complete website for the LALP Initiative (Legal Aid for the Less Privileged
Initiative), built from the organization's charity proposal, with a working
donation checkout powered by Stripe.

## What's included

- **Pages:** Home, About, Programs, Impact & Budget, Contact, Donate,
  plus donation Success/Cancel pages.
- **Design:** a custom visual identity (forest green + gold, in line with the
  LALP mark) — not a generic template.
- **Payments:** a small Node/Express server that creates real Stripe Checkout
  Sessions for one-time and monthly donations. Stripe hosts the actual
  payment form, so card numbers never touch your server.
- **Contact form:** a working front-end form posting to `/api/contact`
  (currently logs the message server-side — wire it to email/CRM before
  launch, see below).

## Requirements

- [Node.js](https://nodejs.org) version 18 or later
- A free [Stripe](https://dashboard.stripe.com/register) account (to accept
  real payments — the site runs without one, but donations won't work)

## 1. Install

Unzip this project, then open a terminal in the folder and run:

```bash
npm install
```

## 2. Add your Stripe key

Duplicate `.env.example` as `.env`:

```bash
cp .env.example .env
```

Open `.env` and paste in your Stripe **secret key** (Dashboard → Developers →
API keys). Start with a **test** key (`sk_test_...`) so you can try the whole
flow with Stripe's test cards before going live:

```
STRIPE_SECRET_KEY=sk_test_...
```

Stripe's test card number is `4242 4242 4242 4242`, any future expiry date,
any 3-digit CVC, and any postal code.

## 3. Run it

```bash
npm start
```

Then open **http://localhost:3000** in your browser. That's the whole site —
click through Home, About, Programs, Impact, Contact, and Donate.

## 4. Test a donation

1. Go to the Donate page, choose an amount, fill in name/email, and submit.
2. You'll be redirected to Stripe's own secure checkout page.
3. Pay with the test card above.
4. You'll land back on the Success page, and Stripe will have emailed a
   receipt to the test email you entered (check Stripe's Dashboard →
   Payments to confirm the transaction).

## Going live

1. In Stripe, switch from test mode to live mode and copy your **live**
   secret key into `.env` (`sk_live_...`).
2. Complete Stripe's account activation (business details, bank account)
   so payouts can reach your organization's bank account.
3. Deploy `server.js` somewhere that can run Node.js continuously — e.g.
   Render, Railway, Fly.io, a VPS, or similar (not a static host, since the
   donation flow needs the server). Set `STRIPE_SECRET_KEY` as an
   environment variable there instead of a local `.env` file.
4. Point your domain (`lalpiniviative.com.ng`) at that deployment.
5. Wire the contact form's `/api/contact` handler in `server.js` to an
   actual email service (e.g. Nodemailer with your email provider, or
   SendGrid/Mailgun) so messages reach your inbox — right now it only logs
   to the server console.
6. Optional but recommended: add a Stripe webhook endpoint to record
   successful donations in a database automatically, rather than relying on
   the Stripe Dashboard alone.

## Editing content

- Page text lives directly in the `.html` files in `public/` — search for the
  text you want to change.
- Colors, fonts, and spacing are all defined once in `public/css/style.css`
  under `:root` at the top of the file.
- Suggested donation amounts are set in `public/donate.html` inside the
  `#amount-grid` block.

## Folder structure

```
lalp-charity/
├── server.js              # Express server + Stripe Checkout endpoint
├── package.json
├── .env.example            # Copy to .env and add your Stripe key
├── public/
│   ├── index.html
│   ├── about.html
│   ├── programs.html
│   ├── impact.html
│   ├── contact.html
│   ├── donate.html
│   ├── success.html
│   ├── cancel.html
│   ├── css/style.css
│   └── js/ (main.js, donate.js)
```
