import { db } from "@/lib/db";
import { OrdersBoard } from "@/components/backoffice/OrdersBoard";

export const dynamic = "force-dynamic";

// Phase 2 route — hidden from nav in Phase 1 but reachable directly if needed.
export default async function OrdersPage() {
  const orders = await db.order.findMany({
    where: { status: { notIn: ["delivered", "picked_up", "cancelled"] } },
    include: { zone: true, restaurant: true },
    orderBy: { placedAt: "asc" },
  });

  return (
    <OrdersBoard
      role="manager"
      stationName="All stations"
      orders={orders.map((o) => ({
        id: o.id,
        status: o.status,
        fulfillment: o.fulfillment,
        placedAt: o.placedAt.toISOString(),
        items: o.items as { name: string; qty: number; priceCents: number }[],
        total: o.totalCents / 100,
        zoneName: o.zone?.name ?? null,
        restaurantName: o.restaurant.name,
      }))}
    />
  );
}
