import type { AlbumFilter } from "@mp/ipc";
import type { QueryKey } from "./types";

const ALBUMS_PREFIX = "albums:";

/**
 * Whether a cached key is an album-list query restricted to favorite
 * albums (`AlbumFilter.favoriteOnly`, `docs/specs/v1.4/architecture/ipc.md`).
 *
 * Such lists are the only queries whose membership a favorite flip changes
 * (an album turned off must leave the grid), so `setAlbumFavorite`
 * refetches exactly these and leaves the unrestricted lists to their Star
 * re-render. Read off the key itself — the serialised filter — so this stays
 * correct for every filter combination without consulting the filter UI.
 *
 * @param key - Query key.
 * @returns `true` for an `albums:` key whose filter has `favoriteOnly: true`.
 */
export const isFavoriteOnlyAlbumsKey = (key: QueryKey): boolean => {
  if (!key.startsWith(ALBUMS_PREFIX)) {
    return false;
  }

  const filter = JSON.parse(key.slice(ALBUMS_PREFIX.length)) as AlbumFilter;
  return filter.favoriteOnly === true;
};
