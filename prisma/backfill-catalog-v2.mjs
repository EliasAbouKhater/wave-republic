/**
 * Catalog v2 backfill — populate the join tables from the legacy owner columns.
 *
 *   MenuCategory.restaurantId  ->  CategoryVenue(categoryId, restaurantId, sortOrder)
 *   MenuItem.categoryId        ->  ItemCategory(itemId, categoryId, sortOrder)
 *   Restaurant.sortOrder       ->  stable order by name (was unset)
 *
 * Idempotent: uses createMany({ skipDuplicates }), so re-running is safe.
 * Run BEFORE dropping the legacy columns. Verifies its own counts and exits
 * non-zero if anything does not line up.
 *
 *   node prisma/backfill-catalog-v2.mjs          # apply
 *   node prisma/backfill-catalog-v2.mjs --check  # verify only, no writes
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";

const checkOnly = process.argv.includes("--check");
const url = fs.readFileSync(".env", "utf8").match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!url) throw new Error("DATABASE_URL not found in .env");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const categories = await db.menuCategory.findMany({
  select: { id: true, restaurantId: true, sortOrder: true },
});
const items = await db.menuItem.findMany({
  select: { id: true, categoryId: true, sortOrder: true },
});

// Legacy rows always had an owner; a null here means the column was already
// dropped, or a row predates the constraint. Either way it cannot be backfilled.
const orphanCats = categories.filter((c) => !c.restaurantId);
const orphanItems = items.filter((i) => !i.categoryId);

console.log(`categories: ${categories.length} (${orphanCats.length} without a venue)`);
console.log(`items:      ${items.length} (${orphanItems.length} without a category)`);

if (!checkOnly) {
  const cv = await db.categoryVenue.createMany({
    data: categories
      .filter((c) => c.restaurantId)
      .map((c) => ({
        categoryId: c.id,
        restaurantId: c.restaurantId,
        sortOrder: c.sortOrder,
      })),
    skipDuplicates: true,
  });
  console.log(`CategoryVenue rows created: ${cv.count}`);

  const ic = await db.itemCategory.createMany({
    data: items
      .filter((i) => i.categoryId)
      .map((i) => ({
        itemId: i.id,
        categoryId: i.categoryId,
        sortOrder: i.sortOrder,
      })),
    skipDuplicates: true,
  });
  console.log(`ItemCategory rows created: ${ic.count}`);

  // Restaurant.sortOrder defaulted to 0 for every row, which would make the
  // browse list order arbitrary. Seed it by name so it is at least stable.
  const venues = await db.restaurant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, sortOrder: true },
  });
  if (venues.every((v) => v.sortOrder === 0)) {
    for (const [i, v] of venues.entries()) {
      await db.restaurant.update({ where: { id: v.id }, data: { sortOrder: i } });
    }
    console.log(`Restaurant.sortOrder seeded for ${venues.length} venues`);
  } else {
    console.log("Restaurant.sortOrder already set — left alone");
  }
}

// ---- verification -------------------------------------------------------
const cvCount = await db.categoryVenue.count();
const icCount = await db.itemCategory.count();
const expectedCv = categories.filter((c) => c.restaurantId).length;
const expectedIc = items.filter((i) => i.categoryId).length;

console.log(`\nCategoryVenue: ${cvCount} (expected >= ${expectedCv})`);
console.log(`ItemCategory:  ${icCount} (expected >= ${expectedIc})`);

// Every item must still be reachable from a venue, or it silently vanishes
// from the menu once the legacy columns are gone.
const reachable = await db.menuItem.count({
  where: { categories: { some: { category: { venues: { some: {} } } } } },
});
console.log(`items reachable via category->venue: ${reachable} / ${items.length}`);

const ok = cvCount >= expectedCv && icCount >= expectedIc && reachable === items.length;
console.log(ok ? "\n✓ backfill verified" : "\n✗ MISMATCH — do not drop the legacy columns");

await db.$disconnect();
process.exit(ok ? 0 : 1);
