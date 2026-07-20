# Phase 1 — Menu Display Only

**Goal:** Measure customer adoption of the online menu before building ordering/payments. If nobody scans QRs or browses, we don't build Phase 2.

## Scope

**In:**
- Customer app: browse restaurants + kiosks (list + map), view menus, view item detail
- QR entry points: park-wide QR, entry-bracelet QR, per-restaurant QR
- Anonymous visitor tracking (cookie, 30d)
- Backoffice: Restaurants, Menus, Zones, Analytics
- QR code generator for park + bracelets + each restaurant

**Out (deferred to Phase 2+):**
- Cart, checkout, orders, tracking
- Payments (all providers)
- Wallet + QR-at-POS
- Backoffice: Orders board, Team management, Reports
- Auth (role picker stays as stub for now)

## Success criteria for advancing to Phase 2

Before we build ordering, we need to see (from analytics):
- Meaningful unique visitor count per operating day
- >30% of visitors view at least one menu
- Repeat visits (same visitor returning within 7d)

Numbers TBD by Elias after 2–4 weeks of live use.

## Routes

### Customer
| Path | Purpose | QR source |
|---|---|---|
| `/` | Landing — restaurants list + map | park, bracelet, direct |
| `/r/[qrSlug]` | Direct-to-restaurant menu | per-restaurant QR |
| `/menu/[restoId]` | Full menu (from landing tap) | — |
| `/item/[itemId]` | Item detail | — |

Removed: `/cart`, `/checkout`, `/tracking/[orderId]`

### Backoffice
| Path | Status |
|---|---|
| `/backoffice` | Role picker (stub, keep) |
| `/backoffice/[role]` | Dashboard |
| `/backoffice/[role]/restaurants` | Keep |
| `/backoffice/[role]/menus` | Keep |
| `/backoffice/[role]/zones` | Keep |
| `/backoffice/[role]/analytics` | **NEW** |
| `/backoffice/[role]/qr` | **NEW** — QR generator |
| `/backoffice/[role]/orders` | Hidden (Phase 2 flag) |
| `/backoffice/[role]/team` | Hidden (Phase 2 flag) |
| `/backoffice/[role]/reports` | Hidden (Phase 2 flag) |

## Data model additions

```prisma
model Restaurant {
  // existing fields...
  qrSlug String? @unique  // short URL slug for per-resto QR (e.g. "wave-cafe")
}

model PageView {
  id         String   @id @default(cuid())
  visitorId  String   // from dl_visitor cookie
  entityType String   // "restaurant" | "item" | "map_pin"
  entityId   String
  source     String?  // "park" | "bracelet" | "resto" | "direct"
  createdAt  DateTime @default(now())

  @@index([entityType, entityId, createdAt])
  @@index([visitorId, createdAt])
}
```

## Tracking rules

- **Visitor ID**: random UUID in `dl_visitor` cookie, 30-day TTL, HttpOnly, SameSite=Lax
- **Dedup**: same `visitorId + entityType + entityId` within 30 minutes = 1 view (not multiple)
- **Source attribution**: `?src=park|bracelet|resto|direct` on QR entry URLs, stored in cookie for the session
- **Events logged**:
  - Restaurant view (opening the menu page)
  - Item view (opening item detail)
  - Map pin tap (client-side event → server action)

## Analytics dashboard

Section per metric:
1. **Traffic overview** — DAU / WAU / total views (last 7d, 30d)
2. **Views by restaurant** — table, sortable by views/unique visitors
3. **Views by item** — top 20 items, split by restaurant
4. **Map interactions** — which pins get tapped
5. **Source attribution** — % of visits from park QR / bracelet / per-resto QR / direct

## QR generation

Backoffice utility:
- Park QR → `https://<domain>/?src=park`
- Bracelet QR → `https://<domain>/?src=bracelet`
- Per-restaurant QR → `https://<domain>/r/<qrSlug>?src=resto`

Downloadable as PNG (300dpi) + SVG. Simple `qrcode` npm lib.

## Non-goals reminders

- No login for customers
- No cart even if we keep the code (route removed, cart lib archived not deleted)
- No payment provider integration — provider choice is planning-only, see `payments-planning.md`
