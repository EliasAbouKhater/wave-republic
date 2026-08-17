# Work log — Wave Republic (dreamland)

## 2026-08-17 — Backoffice CRUD, QR freeze, zone removal

**Shipped live.** Commits `89e908c`, `97b8e42`, `f79048b`, `a8cd8c5`.
Elias reviewed the live site and signed off.

### Trigger
Elias clicked `Suspend` on a restaurant and nothing happened.

### What the audit actually found
Phase 1 shipped the backoffice as a **read-only console**. Eight buttons across
Restaurants, Zones, Menus and Team were markup with no handler — the CRUD plan
written 2026-07-21 (steps 3–5) was never implemented. The one dead button Elias
found was not an isolated bug.

### Delivered
1. **QR stability** — base URL pinned to `QR_BASE_URL`; the page now throws in
   production rather than deriving codes from the request Host header (the
   original latent bug: printed codes would have encoded whatever domain the
   manager happened to browse). Park + bracelet QRs merged into one Entry QR.
   Contract written to `docs/qr-stability.md`.
2. **Backoffice CRUD** — venue add/edit/remove/restore, menu category and item
   CRUD, availability toggle. 11 server actions across `venueActions.ts` and
   `menuActions.ts`, shared modal primitives in `FormKit.tsx`.
3. **Zones removed from every surface**, model retained for Phase 2.
4. **Pin-colour picker and delivery toggle removed** from the venue form;
   `pinColor` now auto-assigns from a palette.

### Bugs found en route (not reported, found by reading)
- **Backoffice showed prices in USD** while customer surfaces showed AED — manager
  and guest saw different currencies for the same item.
- **Removing a venue would have 404'd its printed QR.** `/r/[qrSlug]` required
  `active: true`. Now resolves with a "not serving right now" page.
- **Venue creation would fail outright on an empty zone table.** `createVenue` now
  self-heals by creating the default zone.
- Deleted `src/lib/mockData.ts` — 126 lines, zero importers, superseded by the DB.

### Decisions worth remembering
- Elias asked for a **hard delete**; flagged the conflict with the
  no-permanent-deletes rule and the QR consequence (a freed `qrSlug` kills a
  printed code permanently). Settled on "Remove" wording over soft-delete —
  reads as delete to the manager, reversible underneath.
- Park/bracelet QR merge is **one-way**: signage-vs-bracelet attribution is gone
  from Analytics. Accepted knowingly.
- `Zone`, `ZoneSession`, `pinColor` and `deliveryEnabled` all survive in the schema
  with no UI. Each is annotated in `schema.prisma` explaining why, so a future
  session neither resurrects nor drops them.

### Verification
`tsc --noEmit` and `npm run build` clean. QR URL set proven byte-identical across a
remove→restore cycle and again across the zone refactor. All 7 live QR targets
return 200. Rename confirmed not to touch `qrSlug`.

### Open
- 25 Dependabot vulnerabilities on the public repo (11 high) — pre-existing.
- Phase 2 not started: orders, payments, wallet. See `docs/payments-planning.md`.
