# Next.js 16 notes (only what differs from v15)

## Middleware renamed to proxy
`src/middleware.ts` → `src/proxy.ts`. Same API (`export function` + `export const config = { matcher }`). Old name still runs but logs a deprecation warning.

## Async everything at the request boundary
`params`, `searchParams`, `cookies()`, `headers()` are all **Promises**. Always `await` (Server Component) or `use()` (Client Component). Silent hang if you forget.

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

## `next/cache` new exports
- `updateTag(tag)` — expire now, block for fresh in the same action response
- `revalidateTag(tag)` — SWR background refresh
- `revalidatePath(path)` — unchanged
- `refresh()` — refetch RSC without invalidating

## `use cache` (opt-in, needs `cacheComponents: true` in next.config)
```tsx
async function getUsers() { 'use cache'; cacheLife('hours'); return db.users(); }
```
Not enabling for now — vanilla data-fetching is fine.

## React 19 hook rename
`useFormState` → `useActionState`.

## Tailwind 4
- `@import "tailwindcss"` in `globals.css` (already set).
- No `tailwind.config.*` needed — use `@theme inline { --color-…: …; }` in CSS.
- PostCSS plugin: `@tailwindcss/postcss` in `postcss.config.mjs` (already set).

## Turbopack default
On by default (`next dev`, `next build`). Fine to leave.

## Route handlers
`GET` NOT cached by default. Use `export const dynamic = 'force-static'` only if truly static. Accessing `cookies()`/`headers()`/body makes it dynamic — that's what we want for order endpoints.

## Metadata
`generateMetadata({ params, searchParams })` receives Promises too.

## Deprecated / removed
- `next/future/*` — gone.
- `Image.onLoadingComplete` — use `onLoad`.
- Sync access to params/searchParams/cookies/headers — still works but deprecated; do not use.
