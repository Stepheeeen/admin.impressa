# Impressa admin panel

Staff tools for Impressa: products, orders and parcels, banners, price bands, rewards, coupons,
wallets, merchants, returns and payouts. Next.js 16 with Tailwind.

## Running it

```bash
npm install
npm run dev              # http://localhost:3000
npm run build            # production build
npm start                # serve the production build
```

On machines where Turbopack's native binary is missing, build with `npx next build --webpack`.

## Settings

Create `.env.local` (git ignores it):

| Name | What it does |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the Impressa API, including `/api`. Leave unset to use the Render address the panel ships with. |

Anything named `NEXT_PUBLIC_…` is visible to anyone who opens the panel, so never put a secret here.
Signing in as an admin is what grants access; the API checks every request.
