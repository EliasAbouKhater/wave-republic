import { headers } from "next/headers";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { QrCodesSection, type QrEntry } from "@/components/backoffice/QrCodesSection";

async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3311";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function makeQr(url: string): Promise<string> {
  // SVG output — sharp at any size, embeds cleanly in <img>
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 1, width: 260 });
}

export default async function QrPage() {
  const base = await baseUrl();

  const restaurants = await db.restaurant.findMany({
    where: { active: true, qrSlug: { not: null } },
    select: { id: true, name: true, type: true, qrSlug: true, cuisine: true },
    orderBy: { name: "asc" },
  });

  const entries: QrEntry[] = [];

  // Park-wide QR
  const parkUrl = `${base}/?src=park`;
  entries.push({
    id: "park",
    kind: "park",
    title: "Park-wide QR",
    subtitle: "Print for signs around the park",
    url: parkUrl,
    svg: await makeQr(parkUrl),
  });

  // Bracelet QR
  const braceletUrl = `${base}/?src=bracelet`;
  entries.push({
    id: "bracelet",
    kind: "bracelet",
    title: "Entry bracelet QR",
    subtitle: "Print on bracelet templates",
    url: braceletUrl,
    svg: await makeQr(braceletUrl),
  });

  // Per-restaurant
  for (const r of restaurants) {
    if (!r.qrSlug) continue;
    const url = `${base}/r/${r.qrSlug}?src=resto`;
    entries.push({
      id: r.id,
      kind: "restaurant",
      title: r.name,
      subtitle: `${r.type === "restaurant" ? "Restaurant" : "Kiosk"} · ${r.cuisine}`,
      url,
      svg: await makeQr(url),
    });
  }

  return <QrCodesSection entries={entries} />;
}
