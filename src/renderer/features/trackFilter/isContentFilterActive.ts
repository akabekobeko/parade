import type { ContentFilter } from "./matchesContentFilter";

/**
 * Whether the content toolbar narrows a section
 * (`docs/specs/v1.4/features/filter-menu.md`): a non-blank song-filter
 * text or "favorites only". The one definition behind the Funnel's filled
 * look, the Playlist table's reorder lock, and the "no match" empty states.
 *
 * @param filter - The section's conditions.
 * @returns Whether either condition is in effect.
 */
export const isContentFilterActive = (filter: ContentFilter): boolean =>
  filter.text.trim() !== "" || filter.favoriteOnly;
