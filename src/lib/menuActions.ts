"use server";

/**
 * Catalog mutations — categories and items.
 *
 * Shape as of 2026-08-18 (see docs/catalog-plan.md):
 *   - A **category** belongs to no single venue. `CategoryVenue` says which
 *     venues serve it, and where it sits in each of their menus.
 *   - An **item** belongs to no single venue either. `ItemCategory` says which
 *     categories it appears in. An item reaches a guest only via
 *     item -> category -> venue.
 *   - **Price is global**: one `priceCents` used by every venue serving the item.
 *     Per-venue pricing would be a new join table, not a column here.
 *
 * Prices are integer `priceCents` in AED fils. Never store money as a float; the
 * UI collects decimal AED and converts on this boundary.
 *
 * Deletes are soft (`active = false`) per the workspace rule; items also carry a
 * separate `available` flag for the everyday "sold out today" case.
 */

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { deleteItemImage } from "@/lib/uploadActions";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type ItemInput = {
  name: string;
  description: string;
  priceAed: number;
  available: boolean;
  imageUrl: string | null;
  /** Categories this item appears in. Empty = defined but not on any menu yet. */
  categoryIds: string[];
};

/**
 * A shared category can be on several menus, so a single edit invalidates every
 * venue serving it. Resolve those venues and revalidate each.
 */
async function refreshForCategories(categoryIds: string[]): Promise<void> {
  revalidatePath("/backoffice/categories");
  revalidatePath("/backoffice/restaurants");
  revalidatePath("/");

  if (categoryIds.length === 0) return;
  const links = await db.categoryVenue.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { restaurantId: true },
  });
  for (const id of new Set(links.map((l) => l.restaurantId))) {
    revalidatePath(`/menu/${id}`);
  }
}

async function refreshForItem(itemId: string): Promise<void> {
  const links = await db.itemCategory.findMany({
    where: { itemId },
    select: { categoryId: true },
  });
  await refreshForCategories(links.map((l) => l.categoryId));
}

function validateItem(input: ItemInput): string | null {
  if (!input.name.trim()) return "Item name is required";
  if (!Number.isFinite(input.priceAed) || input.priceAed < 0) return "Price must be a positive number";
  if (input.priceAed > 100_000) return "Price looks too large";
  return null;
}

const toFils = (aed: number) => Math.round(aed * 100);

/* ── categories ─────────────────────────────────────────────────────────── */

