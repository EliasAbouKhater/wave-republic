"use server";

import { db } from "@/lib/db";
import type { Fulfillment } from "@prisma/client";

export type PlaceOrderInput = {
  restaurantId: string;
  fulfillment: Fulfillment;
  items: { id: string; name: string; priceCents: number; qty: number }[];
  subtotalCents: number;
  serviceFeeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
};

/**
 * Server-side order creation. Called after the mocked payment succeeds on the
 * client (task #7). Increments the OrderSequence to produce a human-friendly
 * order number ("1043", "1044", …) matching the prototype.
 *
 * Phase 2 scaffolding — no caller yet.
 */
export async function placeOrder(input: PlaceOrderInput) {
  if (input.items.length === 0) throw new Error("Cannot place an empty order.");

  const orderId = await db.$transaction(async (tx) => {
    // Atomically bump the sequence and use its previous value as the order id.
    const seq = await tx.orderSequence.upsert({
      where: { id: 1 },
      update: { nextVal: { increment: 1 } },
      create: { id: 1, nextVal: 1044 },
    });
    const id = String(seq.nextVal - 1);

    const resto = await tx.restaurant.findUniqueOrThrow({ where: { id: input.restaurantId } });

    await tx.order.create({
      data: {
        id,
        restaurantId: input.restaurantId,
        fulfillment: input.fulfillment,
        status: "confirmed",
        items: input.items,
        subtotalCents: input.subtotalCents,
        serviceFeeCents: input.serviceFeeCents,
        deliveryFeeCents: input.deliveryFeeCents,
        totalCents: input.totalCents,
        prepMinutes: resto.prep,
        paymentStatus: "mocked_succeeded",
      },
    });
    return id;
  });

  return { orderId };
}

/**
 * Cashier / manager action: advance an order to the next status in its
 * fulfillment sequence. Wired to the backoffice board in task #6.
 */
export async function advanceOrder(orderId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  const seq =
    order.fulfillment === "delivery"
      ? (["confirmed", "preparing", "ready", "delivering", "delivered"] as const)
      : (["confirmed", "preparing", "ready", "picked_up"] as const);
  const i = (seq as readonly string[]).indexOf(order.status);
  if (i < 0 || i === seq.length - 1) return { changed: false };
  await db.order.update({ where: { id: orderId }, data: { status: seq[i + 1] } });
  return { changed: true, newStatus: seq[i + 1] };
}
