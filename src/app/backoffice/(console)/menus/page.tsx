import { db } from "@/lib/db";
import { MenusSection } from "@/components/backoffice/MenusSection";

export default async function MenusPage() {
  // Removed categories/items are fetched too — the section hides them behind a
  // "Show removed" toggle so the manager can restore a mistake.
  const restaurants = await db.restaurant.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  return (
    <MenusSection
      canEdit={true}
      restaurants={restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        categories: r.categories.map((c) => ({
          id: c.id,
          name: c.name,
          slot: c.slot,
          active: c.active,
          items: c.items.map((i) => ({
            id: i.id,
            name: i.name,
            description: i.description ?? "",
            imageUrl: i.imageUrl,
            price: i.priceCents / 100,
            available: i.available,
            active: i.active,
          })),
        })),
      }))}
    />
  );
}
