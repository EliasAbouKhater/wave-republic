import { db } from "@/lib/db";
import { ZonesSection } from "@/components/backoffice/ZonesSection";

export default async function ZonesPage() {
  const zones = await db.zone.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { restaurants: true } } },
  });

  return (
    <ZonesSection
      canEdit={true}
      zones={zones.map((z) => ({
        id: z.id,
        name: z.name,
        code: z.code,
        color: z.color,
        venueCount: z._count.restaurants,
      }))}
    />
  );
}
