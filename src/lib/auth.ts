"use server";

/**
 * Manager auth — Phase 1.
 *
 * - Username + password against the Staff table (sha256 seed hashes for now).
 * - Session token stored in the StaffSession row + `dl_staff` HttpOnly cookie.
 * - Only role="manager" is permitted to log in. Owner + cashier are not seeded.
 * - Session TTL: 30 days rolling.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";

const SESSION_COOKIE = "dl_staff";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const hashPassword = (pw: string) => createHash("sha256").update(`dreamland:${pw}`).digest("hex");

export async function login(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await db.staff.findUnique({ where: { username } });
  if (!staff || !staff.active) return { ok: false, error: "Invalid username or password" };
  if (staff.role !== "manager") return { ok: false, error: "Manager access only" };
  if (staff.passwordHash !== hashPassword(password)) return { ok: false, error: "Invalid username or password" };

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.staffSession.create({ data: { staffId: staff.id, token, expiresAt } });

  const jar = await cookies();
  jar.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { ok: true };
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.staffSession.deleteMany({ where: { token } });
    jar.delete(SESSION_COOKIE);
  }
  redirect("/login");
}

export async function getCurrentStaff(): Promise<{ id: string; username: string; name: string; role: string } | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.staffSession.findUnique({
    where: { token },
    include: { staff: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.staffSession.delete({ where: { token } });
    return null;
  }
  const s = session.staff;
  if (!s.active || s.role !== "manager") return null;
  return { id: s.id, username: s.username, name: s.name, role: s.role };
}

export async function requireManager(): Promise<{ id: string; username: string; name: string; role: string }> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  return staff;
}
