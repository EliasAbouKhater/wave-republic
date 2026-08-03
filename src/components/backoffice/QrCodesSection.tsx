"use client";

export type QrEntry = {
  id: string;
  kind: "park" | "bracelet" | "restaurant";
  title: string;
  subtitle: string;
  url: string;
  svg: string;
};

export function QrCodesSection({ entries }: { entries: QrEntry[] }) {
  const park = entries.filter((e) => e.kind === "park");
  const bracelet = entries.filter((e) => e.kind === "bracelet");
  const restos = entries.filter((e) => e.kind === "restaurant");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display font-extrabold text-[26px] text-teal-ink">QR codes</h1>
        <p className="text-[13px] font-body text-teal-muted mt-1">
          Print and distribute. Every scan is attributed by source in Analytics.
        </p>
      </header>

      <Group title="Entry points" entries={[...park, ...bracelet]} />
      <Group title="Per-restaurant / kiosk" entries={restos} />
    </div>
  );
}

function Group({ title, entries }: { title: string; entries: QrEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section>
      <h2 className="font-display font-extrabold text-[17px] text-teal-ink mb-3">{title}</h2>
      <div className="grid grid-cols-3 gap-4">
        {entries.map((e) => (
          <QrCard key={e.id} entry={e} />
        ))}
      </div>
    </section>
  );
}

function QrCard({ entry }: { entry: QrEntry }) {
  const download = () => {
    // Rasterize the SVG to PNG at 1024x1024 in the browser
    const svgBlob = new Blob([entry.svg], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `wave-republic-qr-${entry.id}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    img.src = svgUrl;
  };

  const downloadSvg = () => {
    const blob = new Blob([entry.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wave-republic-qr-${entry.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card p-4 flex flex-col items-center gap-3">
      <div className="text-center">
        <div className="font-display font-extrabold text-[14.5px] text-teal-ink">{entry.title}</div>
        <div className="text-[11.5px] font-body text-teal-muted mt-0.5">{entry.subtitle}</div>
      </div>
      <div
        className="grid place-items-center"
        style={{
          width: 200,
          height: 200,
          background: "#fff",
          padding: 6,
          borderRadius: 12,
          border: "1px solid rgba(16,48,47,0.08)",
        }}
        dangerouslySetInnerHTML={{ __html: entry.svg }}
      />
      <div className="text-[11px] font-body text-teal-muted-4 truncate w-full text-center">
        {entry.url}
      </div>
      <div className="flex gap-2 w-full">
        <button
          onClick={download}
          className="flex-1 font-display font-extrabold text-[12.5px] px-3 py-2 rounded-[12px]"
          style={{ background: "var(--color-teal)", color: "#fff" }}
        >
          Download PNG
        </button>
        <button
          onClick={downloadSvg}
          className="flex-1 font-display font-extrabold text-[12.5px] px-3 py-2 rounded-[12px]"
          style={{ background: "#EAF7F5", color: "#0A6E6C" }}
        >
          SVG
        </button>
      </div>
    </div>
  );
}
