import { db } from "@/lib/db";
import { MenusSection } from "@/components/backoffice/MenusSection";

export default async function MenusPage() {
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
          items: c.items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.priceCents / 100,
            available: i.available,
          })),
        })),
      }))}
    />
  );
}
