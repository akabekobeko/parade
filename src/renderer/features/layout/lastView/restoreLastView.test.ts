import { afterEach, expect, it, vi } from "vitest";
import { libraryStore } from "@/features/library/queryStore/libraryStore";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import { restoreLastView } from "./restoreLastView";

afterEach(() => {
  // The store is a module singleton; drop whatever a test left in it (every
  // test lets its fetches settle, so the entries are idle and reclaimed).
  libraryStore.invalidate();
  vi.unstubAllGlobals();
});

/** Stub the parts of `window` the restore touches. */
const stubWindow = (hash: string, mp: Record<string, unknown> = {}) => {
  const replaceState = vi.fn();
  const location = { hash };
  vi.stubGlobal("window", {
    location,
    history: { state: null, replaceState },
    mp,
  });
  return { location, replaceState };
};

const milo = { name: "Milo Ashgrove", musicCount: 1, pictureUrl: null };

it("points the hash at the remembered view without adding a history entry", async () => {
  const { location, replaceState } = stubWindow("");

  await restoreLastView({ section: "albums" });

  // Assigning location.hash would push an entry before any user
  // interaction, which Chromium reports in the DevTools Issues panel.
  expect(replaceState).toHaveBeenCalledWith(null, "", "#/albums");
  expect(location.hash).toBe("");
});

it("leaves an existing hash alone", async () => {
  const { replaceState } = stubWindow("#/playlists");

  await restoreLastView({ section: "albums" });

  expect(replaceState).not.toHaveBeenCalled();
});

it("changes nothing without a remembered view", async () => {
  const { replaceState } = stubWindow("");

  await restoreLastView(undefined);

  expect(replaceState).not.toHaveBeenCalled();
});

it("fetches the artist list it checks through the query store so the Sidebar does not refetch", async () => {
  const getArtists = vi.fn().mockResolvedValue({ ok: true, value: [milo] });
  const getMusicsByArtist = vi.fn().mockResolvedValue({ ok: true, value: [] });
  const { replaceState } = stubWindow("", {
    library: { getArtists, getMusicsByArtist },
  });

  await restoreLastView({ section: "artists", artist: "Milo Ashgrove" });

  expect(getArtists).toHaveBeenCalledTimes(1);
  expect(libraryStore.getSnapshot(queryKeys.artists)).toEqual({
    status: "success",
    value: [milo],
  });
  expect(replaceState).toHaveBeenCalledWith(
    null,
    "",
    "#/artists/name/Milo%20Ashgrove",
  );
});

it("fetches the artist and playlist lists together, not one after the other", async () => {
  let artistsResolved = false;
  const getArtists = vi.fn(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          artistsResolved = true;
          resolve({ ok: true, value: [milo] });
        }, 5);
      }),
  );
  const list = vi.fn(() => {
    expect(artistsResolved).toBe(false);
    return Promise.resolve({ ok: true, value: [] });
  });
  stubWindow("", { library: { getArtists }, playlist: { list } });

  await restoreLastView({
    section: "albums",
    artist: "Milo Ashgrove",
    playlist: "p1",
  });

  expect(list).toHaveBeenCalledTimes(1);
});

it("prefetches the remembered artist's tracks so the first render shows them", async () => {
  const musics = [{ id: 1, title: "Test Tone Serenade" }];
  const getArtists = vi.fn().mockResolvedValue({ ok: true, value: [milo] });
  const getMusicsByArtist = vi
    .fn()
    .mockResolvedValue({ ok: true, value: musics });
  stubWindow("", { library: { getArtists, getMusicsByArtist } });

  await restoreLastView({ section: "artists", artist: "Milo Ashgrove" });

  expect(getMusicsByArtist).toHaveBeenCalledWith({ artist: "Milo Ashgrove" });
  expect(
    libraryStore.getSnapshot(queryKeys.musicsByArtist("Milo Ashgrove")),
  ).toEqual({ status: "success", value: musics });
});

it("renders without the tracks when they take too long, leaving the fetch to the view", async () => {
  vi.useFakeTimers();
  try {
    const getArtists = vi.fn().mockResolvedValue({ ok: true, value: [milo] });
    let resolveTracks: (result: unknown) => void = () => {};
    const getMusicsByArtist = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveTracks = resolve;
        }),
    );
    const { replaceState } = stubWindow("", {
      library: { getArtists, getMusicsByArtist },
    });

    const restored = restoreLastView({
      section: "artists",
      artist: "Milo Ashgrove",
    });
    await vi.advanceTimersByTimeAsync(30);
    await restored;

    expect(replaceState).toHaveBeenCalledTimes(1);
    // The key is in flight in the store, so the view's subscribe joins it.
    expect(
      libraryStore.getSnapshot(queryKeys.musicsByArtist("Milo Ashgrove")),
    ).toEqual({ status: "loading" });
    expect(getMusicsByArtist).toHaveBeenCalledTimes(1);

    // Let the late response land so the entry settles.
    resolveTracks({ ok: true, value: [] });
    await vi.advanceTimersByTimeAsync(0);
    expect(
      libraryStore.getSnapshot(queryKeys.musicsByArtist("Milo Ashgrove")),
    ).toEqual({ status: "success", value: [] });
  } finally {
    vi.useRealTimers();
  }
});

it("does not fetch tracks when another section opens at startup", async () => {
  const getArtists = vi.fn().mockResolvedValue({ ok: true, value: [milo] });
  const getMusicsByArtist = vi.fn();
  stubWindow("", { library: { getArtists, getMusicsByArtist } });

  await restoreLastView({ section: "albums", artist: "Milo Ashgrove" });

  expect(getMusicsByArtist).not.toHaveBeenCalled();
});

it("drops a failed artist list from the cache so the Sidebar fetches and reports it itself", async () => {
  const getArtists = vi.fn().mockResolvedValue({
    ok: false,
    error: { name: "Error", message: "boom" },
  });
  const getMusicsByArtist = vi.fn().mockResolvedValue({ ok: true, value: [] });
  const { replaceState } = stubWindow("", {
    library: { getArtists, getMusicsByArtist },
  });

  await restoreLastView({ section: "artists", artist: "Milo Ashgrove" });

  expect(libraryStore.keys()).not.toContain(queryKeys.artists);
  // The artist could not be confirmed, so the selection is dropped.
  expect(replaceState).toHaveBeenCalledWith(null, "", "#/artists");
});

it("still restores the view when the track list request fails", async () => {
  const getArtists = vi.fn().mockResolvedValue({ ok: true, value: [milo] });
  const getMusicsByArtist = vi.fn().mockRejectedValue(new Error("boom"));
  const { replaceState } = stubWindow("", {
    library: { getArtists, getMusicsByArtist },
  });

  await restoreLastView({ section: "artists", artist: "Milo Ashgrove" });

  expect(replaceState).toHaveBeenCalledWith(
    null,
    "",
    "#/artists/name/Milo%20Ashgrove",
  );
});
