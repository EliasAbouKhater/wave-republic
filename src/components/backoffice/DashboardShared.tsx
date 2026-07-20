import type { ReactNode } from "react";

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4 gap-4">
      <div>
        <h1 className="font-display font-extrabold text-[26px] text-teal-ink leading-tight">{title}</h1>
        {subtitle && <p className="text-[13px] font-body text-teal-muted mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function LiveBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[11.5px] font-extrabold"
      style={{ background: "#EAF7F5", color: "#0A6E6C", padding: "5px 10px" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "#12B981", boxShadow: "0 0 0 3px rgba(18,185,129,0.25)" }}
      />
      Live
    </span>
  );
}

export function KpiGrid({
  items,
}: {
  items: { label: string; value: string; accent?: string }[];
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((k) => (
        <div key={k.label} className="card p-4">
          <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted">
            {k.label}
          </div>
          <div
            className="font-display font-extrabold text-[28px] mt-1"
            style={{ color: k.accent ?? "var(--color-teal)" }}
          >
            {k.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BarChart({
  title,
  bars,
}: {
  title?: string;
  bars: { label: string; value: number; color?: string }[];
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div
      className="p-5"
      style={{
        background: "#fff",
        borderRadius: 18,
        border: "1px solid rgba(16,48,47,0.06)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {title && (
        <div className="font-display font-extrabold text-[15px] text-teal-ink mb-3">{title}</div>
      )}
      <div className="flex flex-col gap-2.5">
        {bars.map((b) => {
          const pct = (b.value / max) * 100;
          return (
            <div key={b.label}>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-extrabold text-teal-ink">{b.label}</span>
                <span className="font-display font-extrabold text-teal-muted">{b.value}</span>
              </div>
              <div className="h-2 rounded-full mt-1" style={{ background: "rgba(16,48,47,0.08)" }}>
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: b.color ?? "var(--color-teal)",
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
