import { db } from "@/lib/db";
import { CategoriesSection } from "@/components/backoffice/CategoriesSection";

/**
 * Categories & prices — venue-independent.
 *
 * Categories and items are defined here once; which venues serve a category is
 * set on the Restaurants screen. Removed rows are fetched too, hidden behind the
 * section's "Show removed" toggle so a mistake can be restored.
 */
export default async function CategoriesPage() {
  const [categories, items, tags] = await Promise.all([
    db.menuCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        venues: { select: { restaurantId: true } },
        itemLinks: {
          orderBy: { sortOrder: "asc" },
          include: { item: true },
        },
      },
    }),
    db.menuItem.findMany({
      orderBy: { name: "asc" },
      include: {
        categories: { select: { categoryId: true } },
        tags: { select: { tagId: true } },
      },
    }),
    db.tag.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <CategoriesSection
      canEdit={true}
      allTags={tags.map((t) => ({ id: t.id, name: t.name, color: t.color }))}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slot: c.slot,
        active: c.active,
        venueCount: c.venues.length,
        items: c.itemLinks.map((il) => ({
          id: il.item.id,
          name: il.item.name,
          description: il.item.description ?? "",
          imageUrl: il.item.imageUrl,
          price: il.item.priceCents / 100,
          available: il.item.available,
          active: il.item.active,
        })),
      }))}
      allItems={items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description ?? "",
        imageUrl: i.imageUrl,
        price: i.priceCents / 100,
        available: i.available,
        active: i.active,
        categoryIds: i.categories.map((c) => c.categoryId),
        tagIds: i.tags.map((t) => t.tagId),
      }))}
    />
  );
}
