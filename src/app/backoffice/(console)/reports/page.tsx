import { db } from "@/lib/db";
import { ReportsSection } from "@/components/backoffice/ReportsSection";

export default async function ReportsPage() {
  const [orders, restaurants, zones] = await Promise.all([
    db.order.findMany({
      select: { restaurantId: true, deliveryZoneId: true, fulfillment: true, totalCents: true, items: true },
    }),
    db.restaurant.findMany({ select: { id: true, name: true } }),
    db.zone.findMany({ select: { id: true, name: true, color: true } }),
  ]);

  const revenueByStation: Record<string, number> = {};
  const ordersByZone: Record<string, number> = {};
  let deliveryCount = 0, pickupCount = 0;
  const itemCounts: Record<string, number> = {};

  for (const o of orders) {
    revenueByStation[o.restaurantId] = (revenueByStation[o.restaurantId] ?? 0) + o.totalCents;
    if (o.deliveryZoneId) ordersByZone[o.deliveryZoneId] = (ordersByZone[o.deliveryZoneId] ?? 0) + 1;
    if (o.fulfillment === "delivery") deliveryCount++; else pickupCount++;
    for (const it of (o.items as { name: string; qty: number }[])) {
      itemCounts[it.name] = (itemCounts[it.name] ?? 0) + it.qty;
    }
  }

  const topSellers = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  return (
    <ReportsSection
      revenueByStation={restaurants.map((r) => ({
        name: r.name,
        cents: revenueByStation[r.id] ?? 0,
      }))}
      ordersByZone={zones.map((z) => ({
        name: z.name,
        color: z.color,
        count: ordersByZone[z.id] ?? 0,
      }))}
      deliveryCount={deliveryCount}
      pickupCount={pickupCount}
      topSellers={topSellers}
      totals={{
        orders: orders.length,
        revenueCents: orders.reduce((s, o) => s + o.totalCents, 0),
      }}
    />
  );
}
