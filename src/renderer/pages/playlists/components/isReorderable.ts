import type { PlaylistKind } from "@mp/ipc";

/**
 * Whether the Playlist table's rows can be reordered by drag & drop
 * (`docs/specs/v1.3/features/column-sort.md`,
 * `docs/specs/v1.4/architecture/favorite-filter.md`): a static playlist,
 * shown in the playlist order, with no toolbar filter in effect. Drag
 * indices are playlist positions only while nothing is filtered out or
 * sorted; "favorites only" hides rows like the song text does.
 *
 * @param kind - The playlist's kind; smart playlists are never reordered.
 * @param filterActive - A toolbar filter (text or favorites only) narrows the rows.
 * @param playlistOrder - The rows are shown in the playlist order (no sort).
 * @returns Whether drag & drop reorder is enabled.
 */
export const isReorderable = (
  kind: PlaylistKind,
  filterActive: boolean,
  playlistOrder: boolean,
): boolean => kind === "static" && !filterActive && playlistOrder;
