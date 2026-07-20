# Dreamland Menu

Waterpark menu-display app. Phase 1: customers browse restaurants and menus from QR codes; owner tracks adoption via anonymous view analytics.

## Stack

- Next.js 16 (App Router, Turbopack, React 19)
- Prisma 7 + Postgres (Neon, Frankfurt)
- Tailwind 4
- Hosted on Vercel (`dxb1` — Dubai edge region)

## Surfaces

- **Customer** (`/`) — open, no login. Restaurant list + map. Anonymous view tracking via `dl_visitor` cookie.
- **Manager** (`/backoffice`) — login-gated. Analytics dashboard + QR code generator.

## Local development

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
npx prisma db push
npm run db:seed
npm run dev
```

## Phase status

Payments, wallet, orders, and cashier flows are **out of scope for Phase 1**. See `docs/phase-1-plan.md` and `docs/payments-planning.md`.
