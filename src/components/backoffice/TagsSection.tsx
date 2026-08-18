"use client";

/**
 * Tag manager — create the labels ("Chef's choice", "Most popular") that get
 * attached to venues and items elsewhere. Attaching happens in the item and
 * venue modals; this screen only owns the tags themselves.
 */

import { useState, useTransition } from "react";
import { SectionTitle } from "./DashboardShared";
import { Modal, Field, TextInput, ErrorNote, ModalActions, ConfirmModal } from "./FormKit";
import { createTag, updateTag, setTagActive } from "@/lib/tagActions";
import { TAG_COLORS } from "@/lib/tagColors";

export type TagRow = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  itemCount: number;
  venueCount: number;
};

export function TagsSection({ tags, canEdit }: { tags: TagRow[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<TagRow | "new" | null>(null);
  const [confirming, setConfirming] = useState<TagRow | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const removedCount = tags.filter((t) => !t.active).length;
  const visible = showRemoved ? tags : tags.filter((t) => t.active);

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      setConfirming(null);
    });
  };

  return (
    <div>
      <SectionTitle
        title="Tags"
        subtitle="Labels shown as chips on venues and menu items"
        right={
          canEdit ? (
            <button
              onClick={() => { setError(null); setEditing("new"); }}
              className="btn-teal font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[14px]"
              style={{ minHeight: 44 }}
            >
              + Add tag
            </button>
          ) : null
        }
      />

      <ErrorNote message={error} />

      {removedCount > 0 && (
        <button
          onClick={() => setShowRemoved((v) => !v)}
          className="text-[12.5px] font-display font-extrabold mb-3.5 px-3 py-1.5 rounded-[10px] tap-target"
          style={{ background: showRemoved ? "#EAF7F5" : "#F4FBF9", color: "#0A6E6C" }}
        >
          {showRemoved ? "Hide removed" : `Show removed (${removedCount})`}
        </button>
      )}

      {visible.length === 0 ? (
        <div
          className="p-8 text-center rounded-[18px]"
          style={{ background: "#fff", border: "1px dashed rgba(16,48,47,0.14)" }}
        >
          <div className="font-display font-extrabold text-[15px] text-teal-ink">No tags yet</div>
          <p className="text-[13px] font-body text-teal-muted mt-1">
            Try &ldquo;Chef&rsquo;s choice&rdquo;, &ldquo;Most popular&rdquo; or &ldquo;Best value&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <div
              key={t.id}
              className="p-4"
              style={{
                background: "#fff", borderRadius: 16, border: "1px solid rgba(16,48,47,0.06)",
                opacity: t.active ? 1 : 0.6,
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <TagChip name={t.name} color={t.color} />
                {!t.active && (
                  <span
                    className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
                    style={{ background: "#FCEBE7", color: "#E5533B" }}
                  >
                    removed
                  </span>
                )}
              </div>
              <div className="text-[11.5px] font-body text-teal-muted mt-2">
                {t.itemCount} item{t.itemCount === 1 ? "" : "s"} · {t.venueCount} venue
                {t.venueCount === 1 ? "" : "s"}
              </div>
              {canEdit && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => { setError(null); setEditing(t); }}
                    className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px] grid place-items-center"
                    style={{ minHeight: 44, background: "#F4FBF9", color: "#5E807E" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => (t.active ? setConfirming(t) : run(() => setTagActive(t.id, true)))}
                    disabled={pending}
                    className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px] grid place-items-center"
                    style={{
                      minHeight: 44,
                      background: t.active ? "#FCEBE7" : "#EAF7F5",
                      color: t.active ? "#E5533B" : "#0A6E6C",
                    }}
                  >
                    {t.active ? "Remove" : "Restore"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TagModal tag={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}

      {confirming && (
        <ConfirmModal
          title={`Remove ${confirming.name}?`}
          body={`The chip stops showing on ${confirming.itemCount} item(s) and ${confirming.venueCount} venue(s). Nothing else changes, and you can restore it.`}
          confirmLabel="Remove"
          destructive
          pending={pending}
          onCancel={() => setConfirming(null)}
          onConfirm={() => run(() => setTagActive(confirming.id, false))}
        />
      )}
    </div>
  );
}

export function TagChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full"
      style={{ background: color, color: "#fff", letterSpacing: "0.3px" }}
    >
      {name}
    </span>
  );
}

function TagModal({ tag, onClose }: { tag: TagRow | null; onClose: () => void }) {
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? TAG_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    setError(null);
    start(async () => {
      const res = tag ? await updateTag(tag.id, name, color) : await createTag(name, color);
      if (res.ok) onClose();
      else setError(res.error);
    });
  };

  return (
    <Modal title={tag ? `Edit ${tag.name}` : "Add tag"} onClose={onClose}>
      <ErrorNote message={error} />

      <Field label="Name">
        <TextInput
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
          placeholder="Chef's choice"
        />
      </Field>

      <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted mb-1.5">
        Colour
      </div>
      <div className="flex flex-wrap gap-2 mb-3.5">
        {TAG_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Colour ${c}`}
            aria-pressed={color === c}
            className="rounded-full"
            style={{
              width: 40, height: 40, background: c,
              border: color === c ? "3px solid var(--color-teal-ink)" : "3px solid transparent",
            }}
          />
        ))}
      </div>

      <div className="mb-3.5">
        <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted mb-1.5">
          Preview
        </div>
        <TagChip name={name.trim() || "Tag name"} color={color} />
      </div>

      <ModalActions
        onCancel={onClose}
        onSave={save}
        saving={pending}
        saveLabel={tag ? "Save changes" : "Add tag"}
      />
    </Modal>
  );
}
