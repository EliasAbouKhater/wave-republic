"use server";

/**
 * Image uploads for menu items, backed by Vercel Blob.
 *
 * The store must be PUBLIC — guests fetch these URLs directly from the CDN with
 * no session. A private store uploads fine but 403s for anonymous visitors, which
 * is exactly what the manager would not notice until a customer complained.
 *
 * Token: `blob_images_READ_WRITE_TOKEN` (the public "blob_images" store). Passed
 * explicitly rather than relying on the SDK default, because the older private
 * store's BLOB_READ_WRITE_TOKEN is still present and would otherwise win silently.
 *
 * Validation is server-side on purpose: the client component checks type and size
 * too, but that is a convenience, not a control.
 */

import { put, del } from "@vercel/blob";
import { requireManager } from "@/lib/auth";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — plenty for a menu photo off a phone
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadItemImage(formData: FormData): Promise<UploadResult> {
  await requireManager();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No file selected" };
  if (!ALLOWED.includes(file.type)) return { ok: false, error: "Use a JPEG, PNG or WebP image" };
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `Image must be under 5 MB (this one is ${(file.size / 1024 / 1024).toFixed(1)} MB)` };
  }

  const token = process.env.blob_images_READ_WRITE_TOKEN;
  if (!token) {
    return { ok: false, error: "Image storage is not configured. Set blob_images_READ_WRITE_TOKEN." };
  }

  try {
    // addRandomSuffix keeps two items named "burger.jpg" from overwriting each other.
    const blob = await put(`menu-items/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
      token,
    });
    return { ok: true, url: blob.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    // The private-store case is worth naming explicitly — the fix is a dashboard
    // setting, not a code change, and the raw SDK message buries that.
    if (/private/i.test(msg)) {
      return { ok: false, error: "The image store is private, so guests could not see the photo. Switch the Blob store to public." };
    }
    return { ok: false, error: msg };
  }
}

/**
 * Best-effort removal of an orphaned blob (image replaced or cleared).
 * Never throws: losing a stray file is not worth failing the manager's save.
 */
export async function deleteItemImage(url: string): Promise<void> {
  await requireManager();
  const token = process.env.blob_images_READ_WRITE_TOKEN;
  if (!url || !token) return;
  try {
    await del(url, { token });
  } catch {
    // ignore — the DB row is the source of truth
  }
}
