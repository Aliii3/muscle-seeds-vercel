# Muscle Seeds Creator Portal — Vercel edition

Standard Next.js source, ready for a GitHub repository and Vercel. No ChatGPT account or permission is required. This is a separate installation: no data or credentials from the ChatGPT-hosted preview are included.

## What is included

- Email sign-in through Clerk; each creator sees only their assigned code's sales.
- Administrator creator directory and existing Shopify promo-code assignments.
- Paid orders only; pending cash-on-delivery orders stay out until Shopify marks them paid.
- Canceled and fully refunded orders excluded from both paid-order counts and sales value.
- Partial refunds reduce net sales. Dates, search, charts, CSV exports, and separate sample mode.
- Encrypted Shopify credentials and automatic app-token renewal with client credentials.
- Persistent Turso SQLite database, migration script, and reporting tests.

## 1. Add to GitHub

Extract the ZIP. Upload the **contents** of the `muscle-seeds-vercel` folder to the root of your GitHub repository. `package.json` must be at the repository root. GitHub's browser upload can hide dotfiles; include `.env.example` and `.gitignore` too, or use GitHub Desktop to publish the whole folder. Do not upload `.env.local`, secrets, `node_modules`, or `.next`.

## 2. Create email login (Clerk)

Create an application at https://dashboard.clerk.com. Enable email sign-in with email verification (email codes are convenient). Copy the publishable key and secret key into the environment variables described below. Configure the production domain after Vercel gives you the final URL, and use Clerk production keys for the live app. The sign-in and sign-up pages are already implemented.

Anyone may create a verified login, but only the administrator email or creator emails explicitly added by the administrator can read app data. Configure `ADMIN_EMAIL` before the first visit. Use the same email for your verified Clerk account. Administrator ownership is pinned to that account's Clerk user ID after setup; changing accounts or Clerk instances requires an intentional administrator migration.

## 3. Create the database (Turso)

Create a Turso database at https://turso.tech or connect Turso through Vercel Marketplace. Copy its database URL and auth token. The database must be compatible with `@libsql/client` / SQLite. Data persists outside Vercel's temporary function filesystem.

On your computer, install Node.js 22.13 or newer, then run from this folder:

```sh
npm ci
cp .env.example .env.local
```

Fill `.env.local` with your Clerk keys, Turso credentials, administrator email, and app URL. Generate the encryption key with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the generated value into `CREDENTIAL_ENCRYPTION_KEY`. Keep it private and stable: replacing it requires reconnecting Shopify.

Apply the schema using the command below, or sign in as the configured administrator and click **Initialize database** if the portal reports that its tables are missing:

```sh
npm run db:migrate
```

The migration command is safe to repeat: it records checksums of applied SQL files. It does not insert sample users or orders. Keep local and production database credentials distinct if you use separate databases.

## 4. Deploy to Vercel

Import the GitHub repository into Vercel. Framework: **Next.js**. Root directory: repository root. Node.js: **22.x** or newer supported LTS. Default install/build commands work; the included build script uses `next build --webpack`.

Add these environment variables in Vercel Project → Settings → Environment Variables:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` |
| `ADMIN_EMAIL` | Your verified administrator login email |
| `TURSO_DATABASE_URL` | Your Turso database URL |
| `TURSO_AUTH_TOKEN` | Your Turso database auth token |
| `CREDENTIAL_ENCRYPTION_KEY` | Generated 32-byte base64 key |
| `APP_URL` | Exact final HTTPS portal origin, without a trailing path |

Deploy. If your final domain was not known initially, set `APP_URL` to the assigned Vercel URL and redeploy. Configure the same production domain in Clerk. For a preview deployment, give it its own matching `APP_URL` and development Clerk keys/database; a canonical-origin mismatch intentionally rejects writes.

No additional Vercel deployment-password gate is needed for creators: the app already requires email login and authorizes data server-side. Ensure your Vercel deployment-access settings allow intended visitors to reach the login page.

## 5. Finish Shopify setup

In your Shopify app configuration:

- App URL: your new Vercel URL or custom domain.
- Embed in Shopify admin: off.
- Allowed redirect URLs: blank; this implementation uses the client credentials grant, not a Shopify OAuth redirect.
- Legacy install flow: off.
- Scopes: `read_orders`.
- Release the configuration and install the app on the Muscle Seeds store. The app and store must be in the same Shopify organization for client credentials.

Sign into your portal using `ADMIN_EMAIL`. Open **Store connection**. The original domain discovered from the public storefront is `np1cxg-tw.myshopify.com`; confirm it in Shopify Settings → Domains. Enter the Shopify app's client ID and secret directly into the protected form. An existing Admin API token is also supported; expiring tokens require manual replacement.

Add each creator's name, verified sign-in email, and existing promo code. Share your new portal URL. Each creator creates or signs into an email-verified account with the assigned email. There is no ChatGPT login, account, or sharing step.

Assigning a promo code here does not create, validate, or change the discount in Shopify. Keep those codes active in Shopify.

## Reporting and synchronization

Net paid sales = collected order payments minus refunds, including shipping and taxes. Only non-test, non-canceled orders with financial status `PAID` or `PARTIALLY_REFUNDED` and a positive collected balance count. All money is integer EGP minor units; this version supports EGP stores.

Dates use original order creation dates in Africa/Cairo, rather than payment collection dates. Multiple distinct creator codes on one order cause exclusion to avoid double counting. Full refunds and cancellations remove an order; partial refunds retain it if a positive balance remains.

The first import covers Shopify's standard 60-day history. Imported records are retained going forward. Each sync reads at most 100 changed orders to stay within serverless request limits; imports continue every 3 seconds while more pages remain. Once caught up, synchronization runs on dashboard opening and every 60 seconds while the tab is visible. Cancellations are reflected after a successful sync, not instantaneously. There are no background webhooks or scheduled jobs. Failed syncs retain the last successful snapshots and timestamp.

Customer names, addresses, emails, and phone numbers are not imported. Only order identifiers, dates, codes, financial status, and aggregate amounts are stored. Shopify reads are server-side and no Shopify mutations are performed.

## Development and checks

```sh
npm run dev
npm run typecheck
npm test
npm run build
```

Live login, email delivery, database service connectivity, and Shopify access require your own configured provider accounts and credentials. No live Muscle Seeds credentials are included or preconnected. The former hosted prototype's local test fixtures are not part of this bundle.

## Main files

- `app/portal.tsx` — dashboard, admin screens, sample simulator, connection form.
- `lib/auth.ts`, `proxy.ts` — Clerk identity verification.
- `lib/portal/server.ts` — authorization, encrypted Shopify connection, order import.
- `lib/portal/rules.ts` — paid-order and cancellation logic.
- `db/schema.ts`, `db/index.ts`, `migrations/`, `scripts/migrate.mjs` — persistent storage.
- `.env.example` — configuration names only; no secrets.
