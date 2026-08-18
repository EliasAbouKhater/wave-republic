"use server";

/**
 * Tags — manager-defined labels ("Chef's choice", "Most popular", "Best value")
 * shown as chips on venues and menu items.
 *
 * A tag is a row, not a string on the thing it labels: renaming or recolouring
 * one updates every chip at once, and removing a tag does not touch the items
 * that carried it.
 */

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { TAG_COLORS } from "@/lib/tagColors";

export type ActionResult = { ok: true } | { ok: false; error: string };


function refresh() {
  revalidatePath("/backoffice/tags");
  revalidatePath("/backoffice/categories");
  revalidatePath("/backoffice/restaurants");
  revalidatePath("/");
}

export async function createTag(name: string, color: string): Promise<ActionResult> {
  await requireManager();

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Tag name is required" };
  if (trimmed.length > 24) return { ok: false, error: "Keep tag names under 24 characters" };

  const clash = await db.tag.findFirst({ where: { name: trimmed }, select: { id: true } });
  if (clash) return { ok: false, error: `A tag called "${trimmed}" already exists` };

  const last = await db.tag.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });

  await db.tag.create({
    data: {
      name: trimmed,
      color: (TAG_COLORS as readonly string[]).includes(color) ? color : TAG_COLORS[0],
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  refresh();
  return { ok: true };
}

export async function updateTag(tagId: string, name: string, color: string): Promise<ActionResult> {
  await requireManager();

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Tag name is required" };

  const tag = await db.tag.findUnique({ where: { id: tagId }, select: { id: true } });
  if (!tag) return { ok: false, error: "Tag not found" };

  const clash = await db.tag.findFirst({
    where: { name: trimmed, NOT: { id: tagId } },
    select: { id: true },
  });
  if (clash) return { ok: false, error: `A tag called "${trimmed}" already exists` };

  await db.tag.update({
    where: { id: tagId },
    data: {
      name: trimmed,
      color: (TAG_COLORS as readonly string[]).includes(color) ? color : TAG_COLORS[0],
    },
  });

  refresh();
  return { ok: true };
}

/** Soft remove, per the workspace rule — the chip disappears, the tag survives. */
export async function setTagActive(tagId: string, active: boolean): Promise<ActionResult> {
  await requireManager();

  const tag = await db.tag.findUnique({ where: { id: tagId }, select: { id: true } });
  if (!tag) return { ok: false, error: "Tag not found" };

  await db.tag.update({ where: { id: tagId }, data: { active } });

  refresh();
  return { ok: true };
}

/** Replace the tag set on one item. */
export async function setItemTags(itemId: string, tagIds: string[]): Promise<ActionResult> {
  await requireManager();

  const item = await db.menuItem.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) return { ok: false, error: "Item not found" };

  await db.itemTag.deleteMany({ where: { itemId } });
  if (tagIds.length > 0) {
    await db.itemTag.createMany({
      data: tagIds.map((tagId) => ({ itemId, tagId })),
      skipDuplicates: true,
    });
  }

  refresh();
  return { ok: true };
}

/** Replace the tag set on one venue. */
export async function setVenueTags(restaurantId: string, tagIds: string[]): Promise<ActionResult> {
  await requireManager();

  const venue = await db.restaurant.findUnique({ where: { id: restaurantId }, select: { id: true } });
  if (!venue) return { ok: false, error: "Venue not found" };

  await db.venueTag.deleteMany({ where: { restaurantId } });
  if (tagIds.length > 0) {
    await db.venueTag.createMany({
      data: tagIds.map((tagId) => ({ restaurantId, tagId })),
      skipDuplicates: true,
    });
  }

  refresh();
  return { ok: true };
}
