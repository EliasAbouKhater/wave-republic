"use client";

import { SectionTitle } from "./DashboardShared";

type Z = { id: string; name: string; code: string; color: string; venueCount: number };

export function ZonesSection({ zones, canEdit }: { zones: Z[]; canEdit: boolean }) {
  return (
    <div>
      <SectionTitle
        title="Zones"
        subtitle="Where guests can order from and get delivery"
        right={
          canEdit ? (
            <button className="btn-teal font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[14px]">
              + Add zone
            </button>
          ) : null
        }
      />

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {zones.map((z) => (
          <div
            key={z.id}
            className="p-4"
            style={{ background: "#fff", borderRadius: 18, border: "1px solid rgba(16,48,47,0.06)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-[12px] grid place-items-center text-white font-display font-extrabold text-[18px]"
                style={{ background: z.color }}
              >
                {z.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-extrabold text-[16px] text-teal-ink truncate">{z.name}</div>
                <div className="text-[12px] font-body text-teal-muted">{z.venueCount} venue{z.venueCount === 1 ? "" : "s"}</div>
              </div>
            </div>
            <div
              className="mt-3 p-3 rounded-[12px] flex items-center gap-3"
              style={{ background: "#F4FBF9", border: "1px dashed rgba(16,48,47,0.12)" }}
            >
              <QRSvg />
              <div className="flex-1 min-w-0">
                <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-teal-muted">Scan code</div>
                <div className="font-display font-extrabold text-[13px] text-teal-ink truncate">{z.code}</div>
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2 mt-3">
                <button className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px]" style={{ background: "#EAF7F5", color: "#0A6E6C" }}>
                  Print QR
                </button>
                <button className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px]" style={{ background: "#FCEBE7", color: "#E5533B" }}>
                  Suspend
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function QRSvg() {
  return (
    <div
      className="w-11 h-11 rounded-[8px] grid place-items-center flex-shrink-0"
      style={{
        background:
          "repeating-conic-gradient(#10302F 0 25%, transparent 0 50%) 50%/40% 40%, #fff",
        border: "1px solid rgba(16,48,47,0.15)",
      }}
      aria-hidden
    />
  );
}
