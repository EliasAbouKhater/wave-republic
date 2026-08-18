"use client";

/**
 * Categories & prices — the venue-independent half of the catalog.
 *
 * The manager defines categories and items here once. Which venues serve a
 * category is set on the Restaurants screen, not here: keeping the two apart is
 * what makes "put this existing category on another venue" possible at all.
 * An item can sit in several categories (one Coca-Cola, many menus).
 */

import { useState, useTransition } from "react";
import { SectionTitle } from "./DashboardShared";
import {
  Modal, Field, TextInput, TextArea, Select, Toggle, CheckList,
  ErrorNote, ModalActions, ConfirmModal,
} from "./FormKit";
import {
  createCategory, updateCategory, setCategoryActive,
  createItem, updateItem, setItemAvailable, setItemActive,
  type ItemInput,
} from "@/lib/menuActions";
import { ImageUpload } from "./ImageUpload";
import { setItemTags } from "@/lib/tagActions";
import { reorderCategoryItems } from "@/lib/sortActions";
import { Reorderable } from "./Reorderable";
import { TagChip } from "./TagsSection";

export type CatItem = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  available: boolean;
  active: boolean;
};
export type Cat = {
  id: string;
  name: string;
  slot: string;
  active: boolean;
  venueCount: number;
  items: CatItem[];
};
export type AllItem = CatItem & { categoryIds: string[]; tagIds: string[] };
export type TagOption = { id: string; name: string; color: string };

const money = (n: number) => `AED ${n.toFixed(2)}`;

const blankItem: ItemInput = {
  name: "", description: "", priceAed: 0, available: true, imageUrl: null, categoryIds: [],
};

export function CategoriesSection({
  categories,
  allItems,
  allTags,
  canEdit,
}: {
  categories: Cat[];
  allItems: AllItem[];
  allTags: TagOption[];
  canEdit: boolean;
}) {
  const [showRemoved, setShowRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [catModal, setCatModal] = useState<Cat | "new" | null>(null);
  const [itemModal, setItemModal] = useState<{ item: AllItem | null; presetCategoryId?: string } | null>(null);
  const [ordering, setOrdering] = useState<Cat | null>(null);
  const [confirming, setConfirming] = useState<
    { kind: "category"; row: Cat } | { kind: "item"; row: CatItem } | null
  >(null);

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      setConfirming(null);
    });
  };

  const visibleCats = showRemoved ? categories : categories.filter((c) => c.active);
  const removedCount =
    categories.filter((c) => !c.active).length + allItems.filter((i) => !i.active).length;

  // Items defined but not yet in any category would otherwise be invisible here.
  const orphanItems = allItems.filter((i) => i.categoryIds.length === 0 && (showRemoved || i.active));

  return (
    <div>
      <SectionTitle
        title="Categories & prices"
        subtitle="Define categories and items once — assign them to venues on the Restaurants screen"
        right={
          canEdit ? (
            <div className="flex gap-2">
              <button
                onClick={() => { setError(null); setItemModal({ item: null }); }}
                className="font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[14px]"
                style={{ background: "#EAF7F5", color: "#0A6E6C", minHeight: 44 }}
              >
                + Item
              </button>
              <button
                onClick={() => { setError(null); setCatModal("new"); }}
                className="btn-teal font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[14px]"
                style={{ minHeight: 44 }}
              >
                + Category
              </button>
            </div>
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

      {categories.length === 0 && (
        <div
          className="p-8 text-center rounded-[18px]"
          style={{ background: "#fff", border: "1px dashed rgba(16,48,47,0.14)" }}
        >
          <div className="font-display font-extrabold text-[15px] text-teal-ink">No categories yet</div>
          <p className="text-[13px] font-body text-teal-muted mt-1">
            Start with something like &ldquo;Cold drinks&rdquo;, then add items to it.
          </p>
        </div>
      )}

      {visibleCats.map((c) => (
        <div key={c.id} className="mb-5" style={{ opacity: c.active ? 1 : 0.6 }}>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="font-display font-extrabold text-[15px] text-teal-ink">{c.name}</div>
            <span
              className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
              style={{ background: "#EAF7F5", color: "#0A6E6C" }}
            >
              {c.slot}
            </span>
            <span
              className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
              style={{
                background: c.venueCount > 0 ? "#EDF2FF" : "#FCEBE7",
                color: c.venueCount > 0 ? "#3949AB" : "#E5533B",
              }}
              title="Set which venues serve this on the Restaurants screen"
            >
              {c.venueCount === 0 ? "no venues" : `${c.venueCount} venue${c.venueCount > 1 ? "s" : ""}`}
            </span>
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
                  onClick={() => { setError(null); setItemModal({ item: null, presetCategoryId: c.id }); }}
                  className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px] tap-target"
                  style={{ background: "#EAF7F5", color: "#0A6E6C" }}
                >
                  + Item
                </button>
                {c.items.length > 1 && (
                  <button
                    onClick={() => { setError(null); setOrdering(c); }}
                    className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px] tap-target"
                    style={{ background: "#EDF2FF", color: "#3949AB" }}
                  >
                    Reorder
                  </button>
                )}
                <button
                  onClick={() => { setError(null); setCatModal(c); }}
                  className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px] tap-target"
                  style={{ background: "#F4FBF9", color: "#5E807E" }}
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    c.active ? setConfirming({ kind: "category", row: c }) : run(() => setCategoryActive(c.id, true))
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

          <ItemRows
            items={showRemoved ? c.items : c.items.filter((i) => i.active)}
            allItems={allItems}
            allTags={allTags}
            canEdit={canEdit}
            pending={pending}
            onEdit={(it) => { setError(null); setItemModal({ item: it }); }}
            onToggleAvailable={(it) => run(() => setItemAvailable(it.id, !it.available))}
            onRemove={(it) => setConfirming({ kind: "item", row: it })}
            onRestore={(it) => run(() => setItemActive(it.id, true))}
            emptyText="No items in this category yet."
          />
        </div>
      ))}

      {orphanItems.length > 0 && (
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="font-display font-extrabold text-[15px] text-teal-ink">Not in any category</div>
            <span
              className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
              style={{ background: "#FCEBE7", color: "#E5533B" }}
            >
              hidden from guests
            </span>
          </div>
          <ItemRows
            items={orphanItems}
            allItems={allItems}
            allTags={allTags}
            canEdit={canEdit}
            pending={pending}
            onEdit={(it) => { setError(null); setItemModal({ item: it }); }}
            onToggleAvailable={(it) => run(() => setItemAvailable(it.id, !it.available))}
            onRemove={(it) => setConfirming({ kind: "item", row: it })}
            onRestore={(it) => run(() => setItemActive(it.id, true))}
            emptyText=""
          />
        </div>
      )}

      {catModal && (
        <CategoryModal
          category={catModal === "new" ? null : catModal}
          onClose={() => setCatModal(null)}
        />
      )}

      {itemModal && (
        <ItemModal
          item={itemModal.item}
          categories={categories}
          allTags={allTags}
          presetCategoryId={itemModal.presetCategoryId}
          onClose={() => setItemModal(null)}
        />
      )}

      {ordering && (
        <ReorderItemsModal category={ordering} onClose={() => setOrdering(null)} />
      )}

      {confirming && (
        <ConfirmModal
          title={`Remove ${confirming.row.name}?`}
          body={
            confirming.kind === "category"
              ? "It disappears from every venue serving it. Nothing is deleted — its items stay, and you can restore it."
              : "It disappears from every category it is in. Nothing is deleted and you can restore it."
          }
          confirmLabel="Remove"
          destructive
          pending={pending}
          onCancel={() => setConfirming(null)}
          onConfirm={() =>
            run(() =>
              confirming.kind === "category"
                ? setCategoryActive(confirming.row.id, false)
                : setItemActive(confirming.row.id, false),
            )
          }
        />
      )}
    </div>
  );
}

