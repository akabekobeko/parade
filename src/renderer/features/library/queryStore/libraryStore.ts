import { markStartupOnce } from "@/startupMark";
import { createLibraryStore } from "./createLibraryStore";
import { fetchLibraryQuery } from "./fetchLibraryQuery";
import type { QueryFetcher, QueryKey } from "./types";

/**
 * Startup-trace label of the queries the initial Artist view issues, or
 * `undefined` for every other key.
 *
 * @param key - Query key.
 * @returns Label stem used for the `-fetch-start` / `-fetch-end` marks.
 */
const traceLabelOf = (key: QueryKey): string | undefined => {
  if (key === "artists") return "renderer:artists";
  if (key.startsWith("musicsByArtist:")) return "renderer:artist-musics";
  return undefined;
};

/**
 * `fetchLibraryQuery` with the startup marks of the first Artist view
 * queries (`src/main/startupTrace.ts`); later refetches emit nothing and
 * attach nothing. The original promise is returned as is, so the marks add
 * no microtask hop to the store's own settlement.
 *
 * @param key - Query key to resolve.
 * @returns The pending IPC result.
 */
const tracedFetch: QueryFetcher = (key) => {
  const label = traceLabelOf(key);
  const started =
    label !== undefined && markStartupOnce(`${label}-fetch-start`);
  const pending = fetchLibraryQuery(key);
  if (started) {
    const end = (): void => {
      markStartupOnce(`${label}-fetch-end`);
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
