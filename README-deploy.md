# Deployment guide

## Render deployment

1. Push this project to GitHub.
2. In Render, click New > Web Service.
3. Connect the GitHub repository.
4. Use the following values:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add these environment variables in Render:
   - `PAYMENT_PROVIDER` = `paystack`
   - `PAYSTACK_SECRET_KEY` = your Paystack secret key
   - `PAYSTACK_PUBLIC_KEY` = your Paystack public key
   - `STRIPE_SECRET_KEY` = your Stripe secret key (optional fallback)
   - `PORT` = `10000`
   - `HOST` = `0.0.0.0`
   - `EMAIL_HOST` = `smtp.gmail.com`
   - `EMAIL_PORT` = `587`
   - `EMAIL_USER` = your Gmail address
   - `EMAIL_PASS` = your Gmail App Password
   - `EMAIL_FROM` = your Gmail address
   - `CONTACT_TO` = hello@lalpinitiative.org

## Local run

```bash
npm run start
```

Then open http://localhost:3000
