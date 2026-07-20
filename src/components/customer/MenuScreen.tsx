"use client";

import { useState } from "react";
import Link from "next/link";

export type MenuData = {
  id: string;
  name: string;
  type: "restaurant" | "kiosk";
  cuisine: string;
  rating: number;
  prep: number;
  zone: string;
  thumbLabel: string;
  categories: {
    id: string;
    name: string;
    items: { id: string; name: string; description: string | null; price: number; available: boolean }[];
  }[];
};

const money = (n: number) => `AED ${n.toFixed(2)}`;

export function MenuScreen({ data }: { data: MenuData }) {
  const [activeCat, setActiveCat] = useState(data.categories[0]?.id ?? "");

  return (
    <div className="min-h-screen w-full flex flex-col max-w-[520px] mx-auto" style={{ background: "#EAF7F5" }}>
      {/* banner */}
      <div
        className="relative flex-shrink-0"
        style={{
          height: 180,
          background:
            "linear-gradient(150deg,#0EA5A4,#0BA5E9), repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0 12px, transparent 12px 24px)",
          backgroundBlendMode: "overlay",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.14) 0 12px, transparent 12px 24px)",
          }}
        />
        <Link
          href="/"
          className="absolute left-4 grid place-items-center"
          style={{
            top: "max(2.5rem, env(safe-area-inset-top))",
            width: 40,
            height: 40,
            background: "rgba(255,255,255,0.92)",
            borderRadius: 12,
          }}
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10302F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </Link>
        <div className="absolute top-16 left-0 right-0 text-center text-white/85 text-[13px] font-extrabold uppercase tracking-[0.6px]" style={{ pointerEvents: "none" }}>
          {data.thumbLabel}
        </div>
      </div>

      {/* header card overlapping banner */}
      <div className="mx-4 -mt-6 relative z-10 card p-4">
        <div className="flex items-center gap-2">
          <div className="font-display font-extrabold text-[19px] text-teal-ink">{data.name}</div>
          <span
            className="text-[10.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
            style={{
              background: data.type === "restaurant" ? "#EAF7F5" : "#EDF2FF",
              color: data.type === "restaurant" ? "#0A6E6C" : "#3949AB",
            }}
          >
            {data.type}
          </span>
        </div>
        <div className="text-[13px] font-body text-teal-muted mt-0.5">{data.cuisine}</div>
        <div className="flex items-center gap-4 mt-2 text-[12px] font-extrabold text-teal-muted">
          <span className="flex items-center gap-1" style={{ color: "#FF6B4A" }}>
            ★ {data.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            ~{data.prep} min
          </span>
          <span className="flex items-center gap-1" style={{ color: "#FF6B4A" }}>
            <svg width="10" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s7-6.5 7-13a7 7 0 1 0-14 0c0 6.5 7 13 7 13Z"/></svg>
            {data.zone}
          </span>
        </div>
      </div>

      {/* category tabs */}
      <div className="px-4 pt-4 flex-shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {data.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className="chip flex-shrink-0"
              data-active={activeCat === c.id}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* items */}
      <div className="flex-1 px-4 pt-3 pb-6">
        <div className="flex flex-col gap-2.5">
          {data.categories.find((c) => c.id === activeCat)?.items.map((it) => (
            <Link
              key={it.id}
              href={`/item/${it.id}`}
              className="card p-3 flex items-center gap-3 hover:brightness-[1.02] active:scale-[0.99] transition"
            >
              <div
                className="grid place-items-center flex-shrink-0"
                style={{
                  width: 56, height: 56, borderRadius: 12,
                  background: "repeating-linear-gradient(45deg, #DBEEEB 0 6px, #EAF7F5 6px 12px)",
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-display font-extrabold text-[14.5px] text-teal-ink truncate">{it.name}</div>
                {it.description && (
                  <div className="text-[12px] font-body text-teal-muted mt-0.5 truncate">{it.description}</div>
                )}
                <div className="font-display font-extrabold text-[15px] mt-0.5" style={{ color: "var(--color-teal)" }}>
                  {money(it.price)}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8FA6A3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
