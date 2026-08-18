"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { advanceOrder } from "@/lib/orderActions";
import { useRouter } from "next/navigation";
import { SectionTitle, LiveBadge } from "./DashboardShared";
import type { Fulfillment, OrderStatus } from "@prisma/client";

type BoardOrder = {
  id: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  placedAt: string;
  items: { name: string; qty: number; priceCents: number }[];
  total: number;
  restaurantName?: string;
};

// Kanban columns. Terminal statuses (delivered / picked_up) drop off the board.
const columns: { key: OrderStatus; label: string; tint: string; accent: string }[] = [
  { key: "confirmed",  label: "New",       tint: "#EEF6F4", accent: "#0A6E6C" },
  { key: "preparing",  label: "Preparing", tint: "#FFF6E5", accent: "#B45309" },
  { key: "ready",      label: "Ready",     tint: "#EAF7F5", accent: "#0EA5A4" },
  { key: "delivering", label: "Out",       tint: "#EEF4FF", accent: "#3949AB" },
];

export function OrdersBoard({
  role,
  stationName,
  orders,
}: {
  role: "owner" | "manager" | "cashier";
  stationName: string;
  orders: BoardOrder[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tick, setTick] = useState(0);

  // Refresh from the server every 5s. RSC data reloads via router.refresh().
  useEffect(() => {
    const t = setInterval(() => {
      router.refresh();
      setTick((n) => n + 1);
    }, 5000);
    return () => clearInterval(t);
  }, [router]);

  const byColumn = useMemo(() => {
    const g: Record<string, BoardOrder[]> = {};
    for (const c of columns) g[c.key] = [];
    for (const o of orders) if (g[o.status]) g[o.status].push(o);
    return g;
  }, [orders]);

  const advance = (id: string) => start(async () => {
    await advanceOrder(id);
    router.refresh();
  });

  return (
    <div>
      <SectionTitle
        title="Orders"
        subtitle={role === "cashier" ? `Station: ${stationName}` : "All stations · live queue"}
        right={<LiveBadge />}
      />

      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((c) => (
          <div key={c.key} className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="font-display font-extrabold text-[13px] uppercase tracking-wider" style={{ color: c.accent }}>
                {c.label}
              </div>
              <span
                className="text-[11px] font-extrabold px-1.5 py-0.5 rounded-full"
                style={{ background: c.tint, color: c.accent }}
              >
                {byColumn[c.key].length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {byColumn[c.key].length === 0 && (
                <div
                  className="text-[12px] font-body text-teal-muted italic p-4 text-center rounded-[14px]"
                  style={{ background: "#fff", border: "1px dashed rgba(16,48,47,0.12)" }}
                >
                  Nothing here.
                </div>
              )}
              {byColumn[c.key].map((o) => (
                <OrderCard key={o.id} order={o} onAdvance={() => advance(o.id)} disabled={pending} showRestaurant={role !== "cashier"} tick={tick} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order, onAdvance, disabled, showRestaurant,
}: {
  order: BoardOrder; onAdvance: () => void; disabled: boolean; showRestaurant: boolean; tick: number;
}) {
  const placed = new Date(order.placedAt);
  const mins = Math.max(0, Math.round((Date.now() - placed.getTime()) / 60000));
  return (
    <div
      className="p-3.5"
      style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(16,48,47,0.06)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <div className="font-display font-extrabold text-[14.5px] text-teal-ink">#{order.id}</div>
        <div className="text-[11px] font-extrabold text-teal-muted">{mins}m ago</div>
      </div>
      {showRestaurant && order.restaurantName && (
        <div className="text-[11.5px] font-body text-teal-muted-4 mt-0.5">{order.restaurantName}</div>
      )}
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className="text-[10.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
          style={{
            background: order.fulfillment === "delivery" ? "#EEF4FF" : "#EAF7F5",
            color: order.fulfillment === "delivery" ? "#3949AB" : "#0A6E6C",
          }}
        >
          {order.fulfillment}
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        {order.items.map((it, i) => (
          <div key={i} className="text-[12px] font-body text-teal-ink">
            <span className="font-display font-extrabold mr-1">{it.qty}×</span>{it.name}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="font-display font-extrabold text-[13px]" style={{ color: "var(--color-teal)" }}>
          ${order.total.toFixed(2)}
        </div>
        <button
          onClick={onAdvance}
          disabled={disabled}
          className="font-display font-extrabold text-[12px] px-3 py-1.5 rounded-[10px] text-white disabled:opacity-50"
          style={{ background: "var(--color-teal)" }}
        >
          Advance →
        </button>
      </div>
    </div>
  );
}
