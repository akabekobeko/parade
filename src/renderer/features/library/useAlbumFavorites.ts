import { useMemo, useRef } from "react";
import { favoriteKeysOf } from "./favoriteKeysOf";
import { queryKeys } from "./queryStore/queryKeys";
import { useLibraryQuery } from "./useLibraryQuery";

/** The list handed out before the favorites first load; one identity. */
const NONE: readonly string[] = [];
const NONE_SET: ReadonlySet<string> = new Set();

/**
 * The identity keys of every favorite album
 * (`docs/specs/v1.4/architecture/ipc.md`, `albumFavorites` query): what the
 * album cards, the artist album headers, and the album info dialog match
 * their album against. `setAlbumFavorite` patches the cached list, which
 * re-renders every subscriber at once. Empty until the list first loads,
 * so a view simply shows every album as not a favorite while waiting; a
 * reload or a failed load keeps the last loaded list (`favoriteKeysOf`).
 *
 * @returns The favorite album keys (`AlbumSummary.albumKey` / `AlbumGroup.key`).
 */
export const useAlbumFavorites = (): ReadonlySet<string> => {
  const state = useLibraryQuery<readonly string[]>(queryKeys.albumFavorites);
  // The list last handed out, carried across renders so a reload needs no
  // effect pass to keep showing it.
  const previous = useRef(NONE);
  const keys = favoriteKeysOf(state, previous.current);
  previous.current = keys;
  return useMemo(() => (keys === NONE ? NONE_SET : new Set(keys)), [keys]);
};
