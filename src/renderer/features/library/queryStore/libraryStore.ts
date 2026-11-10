import { markStartup } from "@/startupMark";
import { createLibraryStore } from "./createLibraryStore";
import { fetchLibraryQuery } from "./fetchLibraryQuery";
import { queryKeys } from "./queryKeys";
import type { QueryFetcher, QueryKey } from "./types";

/** Key prefix of the selected artist's track list, derived from the builder. */
const MUSICS_BY_ARTIST_PREFIX = queryKeys.musicsByArtist("");

/**
 * Startup-trace label of the queries the initial Artist view issues, or
 * `undefined` for every other key.
 *
 * @param key - Query key.
 * @returns Label stem used for the `-fetch-start` / `-fetch-end` marks.
 */
const traceLabelOf = (key: QueryKey): string | undefined => {
  if (key === queryKeys.artists) return "renderer:artists";
  if (key.startsWith(MUSICS_BY_ARTIST_PREFIX)) return "renderer:artist-musics";
  return undefined;
};

/**
 * `fetchLibraryQuery` with the startup marks of the Artist view queries
 * (`src/main/startupTrace.ts`). Every fetch of those keys emits; the main
 * process prints the first one per label. The original promise is returned
 * as is, so the marks add no microtask hop to the store's own settlement.
 *
 * @param key - Query key to resolve.
 * @returns The pending IPC result.
 */
const tracedFetch: QueryFetcher = (key) => {
  const label = traceLabelOf(key);
  if (label !== undefined) markStartup(`${label}-fetch-start`);
  const pending = fetchLibraryQuery(key);
  if (label !== undefined) {
    const end = (): void => {
      markStartup(`${label}-fetch-end`);
    };
    pending.then(end, end);
  }

  return pending;
};

/**
 * The app-wide library query store. The regular build selects the plain
 * fetcher, so the tracing wrapper is dropped from the bundle.
 */
export const libraryStore = createLibraryStore(
  __STARTUP_TRACE__ ? tracedFetch : fetchLibraryQuery,
);
