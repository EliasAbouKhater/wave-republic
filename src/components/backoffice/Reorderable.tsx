"use client";

/**
 * A hand-orderable list.
 *
 * Pointer devices get HTML5 drag-and-drop. Touch devices get ▲▼ buttons, because
 * HTML5 DnD simply does not fire on touch — and the backoffice is used on a
 * phone. The buttons are always rendered rather than sniffed for, so the same
 * markup works everywhere and keyboard users can reorder too.
 *
 * Order is committed only when the manager presses Save: dragging rearranges
 * local state, so a slow connection never leaves a half-sorted menu.
 */

import { useEffect, useState } from "react";

export type OrderRow = { id: string; label: string; sublabel?: string };

export function Reorderable({
  rows,
  onSave,
  saving,
  emptyText = "Nothing to order yet.",
}: {
  rows: OrderRow[];
  onSave: (orderedIds: string[]) => void;
  saving: boolean;
  emptyText?: string;
}) {
  const [order, setOrder] = useState<OrderRow[]>(rows);
  const [dragging, setDragging] = useState<string | null>(null);

  // Re-sync when the server sends a different list (e.g. after a save).
  useEffect(() => { setOrder(rows); }, [rows]);

  const dirty =
    order.length !== rows.length || order.some((r, i) => r.id !== rows[i]?.id);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    setOrder(next);
  };

  if (order.length === 0) {
    return <div className="text-[12.5px] font-body text-teal-muted py-2">{emptyText}</div>;
  }

  return (
    <div>
      <div
        className="rounded-[14px] overflow-hidden"
        style={{ border: "1px solid rgba(16,48,47,0.10)", background: "#fff" }}
      >
        {order.map((row, i) => (
          <div
            key={row.id}
            draggable
            onDragStart={() => setDragging(row.id)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e) => {
              e.preventDefault();
              if (!dragging || dragging === row.id) return;
              const from = order.findIndex((r) => r.id === dragging);
              if (from !== -1 && from !== i) move(from, i);
            }}
            className="flex items-center gap-2 px-3"
            style={{
              minHeight: 52,
              borderTop: i === 0 ? "none" : "1px solid rgba(16,48,47,0.06)",
              background: dragging === row.id ? "#EAF7F5" : "transparent",
              cursor: "grab",
            }}
          >
            <span
              aria-hidden
              className="select-none"
              style={{ color: "#8FA6A3", fontSize: 15, lineHeight: 1 }}
              title="Drag to reorder"
            >
              ⠿
            </span>
            <span
              className="w-6 text-center font-display font-extrabold text-[12px]"
              style={{ color: "var(--color-teal)" }}
            >
              {i + 1}
            </span>
            <span className="flex-1 min-w-0">
              <span className="font-display font-extrabold text-[13.5px] text-teal-ink">{row.label}</span>
              {row.sublabel && (
                <span className="text-[11.5px] font-body text-teal-muted ml-1.5">{row.sublabel}</span>
              )}
            </span>
            {/* Touch + keyboard path — HTML5 DnD never fires on touch. */}
            <button
              type="button"
              onClick={() => move(i, i - 1)}
              disabled={i === 0}
              aria-label={`Move ${row.label} up`}
              className="grid place-items-center rounded-[9px] disabled:opacity-30"
              style={{ width: 34, height: 34, background: "#F4FBF9", color: "#5E807E" }}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => move(i, i + 1)}
              disabled={i === order.length - 1}
              aria-label={`Move ${row.label} down`}
              className="grid place-items-center rounded-[9px] disabled:opacity-30"
              style={{ width: 34, height: 34, background: "#F4FBF9", color: "#5E807E" }}
            >
              ▼
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => onSave(order.map((r) => r.id))}
          disabled={!dirty || saving}
          className="btn-teal font-display font-extrabold text-[13px] px-4 rounded-[12px] disabled:opacity-40"
          style={{ minHeight: 44 }}
        >
          {saving ? "Saving…" : "Save order"}
        </button>
        <button
          type="button"
          onClick={() => setOrder(rows)}
          disabled={!dirty || saving}
          className="font-display font-extrabold text-[13px] px-4 rounded-[12px] disabled:opacity-30"
          style={{ minHeight: 44, background: "#F4FBF9", color: "#5E807E" }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
