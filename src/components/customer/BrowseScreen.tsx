"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { logMapPinTap } from "@/lib/analytics";

export type BrowseRestaurant = {
  id: string;
  name: string;
  type: "restaurant" | "kiosk";
  cuisine: string;
  zoneId: string;
  prep: number;
  rating: number;
  pinColor: string;
  mapX: number;
  mapY: number;
  thumbLabel: string;
  slots: string[]; // "food" | "drinks" | "sweets"
};

export type BrowseZone = { id: string; name: string; color: string };

type Filter = "all" | "food" | "drinks" | "sweets";
const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "food", label: "Food" },
  { key: "drinks", label: "Drinks" },
  { key: "sweets", label: "Sweets" },
];

export function BrowseScreen({
  restaurants,
  zones,
}: {
  restaurants: BrowseRestaurant[];
  zones: BrowseZone[];
}) {
  const [view, setView] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(() => {
    if (filter === "all") return restaurants;
    return restaurants.filter((r) => r.slots.includes(filter));
  }, [restaurants, filter]);

  return (
    <div className="min-h-screen w-full flex flex-col max-w-[520px] mx-auto" style={{ background: "#EAF7F5" }}>
      {/* header */}
      <div
        className="pt-10 px-5 pb-5 text-white flex-shrink-0"
        style={{ background: "linear-gradient(150deg,#0EA5A4,#0BA5E9)", paddingTop: "max(2.5rem, env(safe-area-inset-top))" }}
      >
        <div className="font-display font-extrabold text-[13px] uppercase" style={{ letterSpacing: "0.6px", opacity: 0.85 }}>
          Dreamland Menu
        </div>
        <h1 className="font-display font-extrabold text-[26px] mt-2 leading-tight">What are you craving?</h1>

        <div className="mt-3">
          <div
            className="flex items-center gap-2 rounded-[16px] px-4"
            style={{ background: "#fff", height: 44 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8FA6A3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="flex-1 bg-transparent outline-none text-[14px] font-body placeholder:text-[#8FA6A3] text-teal-ink"
              placeholder="Search food, drinks, kiosks…"
            />
          </div>
        </div>
      </div>

      {/* filters + view toggle */}
      <div className="px-5 pt-4 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="chip flex-shrink-0"
              data-active={filter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="font-display font-extrabold text-[16px] text-teal-ink">All spots</div>
          <div
            className="flex items-center rounded-[14px] p-1"
            style={{ background: "#fff", border: "1px solid rgba(16,48,47,0.06)" }}
          >
            {(["list", "map"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="font-display font-extrabold px-4 py-1.5 rounded-[10px] text-[13px]"
                style={{
                  background: view === v ? "var(--color-teal)" : "transparent",
                  color: view === v ? "#fff" : "var(--color-teal-muted-4)",
                }}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* body */}
      <div className="flex-1 px-4 pt-3 pb-6">
        {view === "list" ? (
          <ListView restaurants={shown} />
        ) : (
          <MapView restaurants={shown} zones={zones} />
        )}
      </div>
    </div>
  );
}

function ListView({ restaurants }: { restaurants: BrowseRestaurant[] }) {
  if (restaurants.length === 0) {
    return (
      <div className="grid place-items-center h-40 text-teal-muted text-[13px] font-body">
        Nothing matches this filter.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {restaurants.map((r) => (
        <Link
          key={r.id}
          href={`/menu/${r.id}`}
          className="card flex items-center gap-3 p-3 hover:brightness-[1.02] active:scale-[0.99] transition"
        >
          <Thumb label={r.thumbLabel} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="font-display font-extrabold text-[15px] text-teal-ink truncate">{r.name}</div>
              <span
                className="text-[10.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
                style={{
                  background: r.type === "restaurant" ? "#EAF7F5" : "#EDF2FF",
                  color: r.type === "restaurant" ? "#0A6E6C" : "#3949AB",
                }}
              >
                {r.type}
              </span>
            </div>
            <div className="text-[12.5px] font-body text-teal-muted mt-0.5 truncate">{r.cuisine}</div>
            <div className="flex items-center gap-3 text-[11.5px] font-extrabold text-teal-muted mt-1.5">
              <span className="flex items-center gap-1" style={{ color: "#FF6B4A" }}>
                <StarSvg /> {r.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <ClockSvg /> ~{r.prep} min
              </span>
              <span className="flex items-center gap-1" style={{ color: "var(--color-green)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} /> Open
              </span>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8FA6A3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </Link>
      ))}
    </div>
  );
}

function MapView({ restaurants, zones }: { restaurants: BrowseRestaurant[]; zones: BrowseZone[] }) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative overflow-hidden"
        style={{
          width: "100%",
          height: 340,
          borderRadius: 22,
          border: "1px solid rgba(16,48,47,0.08)",
          background: "linear-gradient(135deg,#CDEFEA,#D6ECF9)",
        }}
      >
        <div className="absolute inset-0 grid place-items-center text-[11px] font-extrabold uppercase tracking-widest text-teal-muted-3">
          Resort map goes here
        </div>
        {restaurants.map((r) => (
          <Link
            key={r.id}
            href={`/menu/${r.id}`}
            onClick={() => startTransition(() => { logMapPinTap(r.id); })}
            className="absolute"
            style={{
              left: `${r.mapX}%`,
              top: `${r.mapY}%`,
              transform: "translate(-50%,-100%)",
            }}
            aria-label={r.name}
          >
            <div
              className="pin-teardrop"
              style={{ background: r.pinColor, width: 32, height: 32, boxShadow: "0 8px 16px rgba(0,0,0,0.15)" }}
            >
              <span className="text-[13px]">{r.name.charAt(0)}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {zones.map((z) => (
          <span
            key={z.id}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold rounded-full px-2.5 py-1"
            style={{ background: "#fff", border: "1px solid rgba(16,48,47,0.06)", color: "var(--color-teal-ink)" }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: z.color }} />
            {z.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function Thumb({ label }: { label: string }) {
  return (
    <div
      className="grid place-items-center flex-shrink-0"
      style={{
        width: 60,
        height: 60,
        borderRadius: 12,
        background:
          "repeating-linear-gradient(45deg, #DBEEEB 0 6px, #EAF7F5 6px 12px)",
        color: "#5E807E",
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize: 10,
      }}
    >
      {label}
    </div>
  );
}

function StarSvg() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2 15 8.6l7.2.8-5.4 4.9L18.5 22 12 18 5.5 22l1.7-7.7L1.8 9.4l7.2-.8Z" />
    </svg>
  );
}
function ClockSvg() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
