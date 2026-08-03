"use client";

import { SectionTitle } from "./DashboardShared";
import Link from "next/link";

type R = {
  id: string;
  name: string;
  type: "restaurant" | "kiosk";
  cuisine: string;
  zone: string;
  prep: number;
  thumbLabel: string;
  pinColor: string;
  active: boolean;
  itemCount: number;
};

export function RestaurantsSection({ restaurants, canEdit }: { restaurants: R[]; canEdit: boolean }) {
  return (
    <div>
      <SectionTitle
        title="Restaurants & kiosks"
        subtitle="Everywhere guests can order from"
        right={
          canEdit ? (
            <button className="btn-teal font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[14px]">
              + Add venue
            </button>
          ) : null
        }
      />
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="p-4"
            style={{
              background: "#fff", borderRadius: 18, border: "1px solid rgba(16,48,47,0.06)",
              boxShadow: "var(--shadow-card)", opacity: r.active ? 1 : 0.6,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-14 h-14 rounded-[12px] grid place-items-center flex-shrink-0"
                style={{
                  background: "repeating-linear-gradient(45deg, #DBEEEB 0 6px, #EAF7F5 6px 12px)",
                  color: "#5E807E", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 10,
                }}
              >
                {r.thumbLabel}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="font-display font-extrabold text-[15px] text-teal-ink truncate">{r.name}</div>
                  <span
                    className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
                    style={{
                      background: r.type === "restaurant" ? "#EAF7F5" : "#EDF2FF",
                      color: r.type === "restaurant" ? "#0A6E6C" : "#3949AB",
                    }}
                  >
                    {r.type}
                  </span>
                </div>
                <div className="text-[12px] font-body text-teal-muted mt-0.5 truncate">{r.cuisine}</div>
                <div className="flex items-center gap-3 text-[11.5px] font-extrabold text-teal-muted mt-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: r.pinColor }} />
                    {r.zone}
                  </span>
                  <span>~{r.prep} min</span>
                  <span>{r.itemCount} items</span>
                </div>
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2 mt-3">
                <Link
                  href={`/menu/${r.id}`}
                  className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px]"
                  style={{ background: "#EAF7F5", color: "#0A6E6C" }}
                >
                  Preview
                </Link>
                <button
                  className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px]"
                  style={{ background: r.active ? "#FCEBE7" : "#EAF7F5", color: r.active ? "#E5533B" : "#0A6E6C" }}
                >
                  {r.active ? "Suspend" : "Restore"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
