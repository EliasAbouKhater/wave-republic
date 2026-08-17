"use server";

/**
 * Venue (restaurant / kiosk) mutations for the backoffice.
 *
 * Two invariants drive the shape of this file:
 *
 * 1. **No permanent deletes.** Removal sets `active = false`. Menu items, past
 *    orders and the QR slug all survive, so a mistaken removal is one click back.
 * 2. **`qrSlug` is immutable.** It is burned into printed signage — see
 *    docs/qr-stability.md. `createVenue` assigns it once; `updateVenue` refuses
 *    to touch it.
 */

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";

export type VenueInput = {
  name: string;
  type: "restaurant" | "kiosk";
  cuisine: string;
  prep: number;
  thumbLabel: string;
};

/**
 * Map-pin colours. The colour picker was removed from the UI, but pins still need
 * to be distinguishable on the browse map, so new venues cycle through this palette
 * by creation order instead of asking the manager to choose.
 */
const PIN_COLORS = ["#0EA5A4", "#FF6B4A", "#0BA5E9", "#22C55E", "#8B5CF6", "#F59E0B"];

export type ActionResult = { ok: true } | { ok: false; error: string };

/** "Sunset Grill" -> "sunset-grill". Used for both the row id and the QR slug. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Both the venue list and the QR page render venues; refresh both. */
function refreshVenueViews() {
  revalidatePath("/backoffice/restaurants");
  revalidatePath("/backoffice/menus");
  revalidatePath("/backoffice/qr");
  revalidatePath("/");
}

function validate(input: VenueInput): string | null {
  if (!input.name.trim()) return "Name is required";
  if (!input.cuisine.trim()) return "Cuisine is required";
  if (!Number.isFinite(input.prep) || input.prep < 0 || input.prep > 240) {
    return "Prep time must be between 0 and 240 minutes";
  }
  return null;
}

export async function createVenue(input: VenueInput): Promise<ActionResult> {
  await requireManager();

  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  const base = slugify(input.name);
  if (!base) return { ok: false, error: "Name must contain at least one letter or number" };

  // id and qrSlug are both derived from the name, and both are permanent once
  // set. Suffix on collision rather than overwrite an existing venue's code.
  let id = base;
  for (let n = 2; await db.restaurant.findUnique({ where: { id }, select: { id: true } }); n++) {
    id = `${base}-${n}`;
  }

  // Zones are gone from the UI, but `Restaurant.zoneId` is still a required FK and
  // the Zone model is retained for Phase 2 delivery destinations. Attach silently to
  // the default zone, creating it if the table is empty.
  const zone =
    (await db.zone.findFirst({ orderBy: { id: "asc" }, select: { id: true } })) ??
    (await db.zone.create({
      data: { id: "A", name: "Park", code: "WR-PARK-01", color: "#0EA5A4" },
      select: { id: true },
    }));

  await db.restaurant.create({
    data: {
      id,
      qrSlug: id,
      name: input.name.trim(),
      type: input.type,
      cuisine: input.cuisine.trim(),
      zoneId: zone.id,
      prep: Math.round(input.prep),
      rating: 0,
      pinColor: PIN_COLORS[(await db.restaurant.count()) % PIN_COLORS.length],
      mapX: 50,
      mapY: 50,
      thumbLabel: (input.thumbLabel.trim() || input.name.trim()).slice(0, 12).toLowerCase(),
      deliveryEnabled: true,
    },
  });

  refreshVenueViews();
  return { ok: true };
}

export async function updateVenue(id: string, input: VenueInput): Promise<ActionResult> {
  await requireManager();

  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  const existing = await db.restaurant.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "Venue not found" };

  // Note the absence of `id` and `qrSlug` — both are frozen for QR stability.
  await db.restaurant.update({
    where: { id },
    data: {
      name: input.name.trim(),
      type: input.type,
      cuisine: input.cuisine.trim(),
      prep: Math.round(input.prep),
      thumbLabel: (input.thumbLabel.trim() || input.name.trim()).slice(0, 12).toLowerCase(),
    },
  });

  refreshVenueViews();
  return { ok: true };
}

/**
 * Soft remove / restore. Never deletes: the row, its menu, its order history and
 * its QR slug all stay put, so a printed code keeps resolving and the manager can
 * undo a mistake.
 */
export async function setVenueActive(id: string, active: boolean): Promise<ActionResult> {
  await requireManager();

  const existing = await db.restaurant.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "Venue not found" };

  await db.restaurant.update({ where: { id }, data: { active } });

  refreshVenueViews();
  return { ok: true };
}
