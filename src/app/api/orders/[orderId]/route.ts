import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Polled by the customer tracking screen every ~4s.
export async function GET(_req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, updatedAt: true },
  });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(order);
}
