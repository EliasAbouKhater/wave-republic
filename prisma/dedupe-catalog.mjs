/**
 * One-off catalog cleanup, approved by Elias 2026-08-18.
 *
 * The pre-2026-08-18 model forced a copy of every item per venue, so "Water"
 * existed as five rows and "Beverages" as five categories. Now that items and
 * categories are shared, collapse the copies.
 *
 * Stage 1 — items (95 -> ~76)
 *   - Normalise two spellings: "Soft Drink" -> "Soft Drinks", "Redbull" -> "Red Bull".
 *   - Merge rows with the same name AND same price; re-point their category
 *     links at the survivor. No price ever changes.
 *   - Deliberately NOT merged: "Garden Veggie (V)" (62 vs 39) and "Popcorn"
 *     (20 vs 15) — same name, different price, so merging would change what a
 *     guest pays. Elias confirmed leaving these.
 *
 * Stage 2 — categories (24 -> ~20)
 *   - One shared category per real-world grouping, assigned to the venues that
 *     actually serve it. Slush is its own category because Artisan Pizza does
 *     not sell it and must not gain it.
 *
 * Guest-visible menus are unchanged by design: same item names, same prices,
 * same venues. Verified by comparing every venue's (name, price) menu set
 * before and after.
 *
 *   node prisma/dedupe-catalog.mjs --check   # report only
 *   node prisma/dedupe-catalog.mjs           # apply
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";

const apply = !process.argv.includes("--check");
const url = fs.readFileSync(".env", "utf8").match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const RENAMES = { "Soft Drink": "Soft Drinks", "Redbull": "Red Bull" };

/** name -> items it holds -> venues that serve it */
const PLAN = [
  // Derived from the live data, not hand-guessed: each group is the exact set of
  // items sharing an identical venue set, so no venue gains or loses anything.
  // An earlier hand-written version bundled Red Bull into core Beverages and
  // gave Snack Attack a drink it does not sell — hence this shape.
  { name: "Beverages", slot: "drinks",
    items: ["Water", "Soft Drinks"],
    venues: ["Artisan Pizza", "Bamboo Bay", "Jaccouzi", "Snack Attack", "Wave Cafe"] },
  { name: "Energy Drinks", slot: "drinks",
    items: ["Red Bull"],
    venues: ["Artisan Pizza", "Bamboo Bay", "Jaccouzi", "Wave Cafe"] },
  { name: "Slush", slot: "drinks",
    items: ["Slush"],
    venues: ["Bamboo Bay", "Jaccouzi", "Snack Attack", "Wave Cafe"] },
  { name: "Hot Drinks", slot: "drinks",
    items: ["Coffee"],
    venues: ["Artisan Pizza", "Wave Cafe"] },
  { name: "Ice Cream", slot: "sweets",
    items: ["Ice Cream Stick", "Ice Cream Cone", "Ice Cream Popsicle"],
    venues: ["Bamboo Bay", "Wave Cafe"] },
  { name: "Juices & Beer", slot: "drinks",
    items: ["Fresh Juice", "Heineken Beer"],
    venues: ["Jaccouzi"] },
  { name: "Tea & Smoothies", slot: "drinks",
    items: ["Kark Tea", "Smoothie"],
    venues: ["Wave Cafe"] },
];

/** Menu as the guest sees it: venue -> sorted "name@price" set. */
async function snapshot() {
  const venues = await db.restaurant.findMany({
    include: {
      categoryLinks: {
        include: { category: { include: { itemLinks: { include: { item: true } } } } },
      },
    },
  });
  const out = {};
  for (const v of venues) {
    const set = new Set();
    for (const cl of v.categoryLinks)
      for (const il of cl.category.itemLinks)
        if (il.item.active) set.add(`${il.item.name}@${il.item.priceCents}`);
    out[v.name] = [...set].sort();
  }
  return out;
}

const before = await snapshot();

/* ── stage 1: items ────────────────────────────────────────────────────── */

for (const [from, to] of Object.entries(RENAMES)) {
  const n = await db.menuItem.count({ where: { name: from } });
  if (!n) continue;
  console.log(`rename "${from}" -> "${to}" (${n} row${n > 1 ? "s" : ""})`);
  if (apply) await db.menuItem.updateMany({ where: { name: from }, data: { name: to } });
}

const items = await db.menuItem.findMany({ select: { id: true, name: true, priceCents: true } });
const groups = {};
for (const i of items) (groups[`${i.name}@@${i.priceCents}`] ||= []).push(i);

let mergedRows = 0;
for (const [key, rows] of Object.entries(groups)) {
  if (rows.length < 2) continue;
  const [keep, ...drop] = rows;
  console.log(`merge ${rows.length} x "${keep.name}" -> ${keep.id.slice(-6)}`);
  mergedRows += drop.length;
  if (!apply) continue;

  for (const d of drop) {
    // Move this row's category links onto the survivor, skipping pairs that
    // would collide (both rows already in the same category).
    const links = await db.itemCategory.findMany({ where: { itemId: d.id } });
    for (const l of links) {
      const exists = await db.itemCategory.findUnique({
        where: { itemId_categoryId: { itemId: keep.id, categoryId: l.categoryId } },
      });
      if (!exists) {
        await db.itemCategory.create({
          data: { itemId: keep.id, categoryId: l.categoryId, sortOrder: l.sortOrder },
        });
      }
    }
    await db.itemCategory.deleteMany({ where: { itemId: d.id } });
    await db.itemTag.deleteMany({ where: { itemId: d.id } });
    await db.menuItem.delete({ where: { id: d.id } });
  }
}
console.log(`item rows removed: ${mergedRows}`);

