import { db } from "@/lib/db";
import { RestaurantsSection } from "@/components/backoffice/RestaurantsSection";

export default async function RestaurantsPage() {
  const restaurants = await db.restaurant.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <RestaurantsSection
      canEdit={true}
      restaurants={restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        cuisine: r.cuisine,
        prep: r.prep,
        thumbLabel: r.thumbLabel,
        pinColor: r.pinColor,
        active: r.active,
        itemCount: r._count.items,
      }))}
    />
  );
}
