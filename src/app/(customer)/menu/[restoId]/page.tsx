import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MenuScreen, type MenuData } from "@/components/customer/MenuScreen";
import { logRestaurantView } from "@/lib/analytics";

export default async function MenuPage({ params }: { params: Promise<{ restoId: string }> }) {
  const { restoId } = await params;

  const resto = await db.restaurant.findUnique({
    where: { id: restoId, active: true },
    include: {
      zone: true,
      categories: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { active: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!resto) notFound();

  await logRestaurantView(resto.id);

  const data: MenuData = {
    id: resto.id,
    name: resto.name,
    type: resto.type,
    cuisine: resto.cuisine,
    rating: resto.rating,
    prep: resto.prep,
    zone: resto.zone.name,
    thumbLabel: resto.thumbLabel,
    categories: resto.categories.map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.priceCents / 100,
        available: i.available,
      })),
    })),
  };

  return <MenuScreen data={data} />;
}
