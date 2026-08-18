"use client";

/**
 * Pick → preview → remove, for a single photo (menu item or venue).
 * Uploads immediately on pick so the manager sees the real hosted image before
 * saving, rather than discovering a failed upload after hitting Save.
 */

import { useRef, useState, useTransition } from "react";
import { uploadItemImage } from "@/lib/uploadActions";
import { compressImage, formatBytes, type ImageKind } from "@/lib/compressImage";

/**
 * What we accept off the manager's phone. Deliberately generous: photos are
 * compressed in the browser before upload, so this caps the *input*, not what
 * guests download.
 */
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
  value,
  onChange,
  kind = "item",
  label = "Photo",
  hint,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Drives blob folder and compression size — a venue photo fills a wider banner. */
  kind?: ImageKind;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [savings, setSavings] = useState<string | null>(null);
  const [optimising, setOptimising] = useState(false);
  const [pending, start] = useTransition();

  const busy = optimising || pending;

  const pick = async (file: File) => {
    setError(null);
    setSavings(null);
    if (!ALLOWED.includes(file.type)) { setError("Use a JPEG, PNG or WebP image"); return; }
    if (file.size > MAX_INPUT_BYTES) {
      setError(`That photo is ${formatBytes(file.size)}. The limit is 25 MB.`);
      return;
    }

    // Resize + re-encode here so guests never download the phone-sized original.
    let upload: File;
    setOptimising(true);
    try {
      const out = await compressImage(file, kind);
      upload = out.file;
      if (out.compressedBytes < out.originalBytes) {
        setSavings(`${formatBytes(out.originalBytes)} → ${formatBytes(out.compressedBytes)}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process that image.");
      return;
    } finally {
      setOptimising(false);
    }

    const fd = new FormData();
    fd.set("file", upload);
    fd.set("kind", kind);
    start(async () => {
      const res = await uploadItemImage(fd);
      if (res.ok) onChange(res.url);
      else { setError(res.error); setSavings(null); }
    });
  };

  return (
    <div className="mb-3.5">
      <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-teal-muted mb-1.5">
        {label}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pick(f);
          e.target.value = ""; // allow re-picking the same file
        }}
      />

      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(16,48,47,0.12)" }}
          />
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="text-[12px] font-display font-extrabold px-3 py-1.5 rounded-[10px]"
              style={{ background: "#EAF7F5", color: "#0A6E6C" }}
            >
              {optimising ? "Optimising…" : pending ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => { setError(null); onChange(null); }}
              disabled={busy}
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
          disabled={busy}
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
          {optimising ? "Optimising…" : pending ? "Uploading…" : "+ Add a photo"}
        </button>
      )}

      {error && (
        <div className="text-[12px] font-body mt-1.5" style={{ color: "#8C2F1C" }}>
          {error}
        </div>
      )}
      {!error && savings && (
        <div className="text-[11.5px] font-body text-teal-muted mt-1.5">
          Optimised for guests · {savings}
        </div>
      )}
      {!error && !savings && !value && (
        <div className="text-[11.5px] font-body text-teal-muted mt-1.5">
          {hint ?? "JPEG, PNG or WebP · up to 25 MB · resized automatically so the menu stays fast on park wifi"}
        </div>
      )}
    </div>
  );
}
