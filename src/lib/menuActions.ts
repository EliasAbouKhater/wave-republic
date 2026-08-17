"use server";

/**
 * Menu mutations — categories and items.
 *
 * Prices are stored as integer `priceCents` in AED fils. Never store money as a
 * float. The UI collects a decimal AED amount and converts on the boundary here.
 *
 * Deletes are soft (`active = false`) per the workspace rule; items also carry a
 * separate `available` flag for the everyday "sold out today" case, which is what
 * the manager actually reaches for most often.
 */

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type ItemInput = {
  name: string;
  description: string;
  priceAed: number;
  available: boolean;
};

function refreshMenuViews(restaurantId: string) {
  revalidatePath("/backoffice/menus");
  revalidatePath(`/menu/${restaurantId}`);
  revalidatePath("/");
}

function validateItem(input: ItemInput): string | null {
  if (!input.name.trim()) return "Item name is required";
  if (!Number.isFinite(input.priceAed) || input.priceAed < 0) return "Price must be a positive number";
  if (input.priceAed > 100_000) return "Price looks too large";
  return null;
}

const toFils = (aed: number) => Math.round(aed * 100);

export async function createCategory(restaurantId: string, name: string, slot: string): Promise<ActionResult> {
  await requireManager();

  if (!name.trim()) return { ok: false, error: "Category name is required" };

  const resto = await db.restaurant.findUnique({ where: { id: restaurantId }, select: { id: true } });
  if (!resto) return { ok: false, error: "Venue not found" };

  const last = await db.menuCategory.findFirst({
    where: { restaurantId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.menuCategory.create({
    data: {
      restaurantId,
      name: name.trim(),
      slot: slot || "food",
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  refreshMenuViews(restaurantId);
  return { ok: true };
}

export async function updateCategory(categoryId: string, name: string): Promise<ActionResult> {
  await requireManager();

  if (!name.trim()) return { ok: false, error: "Category name is required" };

  const cat = await db.menuCategory.findUnique({
    where: { id: categoryId },
    select: { restaurantId: true },
  });
  if (!cat) return { ok: false, error: "Category not found" };

  await db.menuCategory.update({ where: { id: categoryId }, data: { name: name.trim() } });

  refreshMenuViews(cat.restaurantId);
  return { ok: true };
}

/** Soft remove. Items underneath are hidden with it but keep their rows. */
export async function setCategoryActive(categoryId: string, active: boolean): Promise<ActionResult> {
  await requireManager();

  const cat = await db.menuCategory.findUnique({
    where: { id: categoryId },
    select: { restaurantId: true },
  });
  if (!cat) return { ok: false, error: "Category not found" };

  await db.menuCategory.update({ where: { id: categoryId }, data: { active } });

  refreshMenuViews(cat.restaurantId);
  return { ok: true };
}

export async function createItem(categoryId: string, input: ItemInput): Promise<ActionResult> {
  await requireManager();

  const invalid = validateItem(input);
  if (invalid) return { ok: false, error: invalid };

  const cat = await db.menuCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, restaurantId: true },
  });
  if (!cat) return { ok: false, error: "Category not found" };

  const last = await db.menuItem.findFirst({
    where: { categoryId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.menuItem.create({
    data: {
      restaurantId: cat.restaurantId,
      categoryId: cat.id,
      name: input.name.trim(),
      description: input.description.trim() || null,
      priceCents: toFils(input.priceAed),
      available: input.available,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  refreshMenuViews(cat.restaurantId);
  return { ok: true };
}

export async function updateItem(itemId: string, input: ItemInput): Promise<ActionResult> {
  await requireManager();

  const invalid = validateItem(input);
  if (invalid) return { ok: false, error: invalid };

  const item = await db.menuItem.findUnique({
    where: { id: itemId },
    select: { restaurantId: true },
  });
  if (!item) return { ok: false, error: "Item not found" };

  await db.menuItem.update({
    where: { id: itemId },
    data: {
      name: input.name.trim(),
      description: input.description.trim() || null,
      priceCents: toFils(input.priceAed),
      available: input.available,
    },
  });

  refreshMenuViews(item.restaurantId);
  return { ok: true };
}

/** The everyday toggle — "we ran out of this today". Distinct from removal. */
export async function setItemAvailable(itemId: string, available: boolean): Promise<ActionResult> {
  await requireManager();

  const item = await db.menuItem.findUnique({ where: { id: itemId }, select: { restaurantId: true } });
  if (!item) return { ok: false, error: "Item not found" };

  await db.menuItem.update({ where: { id: itemId }, data: { available } });

  refreshMenuViews(item.restaurantId);
  return { ok: true };
}

/** Soft remove / restore for an item. */
export async function setItemActive(itemId: string, active: boolean): Promise<ActionResult> {
  await requireManager();

  const item = await db.menuItem.findUnique({ where: { id: itemId }, select: { restaurantId: true } });
  if (!item) return { ok: false, error: "Item not found" };

  await db.menuItem.update({ where: { id: itemId }, data: { active } });

  refreshMenuViews(item.restaurantId);
  return { ok: true };
}
