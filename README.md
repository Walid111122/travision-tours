# Travision Tours

Travision Tours is a React and TypeScript storefront for Egypt travel packages,
day tours, shore excursions, and custom itineraries.

## Local development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

The local site is available at `http://localhost:3000`.

### Local booking API

The booking workflow uses a Cloudflare Worker and a local D1 database. No
Cloudflare account, production database, or domain is required for local work.

Apply migrations once:

```bash
npm run db:migrate:local
```

Then use two terminals:

```bash
npm run dev:worker
npm run dev
```

Vite proxies `/api` requests to the local Worker on port `8787`.

Booking requests begin with the `new` status. The supported manual workflow is:

```text
new → quoted → awaiting_transfer → payment_verification → confirmed
                                                        ↘ cancelled
```

Submitting a request does not confirm a reservation. After a quotation is
accepted, the travel partner provides a secure Visa, Mastercard, or Apple Pay
checkout link, or official wire-transfer instructions. Payment details are
never stored in frontend code, and Travision Tours does not collect payment.

Each new inquiry records the version of the website inquiry/payment policy that
the customer acknowledged, the acceptance timestamp, and the disclosed payment
recipient. Final quotation and tour-specific policy acceptance will be stored
separately when that workflow is implemented.

## Quality checks

```bash
npm run lint
npm run build
```

## Cloudflare (not deployed yet)

The repository includes `wrangler.jsonc` for a future Cloudflare Workers Static
Assets deployment. It serves `dist` and falls back to `index.html` for React
Router routes.

When the application is ready to host:

```bash
npm run build
npx wrangler deploy
```

Do not put provider API keys in Vite client environment variables. Booking,
email, authentication, payments, and AI calls should be implemented in Worker
API routes, with secrets configured through Cloudflare.
