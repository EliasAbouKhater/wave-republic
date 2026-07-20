import { db } from "@/lib/db";
import { BrowseScreen, type BrowseRestaurant, type BrowseZone } from "@/components/customer/BrowseScreen";

// Menu contents change from the backoffice; do not prerender at build time.
export const dynamic = "force-dynamic";

// Phase 1: no zone-gate. Anyone with a park / bracelet / direct QR lands here
// and browses. `?src=` on the URL is captured for attribution by the middleware.
export default async function CustomerLandingPage() {
  const [restaurants, zones] = await Promise.all([
    db.restaurant.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { categories: { select: { slot: true } } },
    }),
    db.zone.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
  ]);

  const items: BrowseRestaurant[] = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    cuisine: r.cuisine,
    zoneId: r.zoneId,
    prep: r.prep,
    rating: r.rating,
    pinColor: r.pinColor,
    mapX: r.mapX,
    mapY: r.mapY,
    thumbLabel: r.thumbLabel,
    slots: Array.from(new Set(r.categories.map((c) => c.slot))),
  }));

  const zs: BrowseZone[] = zones.map((z) => ({ id: z.id, name: z.name, color: z.color }));

  return <BrowseScreen restaurants={items} zones={zs} />;
}
