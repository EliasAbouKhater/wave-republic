import { SectionTitle, KpiGrid, BarChart } from "./DashboardShared";

export function ReportsSection({
  revenueByStation,
  ordersByZone,
  deliveryCount,
  pickupCount,
  topSellers,
  totals,
}: {
  revenueByStation: { name: string; cents: number }[];
  ordersByZone: { name: string; color: string; count: number }[];
  deliveryCount: number;
  pickupCount: number;
  topSellers: { name: string; qty: number }[];
  totals: { orders: number; revenueCents: number };
}) {
  const total = deliveryCount + pickupCount || 1;
  const deliveryPct = Math.round((deliveryCount / total) * 100);
  return (
    <div>
      <SectionTitle title="Reports" subtitle="How the park is performing across every dimension" />

      <KpiGrid
        items={[
          { label: "Orders",     value: String(totals.orders) },
          { label: "Revenue",    value: `$${(totals.revenueCents / 100).toFixed(0)}`, accent: "var(--color-teal)" },
          { label: "Delivery %", value: `${deliveryPct}%`, accent: "var(--color-coral)" },
          { label: "Top station",value: (revenueByStation.slice().sort((a, b) => b.cents - a.cents)[0]?.name ?? "—") },
        ]}
      />

      <div className="grid gap-3.5 mt-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <BarChart
          title="Revenue by station"
          bars={revenueByStation.map((s) => ({ label: s.name.split(" ")[0], value: Math.round(s.cents / 100) }))}
        />
        <div
          className="p-5"
          style={{ background: "#fff", borderRadius: 18, border: "1px solid rgba(16,48,47,0.06)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="font-display font-extrabold text-[15px] text-teal-ink mb-3">Top sellers</div>
          <div className="flex flex-col gap-2">
            {topSellers.length === 0 && <div className="text-[12.5px] font-body text-teal-muted">No orders yet.</div>}
            {topSellers.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="font-display font-extrabold text-[13.5px] text-teal-ink truncate">{t.name}</div>
                <div className="font-display font-extrabold text-[13.5px]" style={{ color: "var(--color-teal)" }}>{t.qty}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3.5 mt-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div
          className="p-5"
          style={{ background: "#fff", borderRadius: 18, border: "1px solid rgba(16,48,47,0.06)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="font-display font-extrabold text-[15px] text-teal-ink mb-3">Orders by zone</div>
          <div className="flex flex-col gap-2.5">
            {ordersByZone.map((z) => {
              const max = Math.max(1, ...ordersByZone.map((x) => x.count));
              return (
                <div key={z.name}>
                  <div className="flex items-center justify-between text-[12.5px] font-extrabold">
                    <div className="text-teal-ink">{z.name}</div>
                    <div className="text-teal-muted">{z.count}</div>
                  </div>
                  <div className="h-2 rounded-full mt-1 overflow-hidden" style={{ background: "#EEF6F4" }}>
                    <div className="h-full rounded-full" style={{ width: `${(z.count / max) * 100}%`, background: z.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="p-5"
          style={{ background: "#fff", borderRadius: 18, border: "1px solid rgba(16,48,47,0.06)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="font-display font-extrabold text-[15px] text-teal-ink mb-3">Delivery vs Pickup</div>
          <div className="flex h-8 rounded-full overflow-hidden" style={{ background: "#EEF6F4" }}>
            <div
              className="h-full grid place-items-center text-[11.5px] font-display font-extrabold text-white"
              style={{ width: `${deliveryPct}%`, background: "#FF6B4A" }}
            >
              {deliveryCount ? `${deliveryPct}%` : ""}
            </div>
            <div
              className="h-full grid place-items-center text-[11.5px] font-display font-extrabold text-teal-ink"
              style={{ width: `${100 - deliveryPct}%` }}
            >
              {pickupCount ? `${100 - deliveryPct}%` : ""}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[12px] font-body text-teal-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF6B4A" }} /> Delivery ({deliveryCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#EEF6F4", border: "1px solid rgba(16,48,47,0.15)" }} />
              Pickup ({pickupCount})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