function ItemRows({
  items, allItems, allTags, canEdit, pending, onEdit, onToggleAvailable, onRemove, onRestore, emptyText,
}: {
  items: CatItem[];
  allItems: AllItem[];
  allTags: TagOption[];
  canEdit: boolean;
  pending: boolean;
  onEdit: (i: AllItem) => void;
  onToggleAvailable: (i: CatItem) => void;
  onRemove: (i: CatItem) => void;
  onRestore: (i: CatItem) => void;
  emptyText: string;
}) {
  if (items.length === 0) {
    return emptyText ? (
      <div className="text-[12.5px] font-body text-teal-muted px-1 py-2">{emptyText}</div>
    ) : null;
  }
  return (
    <div className="rounded-[16px] overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(16,48,47,0.06)" }}>
      {items.map((it, i) => {
        const full = allItems.find((a) => a.id === it.id);
        const alsoIn = (full?.categoryIds.length ?? 0) - 1;
        return (
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
              <img src={it.imageUrl} alt="" style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
            ) : (
              <div
                style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: "repeating-linear-gradient(45deg,#DBEEEB 0 4px,#EAF7F5 4px 8px)",
                }}
              />
            )}
            <div className="min-w-0 flex-1" style={{ flexBasis: "8rem" }}>
              <div className="font-display font-extrabold text-[14px] text-teal-ink truncate">
                {it.name}
                {alsoIn > 0 && (
                  <span
                    className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ml-1.5"
                    style={{ background: "#EDF2FF", color: "#3949AB" }}
                    title="This item also appears in other categories"
                  >
                    +{alsoIn}
                  </span>
                )}
                {(full?.tagIds ?? []).map((id) => {
                  const t = allTags.find((x) => x.id === id);
                  return t ? (
                    <span key={id} className="ml-1.5 inline-block align-middle">
                      <TagChip name={t.name} color={t.color} />
                    </span>
                  ) : null;
                })}
              </div>
              {it.description && (
                <div className="text-[12px] font-body text-teal-muted truncate">{it.description}</div>
              )}
            </div>
            <div className="font-display font-extrabold text-[14px] md:min-w-[92px] text-right" style={{ color: "var(--color-teal)" }}>
              {money(it.price)}
            </div>
            {canEdit ? (
              <button
                onClick={() => onToggleAvailable(it)}
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
            {canEdit && full && (
              <>
                <button
                  onClick={() => onEdit(full)}
                  className="text-[11px] font-display font-extrabold px-2 py-1 rounded-[8px] tap-target"
                  style={{ background: "#F4FBF9", color: "#5E807E" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => (it.active ? onRemove(it) : onRestore(it))}
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
        );
      })}
    </div>
  );
}

