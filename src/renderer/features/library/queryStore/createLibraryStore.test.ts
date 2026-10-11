import type { IpcResult, Music } from "@mp/ipc";
import { expect, it, vi } from "vitest";
import { createLibraryStore, isMusicListKey } from "./createLibraryStore";

const music = (id: number, favorite = false): Music =>
  ({ id, title: `Track ${id}`, favorite }) as Music;

/** Fetcher resolving every key with the list the test registered for it. */
const createFetcher = (lists: Record<string, unknown>) =>
  vi.fn(
    (key: string): Promise<IpcResult<unknown>> =>
      Promise.resolve({ ok: true, value: lists[key] }),
  );

const flush = (): Promise<void> => Promise.resolve();

it("recognises the three track-list key families", () => {
  expect(isMusicListKey("musicsByArtist:A")).toBe(true);
  expect(isMusicListKey("musicsByAlbum:A\u0000B")).toBe(true);
  expect(isMusicListKey("musicsByPlaylist:p1")).toBe(true);
  expect(isMusicListKey("artists")).toBe(false);
  expect(isMusicListKey("albums:{}")).toBe(false);
  expect(isMusicListKey("albumFavorites")).toBe(false);
});

it("patchMusics applies the updater to every cached track list only", async () => {
  const store = createLibraryStore(
    createFetcher({
      "musicsByArtist:A": [music(1), music(2)],
      "musicsByAlbum:A\u0000B": [music(2)],
      "musicsByPlaylist:p1": [music(3)],
      artists: [{ name: "A" }],
    }),
  );
  for (const key of [
    "musicsByArtist:A",
    "musicsByAlbum:A\u0000B",
    "musicsByPlaylist:p1",
    "artists",
  ]) {
    store.subscribe(key, vi.fn());
  }
  await flush();

  store.patchMusics((musics) =>
    musics.map((entry) =>
      entry.id === 2 ? { ...entry, favorite: true } : entry,
    ),
  );

  const favorites = (key: string): boolean[] =>
    (
      store.getSnapshot<readonly Music[]>(key) as { value: readonly Music[] }
    ).value.map((entry) => entry.favorite);
  expect(favorites("musicsByArtist:A")).toEqual([false, true]);
  expect(favorites("musicsByAlbum:A\u0000B")).toEqual([true]);
  expect(favorites("musicsByPlaylist:p1")).toEqual([false]);
  expect(store.getSnapshot("artists")).toEqual({
    status: "success",
    value: [{ name: "A" }],
  });
});

it("patchMusics restarts the fetch of a list still loading (stale response)", async () => {
  const pending: Array<(result: IpcResult<unknown>) => void> = [];
  const store = createLibraryStore(
    () => new Promise((resolve) => pending.push(resolve)),
  );
  store.subscribe("musicsByArtist:A", vi.fn());
  expect(pending).toHaveLength(1);

  store.patchMusics(() => [music(9)]);

  // The first response predates the mutation: discarded; the refetch wins.
  expect(pending).toHaveLength(2);
  pending[0]?.({ ok: true, value: [music(1)] });
  await flush();
  expect(store.getSnapshot("musicsByArtist:A")).toEqual({ status: "loading" });
  pending[1]?.({ ok: true, value: [music(1, true)] });
  await flush();
  expect(store.getSnapshot("musicsByArtist:A")).toEqual({
    status: "success",
    value: [music(1, true)],
  });
});

it("patchMusics does not notify a list the updater left untouched", async () => {
  const store = createLibraryStore(
    createFetcher({ "musicsByArtist:A": [music(1)] }),
  );
  const listener = vi.fn();
  store.subscribe("musicsByArtist:A", listener);
  await flush();
  expect(listener).toHaveBeenCalledTimes(1);

  store.patchMusics((musics) => musics);

  expect(listener).toHaveBeenCalledTimes(1);
});
