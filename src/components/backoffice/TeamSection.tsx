"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SectionTitle } from "./DashboardShared";
import { reassignCashier } from "@/lib/staffActions";

type Member = {
  id: string;
  name: string;
  role: "owner" | "manager" | "cashier";
  kioskId: string | null;
  removable: boolean;
};

export function TeamSection({
  staff,
  restaurants,
  canReassign,
}: {
  staff: Member[];
  restaurants: { id: string; name: string }[];
  canReassign: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [openFor, setOpenFor] = useState<Member | null>(null);
  const [formKiosk, setFormKiosk] = useState<string>("");

  const groups = useMemo(() => ({
    owner:   staff.filter((s) => s.role === "owner"),
    manager: staff.filter((s) => s.role === "manager"),
    cashier: staff.filter((s) => s.role === "cashier"),
  }), [staff]);

  const kioskName = (id: string | null) =>
    id ? restaurants.find((r) => r.id === id)?.name ?? "Unknown" : null;

  const openReassign = (m: Member) => {
    setOpenFor(m);
    setFormKiosk(m.kioskId ?? "");
  };

  const saveAssignment = () => {
    if (!openFor) return;
    start(async () => {
      await reassignCashier(openFor.id, formKiosk || null);
      setOpenFor(null);
      router.refresh();
    });
  };

  return (
    <div>
      <SectionTitle
        title="Team & access"
        subtitle="Managers, cashiers and their station assignments"
      />

      <Group label="Owner">
        {groups.owner.map((m) => (
          <MemberCard key={m.id} m={m} accent="#8B5CF6" tint="#F3ECFF" roleLine="Owner · full oversight" />
        ))}
      </Group>
      <Group label="Managers">
        {groups.manager.map((m) => (
          <MemberCard key={m.id} m={m} accent="#0EA5A4" tint="#EAF7F5" roleLine="Manager · full access" />
        ))}
      </Group>
      <Group label="Cashiers">
        {groups.cashier.map((m) => (
          <MemberCard
            key={m.id}
            m={m}
            accent="#FF6B4A"
            tint="#FFECE6"
            roleLine={m.kioskId ? `Cashier · ${kioskName(m.kioskId)}` : "Cashier · unassigned"}
            action={
              canReassign ? (
                <button
                  onClick={() => openReassign(m)}
                  className="font-display font-extrabold text-[12.5px] px-3 py-2 rounded-[10px]"
                  style={{ background: "#EAF7F5", color: "#0A6E6C", border: "1px solid rgba(10,110,108,0.25)" }}
                >
                  Reassign
                </button>
              ) : undefined
            }
          />
        ))}
      </Group>

      {openFor && (
        <Modal onClose={() => setOpenFor(null)}>
          <div className="font-display font-extrabold text-[22px] text-teal-ink">Reassign cashier</div>
          <div className="text-[13.5px] font-body text-teal-muted mt-1.5">
            Set today&rsquo;s station — they stay here until moved again.
          </div>
          <div className="mt-5">
            <div className="text-[12px] font-extrabold uppercase tracking-wider text-teal-muted mb-2">
              Station for today
            </div>
            <select
              value={formKiosk}
              onChange={(e) => setFormKiosk(e.target.value)}
              className="w-full font-display font-extrabold text-[14px] rounded-[12px] px-3 py-3 text-teal-ink"
              style={{ background: "#fff", border: "1.5px solid rgba(16,48,47,0.12)" }}
            >
              <option value="">Unassigned</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2.5 mt-6">
            <button
              onClick={() => setOpenFor(null)}
              className="flex-1 rounded-[14px] py-3 font-display font-extrabold text-[14px] text-teal-muted-4"
              style={{ background: "#F4FBF9" }}
            >
              Cancel
            </button>
            <button
              onClick={saveAssignment}
              disabled={pending}
              className="rounded-[14px] py-3 font-display font-extrabold text-[14px] text-white disabled:opacity-70"
              style={{ background: "var(--color-teal)", flex: 1.4 }}
            >
              {pending ? "Saving…" : "Save assignment"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-[13px] font-extrabold text-teal-muted uppercase tracking-wider mb-2.5">{label}</div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>{children}</div>
    </div>
  );
}

function MemberCard({
  m, accent, tint, roleLine, action,
}: {
  m: Member; accent: string; tint: string; roleLine: string; action?: React.ReactNode;
}) {
  return (
    <div
      className="p-4 flex items-start gap-3"
      style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(16,48,47,0.06)", boxShadow: "var(--shadow-card)" }}
    >
      <div
        className="w-11 h-11 grid place-items-center rounded-[12px] text-white font-display font-extrabold text-[16px] flex-shrink-0"
        style={{ background: accent }}
      >
        {m.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-extrabold text-[15px] text-teal-ink truncate">{m.name}</div>
        <div className="text-[12px] font-body text-teal-muted mt-0.5">{roleLine}</div>
        {action && <div className="mt-3">{action}</div>}
      </div>
      {!m.removable && (
        <span
          className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
          style={{ background: tint, color: accent }}
        >
          Core
        </span>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(16,48,47,0.45)", zIndex: 200,
          animation: "dl-fade 0.18s ease",
        }}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          background: "#fff", borderRadius: 22, padding: 26, width: "100%", maxWidth: 440,
          zIndex: 201, animation: "dl-pop 0.25s cubic-bezier(0.2,0.8,0.2,1)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        {children}
      </div>
    </>
  );
}
