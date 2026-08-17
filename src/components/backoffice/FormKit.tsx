"use client";

/**
 * Shared modal + field primitives for the backoffice CRUD forms.
 * Kept deliberately small — the sections differ in fields, not in chrome.
 */

import { useEffect, type ReactNode } from "react";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  // Escape closes; body scroll locks while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(9,32,31,0.45)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-h-[90vh] overflow-y-auto"
        style={{
          maxWidth: 460,
          background: "#fff",
          borderRadius: 20,
          border: "1px solid rgba(16,48,47,0.08)",
          boxShadow: "0 20px 60px rgba(9,32,31,0.25)",
          padding: 22,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="font-display font-extrabold text-[19px] text-teal-ink">{title}</h2>
          {subtitle && <p className="text-[12.5px] font-body text-teal-muted mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block mb-3.5">
      <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted mb-1.5">
        {label}
      </div>
      {children}
      {hint && <div className="text-[11.5px] font-body text-teal-muted mt-1">{hint}</div>}
    </label>
  );
}

const controlStyle: React.CSSProperties = {
  width: "100%",
  background: "#F4FBF9",
  border: "1px solid rgba(16,48,47,0.12)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  color: "var(--color-teal-ink)",
  fontFamily: "var(--font-sans)",
};

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...controlStyle, ...props.style }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...controlStyle, resize: "vertical", ...props.style }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...controlStyle, ...props.style }} />;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 mb-3.5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 17, height: 17, accentColor: "var(--color-teal)" }}
      />
      <span className="text-[13.5px] font-body text-teal-ink">{label}</span>
    </label>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="text-[12.5px] font-body mb-3 p-2.5 rounded-[10px]"
      style={{ background: "#FCEBE7", color: "#8C2F1C" }}
    >
      {message}
    </div>
  );
}

export function ModalActions({
  onCancel,
  onSave,
  saving,
  saveLabel = "Save",
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="flex gap-2 mt-5">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="flex-1 font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[12px]"
        style={{ background: "#F4FBF9", color: "var(--color-teal-ink)" }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex-1 btn-teal font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[12px]"
        style={{ opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}

/** Small inline confirm for destructive-looking actions (remove / restore). */
export function ConfirmModal({
  title,
  body,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
  pending,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-[13.5px] font-body text-teal-muted leading-relaxed">{body}</p>
      <div className="flex gap-2 mt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex-1 font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[12px]"
          style={{ background: "#F4FBF9", color: "var(--color-teal-ink)" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="flex-1 font-display font-extrabold text-[13.5px] px-4 py-2.5 rounded-[12px]"
          style={{
            background: destructive ? "#E5533B" : "var(--color-teal)",
            color: "#fff",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
