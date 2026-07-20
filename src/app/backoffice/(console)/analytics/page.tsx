import { db } from "@/lib/db";
import { AnalyticsSection, type AnalyticsData } from "@/components/backoffice/AnalyticsSection";

const RANGE_DAYS = 30;

export default async function AnalyticsPage() {
  const since = new Date(Date.now() - RANGE_DAYS * 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Overview counters
  const [total30d, unique30d, unique7d, unique24h, restaurants, menuItems] = await Promise.all([
    db.pageView.count({ where: { createdAt: { gte: since } } }),
    db.pageView.findMany({
      where: { createdAt: { gte: since } },
      distinct: ["visitorId"],
      select: { visitorId: true },
    }),
    db.pageView.findMany({
      where: { createdAt: { gte: since7d } },
      distinct: ["visitorId"],
      select: { visitorId: true },
    }),
    db.pageView.findMany({
      where: { createdAt: { gte: since24h } },
      distinct: ["visitorId"],
      select: { visitorId: true },
    }),
    db.restaurant.findMany({
      where: { active: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
    db.menuItem.findMany({
      where: { active: true },
      select: { id: true, name: true, restaurantId: true },
    }),
  ]);

  // Per-entity aggregations
  const restaurantViews = await db.pageView.groupBy({
    by: ["entityId"],
    where: { entityType: "restaurant", createdAt: { gte: since } },
    _count: { _all: true },
  });
  const itemViews = await db.pageView.groupBy({
    by: ["entityId"],
    where: { entityType: "item", createdAt: { gte: since } },
    _count: { _all: true },
  });
  const mapTaps = await db.pageView.groupBy({
    by: ["entityId"],
    where: { entityType: "map_pin", createdAt: { gte: since } },
    _count: { _all: true },
  });

  // Unique visitors per restaurant
  const restaurantUnique = await Promise.all(
    restaurants.map(async (r) => {
      const rows = await db.pageView.findMany({
        where: { entityType: "restaurant", entityId: r.id, createdAt: { gte: since } },
        distinct: ["visitorId"],
        select: { visitorId: true },
      });
      return { id: r.id, uniques: rows.length };
    }),
  );

  // Source attribution (last 30d, restaurant views only — best signal of "engaged" traffic)
  const sourceRaw = await db.pageView.groupBy({
    by: ["source"],
    where: { entityType: "restaurant", createdAt: { gte: since } },
    _count: { _all: true },
  });

  const restLookup = new Map(restaurants.map((r) => [r.id, r]));
  const itemLookup = new Map(menuItems.map((i) => [i.id, i]));

  const data: AnalyticsData = {
    overview: {
      totalViews30d: total30d,
      uniqueVisitors30d: unique30d.length,
      uniqueVisitors7d: unique7d.length,
      uniqueVisitors24h: unique24h.length,
    },
    restaurants: restaurants
      .map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        views: restaurantViews.find((v) => v.entityId === r.id)?._count._all ?? 0,
        uniques: restaurantUnique.find((v) => v.id === r.id)?.uniques ?? 0,
      }))
      .sort((a, b) => b.views - a.views),
    topItems: itemViews
      .map((v) => {
        const it = itemLookup.get(v.entityId);
        if (!it) return null;
        const r = restLookup.get(it.restaurantId);
        return {
          id: v.entityId,
          name: it.name,
          restaurantName: r?.name ?? "?",
          views: v._count._all,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.views - a.views)
      .slice(0, 20),
    mapTaps: mapTaps
      .map((v) => {
        const r = restLookup.get(v.entityId);
        if (!r) return null;
        return { id: v.entityId, name: r.name, taps: v._count._all };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.taps - a.taps),
    sources: sourceRaw.map((s) => ({
      source: s.source ?? "direct",
      count: s._count._all,
    })),
    rangeDays: RANGE_DAYS,
  };

  return <AnalyticsSection data={data} />;
}