export async function createCategory(name: string, slot: string): Promise<ActionResult> {
  await requireManager();
  if (!name.trim()) return { ok: false, error: "Category name is required" };

  const last = await db.menuCategory.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.menuCategory.create({
    data: {
      name: name.trim(),
      slot: slot || "food",
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  await refreshForCategories([]);
  return { ok: true };
}

export async function updateCategory(categoryId: string, name: string, slot?: string): Promise<ActionResult> {
  await requireManager();
  if (!name.trim()) return { ok: false, error: "Category name is required" };

  const cat = await db.menuCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!cat) return { ok: false, error: "Category not found" };

  await db.menuCategory.update({
    where: { id: categoryId },
    data: { name: name.trim(), ...(slot ? { slot } : {}) },
  });

  await refreshForCategories([categoryId]);
  return { ok: true };
}

/** Soft remove. Items stay put; the category simply stops rendering. */
export async function setCategoryActive(categoryId: string, active: boolean): Promise<ActionResult> {
  await requireManager();

  const cat = await db.menuCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!cat) return { ok: false, error: "Category not found" };

  await db.menuCategory.update({ where: { id: categoryId }, data: { active } });

  await refreshForCategories([categoryId]);
  return { ok: true };
}

/**
 * Replace the set of venues serving a category. Appends new links at the end of
 * each venue's menu and drops the ones unticked — existing links keep their
 * position so re-saving the form does not reshuffle a menu.
 */
export async function setCategoryVenues(categoryId: string, restaurantIds: string[]): Promise<ActionResult> {
  await requireManager();

  const cat = await db.menuCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!cat) return { ok: false, error: "Category not found" };

  const existing = await db.categoryVenue.findMany({
    where: { categoryId },
    select: { restaurantId: true },
  });
  const had = new Set(existing.map((e) => e.restaurantId));
  const want = new Set(restaurantIds);

  const toAdd = restaurantIds.filter((id) => !had.has(id));
  const toRemove = [...had].filter((id) => !want.has(id));

  for (const restaurantId of toAdd) {
    const last = await db.categoryVenue.findFirst({
      where: { restaurantId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await db.categoryVenue.create({
      data: { categoryId, restaurantId, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
  }

  if (toRemove.length > 0) {
    await db.categoryVenue.deleteMany({
      where: { categoryId, restaurantId: { in: toRemove } },
    });
  }

  // Both the venues gained and the venues lost need their menus rebuilt.
  revalidatePath("/backoffice/categories");
  revalidatePath("/backoffice/restaurants");
  revalidatePath("/");
  for (const id of new Set([...toAdd, ...toRemove, ...want])) {
    revalidatePath(`/menu/${id}`);
  }
  return { ok: true };
}

/** The mirror of setCategoryVenues, driven from a venue instead of a category. */
export async function setVenueCategories(restaurantId: string, categoryIds: string[]): Promise<ActionResult> {
  await requireManager();

  const venue = await db.restaurant.findUnique({ where: { id: restaurantId }, select: { id: true } });
  if (!venue) return { ok: false, error: "Venue not found" };

  const existing = await db.categoryVenue.findMany({
    where: { restaurantId },
    select: { categoryId: true, sortOrder: true },
    orderBy: { sortOrder: "desc" },
  });
  const had = new Set(existing.map((e) => e.categoryId));
  const want = new Set(categoryIds);

  let next = (existing[0]?.sortOrder ?? -1) + 1;
  for (const categoryId of categoryIds.filter((id) => !had.has(id))) {
    await db.categoryVenue.create({ data: { categoryId, restaurantId, sortOrder: next++ } });
  }

  const toRemove = [...had].filter((id) => !want.has(id));
  if (toRemove.length > 0) {
    await db.categoryVenue.deleteMany({
      where: { restaurantId, categoryId: { in: toRemove } },
    });
  }

  revalidatePath("/backoffice/restaurants");
  revalidatePath("/backoffice/categories");
  revalidatePath(`/menu/${restaurantId}`);
  revalidatePath("/");
  return { ok: true };
}

/* ── items ──────────────────────────────────────────────────────────────── */

async function linkItemToCategories(itemId: string, categoryIds: string[]): Promise<void> {
  const existing = await db.itemCategory.findMany({
    where: { itemId },
    select: { categoryId: true },
  });
  const had = new Set(existing.map((e) => e.categoryId));
  const want = new Set(categoryIds);

  for (const categoryId of categoryIds.filter((id) => !had.has(id))) {
    const last = await db.itemCategory.findFirst({
      where: { categoryId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await db.itemCategory.create({
      data: { itemId, categoryId, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
  }

  const toRemove = [...had].filter((id) => !want.has(id));
  if (toRemove.length > 0) {
    await db.itemCategory.deleteMany({ where: { itemId, categoryId: { in: toRemove } } });
  }
}

export async function createItem(input: ItemInput): Promise<ActionResult> {
  await requireManager();

  const invalid = validateItem(input);
  if (invalid) return { ok: false, error: invalid };

  const item = await db.menuItem.create({
    data: {
      name: input.name.trim(),
      description: input.description.trim() || null,
      imageUrl: input.imageUrl,
      priceCents: toFils(input.priceAed),
      available: input.available,
    },
    select: { id: true },
  });

  await linkItemToCategories(item.id, input.categoryIds);
  await refreshForCategories(input.categoryIds);
  return { ok: true };
}

export async function updateItem(itemId: string, input: ItemInput): Promise<ActionResult> {
  await requireManager();

  const invalid = validateItem(input);
  if (invalid) return { ok: false, error: invalid };

  const item = await db.menuItem.findUnique({
    where: { id: itemId },
    select: { imageUrl: true, categories: { select: { categoryId: true } } },
  });
  if (!item) return { ok: false, error: "Item not found" };

  await db.menuItem.update({
    where: { id: itemId },
    data: {
      name: input.name.trim(),
      description: input.description.trim() || null,
      imageUrl: input.imageUrl,
      priceCents: toFils(input.priceAed),
      available: input.available,
    },
  });

  await linkItemToCategories(itemId, input.categoryIds);

  // The old photo is now unreachable — drop it so the store does not fill with
  // orphans. Best-effort: the DB row is what matters.
  if (item.imageUrl && item.imageUrl !== input.imageUrl) {
    await deleteItemImage(item.imageUrl);
  }

  // Refresh menus the item left as well as the ones it joined.
  const touched = new Set([...item.categories.map((c) => c.categoryId), ...input.categoryIds]);
  await refreshForCategories([...touched]);
  return { ok: true };
}

/** The everyday toggle — "we ran out of this today". Distinct from removal. */
export async function setItemAvailable(itemId: string, available: boolean): Promise<ActionResult> {
  await requireManager();

  const item = await db.menuItem.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) return { ok: false, error: "Item not found" };

  await db.menuItem.update({ where: { id: itemId }, data: { available } });

  await refreshForItem(itemId);
  return { ok: true };
}

/** Soft remove / restore for an item. */
export async function setItemActive(itemId: string, active: boolean): Promise<ActionResult> {
  await requireManager();

  const item = await db.menuItem.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) return { ok: false, error: "Item not found" };

  await db.menuItem.update({ where: { id: itemId }, data: { active } });

  await refreshForItem(itemId);
  return { ok: true };
}
