import { headers } from "next/headers";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { QrCodesSection, type QrEntry } from "@/components/backoffice/QrCodesSection";

/**
 * QR codes are physically printed on park signage and entry bracelets. Once printed
 * they cannot be recalled, so the URL burned into them is FROZEN.
 *
 * `QR_BASE_URL` is the single source of truth. It must never change while printed
 * codes are in circulation — see docs/qr-stability.md. The request Host header is
 * only a dev-time fallback so `npm run dev` still produces scannable codes; it is
 * deliberately NOT used in production, because the host varies by deployment URL
 * (preview deploys, vercel.app vs custom domain) and would silently change codes.
 */
async function baseUrl(): Promise<string> {
  const pinned = process.env.QR_BASE_URL?.trim();
  if (pinned) return pinned.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "QR_BASE_URL is not set. Printed QR codes require a pinned canonical URL — " +
        "refusing to generate codes from the request Host header in production. " +
        "See docs/qr-stability.md."
    );
  }

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
  const isPinned = Boolean(process.env.QR_BASE_URL?.trim());

  const restaurants = await db.restaurant.findMany({
    where: { active: true, qrSlug: { not: null } },
    select: { id: true, name: true, type: true, qrSlug: true, cuisine: true },
    orderBy: { name: "asc" },
  });

  const entries: QrEntry[] = [];

  // Single entry QR — one code for park signage AND entry bracelets.
  // Merged 2026-08-17 so the park prints one artwork everywhere.
  // The `?src=park` tag is frozen: analytics rows already reference it.
  const entryUrl = `${base}/?src=park`;
  entries.push({
    id: "entry",
    kind: "entry",
    title: "Entry QR",
    subtitle: "One code for park signs and entry bracelets",
    url: entryUrl,
    svg: await makeQr(entryUrl),
  });

  // Per-restaurant — slug is immutable once assigned (see docs/qr-stability.md)
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

  return <QrCodesSection entries={entries} baseUrl={base} isPinned={isPinned} />;
}
