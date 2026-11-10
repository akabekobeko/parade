import type { Artist, LastView, Playlist } from "@mp/ipc";
import { libraryStore } from "@/features/library/queryStore/libraryStore";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import type { FetchState, QueryKey } from "@/features/library/queryStore/types";
import { playlistRouteId } from "@/features/playlist/playlistRouteId";
import { lastViewPath } from "./lastViewPath";
import { lastViewStore } from "./lastViewStore";
import { resolveLastView } from "./resolveLastView";

/**
 * How long the restore waits for the remembered artist's track list before
 * rendering without it. A response applied before the first render puts the
 * Artist view's content into the first commit; one applied after it waits
 * behind the post-commit tasks and costs a second render and a frame. The
 * first render takes about as long as this, so waiting longer would gain
 * nothing over letting the view pick the fetch up.
 */
const TRACKS_DEADLINE_MS = 30;

/**
 * Point the hash router at the remembered view before the first render
 * (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * Runs in the bootstrap, so there is no flash of the default route. A
 * selection whose artist / playlist has since disappeared is dropped and
 * only the section tab is restored. The resolved view also seeds
 * `lastViewStore`, so the Sidebar's tabs know each section's selection. With
 * no remembered view nothing changes and the router's default applies; when
 * the page already has a hash (e.g. a dev reload) the store is seeded but
 * the hash is left alone.
 *
 * The lists needed for the check go through the query store
 * (`libraryStore.prefetch`), so the Sidebar's first render reads them
 * instead of fetching the same data again. For the same reason the
 * remembered artist's track list is prefetched alongside, and awaited up to
 * {@link TRACKS_DEADLINE_MS}; past that the Artist view's own subscribe
 * joins the fetch in flight.
 *
 * The hash is set with `history.replaceState`, not by assigning
 * `location.hash`: an assignment adds a session history entry before any
 * user interaction, which Chromium reports in the DevTools Issues panel.
 * The router does not exist yet, so nothing needs the `hashchange` event.
 *
 * @param view - Persisted view, if any.
 */
export const restoreLastView = async (
  view: LastView | undefined,
): Promise<void> => {
  if (view === undefined) {
    return;
  }

  const tracks =
    view.section === "artists" && view.artist !== undefined
      ? libraryStore.prefetch(queryKeys.musicsByArtist(view.artist))
      : undefined;
  const [artistNames, playlistRouteIds] = await Promise.all([
    artistNamesOf(view),
    playlistRouteIdsOf(view),
  ]);
  const resolved = resolveLastView(view, { artistNames, playlistRouteIds });
  if (tracks !== undefined && resolved.artist !== undefined) {
    await Promise.race([tracks, delay(TRACKS_DEADLINE_MS)]);
  }

  lastViewStore.initialize(resolved);
  if (window.location.hash === "") {
    window.history.replaceState(
      window.history.state,
      "",
      `#${lastViewPath(resolved)}`,
    );
  }
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Prefetch a list for the existence check. A failed fetch is logged and
 * dropped from the cache, so the view that shows the list fetches again
 * and reports its own error; the restore then treats the list as empty.
 *
 * @param key - Query key of the list.
 * @param what - Noun for the log line.
 * @returns The list, or `undefined` when it could not be loaded.
 */
const listOf = async <T>(
  key: QueryKey,
  what: string,
): Promise<T | undefined> => {
  const state: FetchState<T> = await libraryStore.prefetch<T>(key);
  if (state.status === "success") {
    return state.value;
  }

  if (state.status === "error") {
    console.error(`Failed to load ${what} for view restore`, state.error);
  }
  libraryStore.invalidate(key);
  return undefined;
};

/** Artist names only when the view actually needs them. */
const artistNamesOf = async (view: LastView): Promise<ReadonlySet<string>> => {
  if (view.artist === undefined) {
    return new Set();
  }

  const artists = await listOf<readonly Artist[]>(queryKeys.artists, "artists");
  return new Set(artists?.map((artist) => artist.name));
};

/** Playlist route ids only when the view actually needs them. */
const playlistRouteIdsOf = async (
  view: LastView,
): Promise<ReadonlySet<string>> => {
  if (view.playlist === undefined) {
    return new Set();
  }

  const playlists = await listOf<readonly Playlist[]>(
    queryKeys.playlists,
    "playlists",
  );
  return new Set(playlists?.map(playlistRouteId));
};
