import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { logItemView } from "@/lib/analytics";

const money = (cents: number) => `AED ${(cents / 100).toFixed(2)}`;

export default async function ItemDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;

  const item = await db.menuItem.findUnique({
    where: { id: itemId, active: true },
    include: {
      restaurant: { select: { id: true, name: true, thumbLabel: true, cuisine: true } },
      category: { select: { name: true } },
    },
  });

  if (!item) notFound();

  await logItemView(item.id);

  return (
    <div className="min-h-screen w-full flex flex-col max-w-[520px] mx-auto" style={{ background: "#EAF7F5" }}>
      {/* banner */}
      <div
        className="relative flex-shrink-0"
        style={{
          height: 240,
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
          href={`/menu/${item.restaurant.id}`}
          className="absolute left-4 grid place-items-center"
          style={{ top: "max(2.5rem, env(safe-area-inset-top))", width: 40, height: 40, background: "rgba(255,255,255,0.92)", borderRadius: 12 }}
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10302F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </Link>
        <div className="absolute bottom-4 left-0 right-0 text-center text-white/85 text-[13px] font-extrabold uppercase tracking-[0.6px]" style={{ pointerEvents: "none" }}>
          {item.restaurant.thumbLabel}
        </div>
      </div>

      {/* content */}
      <div className="flex-1 px-5 pt-6 pb-8 max-w-[520px] w-full mx-auto">
        <div className="text-[12px] font-extrabold text-teal-muted uppercase tracking-wider">
          {item.category.name} · {item.restaurant.name}
        </div>
        <h1 className="font-display font-extrabold text-[26px] text-teal-ink mt-1 leading-tight">
          {item.name}
        </h1>
        <div className="font-display font-extrabold text-[22px] mt-3" style={{ color: "var(--color-teal)" }}>
          {money(item.priceCents)}
        </div>

        {item.description && (
          <p className="text-[14px] font-body text-teal-muted mt-4 leading-relaxed">
            {item.description}
          </p>
        )}

        {!item.available && (
          <div
            className="mt-5 rounded-xl px-3 py-2 text-[12.5px] font-extrabold"
            style={{ background: "#FFECE7", color: "#B4351A" }}
          >
            Currently unavailable
          </div>
        )}

        <div className="card mt-6 p-4">
          <div className="text-[12px] font-extrabold text-teal-muted uppercase tracking-wider">
            Sold at
          </div>
          <div className="font-display font-extrabold text-[15.5px] text-teal-ink mt-1">
            {item.restaurant.name}
          </div>
          <div className="text-[12.5px] font-body text-teal-muted">{item.restaurant.cuisine}</div>
          <Link
            href={`/menu/${item.restaurant.id}`}
            className="btn-coral inline-flex mt-4"
            style={{ padding: "10px 18px", fontSize: 13 }}
          >
            View full menu
          </Link>
        </div>
      </div>
    </div>
  );
}
