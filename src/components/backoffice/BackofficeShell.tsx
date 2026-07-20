"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import type { ReactNode } from "react";
import { logout } from "@/lib/auth";

type NavItem = { key: string; label: string; href: string; phase2?: boolean };

// Phase 1 nav: menu-display + analytics.
// Set NEXT_PUBLIC_PHASE_2_ENABLED=true to restore orders/team/reports.
const nav: NavItem[] = [
  { key: "analytics",   label: "Analytics",      href: "/backoffice/analytics" },
  { key: "restaurants", label: "Restaurants",    href: "/backoffice/restaurants" },
  { key: "menus",       label: "Menus & prices", href: "/backoffice/menus" },
  { key: "zones",       label: "Zones",          href: "/backoffice/zones" },
  { key: "qr",          label: "QR codes",       href: "/backoffice/qr" },
  { key: "orders",      label: "Orders",         href: "/backoffice/orders",  phase2: true },
  { key: "team",        label: "Team",           href: "/backoffice/team",    phase2: true },
  { key: "reports",     label: "Reports",        href: "/backoffice/reports", phase2: true },
];

const PHASE_2 = process.env.NEXT_PUBLIC_PHASE_2_ENABLED === "true";

export function BackofficeShell({
  staff,
  children,
}: {
  staff: { name: string; username: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const visibleNav = nav.filter((n) => !n.phase2 || PHASE_2);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const signOut = () => start(async () => { await logout(); });

  return (
    <div className="flex gap-6 items-start max-w-[1200px] mx-auto p-5">
      <aside
        className="flex-shrink-0"
        style={{
          width: 230,
          background: "#fff",
          border: "1px solid rgba(16,48,47,0.08)",
          borderRadius: 20,
          padding: 16,
          position: "sticky",
          top: 20,
        }}
      >
        <div className="flex items-center gap-3 p-2 mb-4">
          <div
            className="w-11 h-11 grid place-items-center rounded-[14px] text-white font-display font-extrabold text-lg"
            style={{ background: "#0EA5A4" }}
          >
            {staff.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-display font-extrabold text-[14px] text-teal-ink truncate">{staff.name}</div>
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-teal-muted truncate">
              Manager
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          {visibleNav.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.key}
                href={n.href}
                className="flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-[13.5px] font-display font-extrabold transition"
                style={{
                  background: active ? "var(--color-teal)" : "transparent",
                  color: active ? "#fff" : "var(--color-teal-ink)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: active ? "#fff" : "rgba(16,48,47,0.2)" }}
                />
                {n.label}
              </Link>
            );
          })}
        </div>

        <div style={{ height: 1, background: "rgba(16,48,47,0.08)", margin: "14px 0" }} />
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          className="w-full text-center rounded-[12px] py-2.5 text-[13px] font-display font-extrabold text-teal-muted-4 disabled:opacity-70"
          style={{ background: "#F4FBF9" }}
        >
          {pending ? "Signing out…" : "Sign out"}
        </button>
      </aside>

      <section className="flex-1 min-w-0">{children}</section>
    </div>
  );
}