function CategoryModal({ category, onClose }: { category: Cat | null; onClose: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slot, setSlot] = useState(category?.slot ?? "food");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    setError(null);
    start(async () => {
      const res = category
        ? await updateCategory(category.id, name, slot)
        : await createCategory(name, slot);
      if (res.ok) onClose();
      else setError(res.error);
    });
  };

  return (
    <Modal title={category ? `Edit ${category.name}` : "Add category"} onClose={onClose}>
      <ErrorNote message={error} />
      <Field label="Name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Cold drinks" />
      </Field>
      <Field label="Browse filter" hint="Which chip on the guest browse screen this counts towards.">
        <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
          <option value="food">Food</option>
          <option value="drinks">Drinks</option>
          <option value="sweets">Sweets</option>
        </Select>
      </Field>
      <p className="text-[11.5px] font-body text-teal-muted mb-1">
        Assign this category to venues on the <strong>Restaurants</strong> screen.
      </p>
      <ModalActions onCancel={onClose} onSave={save} saving={pending} saveLabel={category ? "Save changes" : "Add category"} />
    </Modal>
  );
}

function ItemModal({
  item, categories, allTags, presetCategoryId, onClose,
}: {
  item: AllItem | null;
  categories: Cat[];
  allTags: TagOption[];
  presetCategoryId?: string;
  onClose: () => void;
}) {
  const [tagIds, setTagIds] = useState<string[]>(item?.tagIds ?? []);
  const [form, setForm] = useState<ItemInput>(
    item
      ? {
          name: item.name, description: item.description, priceAed: item.price,
          available: item.available, imageUrl: item.imageUrl, categoryIds: item.categoryIds,
        }
      : { ...blankItem, categoryIds: presetCategoryId ? [presetCategoryId] : [] },
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof ItemInput>(k: K, v: ItemInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    setError(null);
    start(async () => {
      const res = item ? await updateItem(item.id, form) : await createItem(form);
      if (!res.ok) { setError(res.error); return; }
      // Tags live on their own join table, so they save separately. Only an
      // existing item has an id to attach them to; a new one is saved first.
      if (item) {
        const t = await setItemTags(item.id, tagIds);
        if (!t.ok) { setError(t.error); return; }
      }
      onClose();
    });
  };

  return (
    <Modal
      title={item ? `Edit ${item.name}` : "Add item"}
      subtitle="One price everywhere. Tick every category this should appear in."
      onClose={onClose}
    >
      <ErrorNote message={error} />

      <Field label="Item name">
        <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Coca-Cola" />
      </Field>

      <Field label="Description" hint="Optional — shown under the item name.">
        <TextArea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <Field label="Price (AED)">
        <TextInput
          type="number" min={0} step="0.01" value={form.priceAed}
          onChange={(e) => set("priceAed", Number(e.target.value))}
        />
      </Field>

      <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted mb-1.5">
        Categories
      </div>
      <CheckList
        options={categories.filter((c) => c.active).map((c) => ({
          id: c.id,
          label: c.name,
          sublabel: c.venueCount === 0 ? "· no venues yet" : `· ${c.venueCount} venue${c.venueCount > 1 ? "s" : ""}`,
        }))}
        selected={form.categoryIds}
        onChange={(ids) => set("categoryIds", ids)}
        empty="Create a category first — an item with no category is hidden from guests."
      />

      {allTags.length > 0 && item && (
        <>
          <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted mb-1.5">
            Tags
          </div>
          <div className="flex flex-wrap gap-2 mb-3.5">
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
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </>
      )}
      {allTags.length > 0 && !item && (
        <p className="text-[11.5px] font-body text-teal-muted mb-3.5">
          Save the item first, then reopen it to add tags.
        </p>
      )}

      <ImageUpload value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />

      <Toggle checked={form.available} onChange={(v) => set("available", v)} label="Available today" />

      <ModalActions onCancel={onClose} onSave={save} saving={pending} saveLabel={item ? "Save changes" : "Add item"} />
    </Modal>
  );
}

/** Drag (or ▲▼) the items inside one category into the order guests will see. */
function ReorderItemsModal({ category, onClose }: { category: Cat; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (orderedIds: string[]) => {
    setError(null);
    start(async () => {
      const res = await reorderCategoryItems(category.id, orderedIds);
      if (res.ok) onClose();
      else setError(res.error);
    });
  };

  return (
    <Modal
      title={`Order items in ${category.name}`}
      subtitle="Drag, or use the arrows. This order is what guests see at every venue serving this category."
      onClose={onClose}
    >
      <ErrorNote message={error} />
      <Reorderable
        rows={category.items.map((i) => ({ id: i.id, label: i.name, sublabel: money(i.price) }))}
        onSave={save}
        saving={pending}
      />
    </Modal>
  );
}
