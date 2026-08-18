"use server";

/**
 * Manager-controlled ordering. Three separate surfaces, because "position" means
 * something different in each:
 *
 *   venues on the browse screen   -> Restaurant.sortOrder
 *   categories inside one venue   -> CategoryVenue.sortOrder   (per venue)
 *   items inside one category     -> ItemCategory.sortOrder    (per category)
 *
 * The last two live on join rows on purpose: the same category can sit first at
 * one venue and fourth at another, and an item can lead one category while
 * trailing in another. See docs/catalog-plan.md.
 *
 * Each action takes the full ordered list of ids and rewrites positions 0..n-1.
 * Sending the whole list rather than a "moved from A to B" delta keeps the write
 * idempotent and immune to a stale client — worth the extra bytes for a list a
 * manager reorders by hand.
 */

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function reorderVenues(orderedIds: string[]): Promise<ActionResult> {
  await requireManager();

  const known = await db.restaurant.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true },
  });
  if (known.length !== orderedIds.length) {
    return { ok: false, error: "That list is out of date — reload and try again" };
  }

  await db.$transaction(
    orderedIds.map((id, i) =>
      db.restaurant.update({ where: { id }, data: { sortOrder: i } }),
    ),
  );

  revalidatePath("/backoffice/restaurants");
  revalidatePath("/");
  return { ok: true };
}

export async function reorderVenueCategories(
  restaurantId: string,
  orderedCategoryIds: string[],
): Promise<ActionResult> {
  await requireManager();

  const links = await db.categoryVenue.findMany({
    where: { restaurantId, categoryId: { in: orderedCategoryIds } },
    select: { categoryId: true },
  });
  if (links.length !== orderedCategoryIds.length) {
    return { ok: false, error: "That list is out of date — reload and try again" };
  }

  await db.$transaction(
    orderedCategoryIds.map((categoryId, i) =>
      db.categoryVenue.update({
        where: { categoryId_restaurantId: { categoryId, restaurantId } },
        data: { sortOrder: i },
      }),
    ),
  );

  revalidatePath("/backoffice/restaurants");
  revalidatePath(`/menu/${restaurantId}`);
  return { ok: true };
}

export async function reorderCategoryItems(
  categoryId: string,
  orderedItemIds: string[],
): Promise<ActionResult> {
  await requireManager();

  const links = await db.itemCategory.findMany({
    where: { categoryId, itemId: { in: orderedItemIds } },
    select: { itemId: true },
  });
  if (links.length !== orderedItemIds.length) {
    return { ok: false, error: "That list is out of date — reload and try again" };
  }

  await db.$transaction(
    orderedItemIds.map((itemId, i) =>
      db.itemCategory.update({
        where: { itemId_categoryId: { itemId, categoryId } },
        data: { sortOrder: i },
      }),
    ),
  );

  // A shared category can be on several menus; refresh each of them.
  const venues = await db.categoryVenue.findMany({
    where: { categoryId },
    select: { restaurantId: true },
  });
  revalidatePath("/backoffice/categories");
  for (const v of venues) revalidatePath(`/menu/${v.restaurantId}`);
  return { ok: true };
}
