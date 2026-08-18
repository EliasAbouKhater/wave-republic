@AGENTS.md
@docs/nextjs16-notes.md

# Dreamland — Resort Food Ordering

Waterpark food-ordering app. Local folder is `dreamland/`; the **public brand is
"Wave Republic"** (rebranded 2026-08-03 — internal identifiers deliberately unchanged).

Two connected surfaces in one Next.js codebase:
- **Customer** (mobile PWA, `~390px` iOS-frame viewport): scan QR → browse (list) → menu.
- **Backoffice** (desktop, `~1180px`): Manager login, analytics, venue + menu CRUD, QR codes.

Built for a **real waterpark client**. Live on Vercel (Hobby) + Neon Postgres (Frankfurt).

## Phase status
- **Phase 1 — LIVE** at `https://wave-republic.vercel.app`. Menu display, anonymous
  view analytics, QR codes, manager auth, venue/menu CRUD. No ordering.
- **Phase 2 — not started.** Orders, payments, wallet. Order/cashier/zone code below
  describes the *prototype target*, not what is built. Payment provider research in
  `docs/payments-planning.md` (Telr / Checkout.com favoured over Stripe for UAE fees).
- Orders / Team / Reports pages exist but are gated behind
  `NEXT_PUBLIC_PHASE_2_ENABLED` and hidden from nav.

## Stack
- Next.js 16 App Router + TypeScript + Tailwind 4 (Turbopack default)
- Prisma → Postgres (Neon in prod, local Postgres in dev)
- Payments: none in Phase 1. Provider undecided — see `docs/payments-planning.md`.

## Sources of truth
- **Product & visuals**: `design-handoff/` — README.md and `Dreamland Order.dc.html` (prototype). Screenshots in `design-handoff/screenshots/`.
- **Extracted spec** (seed data, exact tokens, state machine timings): `docs/prototype-spec.md` — read this before hardcoding numbers.
- **Framework quirks**: `docs/nextjs16-notes.md`.

## Phase 2 target behaviour (prototype spec — NOT built yet)

### Order state machine (must match prototype)
- `placeOrder` → 1400 ms `processing` overlay → 700 ms `success` check → `finalizeOrder` (create order, clear cart, navigate to tracking).
- Sequences: `delivery: confirmed→preparing→ready→delivering→delivered` · `pickup: confirmed→preparing→ready→picked_up`.

### Cashier reassignment
*(Team page is Phase-2 gated.)* Manager can reopen the `Reassign cashier` modal per cashier. Save maps `staff.kioskId` to a station or `null` (Unassigned). Persists until moved again. Cashier's board and login-station reflect the current assignment.

## QR codes are printed — they must never change
**Read `docs/qr-stability.md` before touching any QR-reachable URL.** The park prints
these on signage and bracelets; a changed URL is dead plastic. In short:
- `QR_BASE_URL` env var is frozen (`https://wave-republic.vercel.app`). The QR page
  **throws in production** if it is unset rather than falling back to the Host header.
- A venue's `qrSlug` is immutable after creation — `updateVenue` must never accept it.
- Removal is soft; `/r/<qrSlug>` keeps resolving and shows a "not serving right now"
  page instead of a 404.
- Changing a QR-reachable route = add a redirect, never reissue the code.
- One merged **Entry QR** (`/?src=park`) covers park signs *and* entry bracelets.

## Menu item photos
Managers upload one photo per menu item; guests see it as the menu-row thumbnail
and the item-page hero. Storage is the **public** Vercel Blob store `blob_images`,
addressed by `blob_images_READ_WRITE_TOKEN` (passed explicitly — the legacy
`BLOB_READ_WRITE_TOKEN` points at a PRIVATE store and would 403 for guests).
Replacing or clearing a photo deletes the old blob. JPEG/PNG/WebP, 5 MB cap,
enforced server-side in `src/lib/uploadActions.ts`.

## Rules
- Money is **AED**, stored as integer `priceCents` (fils). Never float, never `$`.
- No permanent deletes ever (workspace-wide rule) — venues, categories, items and staff
  all soft-remove via `active`. UI says "Remove" and hides the row behind a
  "Show removed" toggle with Restore; nothing leaves the database.
- **Zones have no UI at all** (removed 2026-08-17): the backoffice section, the map
  legend, the menu-header location pin, venue-card zone labels, the Reports
  "Orders by zone" chart and the Orders board zone tag are all gone. The `Zone` and
  `ZoneSession` models are **retained deliberately** — `Restaurant.zoneId` is a
  required FK and Phase 2 needs zones for sunbed-delivery destinations and the
  anti-scam scan gate. `createVenue` attaches new venues to the default zone
  silently (creating it if the table is empty). Don't surface zones again without asking.
- *(Phase 2, not yet built)* Ordering blocked without a valid zone-session; delivery
  only when `deliveryEnabled`.

## Deploy
Live on Vercel, auto-deploys from `main` on GitHub (`EliasAbouKhater/wave-republic`).
Elias reviews UI changes before they ship (workspace rule: `visual-review-before-deploy`).
`QR_BASE_URL` must be set in Vercel project env or the QR page throws.

## Lessons live from this project
- **Neon has no Middle East region (verified 2026-07-17).** Frankfurt (`eu-central-1`) is the answer for Dubai users, not a fallback. Expected latency ~110ms + serverless cold-starts. See: `~/Claude/scholar/lessons/general/knowledge-systems/blockers-before-recommendations.md` § "Corollary 2026-07-17"
- **Dev server binding + Next 16 `allowedDevOrigins` broke the review loop 2026-07-16.** Dev servers reviewed off-machine bind `0.0.0.0` and pin `--port 3311`; `next.config.ts` `allowedDevOrigins` must list the Tailscale IP and `*.ts.net`. See: `~/Claude/scholar/lessons/general/coding/verify-before-handoff.md` § "Corollary 2026-07-17"
