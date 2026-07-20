import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

// Per-restaurant QR entry. Resolves slug → restaurant id and redirects
// into the standard /menu/[restoId] view. The middleware has already
// captured `?src=resto` on this request.
export default async function RestoBySlugPage({ params }: { params: Promise<{ qrSlug: string }> }) {
  const { qrSlug } = await params;

  const resto = await db.restaurant.findUnique({
    where: { qrSlug, active: true },
    select: { id: true },
  });

  if (!resto) notFound();

  redirect(`/menu/${resto.id}`);
}
