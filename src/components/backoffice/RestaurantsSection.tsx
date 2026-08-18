"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SectionTitle } from "./DashboardShared";
import {
  Modal, Field, TextInput, Select, CheckList, ErrorNote, ModalActions, ConfirmModal,
} from "./FormKit";
import { createVenue, updateVenue, setVenueActive, type VenueInput } from "@/lib/venueActions";
import { setVenueCategories } from "@/lib/menuActions";
import { setVenueTags } from "@/lib/tagActions";
import { reorderVenues, reorderVenueCategories } from "@/lib/sortActions";
import { Reorderable } from "./Reorderable";
import { TagChip } from "./TagsSection";
import { ImageUpload } from "./ImageUpload";

type R = {
  id: string;
  name: string;
  type: "restaurant" | "kiosk";
  cuisine: string;
  prep: number;
  thumbLabel: string;
  pinColor: string;
  imageUrl: string | null;
  active: boolean;
  itemCount: number;
  categoryIds: string[];
  categoryNames: string[];
  categories: { id: string; name: string }[];
  tagIds: string[];
};

export type TagOption = { id: string; name: string; color: string };

export type CategoryOption = { id: string; name: string; slot: string; itemCount: number };

const blank: VenueInput = {
  name: "", type: "restaurant", cuisine: "", prep: 10, thumbLabel: "", imageUrl: null,
};

