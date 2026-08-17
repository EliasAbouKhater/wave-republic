"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SectionTitle } from "./DashboardShared";
import {
  Modal, Field, TextInput, Select, ErrorNote, ModalActions, ConfirmModal,
} from "./FormKit";
import { createVenue, updateVenue, setVenueActive, type VenueInput } from "@/lib/venueActions";

type R = {
  id: string;
  name: string;
  type: "restaurant" | "kiosk";
  cuisine: string;
  prep: number;
  thumbLabel: string;
  pinColor: string;
  active: boolean;
  itemCount: number;
};

const blank: VenueInput = {
  name: "", type: "restaurant", cuisine: "", prep: 10, thumbLabel: "",
};

export function RestaurantsSection({ restaurants, canEdit }: { restaurants: R[]; canEdit: boolean }) {
  const [showRemoved, setShowRemoved] = useState(false);
  const [editing, setEditing] = useState<R | "new" | null>(null);
  const [confirming, setConfirming] = useState<R | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const removedCount = restaurants.filter((r) => !r.active).length;
  const visible = showRemoved ? restaurants : restaurants.filter((r) => r.active);

  const toggleActive = (r: R) => {
    setError(null);
    start(async () => {
      const res = await setVenueActive(r.id, !r.active);
      if (!res.ok) setError(res.error);
      setConfirming(null);
    });
  };

  return (
    <div>
      <SectionTitle
        title="Restaurants & kiosks"
        subtitle="Everywhere guests can order from"
        right={
          canEdit ? (
            <button
              onClick={() => { setError(null); setEditing("new"); }}
              className="btn-teal font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[14px]"
            >
              + Add venue
            </button>
          ) : null
        }
      />

      <ErrorNote message={error} />

      {removedCount > 0 && (
        <button
          onClick={() => setShowRemoved((v) => !v)}
          className="text-[12.5px] font-display font-extrabold mb-3.5 px-3 py-1.5 rounded-[10px]"
          style={{ background: showRemoved ? "#EAF7F5" : "#F4FBF9", color: "#0A6E6C" }}
        >
          {showRemoved ? "Hide removed" : `Show removed (${removedCount})`}
        </button>
      )}

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {visible.map((r) => (
          <div
            key={r.id}
            className="p-4"
            style={{
              background: "#fff", borderRadius: 18, border: "1px solid rgba(16,48,47,0.06)",
              boxShadow: "var(--shadow-card)", opacity: r.active ? 1 : 0.6,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-14 h-14 rounded-[12px] grid place-items-center flex-shrink-0"
                style={{
                  background: "repeating-linear-gradient(45deg, #DBEEEB 0 6px, #EAF7F5 6px 12px)",
                  color: "#5E807E", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 10,
                }}
              >
                {r.thumbLabel}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="font-display font-extrabold text-[15px] text-teal-ink truncate">{r.name}</div>
                  <span
                    className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
                    style={{
                      background: r.type === "restaurant" ? "#EAF7F5" : "#EDF2FF",
                      color: r.type === "restaurant" ? "#0A6E6C" : "#3949AB",
                    }}
                  >
                    {r.type}
                  </span>
                  {!r.active && (
                    <span
                      className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
                      style={{ background: "#FCEBE7", color: "#E5533B" }}
                    >
                      removed
                    </span>
                  )}
                </div>
                <div className="text-[12px] font-body text-teal-muted mt-0.5 truncate">{r.cuisine}</div>
                <div className="flex items-center gap-3 text-[11.5px] font-extrabold text-teal-muted mt-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: r.pinColor }} />
                    {r.type === "restaurant" ? "Restaurant" : "Kiosk"}
                  </span>
                  <span>~{r.prep} min</span>
                  <span>{r.itemCount} items</span>
                </div>
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2 mt-3">
                <Link
                  href={`/menu/${r.id}`}
                  className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px]"
                  style={{ background: "#EAF7F5", color: "#0A6E6C" }}
                >
                  Preview
                </Link>
                <button
                  onClick={() => { setError(null); setEditing(r); }}
                  className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px]"
                  style={{ background: "#F4FBF9", color: "#5E807E" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => (r.active ? setConfirming(r) : toggleActive(r))}
                  disabled={pending}
                  className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px]"
                  style={{ background: r.active ? "#FCEBE7" : "#EAF7F5", color: r.active ? "#E5533B" : "#0A6E6C" }}
                >
                  {r.active ? "Remove" : "Restore"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div
          className="p-8 text-center rounded-[18px]"
          style={{ background: "#fff", border: "1px dashed rgba(16,48,47,0.14)" }}
        >
          <div className="font-display font-extrabold text-[15px] text-teal-ink">No venues yet</div>
          <p className="text-[13px] font-body text-teal-muted mt-1">
            Add your first restaurant or kiosk to start building its menu.
          </p>
        </div>
      )}

      {editing && (
        <VenueModal
          venue={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {confirming && (
        <ConfirmModal
          title={`Remove ${confirming.name}?`}
          body="Guests will stop seeing this venue immediately. Nothing is deleted — its menu and printed QR code stay intact, and you can restore it at any time."
          confirmLabel="Remove"
          destructive
          pending={pending}
          onCancel={() => setConfirming(null)}
          onConfirm={() => toggleActive(confirming)}
        />
      )}
    </div>
  );
}

function VenueModal({ venue, onClose }: { venue: R | null; onClose: () => void }) {
  const [form, setForm] = useState<VenueInput>(
    venue
      ? {
          name: venue.name, type: venue.type, cuisine: venue.cuisine,
          prep: venue.prep, thumbLabel: venue.thumbLabel,
        }
      : blank
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof VenueInput>(k: K, v: VenueInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    setError(null);
    start(async () => {
      const res = venue ? await updateVenue(venue.id, form) : await createVenue(form);
      if (res.ok) onClose();
      else setError(res.error);
    });
  };

  return (
    <Modal
      title={venue ? `Edit ${venue.name}` : "Add venue"}
      subtitle={venue ? undefined : "The QR link is created from the name and locked afterwards."}
      onClose={onClose}
    >
      <ErrorNote message={error} />

      <Field label="Name">
        <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Sunset Grill" />
      </Field>

      <Field label="Type">
        <Select value={form.type} onChange={(e) => set("type", e.target.value as "restaurant" | "kiosk")}>
          <option value="restaurant">Restaurant</option>
          <option value="kiosk">Kiosk</option>
        </Select>
      </Field>

      <Field label="Cuisine">
        <TextInput value={form.cuisine} onChange={(e) => set("cuisine", e.target.value)} placeholder="Burgers & grills" />
      </Field>

      <Field label="Prep time (minutes)">
        <TextInput
          type="number" min={0} max={240} value={form.prep}
          onChange={(e) => set("prep", Number(e.target.value))}
        />
      </Field>

      <Field label="Thumbnail label" hint="Short word shown on the venue tile — up to 12 characters.">
        <TextInput
          value={form.thumbLabel} maxLength={12}
          onChange={(e) => set("thumbLabel", e.target.value)} placeholder="burgers"
        />
      </Field>

      {venue && (
        <p className="text-[11.5px] font-body text-teal-muted mb-1">
          QR link is locked to <code>/r/{venue.id}</code> — it is already printed and cannot change.
        </p>
      )}

      <ModalActions
        onCancel={onClose} onSave={save} saving={pending}
        saveLabel={venue ? "Save changes" : "Add venue"}
      />
    </Modal>
  );
}
