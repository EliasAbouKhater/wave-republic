# Photos — upload and compression contract

Two subjects, one pipeline:

- **Menu item** — menu-row thumbnail (56px) and item-page hero (240px tall).
- **Venue** — browse tile (60px), backoffice venue card (56px) and the
  menu-page banner (full width × 180px).

One photo per venue serves all three venue slots, centre-cropped to fill
(`object-fit: cover`). `thumbLabel` remains the fallback when no photo is set,
and is captioned over the banner either way.

## The rule

**Accept big, store small.** A manager should never be told their phone photo
is too large. A guest should never download a phone-sized photo.

| Stage | Limit | Where |
|---|---|---|
| Input from the manager | **25 MB** | `MAX_INPUT_BYTES`, `ImageUpload.tsx` |
| After browser compression | ~200–500 KB typical | `compressImage.ts` |
| Server-side cap on the upload | **3 MB** | `MAX_BYTES`, `uploadActions.ts` |
| Framework request-body ceiling | **4 MB** | `serverActions.bodySizeLimit`, `next.config.ts` |

Those last two are ordered deliberately: the framework limit must stay **above**
the server cap, or Next rejects the request before `uploadActions.ts` can return
a readable error.

## Compression

`src/lib/compressImage.ts`, in the browser, before the file touches the network:

1. Decode with `createImageBitmap`.
2. Resize the long edge, per subject:
   - **item — 1600px**, covering the 240px hero on a 3x screen.
   - **venue — 2000px**, because a venue photo is stretched across the full
     viewport width as a banner, not confined to a card.
3. Re-encode as **WebP at quality 0.82**.
4. If the result is somehow larger than the input, keep the original.

Measured: a 10.4 MB / 12 MP image came out at 30 KB. Real photographs compress
less well than test gradients — expect a few hundred KB.

No dependency; `createImageBitmap` and `canvas.toBlob()` are built in.

**Originals are not kept.** Menu photos are displayed at 56px and 240px, so the
loss is invisible and the bandwidth saving is the entire point. Print work
should use a real photograph, not a manager's phone snap. Changing this means
storing two blobs per item and a migration.

## Why the framework limit is in this file

Server Actions cap request bodies at **1 MB by default**. Before 2026-08-18 that
cap was never raised, so uploads over ~1 MB failed *inside Next* before any
project code ran — while `ImageUpload.tsx` advertised "up to 5 MB". The limit
was fiction, and the manager got an opaque failure.

If uploads start failing again with no error message from our own code, check
`serverActions.bodySizeLimit` first.

## HEIC

iPhones normally transcode to JPEG on upload, but a file copied off a Mac can
arrive as HEIC, which most browsers cannot decode. Two layers catch it: the
`accept` list and `ALLOWED` type check reject it with a readable message, and
`compressImage` fails with "save it as JPEG or PNG" if a decode still fails.

## Storage

Blobs are foldered by subject — `menu-items/` and `venues/` — so the two are
separable later. The folder comes from the `kind` field on the upload FormData;
anything other than `"venue"` is treated as an item.

Public Vercel Blob store `blob_images`, addressed by
`blob_images_READ_WRITE_TOKEN` (passed explicitly — the legacy
`BLOB_READ_WRITE_TOKEN` points at a **private** store and would 403 for guests).
Replacing or clearing a photo deletes the old blob; a failed delete is ignored
because the DB row is the source of truth.
