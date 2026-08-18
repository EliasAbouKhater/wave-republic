import { db } from "@/lib/db";
import { TagsSection } from "@/components/backoffice/TagsSection";

export default async function TagsPage() {
  const tags = await db.tag.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { items: true, venues: true } } },
  });

  return (
    <TagsSection
      canEdit={true}
      tags={tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        active: t.active,
        itemCount: t._count.items,
        venueCount: t._count.venues,
      }))}
    />
  );
}