export function RestaurantsSection({
  restaurants,
  allCategories,
  allTags,
  canEdit,
}: {
  restaurants: R[];
  allCategories: CategoryOption[];
  allTags: TagOption[];
  canEdit: boolean;
}) {
  const [showRemoved, setShowRemoved] = useState(false);
  const [editing, setEditing] = useState<R | "new" | null>(null);
  const [confirming, setConfirming] = useState<R | null>(null);
  const [assigning, setAssigning] = useState<R | null>(null);
  const [tagging, setTagging] = useState<R | null>(null);
  const [orderingCats, setOrderingCats] = useState<R | null>(null);
  const [orderingVenues, setOrderingVenues] = useState(false);
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
            <div className="flex gap-2">
              {restaurants.filter((r) => r.active).length > 1 && (
                <button
                  onClick={() => { setError(null); setOrderingVenues(true); }}
                  className="font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[14px]"
                  style={{ background: "#EDF2FF", color: "#3949AB", minHeight: 44 }}
                >
                  Reorder
                </button>
              )}
              <button
                onClick={() => { setError(null); setEditing("new"); }}
                className="btn-teal font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[14px]"
                style={{ minHeight: 44 }}
              >
                + Add venue
              </button>
            </div>
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

      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
              {r.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={r.imageUrl}
                  alt=""
                  loading="lazy"
                  className="w-14 h-14 rounded-[12px] flex-shrink-0"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-[12px] grid place-items-center flex-shrink-0"
                  style={{
                    background: "repeating-linear-gradient(45deg, #DBEEEB 0 6px, #EAF7F5 6px 12px)",
                    color: "#5E807E", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 10,
                  }}
                >
                  {r.thumbLabel}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
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
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-extrabold text-teal-muted mt-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: r.pinColor }} />
                    {r.type === "restaurant" ? "Restaurant" : "Kiosk"}
                  </span>
                  <span>~{r.prep} min</span>
                  <span>{r.itemCount} items</span>
                </div>
                {r.tagIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.tagIds.map((id) => {
                      const t = allTags.find((x) => x.id === id);
                      return t ? <TagChip key={id} name={t.name} color={t.color} /> : null;
                    })}
                  </div>
                )}
                <div className="mt-2 text-[11.5px] font-body">
                  {r.categoryNames.length === 0 ? (
                    <span style={{ color: "#E5533B" }}>No categories — nothing shows to guests</span>
                  ) : (
                    <span className="text-teal-muted">{r.categoryNames.join(" · ")}</span>
                  )}
                </div>
              </div>
            </div>
            {canEdit && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Link
                  href={`/menu/${r.id}`}
                  className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px] grid place-items-center"
                  style={{ minHeight: 44, background: "#EAF7F5", color: "#0A6E6C" }}
                >
                  Preview
                </Link>
                <button
                  onClick={() => { setError(null); setAssigning(r); }}
                  className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px] grid place-items-center"
                  style={{ minHeight: 44, background: "#EDF2FF", color: "#3949AB" }}
                >
                  Categories
                </button>
                {r.categories.length > 1 && (
                  <button
                    onClick={() => { setError(null); setOrderingCats(r); }}
                    className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px] grid place-items-center"
                    style={{ minHeight: 44, background: "#EDF2FF", color: "#3949AB" }}
                  >
                    Order
                  </button>
                )}
                {allTags.length > 0 && (
                  <button
                    onClick={() => { setError(null); setTagging(r); }}
                    className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px] grid place-items-center"
                    style={{ minHeight: 44, background: "#F4FBF9", color: "#5E807E" }}
                  >
                    Tags
                  </button>
                )}
                <button
                  onClick={() => { setError(null); setEditing(r); }}
                  className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px] grid place-items-center"
                  style={{ minHeight: 44, background: "#F4FBF9", color: "#5E807E" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => (r.active ? setConfirming(r) : toggleActive(r))}
                  disabled={pending}
                  className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px] grid place-items-center"
                  style={{ minHeight: 44, background: r.active ? "#FCEBE7" : "#EAF7F5", color: r.active ? "#E5533B" : "#0A6E6C" }}
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

      {orderingVenues && (
        <ReorderVenuesModal
          venues={restaurants.filter((r) => r.active)}
          onClose={() => setOrderingVenues(false)}
        />
      )}

      {orderingCats && (
        <ReorderCategoriesModal venue={orderingCats} onClose={() => setOrderingCats(null)} />
      )}

      {tagging && (
        <VenueTagsModal venue={tagging} allTags={allTags} onClose={() => setTagging(null)} />
      )}

      {assigning && (
        <AssignCategoriesModal
          venue={assigning}
          allCategories={allCategories}
          onClose={() => setAssigning(null)}
        />
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
          prep: venue.prep, thumbLabel: venue.thumbLabel, imageUrl: venue.imageUrl,
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

      <ImageUpload
        kind="venue"
        label="Venue photo"
        hint="Shown on the browse tile and as the menu banner. Landscape works best — it is cropped to fill."
        value={form.imageUrl}
        onChange={(url) => set("imageUrl", url)}
      />

      <Field label="Thumbnail label" hint="Fallback shown when there is no photo, and captioned over the menu banner. Up to 12 characters.">
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

/**
 * Which categories this venue serves. This is the screen that answers "put this
 * existing category on another venue" — categories themselves are defined once
 * on the Categories & prices screen and attached here.
 */
function AssignCategoriesModal({
  venue,
  allCategories,
  onClose,
}: {
  venue: R;
  allCategories: CategoryOption[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(venue.categoryIds);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    setError(null);
    start(async () => {
      const res = await setVenueCategories(venue.id, selected);
      if (res.ok) onClose();
      else setError(res.error);
    });
  };

  return (
    <Modal
      title={`Categories at ${venue.name}`}
      subtitle="Tick everything this venue serves. The same category can be on any number of venues."
      onClose={onClose}
    >
      <ErrorNote message={error} />
      <CheckList
        options={allCategories.map((c) => ({
          id: c.id,
          label: c.name,
          // Several categories can share a name; the item count tells them apart.
          sublabel: `· ${c.slot} · ${c.itemCount} item${c.itemCount === 1 ? "" : "s"}`,
        }))}
        selected={selected}
        onChange={setSelected}
        empty="No categories exist yet. Create one on the Categories & prices screen first."
      />
      <ModalActions onCancel={onClose} onSave={save} saving={pending} saveLabel="Save categories" />
    </Modal>
  );
}

/** Browse-screen order — which venue a guest sees first. */
function ReorderVenuesModal({ venues, onClose }: { venues: R[]; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (ids: string[]) => {
    setError(null);
    start(async () => {
      const res = await reorderVenues(ids);
      if (res.ok) onClose();
      else setError(res.error);
    });
  };

  return (
    <Modal
      title="Order venues"
      subtitle="Drag, or use the arrows. This is the order guests see when they scan the entry QR."
      onClose={onClose}
    >
      <ErrorNote message={error} />
      <Reorderable
        rows={venues.map((v) => ({ id: v.id, label: v.name, sublabel: v.cuisine }))}
        onSave={save}
        saving={pending}
      />
    </Modal>
  );
}

/** Category order within one venue's menu — per venue, not global. */
function ReorderCategoriesModal({ venue, onClose }: { venue: R; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (ids: string[]) => {
    setError(null);
    start(async () => {
      const res = await reorderVenueCategories(venue.id, ids);
      if (res.ok) onClose();
      else setError(res.error);
    });
  };

  return (
    <Modal
      title={`Category order at ${venue.name}`}
      subtitle="Only affects this venue — the same category can sit elsewhere in another menu."
      onClose={onClose}
    >
      <ErrorNote message={error} />
      <Reorderable
        rows={venue.categories.map((c) => ({ id: c.id, label: c.name }))}
        onSave={save}
        saving={pending}
      />
    </Modal>
  );
}

function VenueTagsModal({
  venue, allTags, onClose,
}: {
  venue: R;
  allTags: TagOption[];
  onClose: () => void;
}) {
  const [tagIds, setTagIds] = useState<string[]>(venue.tagIds);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    setError(null);
    start(async () => {
      const res = await setVenueTags(venue.id, tagIds);
      if (res.ok) onClose();
      else setError(res.error);
    });
  };

  return (
    <Modal title={`Tags for ${venue.name}`} subtitle="Shown as chips on the browse screen." onClose={onClose}>
      <ErrorNote message={error} />
      <div className="flex flex-wrap gap-2 mb-4">
        {allTags.map((t) => {
          const on = tagIds.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTagIds((ids) => (on ? ids.filter((x) => x !== t.id) : [...ids, t.id]))}
              aria-pressed={on}
              className="rounded-full px-2.5"
              style={{
                minHeight: 36,
                background: on ? t.color : "#F4FBF9",
                color: on ? "#fff" : "#5E807E",
                border: on ? "2px solid transparent" : "2px solid rgba(16,48,47,0.12)",
                fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3px",
              }}
            >
              {t.name}
            </button>
          );
        })}
      </div>
      <ModalActions onCancel={onClose} onSave={save} saving={pending} saveLabel="Save tags" />
    </Modal>
  );
}
