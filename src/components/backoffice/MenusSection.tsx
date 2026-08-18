"use client";

import { useState, useTransition } from "react";
import { SectionTitle } from "./DashboardShared";
import {
  Modal, Field, TextInput, TextArea, Select, Toggle, ErrorNote, ModalActions, ConfirmModal,
} from "./FormKit";
import {
  createCategory, updateCategory, setCategoryActive,
  createItem, updateItem, setItemAvailable, setItemActive,
  type ItemInput,
} from "@/lib/menuActions";
import { ImageUpload } from "./ImageUpload";

type Item = { id: string; name: string; description: string; price: number; available: boolean; active: boolean; imageUrl: string | null };
type Category = { id: string; name: string; slot: string; active: boolean; items: Item[] };
type R = { id: string; name: string; categories: Category[] };

// Prices are AED — the app runs in Dubai. (The backoffice used to render "$".)
const money = (n: number) => `AED ${n.toFixed(2)}`;

const blankItem: ItemInput = { name: "", description: "", priceAed: 0, available: true, imageUrl: null };

export function MenusSection({ restaurants, canEdit }: { restaurants: R[]; canEdit: boolean }) {
  const [activeId, setActiveId] = useState<string>(restaurants[0]?.id ?? "");
  const [showRemoved, setShowRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [catModal, setCatModal] = useState<Category | "new" | null>(null);
  const [itemModal, setItemModal] = useState<{ categoryId: string; item: Item | null } | null>(null);
  const [confirming, setConfirming] = useState<
    { kind: "category"; row: Category } | { kind: "item"; row: Item } | null
  >(null);

  const active = restaurants.find((r) => r.id === activeId);

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      setConfirming(null);
    });
  };

  const visibleCats = active
    ? showRemoved ? active.categories : active.categories.filter((c) => c.active)
    : [];
  const removedCount = active
    ? active.categories.filter((c) => !c.active).length +
      active.categories.reduce((n, c) => n + c.items.filter((i) => !i.active).length, 0)
    : 0;

  return (
    <div>
      <SectionTitle
        title="Menus & prices"
        subtitle="Update items, pricing, and availability per venue"
        right={
          canEdit && active ? (
            <button
              onClick={() => { setError(null); setCatModal("new"); }}
              className="btn-teal font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[14px]"
            >
              + Add category
            </button>
          ) : null
        }
      />

      <ErrorNote message={error} />

      {restaurants.length === 0 ? (
        <div
          className="p-8 text-center rounded-[18px]"
          style={{ background: "#fff", border: "1px dashed rgba(16,48,47,0.14)" }}
        >
          <div className="font-display font-extrabold text-[15px] text-teal-ink">No venues yet</div>
          <p className="text-[13px] font-body text-teal-muted mt-1">
            Add a restaurant or kiosk first, then build its menu here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-start">
          {/* Venue picker: a swipeable chip row on phones, a rail on desktop. */}
          <div className="w-full md:w-56 flex-shrink-0 flex flex-row md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-x-visible no-scrollbar">
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className="text-left rounded-[12px] px-3 py-2.5 font-display font-extrabold text-[13.5px] flex-shrink-0 md:flex-shrink whitespace-nowrap md:whitespace-normal"
                style={{
                  background: activeId === r.id ? "var(--color-teal)" : "#fff",
                  color: activeId === r.id ? "#fff" : "var(--color-teal-ink)",
                  border: "1px solid rgba(16,48,47,0.06)",
                  minHeight: 44,
                }}
              >
                {r.name}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            {removedCount > 0 && (
              <button
                onClick={() => setShowRemoved((v) => !v)}
                className="text-[12.5px] font-display font-extrabold mb-3.5 px-3 py-1.5 rounded-[10px] tap-target"
                style={{ background: showRemoved ? "#EAF7F5" : "#F4FBF9", color: "#0A6E6C" }}
              >
                {showRemoved ? "Hide removed" : `Show removed (${removedCount})`}
              </button>
            )}

            {visibleCats.length === 0 && (
              <div
                className="p-8 text-center rounded-[18px]"
                style={{ background: "#fff", border: "1px dashed rgba(16,48,47,0.14)" }}
              >
                <div className="font-display font-extrabold text-[15px] text-teal-ink">No categories yet</div>
                <p className="text-[13px] font-body text-teal-muted mt-1">
                  Start with a category like &ldquo;Burgers&rdquo; or &ldquo;Cold drinks&rdquo;.
                </p>
              </div>
            )}

            {visibleCats.map((c) => {
              const items = showRemoved ? c.items : c.items.filter((i) => i.active);
              return (
                <div key={c.id} className="mb-5" style={{ opacity: c.active ? 1 : 0.6 }}>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="font-display font-extrabold text-[15px] text-teal-ink">{c.name}</div>
                    {!c.active && (
                      <span
                        className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
                        style={{ background: "#FCEBE7", color: "#E5533B" }}
                      >
                        removed
                      </span>
                    )}
                    {canEdit && (
                      <>
                        <button
                          onClick={() => { setError(null); setItemModal({ categoryId: c.id, item: null }); }}
                          className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px] tap-target"
                          style={{ background: "#EAF7F5", color: "#0A6E6C" }}
                        >
                          + Item
                        </button>
                        <button
                          onClick={() => { setError(null); setCatModal(c); }}
                          className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px] tap-target"
                          style={{ background: "#F4FBF9", color: "#5E807E" }}
                        >
                          Rename
                        </button>
                        <button
                          onClick={() =>
                            c.active
                              ? setConfirming({ kind: "category", row: c })
                              : run(() => setCategoryActive(c.id, true))
                          }
                          disabled={pending}
                          className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px] tap-target"
                          style={{
                            background: c.active ? "#FCEBE7" : "#EAF7F5",
                            color: c.active ? "#E5533B" : "#0A6E6C",
                          }}
                        >
                          {c.active ? "Remove" : "Restore"}
                        </button>
                      </>
                    )}
                  </div>

                  <div
                    className="rounded-[16px] overflow-hidden"
                    style={{ background: "#fff", border: "1px solid rgba(16,48,47,0.06)", boxShadow: "var(--shadow-card)" }}
                  >
                    {items.length === 0 && (
                      <div className="px-4 py-3 text-[13px] font-body text-teal-muted">No items in this category.</div>
                    )}
                    {items.map((it, i) => (
                      <div
                        key={it.id}
                        className="flex flex-wrap md:flex-nowrap items-center gap-x-3 gap-y-2 px-4 py-3"
                        style={{
                          borderTop: i === 0 ? "none" : "1px solid rgba(16,48,47,0.05)",
                          opacity: it.active ? 1 : 0.55,
                        }}
                      >
                        {it.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={it.imageUrl}
                            alt=""
                            style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                              background: "repeating-linear-gradient(45deg,#DBEEEB 0 4px,#EAF7F5 4px 8px)",
                            }}
                          />
                        )}
                        {/* Claims the rest of line 1; controls wrap to line 2 on phones. */}
                        <div className="min-w-0 flex-1" style={{ flexBasis: "8rem" }}>
                          <div className="font-display font-extrabold text-[14px] text-teal-ink truncate">{it.name}</div>
                          {it.description && (
                            <div className="text-[12px] font-body text-teal-muted truncate">{it.description}</div>
                          )}
                        </div>
                        <div
                          className="font-display font-extrabold text-[14px] md:min-w-[92px] text-right"
                          style={{ color: "var(--color-teal)" }}
                        >
                          {money(it.price)}
                        </div>
                        {canEdit ? (
                          <button
                            onClick={() => run(() => setItemAvailable(it.id, !it.available))}
                            disabled={pending || !it.active}
                            title="Toggle availability"
                            className="text-[10.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md tap-target"
                            style={{
                              background: it.available ? "#EAF7F5" : "#FCEBE7",
                              color: it.available ? "#0A6E6C" : "#E5533B",
                            }}
                          >
                            {it.available ? "Available" : "Sold out"}
                          </button>
                        ) : (
                          <span
                            className="text-[10.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
                            style={{
                              background: it.available ? "#EAF7F5" : "#FCEBE7",
                              color: it.available ? "#0A6E6C" : "#E5533B",
                            }}
                          >
                            {it.available ? "Available" : "Sold out"}
                          </span>
                        )}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => { setError(null); setItemModal({ categoryId: c.id, item: it }); }}
                              className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px] tap-target"
                              style={{ background: "#F4FBF9", color: "#5E807E" }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                it.active
                                  ? setConfirming({ kind: "item", row: it })
                                  : run(() => setItemActive(it.id, true))
                              }
                              disabled={pending}
                              className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px] tap-target"
                              style={{
                                background: it.active ? "#FCEBE7" : "#EAF7F5",
                                color: it.active ? "#E5533B" : "#0A6E6C",
                              }}
                            >
                              {it.active ? "Remove" : "Restore"}
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {catModal && active && (
        <CategoryModal
          restaurantId={active.id}
          category={catModal === "new" ? null : catModal}
          onClose={() => setCatModal(null)}
        />
      )}

      {itemModal && (
        <ItemModal
          categoryId={itemModal.categoryId}
          item={itemModal.item}
          onClose={() => setItemModal(null)}
        />
      )}

      {confirming && (
        <ConfirmModal
          title={confirming.kind === "category" ? `Remove ${confirming.row.name}?` : `Remove ${confirming.row.name}?`}
          body={
            confirming.kind === "category"
              ? "This category and its items stop showing to guests. Nothing is deleted — you can restore it at any time."
              : "This item stops showing to guests. Nothing is deleted — you can restore it at any time."
          }
          confirmLabel="Remove"
          destructive
          pending={pending}
          onCancel={() => setConfirming(null)}
          onConfirm={() =>
            run(() =>
              confirming.kind === "category"
                ? setCategoryActive(confirming.row.id, false)
                : setItemActive(confirming.row.id, false)
            )
          }
        />
      )}
    </div>
  );
}

