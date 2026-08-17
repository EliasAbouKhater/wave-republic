# QR stability contract

**Status: binding rule. Applies to every future change, no exceptions.**

The park prints QR codes on physical signage and entry bracelets. Printed codes
cannot be recalled, reissued, or patched. A URL change that would be a trivial
redirect on the web is, here, a pile of dead plastic and reprinted signs.

Therefore: **once a QR-reachable URL is in circulation, it never changes.**

## What is frozen

| Thing | Value | Why it can't move |
|---|---|---|
| Base URL | `QR_BASE_URL` env var | Burned into every printed code |
| Entry path | `/` with `?src=park` | On signs and bracelets |
| Venue path | `/r/<qrSlug>` with `?src=resto` | On per-venue table cards / counters |
| A venue's `qrSlug` | assigned at creation | Immutable after create — no UI exposes it for edit |

## Rules for future work

1. **Never change `QR_BASE_URL`** while printed codes exist. Moving the app to a
   custom domain does *not* mean changing this — point the new domain at the app
   and keep serving the old one, or add a permanent redirect from the old host.
2. **Never edit a `qrSlug`.** `createVenue` assigns it once. `updateVenue` must not
   accept the field. Guarded in `src/lib/venueActions.ts`.
3. **Never hard-delete a venue.** Removal is soft (`active = false`). The venue
   disappears from guest-facing lists, but `/r/<qrSlug>` must keep resolving —
   a guest scanning a code on a table has to get *something* useful, not a 404.
4. **Changing a QR-reachable route = add a redirect, never reissue the code.**
   If `/r/[qrSlug]` ever moves, the old path stays and redirects forever.
5. **Don't touch the `?src=` tags.** Analytics rows already reference them;
   changing a tag orphans historical data.

## Production guard

`src/app/backoffice/(console)/qr/page.tsx` **throws** in production if
`QR_BASE_URL` is unset, rather than silently falling back to the request `Host`
header. Host-derived codes were the original bug: they encoded whatever domain
the manager happened to be browsing (preview deploy, `vercel.app`, custom domain)
and would have been printed wrong. Host fallback now exists only in dev.

The QR page shows a lock banner confirming the frozen base URL, or a red
"not safe to print" banner when the env var is missing.

## History

- **2026-08-17** — Base URL pinned to `https://wave-republic.vercel.app`.
  Park-wide and entry-bracelet QRs **merged into one "Entry QR"** (`?src=park`);
  they always pointed to the same page and differed only by analytics tag.
  Accepted trade-off: signage-vs-bracelet attribution is no longer separable.
