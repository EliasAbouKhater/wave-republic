export type AnalyticsData = {
  overview: {
    totalViews30d: number;
    uniqueVisitors30d: number;
    uniqueVisitors7d: number;
    uniqueVisitors24h: number;
  };
  restaurants: { id: string; name: string; type: "restaurant" | "kiosk"; views: number; uniques: number }[];
  topItems: { id: string; name: string; restaurantName: string; views: number }[];
  mapTaps: { id: string; name: string; taps: number }[];
  sources: { source: string; count: number }[];
  rangeDays: number;
};

const SOURCE_LABEL: Record<string, string> = {
  park: "Park QR",
  bracelet: "Bracelet QR",
  resto: "Per-restaurant QR",
  direct: "Direct / unknown",
};
const SOURCE_COLOR: Record<string, string> = {
  park: "#0EA5A4",
  bracelet: "#FF6B4A",
  resto: "#8B5CF6",
  direct: "#8FA6A3",
};

export function AnalyticsSection({ data }: { data: AnalyticsData }) {
  const totalSourceCount = data.sources.reduce((s, x) => s + x.count, 0);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display font-extrabold text-[22px] sm:text-[26px] text-teal-ink">Analytics</h1>
        <p className="text-[13px] font-body text-teal-muted mt-1">
          Anonymous view tracking · last {data.rangeDays} days · dedup 30 min per visitor
        </p>
      </header>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Views (30d)" value={data.overview.totalViews30d} />
        <Stat label="Unique visitors (30d)" value={data.overview.uniqueVisitors30d} accent />
        <Stat label="Unique visitors (7d)" value={data.overview.uniqueVisitors7d} />
        <Stat label="Unique visitors (24h)" value={data.overview.uniqueVisitors24h} />
      </div>

      {/* Source attribution */}
      <section className="card p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display font-extrabold text-[17px] text-teal-ink">Traffic source</h2>
          <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted">
            Restaurant views only
          </div>
        </div>
        {totalSourceCount === 0 ? (
          <Empty>No traffic yet.</Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {data.sources.map((s) => {
              const pct = totalSourceCount > 0 ? (s.count / totalSourceCount) * 100 : 0;
              const color = SOURCE_COLOR[s.source] ?? "#8FA6A3";
              return (
                <div key={s.source}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-extrabold text-teal-ink">
                      {SOURCE_LABEL[s.source] ?? s.source}
                    </span>
                    <span className="font-display font-extrabold text-teal-muted">
                      {s.count} · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full mt-1"
                    style={{ background: "rgba(16,48,47,0.08)" }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${pct}%`, background: color, transition: "width 0.3s" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Views by restaurant */}
      <section className="card p-5">
        <h2 className="font-display font-extrabold text-[17px] text-teal-ink mb-4">
          Views by restaurant / kiosk
        </h2>
        {data.restaurants.length === 0 ? (
          <Empty>No restaurants.</Empty>
        ) : (
          <Table
            head={["Name", "Type", "Views", "Unique visitors"]}
            rows={data.restaurants.map((r) => [
              r.name,
              <Tag key="t" kind={r.type} />,
              r.views.toString(),
              r.uniques.toString(),
            ])}
          />
        )}
      </section>

      {/* Top items */}
      <section className="card p-5">
        <h2 className="font-display font-extrabold text-[17px] text-teal-ink mb-4">
          Top viewed items
        </h2>
        {data.topItems.length === 0 ? (
          <Empty>No item views yet.</Empty>
        ) : (
          <Table
            head={["Item", "Restaurant", "Views"]}
            rows={data.topItems.map((i) => [i.name, i.restaurantName, i.views.toString()])}
          />
        )}
      </section>

      {/* Map taps */}
      <section className="card p-5">
        <h2 className="font-display font-extrabold text-[17px] text-teal-ink mb-4">
          Map pin taps
        </h2>
        {data.mapTaps.length === 0 ? (
          <Empty>No map interactions yet.</Empty>
        ) : (
          <Table
            head={["Restaurant", "Taps"]}
            rows={data.mapTaps.map((m) => [m.name, m.taps.toString()])}
          />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted">
        {label}
      </div>
      <div
        className="font-display font-extrabold text-[28px] mt-1"
        style={{ color: accent ? "var(--color-coral)" : "var(--color-teal)" }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function Tag({ kind }: { kind: "restaurant" | "kiosk" }) {
  return (
    <span
      className="text-[10.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
      style={{
        background: kind === "restaurant" ? "#EAF7F5" : "#EDF2FF",
        color: kind === "restaurant" ? "#0A6E6C" : "#3949AB",
      }}
    >
      {kind}
    </span>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      {/* Below ~520px the columns would squeeze into each other; let the table
          keep its natural width and scroll instead. */}
      <table className="w-full text-[13px] min-w-[420px]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="text-left text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted pb-2 border-b"
                style={{ borderColor: "rgba(16,48,47,0.08)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="py-2.5 border-b"
                  style={{ borderColor: "rgba(16,48,47,0.05)" }}
                >
                  <span className={j === 0 ? "font-display font-extrabold text-teal-ink" : "text-teal-ink"}>
                    {cell}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid place-items-center h-24 text-[13px] font-body text-teal-muted">
      {children}
    </div>
  );
}
