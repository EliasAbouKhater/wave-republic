import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MenuScreen, type MenuData } from "@/components/customer/MenuScreen";
import { logRestaurantView } from "@/lib/analytics";

export default async function MenuPage({ params }: { params: Promise<{ restoId: string }> }) {
  const { restoId } = await params;

  // Categories reach a venue through CategoryVenue, and items reach a category
  // through ItemCategory. Order comes from the join rows, so the same category
  // can sit in a different position at each venue. See docs/catalog-plan.md.
  const resto = await db.restaurant.findUnique({
    where: { id: restoId, active: true },
    include: {
      categoryLinks: {
        where: { category: { active: true } },
        orderBy: { sortOrder: "asc" },
        include: {
          category: {
            include: {
              itemLinks: {
                where: { item: { active: true } },
                orderBy: { sortOrder: "asc" },
                include: {
                  item: {
                    include: {
                      tags: {
                        where: { tag: { active: true } },
                        select: { tag: { select: { id: true, name: true, color: true } } },
                        orderBy: { tag: { sortOrder: "asc" } },
                      },
                    },
                  },
                },
              },
            },
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
    thumbLabel: resto.thumbLabel,
    imageUrl: resto.imageUrl,
    categories: resto.categoryLinks.map((cl) => ({
      id: cl.category.id,
      name: cl.category.name,
      items: cl.category.itemLinks.map((il) => ({
        id: il.item.id,
        name: il.item.name,
        description: il.item.description,
        price: il.item.priceCents / 100,
        available: il.item.available,
        imageUrl: il.item.imageUrl,
        tags: il.item.tags.map((t) => t.tag),
      })),
    })),
  };

  return <MenuScreen data={data} />;
}
