"use server";

/**
 * Phase 1 analytics — anonymous page-view tracking.
 *
 * Visitor identity: `dl_visitor` cookie (set by middleware).
 * Source attribution: `dl_source` cookie (set by middleware from `?src=` on entry).
 * Dedup: same visitor + entityType + entityId within 30 minutes = 1 view.
 */

import { cookies } from "next/headers";
import { db } from "@/lib/db";

const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 min

type EntityType = "restaurant" | "item" | "map_pin";

async function readVisitor(): Promise<{ visitorId: string | null; source: string | null }> {
  const jar = await cookies();
  const visitorId = jar.get("dl_visitor")?.value ?? null;
  const source = jar.get("dl_source")?.value ?? null;
  return { visitorId, source };
}

async function logView(entityType: EntityType, entityId: string): Promise<void> {
  const { visitorId, source } = await readVisitor();
  if (!visitorId) return; // middleware sets it on next request; skip this one

  const since = new Date(Date.now() - DEDUP_WINDOW_MS);
  const recent = await db.pageView.findFirst({
    where: { visitorId, entityType, entityId, createdAt: { gt: since } },
    select: { id: true },
  });
  if (recent) return;

  await db.pageView.create({
    data: { visitorId, entityType, entityId, source },
  });
}

export async function logRestaurantView(restaurantId: string): Promise<void> {
  await logView("restaurant", restaurantId);
}

export async function logItemView(itemId: string): Promise<void> {
  await logView("item", itemId);
}

// No `map_pin` writer: the customer map was removed 2026-08-18. The entity type
// stays so Analytics can still read the rows logged while the map was live.
