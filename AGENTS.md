# AGENTS.md

## Project overview
This repo is a small charity website for the LALP Initiative. It is a static front-end served by an Express server and uses Stripe Checkout for donations.

- App entry: `server.js`
- Front-end pages: `public/*.html`
- Shared styling: `public/css/style.css`
- Shared UI scripts: `public/js/main.js`
- Donation flow logic: `public/js/donate.js`
- Product docs: [README.md](README.md)

## Working conventions
- Keep content changes in the HTML files under `public/` unless the change is clearly backend-related.
- Keep styling in `public/css/style.css` rather than inline CSS.
- Keep client-side behavior in the JS files under `public/js/`.
- Keep API logic in `server.js`; do not add business logic to the static pages.
- Keep donation-related changes aligned across both the browser form and the server route.

## Local development
- Install dependencies: `npm install`
- Start the app: `npm start`
- Local URL: `http://localhost:3000`
- Node version: 18+
- Copy `.env.example` to `.env` and set `STRIPE_SECRET_KEY` before testing real donations.

## Important runtime behavior
- The app runs without Stripe configured, but donation checkout will fail with a clear error message until `STRIPE_SECRET_KEY` is present.
- The contact form endpoint at `/api/contact` is intentionally a demo endpoint and should be wired to a real email/CRM service before launch.
- Donation amounts are passed as Naira values from the browser; the server converts them to Stripe's smallest currency unit.

## Files to check before changing behavior
- Donation flow: `server.js`, `public/js/donate.js`, `public/donate.html`
- Contact flow: `server.js`, `public/js/main.js`, `public/contact.html`
- Site-wide styling: `public/css/style.css`
- Product documentation: [README.md](README.md)

## Validation
- There is no automated test suite in this repo.
- Validate changes by starting the app with `npm start` and checking the affected route or form flow in a browser.
- For donation changes, test the checkout flow with Stripe test credentials and the test card `4242 4242 4242 4242`.

## Avoid
- Do not add frameworks or a build pipeline for a site this small unless the task explicitly requires it.
- Do not move pages out of `public/` or change the server's static serving layout without updating the affected routes.
- Do not duplicate content that already exists in [README.md](README.md); link to it instead of re-explaining it here.
