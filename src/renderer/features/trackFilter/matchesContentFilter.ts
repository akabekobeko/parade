import type { Music } from "@mp/ipc";
import { matchesTrackFilter } from "./matchesTrackFilter";

/** The content toolbar's conditions on one section's tracks. */
export type ContentFilter = {
  /** Song-filter text; blank matches everything. */
  readonly text: string;
  /** "Favorites only": keep only tracks flagged as favorite. */
  readonly favoriteOnly: boolean;
};

/**
 * Whether a track passes the content toolbar's filters
 * (`docs/specs/v1.4/architecture/favorite-filter.md`): the song-filter
 * text (`matchesTrackFilter`) AND, when "favorites only" is on, the
 * track's favorite flag. The single definition the Artists view, the
 * Playlist table, and the Albums track list share, so the two conditions
 * combine the same way whichever was switched first.
 *
 * @param music - The track.
 * @param filter - The section's conditions.
 * @returns Whether the track is shown.
 */
export const matchesContentFilter = (
  music: Music,
  filter: ContentFilter,
): boolean =>
  matchesTrackFilter(music.title, filter.text) &&
  (!filter.favoriteOnly || music.favorite);
