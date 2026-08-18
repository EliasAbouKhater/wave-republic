/**
 * Browser-side image compression for menu photos.
 *
 * Managers upload straight off a phone, where a single photo is routinely
 * 5-12 MB. Guests view those photos at 56px (menu row) and 240px (item hero),
 * on park wifi. Shipping the original would cost every guest megabytes for an
 * image displayed smaller than a postage stamp.
 *
 * So: accept whatever the phone produces, and compress before it ever reaches
 * the network. The original is not kept — see docs/photos.md.
 *
 * No dependency: `createImageBitmap` + `<canvas>.toBlob()` are built in.
 */

/**
 * Long edge of the stored image.
 * - item:  1600px covers the 240px hero on a 3x screen.
 * - venue: 2000px — a venue photo fills a full-width 180px banner, so it is
 *   stretched across the whole viewport rather than a fixed-width card.
 */
const MAX_EDGE = { item: 1600, venue: 2000 } as const;
export type ImageKind = keyof typeof MAX_EDGE;

/** WebP quality. 0.82 is the knee of the curve — visually clean, far smaller. */
const QUALITY = 0.82;

/** Safety net: never hand back something larger than the file we were given. */
export type CompressResult = {
  file: File;
  originalBytes: number;
  compressedBytes: number;
};

export async function compressImage(input: File, kind: ImageKind = "item"): Promise<CompressResult> {
  const bitmap = await decode(input);

  const scale = Math.min(1, MAX_EDGE[kind] / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image in this browser.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await toBlob(canvas, "image/webp", QUALITY);

  // A tiny or already-optimised image can come out bigger as WebP. Keep the
  // original in that case rather than inflating it.
  if (blob.size >= input.size) {
    return { file: input, originalBytes: input.size, compressedBytes: input.size };
  }

  const name = input.name.replace(/\.[^.]+$/, "") + ".webp";
  return {
    file: new File([blob], name, { type: "image/webp" }),
    originalBytes: input.size,
    compressedBytes: blob.size,
  };
}

/**
 * `createImageBitmap` handles anything the browser can decode. It notably does
 * NOT handle HEIC on most desktop browsers — iPhones transcode to JPEG on
 * upload, but a file copied off a Mac can still arrive as HEIC. Fail with words
 * the manager can act on rather than a DOMException.
 */
async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error(
      "That image format could not be read. Save it as JPEG or PNG and try again.",
    );
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not compress the image."))),
      type,
      quality,
    );
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
