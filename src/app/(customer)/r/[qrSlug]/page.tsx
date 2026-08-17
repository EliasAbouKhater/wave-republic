import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Entry point for a venue's printed QR code (table cards, counter stands).
 *
 * A removed venue must NOT 404 here: its code is already printed and physically
 * out in the park. A guest scanning it gets an explanation and a way back to the
 * full list — never a dead end. See docs/qr-stability.md rule 3.
 */
export default async function RestoBySlugPage({ params }: { params: Promise<{ qrSlug: string }> }) {
  const { qrSlug } = await params;

  const resto = await db.restaurant.findUnique({
    where: { qrSlug },
    select: { id: true, name: true, active: true },
  });

  // Unknown slug — never issued, or a mis-scan. Genuinely not found.
  if (!resto) notFound();

  if (resto.active) redirect(`/menu/${resto.id}`);

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="card p-6 text-center" style={{ maxWidth: 340 }}>
        <div className="font-display font-extrabold text-[19px] text-teal-ink">
          {resto.name} isn&rsquo;t serving right now
        </div>
        <p className="text-[13.5px] font-body text-teal-muted mt-2 leading-relaxed">
          This spot is closed at the moment. Plenty of other places to eat around the park.
        </p>
        <Link
          href="/"
          className="btn-teal inline-block font-display font-extrabold text-[13.5px] px-5 py-2.5 rounded-[14px] mt-4"
        >
          See all food &amp; drinks
        </Link>
      </div>
    </main>
  );
}
