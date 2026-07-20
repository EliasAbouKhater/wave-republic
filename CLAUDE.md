@AGENTS.md
@docs/nextjs16-notes.md

# Dreamland — Resort Food Ordering

Waterpark food-ordering app. Two connected surfaces in one Next.js codebase:
- **Customer** (mobile PWA, `~390px` iOS-frame viewport): scan zone QR → browse (list/map) → order → mock Stripe → track.
- **Backoffice** (desktop, `~1180px`): Owner / Manager / Cashier logins, orders board, menus, zones, team, reports.

Built for a **real waterpark client**. Hosting plan: Vercel (app) + Neon (Postgres). GitHub repo.

## Stack
- Next.js 16 App Router + TypeScript + Tailwind 4 (Turbopack default)
- Prisma → Postgres (Neon in prod, local Postgres in dev)
- Stripe (real, test mode) — first pass is mocked following the prototype's 1.4s+0.7s dialog

## Sources of truth
- **Product & visuals**: `design-handoff/` — README.md and `Dreamland Order.dc.html` (prototype). Screenshots in `design-handoff/screenshots/`.
- **Extracted spec** (seed data, exact tokens, state machine timings): `docs/prototype-spec.md` — read this before hardcoding numbers.
- **Framework quirks**: `docs/nextjs16-notes.md`.

## Order state machine (must match prototype)
- `placeOrder` → 1400 ms `processing` overlay → 700 ms `success` check → `finalizeOrder` (create order, clear cart, navigate to tracking).
- Sequences: `delivery: confirmed→preparing→ready→delivering→delivered` · `pickup: confirmed→preparing→ready→picked_up`.

## Cashier reassignment
Manager (Team & access) can reopen the `Reassign cashier` modal per cashier. Save maps `staff.kioskId` to a station or `null` (Unassigned). Persists until moved again. Cashier's board and login-station reflect the current assignment.

## Rules
- Ordering is **blocked** without a valid zone-session (anti-scam gate). Session expires with the scan countdown.
- Delivery only allowed when `deliveryEnabled` for the venue; else force pickup.
- No permanent deletes ever (workspace-wide rule) — venues/staff/zones use active flag or soft-remove; order line-item joins can be replaced.

## Deploy
Nothing deployed yet. Elias to review the UI locally before first deploy (workspace-wide rule: `visual-review-before-deploy`).

## Lessons live from this project
- **Neon has no Middle East region (verified 2026-07-17).** Frankfurt (`eu-central-1`) is the answer for Dubai users, not a fallback. Expected latency ~110ms + serverless cold-starts. See: `~/Claude/scholar/lessons/general/knowledge-systems/blockers-before-recommendations.md` § "Corollary 2026-07-17"
- **Dev server binding + Next 16 `allowedDevOrigins` broke the review loop 2026-07-16.** Dev servers reviewed off-machine bind `0.0.0.0` and pin `--port 3311`; `next.config.ts` `allowedDevOrigins` must list the Tailscale IP and `*.ts.net`. See: `~/Claude/scholar/lessons/general/coding/verify-before-handoff.md` § "Corollary 2026-07-17"
