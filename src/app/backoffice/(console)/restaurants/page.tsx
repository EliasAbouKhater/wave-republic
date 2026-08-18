import { db } from "@/lib/db";
import { RestaurantsSection } from "@/components/backoffice/RestaurantsSection";

export default async function RestaurantsPage() {
  // Items no longer hang off a venue directly — a venue's menu is
  // venue -> CategoryVenue -> category -> ItemCategory -> item. The item count
  // is therefore derived, and counts distinct items (an item in two of this
  // venue's categories is still one item on the menu).
  const [restaurants, categories, tags] = await Promise.all([
    db.restaurant.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        categoryLinks: {
          orderBy: { sortOrder: "asc" },
          include: {
            category: {
              include: { itemLinks: { select: { itemId: true, item: { select: { active: true } } } } },
            },
          },
        },
        tags: { select: { tagId: true } },
      },
    }),
    db.menuCategory.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      // Item count disambiguates same-named categories in the assignment list.
      select: {
        id: true,
        name: true,
        slot: true,
        _count: { select: { itemLinks: true } },
      },
    }),
    db.tag.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <RestaurantsSection
      canEdit={true}
      allTags={tags.map((t) => ({ id: t.id, name: t.name, color: t.color }))}
      allCategories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slot: c.slot,
        itemCount: c._count.itemLinks,
      }))}
      restaurants={restaurants.map((r) => {
        const itemIds = new Set(
          r.categoryLinks.flatMap((cl) =>
            cl.category.itemLinks.filter((il) => il.item.active).map((il) => il.itemId),
          ),
        );
        return {
          id: r.id,
          name: r.name,
          type: r.type,
          cuisine: r.cuisine,
          prep: r.prep,
          thumbLabel: r.thumbLabel,
          imageUrl: r.imageUrl,
          pinColor: r.pinColor,
          active: r.active,
          itemCount: itemIds.size,
          categoryIds: r.categoryLinks.map((cl) => cl.category.id),
          categoryNames: r.categoryLinks.map((cl) => cl.category.name),
          categories: r.categoryLinks.map((cl) => ({ id: cl.category.id, name: cl.category.name })),
          tagIds: r.tags.map((t) => t.tagId),
        };
      })}
    />
  );
}
