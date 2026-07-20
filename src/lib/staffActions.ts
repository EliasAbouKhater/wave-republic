"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Move a cashier to a specific station (or unassign). Persists in `staff.kioskId`.
 * The cashier's board and login-station reflect the current assignment.
 * `kioskId` may be `null` to unassign.
 */
export async function reassignCashier(userId: string, kioskId: string | null) {
  const staff = await db.staff.findUnique({ where: { id: userId } });
  if (!staff) throw new Error("Staff not found");
  if (staff.role !== "cashier") throw new Error("Only cashiers can be reassigned to a station");
  if (kioskId) {
    const kiosk = await db.restaurant.findUnique({ where: { id: kioskId, active: true } });
    if (!kiosk) throw new Error("That station no longer exists");
  }
  await db.staff.update({ where: { id: userId }, data: { kioskId } });
  revalidatePath("/backoffice/manager/team");
  revalidatePath("/backoffice/owner/team");
}