function CategoryModal({
  restaurantId, category, onClose,
}: { restaurantId: string; category: Category | null; onClose: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slot, setSlot] = useState(category?.slot ?? "food");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    setError(null);
    start(async () => {
      const res = category
        ? await updateCategory(category.id, name)
        : await createCategory(restaurantId, name, slot);
      if (res.ok) onClose();
      else setError(res.error);
    });
  };

  return (
    <Modal title={category ? "Rename category" : "Add category"} onClose={onClose}>
      <ErrorNote message={error} />
      <Field label="Category name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Burgers" />
      </Field>
      {!category && (
        <Field label="Menu section" hint="Controls which browse filter the category appears under.">
          <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
            <option value="food">Food</option>
            <option value="drinks">Drinks</option>
            <option value="sweets">Sweets</option>
          </Select>
        </Field>
      )}
      <ModalActions onCancel={onClose} onSave={save} saving={pending} saveLabel={category ? "Save" : "Add category"} />
    </Modal>
  );
}

function ItemModal({
  categoryId, item, onClose,
}: { categoryId: string; item: Item | null; onClose: () => void }) {
  const [form, setForm] = useState<ItemInput>(
    item
      ? { name: item.name, description: item.description, priceAed: item.price, available: item.available, imageUrl: item.imageUrl }
      : blankItem
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof ItemInput>(k: K, v: ItemInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    setError(null);
    start(async () => {
      const res = item ? await updateItem(item.id, form) : await createItem(categoryId, form);
      if (res.ok) onClose();
      else setError(res.error);
    });
  };

  return (
    <Modal title={item ? `Edit ${item.name}` : "Add item"} onClose={onClose}>
      <ErrorNote message={error} />

      <Field label="Item name">
        <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Double cheeseburger" />
      </Field>

      <Field label="Description" hint="Optional — shown under the item name.">
        <TextArea
          rows={2} value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Two beef patties, cheddar, house sauce"
        />
      </Field>

      <Field label="Price (AED)">
        <TextInput
          type="number" min={0} step="0.25" value={form.priceAed}
          onChange={(e) => set("priceAed", Number(e.target.value))}
        />
      </Field>

      <ImageUpload value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />

      <Toggle checked={form.available} onChange={(v) => set("available", v)} label="Available today" />

      <ModalActions onCancel={onClose} onSave={save} saving={pending} saveLabel={item ? "Save changes" : "Add item"} />
    </Modal>
  );
}
