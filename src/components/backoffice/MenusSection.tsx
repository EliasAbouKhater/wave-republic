"use client";

import { useState } from "react";
import { SectionTitle } from "./DashboardShared";

type R = {
  id: string;
  name: string;
  categories: {
    id: string;
    name: string;
    items: { id: string; name: string; price: number; available: boolean }[];
  }[];
};

export function MenusSection({ restaurants, canEdit }: { restaurants: R[]; canEdit: boolean }) {
  const [activeId, setActiveId] = useState<string>(restaurants[0]?.id ?? "");
  const active = restaurants.find((r) => r.id === activeId);

  return (
    <div>
      <SectionTitle
        title="Menus & prices"
        subtitle="Update items, pricing, and availability per venue"
      />

      <div className="flex gap-6 items-start">
        <div className="w-56 flex-shrink-0 flex flex-col gap-1">
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveId(r.id)}
              className="text-left rounded-[12px] px-3 py-2.5 font-display font-extrabold text-[13.5px]"
              style={{
                background: activeId === r.id ? "var(--color-teal)" : "#fff",
                color: activeId === r.id ? "#fff" : "var(--color-teal-ink)",
                border: "1px solid rgba(16,48,47,0.06)",
              }}
            >
              {r.name}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {active?.categories.map((c) => (
            <div key={c.id} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-display font-extrabold text-[15px] text-teal-ink">{c.name}</div>
                {canEdit && (
                  <button className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px]" style={{ background: "#EAF7F5", color: "#0A6E6C" }}>
                    + Item
                  </button>
                )}
              </div>
              <div
                className="rounded-[16px] overflow-hidden"
                style={{ background: "#fff", border: "1px solid rgba(16,48,47,0.06)", boxShadow: "var(--shadow-card)" }}
              >
                {c.items.map((it, i) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: i === 0 ? "none" : "1px solid rgba(16,48,47,0.05)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-extrabold text-[14px] text-teal-ink truncate">{it.name}</div>
                    </div>
                    <div className="font-display font-extrabold text-[14px]" style={{ color: "var(--color-teal)", minWidth: 60, textAlign: "right" }}>
                      ${it.price.toFixed(2)}
                    </div>
                    <span
                      className="text-[10.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
                      style={{
                        background: it.available ? "#EAF7F5" : "#FCEBE7",
                        color: it.available ? "#0A6E6C" : "#E5533B",
                      }}
                    >
                      {it.available ? "Available" : "Sold out"}
                    </span>
                    {canEdit && (
                      <button className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px]" style={{ background: "#F4FBF9", color: "#5E807E" }}>
                        Edit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
