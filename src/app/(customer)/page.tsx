import { db } from "@/lib/db";
import { BrowseScreen, type BrowseRestaurant } from "@/components/customer/BrowseScreen";

// Menu contents change from the backoffice; do not prerender at build time.
export const dynamic = "force-dynamic";

// Anyone with an entry or venue QR lands here and browses.
// `?src=` on the URL is captured for attribution by the middleware.
export default async function CustomerLandingPage() {
  // Manager-controlled order (drag-and-drop in the backoffice), name as a
  // stable tiebreak. The Food/Drinks/Sweets filter still keys off category
  // `slot`, now reached through CategoryVenue.
  const restaurants = await db.restaurant.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      categoryLinks: {
        where: { category: { active: true } },
        select: { category: { select: { slot: true } } },
      },
      tags: {
        where: { tag: { active: true } },
        select: { tag: { select: { id: true, name: true, color: true } } },
        orderBy: { tag: { sortOrder: "asc" } },
      },
    },
  });

  const items: BrowseRestaurant[] = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    cuisine: r.cuisine,
    prep: r.prep,
    rating: r.rating,
    thumbLabel: r.thumbLabel,
    imageUrl: r.imageUrl,
    slots: Array.from(new Set(r.categoryLinks.map((cl) => cl.category.slot))),
    tags: r.tags.map((t) => t.tag),
  }));

  return <BrowseScreen restaurants={items} />;
}
