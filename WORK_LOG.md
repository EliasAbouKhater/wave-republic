# Work log — Wave Republic (dreamland)

## 2026-08-18 — v2: photo pipeline, venue photos, shared catalog, tags, ordering

Committed as one v2 batch at Elias's request. **Not deployed** — pushed
separately after review.

### 1. Photo uploads: accept big, store small
The advertised 5 MB limit was **fiction**. Next.js Server Actions cap request
bodies at 1 MB by default and `next.config.ts` never raised it, so any photo
over ~1 MB failed inside the framework before validation ran. Now: 25 MB
accepted, compressed in-browser to WebP (1600px items / 2000px venues) before
upload, `bodySizeLimit` raised to 4mb. Measured 10.4 MB -> 30 KB.
See `docs/photos.md`.

### 2. Venue photos
One photo per venue, centre-cropped to fill the browse tile, backoffice card and
the full-width menu banner. `thumbLabel` remains the fallback and banner caption.

### 3. Catalog v2 — the big one
Categories and items were **per-venue**, so the same thing was re-created for
each venue: "Beverages" existed 5 times, "Water" as 5 separate rows.

Now: `CategoryVenue` and `ItemCategory` joins. A category is served by many
venues; an item appears in many categories; price is global. `sortOrder` lives
on the join rows so position can differ per venue / per category.

**Backoffice split** (after Elias found the first attempt confusing):
- *Categories & prices* — define categories and items, venue-independent
- *Restaurants* — assign categories to each venue

That separation is the whole point: it is what makes an existing category
reusable on another venue.

Migration was add -> backfill -> verify -> drop, with the new join path proven to
produce identical menus for all 6 venues before anything was dropped.

### 4. Data cleanup (approved item-by-item)
95 -> 76 items, 24 -> 22 categories, zero duplicate names. Groupings were
**derived from the data**, not hand-written — see "failures" below.

### 5. Tags + ordering
Manager-defined tags (rows, not strings) on venues and items, shown as chips.
Three independent orderings with drag-and-drop plus ▲▼ buttons.

### Failures worth remembering
- **First dedupe attempt deleted items.** It looked up items mid-loop, after
  cascade deletes had already removed them; Slush and Smoothie vanished from
  four menus. Caught by the script's own before/after check, restored from
  backup, fixed to resolve all ids up front and throw rather than skip.
- **Second attempt silently *added* items.** Hand-written groupings put Red Bull
  in core Beverages, which would have given Snack Attack a drink it does not
  sell. Restored again; rewrote the plan to be derived from live data.
- **`TAG_COLORS` exported from a `"use server"` file** became an RPC stub and
  threw `.map is not a function` in the browser — invisible to tsc *and* the
  build, caught only by clicking the button.
- Nearly deleted Wave Cafe's tea by writing "Kara Tea" from memory; the item is
  "Kark Tea". Caught by checking before running.

**Lesson:** every destructive data script needs its own before/after assertion.
All three data bugs were caught by that check, not by types or review.

### Open
- Legacy columns (`MenuCategory.restaurantId`, `MenuItem.restaurantId`,
  `.categoryId`, `.sortOrder`) still exist — `db push --accept-data-loss` was
  blocked by the permission classifier. Nullable and unread; harmless.
- `Garden Veggie (V)` (AED 62 vs 39) and `Popcorn` (20 vs 15) left unmerged:
  same name, different price. Worth a look — likely a pricing error.
- Browse Food/Drinks/Sweets filter still keys off `MenuCategory.slot`; needs a
  decision now that categories are manager-defined.
- Customer app still ships with pinch-zoom disabled (pre-existing).
- 25 Dependabot vulnerabilities (11 high) — pre-existing.

## 2026-08-18 — Customer map removed, backoffice made phone-usable

**Shipped live.** Commits `6c2e726`, `b6fe824`. Deploy verified on
`wave-republic.vercel.app`.

### Delivered
1. **Map removed from the customer app.** The List/Map toggle, `MapView`, the
   `logMapPinTap` writer and `.pin-teardrop` are gone. The backoffice "Map pin
   taps" panel and the already-logged `map_pin` rows stay readable; `pinColor`,
   `mapX`, `mapY` survive annotated in the schema, so restoring the map is a
   revert of one component rather than a rebuild.
2. **Backoffice is responsive.** Below `md` the sidebar becomes a fixed bottom
   tab bar plus a compact top bar; grids collapse, modals become bottom sheets,
   inputs are 16px, touch targets reach 44px via `.tap-target`
   (`pointer: coarse` only, so desktop density is untouched).

### The actual root cause
Not CSS. `src/app/layout.tsx` exported no `viewport`, so phones assumed a
~980px canvas. Every other fix would have been cosmetic without it.

### Bugs found en route (not reported, found by verifying)
- `RestaurantsSection` set a hard 3-column grid via **inline
  `gridTemplateColumns`** — invisible to a `grid-cols-*` search, and the real
  source of the worst overflow (103px).
- **The same inline-grid bug in Orders, Reports and Team.** Phase-2 gated, so it
  would have shipped broken the day `NEXT_PUBLIC_PHASE_2_ENABLED` flipped.
- Menu item rows clipped item names and Remove *inside their own card* — the
  page-overflow metric could not see it; only a screenshot did.
- Login inputs were 14px (outside `FormKit`, so the form pass missed them).
- The analytics table squeezed instead of scrolling.
- `.no-scrollbar` was used by the customer `BrowseScreen` but never defined.

### Decisions worth remembering
- **`src/app/(customer)/layout.tsx` has its own `viewport` export** with
  `maximumScale: 1, userScalable: false`. It pre-dates this work and overrides
  the root for customer routes, so the **customer app still ships with
  pinch-zoom disabled** — an accessibility problem, left alone as out of scope.
  The backoffice correctly serves `width=device-width, initial-scale=1,
  viewport-fit=cover`. Verified per-route on the live deploy.
- Bottom tabs scroll horizontally past ~5 items so Phase 2's 7 nav items
  degrade instead of crushing.

### Verification
`tsc --noEmit` + `npm run build` clean, including the map commit alone with the
responsive work stashed (neither commit is a broken bisect state). Audited at
390×844 against a **production build** and again against the **live deploy**:
0px horizontal overflow on login, analytics, restaurants, menus, QR and the
venue modal; no sub-44px target; no sub-16px input.

**A stale `.next` silently served old CSS and made a fully broken production
build look fine in dev.** Responsive work must be verified against `next start`.

### Open
- 25 Dependabot vulnerabilities on the public repo (11 high) — pre-existing.
- Customer-side pinch-zoom is disabled (see above) — worth a decision.
- Phase 2 not started: orders, payments, wallet. See `docs/payments-planning.md`.

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

### Lesson filed (Scholar 2026-08-18)
The eight dead buttons were not eight bugs — they were one structural cause sampled
once. Phase 2 rule: no inert controls (hidden or `disabled` + `TODO(phase-2)`), and
classify a bug report as structural vs incidental *before* fixing it.
See: `~/Claude/scholar/lessons/general/product/no-inert-controls-in-partial-phases.md`

### Open
- 25 Dependabot vulnerabilities on the public repo (11 high) — pre-existing.
- Phase 2 not started: orders, payments, wallet. See `docs/payments-planning.md`.
