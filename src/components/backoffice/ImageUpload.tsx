"use client";

/**
 * Pick → preview → remove, for a single menu-item photo.
 * Uploads immediately on pick so the manager sees the real hosted image before
 * saving, rather than discovering a failed upload after hitting Save.
 */

import { useRef, useState, useTransition } from "react";
import { uploadItemImage } from "@/lib/uploadActions";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const pick = (file: File) => {
    setError(null);
    if (!ALLOWED.includes(file.type)) { setError("Use a JPEG, PNG or WebP image"); return; }
    if (file.size > MAX_BYTES) { setError("Image must be under 5 MB"); return; }

    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const res = await uploadItemImage(fd);
      if (res.ok) onChange(res.url);
      else setError(res.error);
    });
  };

  return (
    <div className="mb-3.5">
      <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted mb-1.5">
        Photo
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = ""; // allow re-picking the same file
        }}
      />

      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Menu item"
            style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(16,48,47,0.12)" }}
          />
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px]"
              style={{ background: "#EAF7F5", color: "#0A6E6C" }}
            >
              {pending ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => { setError(null); onChange(null); }}
              disabled={pending}
              className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px]"
              style={{ background: "#FCEBE7", color: "#E5533B" }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="w-full grid place-items-center"
          style={{
            height: 76,
            borderRadius: 12,
            border: "1px dashed rgba(16,48,47,0.22)",
            background: "#F4FBF9",
            color: "#5E807E",
            fontSize: 13,
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
          }}
        >
          {pending ? "Uploading…" : "+ Add a photo"}
        </button>
      )}

      {error && (
        <div className="text-[12px] font-body mt-1.5" style={{ color: "#8C2F1C" }}>
          {error}
        </div>
      )}
      {!error && !value && (
        <div className="text-[11.5px] font-body text-teal-muted mt-1.5">
          JPEG, PNG or WebP · up to 5 MB · shown to guests on the menu
        </div>
      )}
    </div>
  );
}
