/**
 * Chip palette for tags.
 *
 * Deliberately NOT in tagActions.ts: that file is "use server", where every
 * export must be an async function. A plain array exported from there is
 * rewritten as a server-action stub, and `TAG_COLORS.map` blows up in the
 * browser. Constants shared with client components live here.
 */
export const TAG_COLORS = [
  "#0EA5A4", // teal
  "#FF6B4A", // coral
  "#0BA5E9", // sky
  "#22C55E", // green
  "#8B5CF6", // violet
  "#F59E0B", // amber
] as const;

export type TagColor = (typeof TAG_COLORS)[number];
