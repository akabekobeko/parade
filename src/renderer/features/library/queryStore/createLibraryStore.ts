import type { Music } from "@mp/ipc";
import { createQueryStore } from "./createQueryStore";
import { queryKeys } from "./queryKeys";
import type { QueryFetcher, QueryKey, QueryStore } from "./types";

/** The query store plus the library-specific bulk operations. */
export type LibraryStore = QueryStore & {
  /**
   * Patch every cached track list at once (`musicsByArtist:*`,
   * `musicsByAlbum:*`, `musicsByPlaylist:*`) — the same track can sit in
   * several of them, and a per-track change (a favorite flip) must reach all
   * of them without a refetch. Each list goes through `patch`, so returning
   * the same instance for a list that holds no affected track leaves that
   * list's subscribers alone. A list still loading is invalidated instead:
   * its in-flight response was read before the mutation and must not land
   * as the newest state.
   *
   * @param updater - Maps one cached track list to the next one.
   */
  readonly patchMusics: (
    updater: (musics: readonly Music[]) => readonly Music[],
  ) => void;
};

/**
 * Key prefixes of the queries whose value is a `readonly Music[]`, derived
 * from the builders so a renamed key cannot leave a family behind.
 */
const MUSIC_LIST_PREFIXES = [
  queryKeys.musicsByArtist(""),
  queryKeys.musicsByAlbum(""),
  queryKeys.musicsByPlaylist(""),
];

/**
 * Whether a key names one of the track-list queries.
 *
 * @param key - Query key.
 * @returns `true` for the `musicsBy*` keys.
 */
export const isMusicListKey = (key: QueryKey): boolean =>
  MUSIC_LIST_PREFIXES.some((prefix) => key.startsWith(prefix));

/**
 * Build the library store: a query store with the track-list bulk patch
 * (`docs/specs/v1.4/architecture/ipc.md`).
 *
 * @param fetch - Key → Main query resolver.
 * @returns The store.
 */
export const createLibraryStore = (fetch: QueryFetcher): LibraryStore => {
  const store = createQueryStore(fetch);
  return {
    ...store,
    patchMusics: (updater) => {
      for (const key of store.keys()) {
        if (!isMusicListKey(key)) {
          continue;
        }

        if (store.getSnapshot(key).status === "loading") {
          store.invalidate(key);
        } else {
          store.patch(key, updater);
        }
      }
    },
  };
};