/* ── stage 2: categories ───────────────────────────────────────────────── */

const venues = await db.restaurant.findMany({ select: { id: true, name: true } });
const venueId = (n) => venues.find((v) => v.name === n)?.id;

// Resolve every planned item to an id BEFORE the loop starts deleting
// categories. Deleting a category cascades to its ItemCategory rows, and an
// earlier version of this script looked items up mid-loop — by which point the
// row it wanted had already gone, silently dropping Slush and Smoothie from
// four menus. Fail loudly here instead.
const itemIdByName = new Map();
for (const spec of PLAN) {
  for (const n of spec.items) {
    if (itemIdByName.has(n)) continue;
    const it = await db.menuItem.findFirst({ where: { name: n, active: true }, select: { id: true } });
    if (!it) throw new Error(`planned item not found before any writes: "${n}" — fix PLAN and re-run`);
    itemIdByName.set(n, it.id);
  }
}
console.log(`resolved ${itemIdByName.size} planned items up front`);

for (const spec of PLAN) {
  const existing = await db.menuCategory.findMany({
    where: { name: spec.name },
    include: { itemLinks: true },
  });
  // Slush / Juices & Smoothies / Beer do not exist yet — they are new
  // categories carved out of the old per-venue "Beverages".
  let keep, dupes;
  if (existing.length === 0) {
    if (!apply) { console.log(`"${spec.name}": CREATE (new category)`); continue; }
    keep = await db.menuCategory.create({
      data: { name: spec.name, slot: spec.slot, sortOrder: 0 },
    });
    dupes = [];
    console.log(`"${spec.name}": created ${keep.id.slice(-6)}`);
  } else {
    [keep, ...dupes] = existing.sort((a, b) => b.itemLinks.length - a.itemLinks.length);
    console.log(`"${spec.name}": keep ${keep.id.slice(-6)}, retire ${dupes.length}`);
    if (!apply) continue;
  }

  const wanted = spec.items.map((n) => itemIdByName.get(n));

  await db.itemCategory.deleteMany({ where: { categoryId: keep.id } });
  for (const [i, itemId] of wanted.entries()) {
    await db.itemCategory.create({ data: { itemId, categoryId: keep.id, sortOrder: i } });
  }
  await db.menuCategory.update({
    where: { id: keep.id },
    data: { name: spec.name, slot: spec.slot, active: true },
  });
  await db.categoryVenue.deleteMany({ where: { categoryId: keep.id } });
  for (const [i, vn] of spec.venues.entries()) {
    const id = venueId(vn);
    if (!id) { console.log(`   ! venue not found: ${vn}`); continue; }
    await db.categoryVenue.create({ data: { categoryId: keep.id, restaurantId: id, sortOrder: i } });
  }

  for (const d of dupes) {
    await db.categoryVenue.deleteMany({ where: { categoryId: d.id } });
    await db.itemCategory.deleteMany({ where: { categoryId: d.id } });
    await db.menuCategory.delete({ where: { id: d.id } });
  }
}

// Any remaining same-name duplicates (e.g. the two empty "Shisha").
const all = await db.menuCategory.findMany({ include: { itemLinks: true, venues: true } });
const byName = {};
for (const c of all) (byName[c.name] ||= []).push(c);
for (const [name, group] of Object.entries(byName)) {
  if (group.length < 2) continue;
  const [keep, ...dupes] = group.sort((a, b) => b.itemLinks.length - a.itemLinks.length);
  for (const d of dupes) {
    console.log(`retire leftover duplicate "${name}" (${d.itemLinks.length} items)`);
    if (!apply) continue;
    // Preserve any venue the duplicate served that the survivor does not.
    for (const v of d.venues) {
      const has = await db.categoryVenue.findUnique({
        where: { categoryId_restaurantId: { categoryId: keep.id, restaurantId: v.restaurantId } },
      });
      if (!has) {
        await db.categoryVenue.create({
          data: { categoryId: keep.id, restaurantId: v.restaurantId, sortOrder: v.sortOrder },
        });
      }
    }
    await db.categoryVenue.deleteMany({ where: { categoryId: d.id } });
    await db.itemCategory.deleteMany({ where: { categoryId: d.id } });
    await db.menuCategory.delete({ where: { id: d.id } });
  }
}

/* ── verify ────────────────────────────────────────────────────────────── */

const after = await snapshot();
let identical = true;
for (const v of new Set([...Object.keys(before), ...Object.keys(after)])) {
  const a = (before[v] ?? []).join("|");
  const b = (after[v] ?? []).join("|");
  if (a !== b) {
    identical = false;
    const miss = (before[v] ?? []).filter((x) => !(after[v] ?? []).includes(x));
    const extra = (after[v] ?? []).filter((x) => !(before[v] ?? []).includes(x));
    console.log(`\n${v}: CHANGED`);
    if (miss.length) console.log(`   lost:  ${miss.join(", ")}`);
    if (extra.length) console.log(`   gained: ${extra.join(", ")}`);
  }
}

console.log(`\nitems: ${await db.menuItem.count()}   categories: ${await db.menuCategory.count()}`);
const dupLeft = Object.entries(
  (await db.menuCategory.findMany()).reduce((a, c) => ((a[c.name] = (a[c.name] || 0) + 1), a), {}),
).filter(([, n]) => n > 1);
console.log(`duplicate category names left: ${dupLeft.length ? JSON.stringify(dupLeft) : "none"}`);
console.log(identical ? "\n✓ every venue's menu is unchanged" : "\n✗ MENUS CHANGED — review above");
if (!apply) console.log("(dry run — nothing written)");

await db.$disconnect();
process.exit(identical ? 0 : 1);
