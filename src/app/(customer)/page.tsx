import { db } from "@/lib/db";
import { BrowseScreen, type BrowseRestaurant } from "@/components/customer/BrowseScreen";

// Menu contents change from the backoffice; do not prerender at build time.
export const dynamic = "force-dynamic";

// Anyone with an entry or venue QR lands here and browses.
// `?src=` on the URL is captured for attribution by the middleware.
export default async function CustomerLandingPage() {
  const restaurants = await db.restaurant.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { categories: { select: { slot: true } } },
  });

  const items: BrowseRestaurant[] = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    cuisine: r.cuisine,
    prep: r.prep,
    rating: r.rating,
    thumbLabel: r.thumbLabel,
    slots: Array.from(new Set(r.categories.map((c) => c.slot))),
  }));

  return <BrowseScreen restaurants={items} />;
}
