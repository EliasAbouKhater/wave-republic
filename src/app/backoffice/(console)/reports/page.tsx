import { db } from "@/lib/db";
import { ReportsSection } from "@/components/backoffice/ReportsSection";

export default async function ReportsPage() {
  const [orders, restaurants] = await Promise.all([
    db.order.findMany({
      select: { restaurantId: true, fulfillment: true, totalCents: true, items: true },
    }),
    db.restaurant.findMany({ select: { id: true, name: true } }),
  ]);

  const revenueByStation: Record<string, number> = {};
  let deliveryCount = 0, pickupCount = 0;
  const itemCounts: Record<string, number> = {};

  for (const o of orders) {
    revenueByStation[o.restaurantId] = (revenueByStation[o.restaurantId] ?? 0) + o.totalCents;
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
