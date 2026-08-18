"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import type { ReactNode } from "react";
import { logout } from "@/lib/auth";

// `shortLabel` is the bottom-tab caption; `label` is the sidebar's.
type NavItem = { key: string; label: string; shortLabel?: string; href: string; phase2?: boolean };

// Phase 1 nav: menu-display + analytics.
// Set NEXT_PUBLIC_PHASE_2_ENABLED=true to restore orders/team/reports.
const nav: NavItem[] = [
  { key: "analytics",   label: "Analytics",      href: "/backoffice/analytics" },
  { key: "restaurants", label: "Restaurants",    shortLabel: "Venues", href: "/backoffice/restaurants" },
  { key: "categories",  label: "Categories & prices", shortLabel: "Catalog", href: "/backoffice/categories" },
  { key: "tags",        label: "Tags",           shortLabel: "Tags",   href: "/backoffice/tags" },
  { key: "qr",          label: "QR codes",       shortLabel: "QR",     href: "/backoffice/qr" },
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
    <div className="bo-shell flex md:gap-6 items-start max-w-[1200px] mx-auto p-0 md:p-5">
      {/* Mobile top bar — identity + sign-out, the two things the sidebar owns
          that the bottom tab bar has no room for. */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4"
        style={{
          height: "calc(56px + env(safe-area-inset-top))",
          paddingTop: "env(safe-area-inset-top)",
          background: "#fff",
          borderBottom: "1px solid rgba(16,48,47,0.08)",
        }}
      >
        <div
          className="w-9 h-9 grid place-items-center rounded-[12px] text-white font-display font-extrabold text-[15px] flex-shrink-0"
          style={{ background: "#0EA5A4" }}
        >
          {staff.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-extrabold text-[14px] text-teal-ink truncate leading-tight">
            {staff.name}
          </div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-muted truncate">
            Manager
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          className="flex-shrink-0 grid place-items-center rounded-[12px] px-3 text-[12.5px] font-display font-extrabold text-teal-muted-4 disabled:opacity-70"
          style={{ background: "#F4FBF9", minHeight: 40 }}
        >
          {pending ? "…" : "Sign out"}
        </button>
      </header>

      <aside
        className="flex-shrink-0 hidden md:block"
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

      <section
        className="flex-1 min-w-0 w-full p-4 md:p-0"
        style={{
          // Clear the fixed top bar and bottom tabs on mobile; both collapse to 0 at md.
          paddingTop: "var(--bo-pad-top)",
          paddingBottom: "var(--bo-pad-bottom)",
        }}
      >
        {children}
      </section>

      {/* Mobile bottom tabs. Scrolls horizontally once Phase 2 pushes this past
          ~5 items, so the bar degrades instead of crushing the labels. */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex overflow-x-auto no-scrollbar"
        style={{
          background: "#fff",
          borderTop: "1px solid rgba(16,48,47,0.08)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {visibleNav.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.key}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 px-3 font-display font-extrabold text-[11px] text-center"
              style={{
                minWidth: 72,
                minHeight: 56,
                color: active ? "var(--color-teal)" : "var(--color-teal-muted-4)",
              }}
            >
              <span
                className="rounded-full"
                style={{
                  width: active ? 18 : 6,
                  height: 6,
                  background: active ? "var(--color-teal)" : "rgba(16,48,47,0.2)",
                  transition: "width 140ms ease",
                }}
              />
              <span className="whitespace-nowrap">{n.shortLabel ?? n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
