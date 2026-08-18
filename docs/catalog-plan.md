# Catalog v2 — shared categories, sorting, tagging

Plan for approval. **No code written yet.**

## The problem, confirmed in live data

The current model is strictly hierarchical: a category belongs to one venue, an
item belongs to one category and one venue. So the same thing gets re-created
per venue. Live database right now:

- **"Beverages" exists 5 times**, once per venue.
- "Ice Cream" twice, "Shisha" twice.
- 8 venues · 24 categories · 95 items.

Change a drink's price and the manager edits it in five places, or misses one.

## What changes

| | Today | After |
|---|---|---|
| Category owner | one venue | **many venues** (explicit assignment) |
| Item owner | one category, one venue | **many categories** |
| Item price | per item | per item (**global** — your call) |
| Ordering | `sortOrder`, no UI | **drag and drop** |
| Tags | none | **manager-defined**, on venues and items |

### Decisions already made
- **Global price.** One price per item everywhere. Noted risk: the day one kiosk
  wants a different price, the item must be duplicated again — the exact problem
  being solved. Schema below is shaped so per-venue price can be added later as
  one new table, without re-migrating anything.
- **Explicit venue assignment**, not by venue type. New venues start unassigned.

## Schema

Three new join tables; nothing is dropped.

```prisma
model MenuCategory {
  id        String  @id @default(cuid())
  name      String
  sortOrder Int     @default(0)   // order within a venue's menu
  active    Boolean @default(true)
  // restaurantId REMOVED — replaced by the join below
  // slot        RETAINED, see "Browse filter" note
  venues CategoryVenue[]
  items  ItemCategory[]
}

model CategoryVenue {          // which venues serve this category
  categoryId   String
  restaurantId String
  sortOrder    Int @default(0) // category order *within that venue*
  @@id([categoryId, restaurantId])
}

model ItemCategory {           // which categories an item appears in
  itemId     String
  categoryId String
  sortOrder  Int @default(0)   // item order *within that category*
  @@id([itemId, categoryId])
}

model Tag {
  id       String @id @default(cuid())
  name     String @unique      // "Chef's choice", "Most popular"
  color    String              // chip colour
  sortOrder Int   @default(0)
  active   Boolean @default(true)
  items    ItemTag[]
  venues   VenueTag[]
}

model ItemTag  { itemId String; tagId String; @@id([itemId, tagId]) }
model VenueTag { restaurantId String; tagId String; @@id([restaurantId, tagId]) }

model Restaurant {
  sortOrder Int @default(0)     // NEW — browse-screen order
  // …unchanged
}

model MenuItem {
  // restaurantId  REMOVED — an item reaches venues via its categories
  // categoryId    REMOVED — replaced by ItemCategory
  // sortOrder     REMOVED — moves to ItemCategory (per-category order)
  // …name, description, imageUrl, priceCents, available, active unchanged
}
```

**Why `sortOrder` lives on the join tables:** "Coca-Cola is 3rd in Cold Drinks
but 1st in Poolside Favourites" is only expressible per-pairing. Same for a
category's position differing between two venues.

## Migration — 95 items must survive

`prisma db push` alone **drops the removed columns and their data.** This needs a
real migration, run in order, against production Neon:

1. Add new tables and `Restaurant.sortOrder`. Nothing removed yet.
2. Backfill: for every existing category → one `CategoryVenue` row from its
   current `restaurantId`. For every item → one `ItemCategory` row from its
   current `categoryId`, carrying its current `sortOrder`.
3. **Verify counts match** (24 CategoryVenue, 95 ItemCategory) before step 4.
4. Only then drop `MenuCategory.restaurantId`, `MenuItem.restaurantId`,
   `MenuItem.categoryId`, `MenuItem.sortOrder`.

I will take a database backup before starting and verify after each step. This
project has **no migrations directory** — it has been using `db push` — so I will
introduce `prisma/migrations/` for this.

### Duplicate merge is NOT automatic
The 5 "Beverages" categories become 5 separate shared-capable categories, each
assigned to its original venue. Menus look identical afterwards. Merging them
into one is a **manager decision** (their item lists differ) — the new UI makes
it possible, this migration does not do it silently.

## Backoffice UI

**Menus becomes two tabs:**
- *Catalog* — all categories and items, venue-independent. Create a category,
  tick which venues serve it. Create an item, tick which categories it appears in.
- *Per venue* — pick a venue, drag its categories and items into order.

**Drag and drop:** HTML5 drag events, no dependency. Touch devices get explicit
▲▼ buttons — HTML5 DnD does not work on touch, and you specifically asked for
the backoffice to work on a phone.

**Tags:** a small manager screen to create/colour them, plus a tag picker in the
item and venue modals. Rendered as chips on the customer browse tile, menu row
and item page.

## Customer-side

- Browse list ordered by `Restaurant.sortOrder`, tags shown as chips.
- Menu page: categories via `CategoryVenue` order, items via `ItemCategory` order.
- An item appearing in two of a venue's categories shows in both. That is the
  intended behaviour, worth seeing once live.

### Browse filter — needs your call later
The Food/Drinks/Sweets chips are driven by `MenuCategory.slot`. Options once the
rest is built: keep `slot` as-is, drive the filter from tags instead, or drop the
filter. **Not deciding now** — I will keep `slot` working so nothing breaks, and
raise it when the rest is in.

## Risk

The largest change so far: schema, migration on live data, both surfaces. QR
routes and `qrSlug` are untouched — no printed code is affected.

Suggested order, each verified before the next:
1. Schema + migration + backfill (data safety first)
2. Server actions
3. Backoffice Catalog tab
4. Drag/drop ordering
5. Tags
6. Customer surfaces

I can stop after any step for you to look.
