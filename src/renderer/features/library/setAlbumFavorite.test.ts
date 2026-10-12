import type { IpcResult } from "@mp/ipc";
import { afterEach, expect, it, vi } from "vitest";
import { libraryStore } from "./queryStore/libraryStore";
import { queryKeys } from "./queryStore/queryKeys";
import { setAlbumFavorite } from "./setAlbumFavorite";

const ok = (value: unknown): IpcResult<unknown> => ({ ok: true, value });
const flush = (): Promise<void> => Promise.resolve();

const unsubscribers: Array<() => void> = [];
let favorites: readonly string[] = [];
const ipc = vi.fn<(request: unknown) => Promise<IpcResult<void>>>();
const getAlbums = vi.fn(() => Promise.resolve(ok([])));
const getAlbumFavorites = vi.fn(() => Promise.resolve(ok(favorites)));

vi.stubGlobal("window", {
  mp: {
    library: {
      setAlbumFavorite: ipc,
      getAlbumFavorites,
      getAlbums,
    },
  },
});

/** Subscribe a key the way a mounted view would and let its fetch land. */
const subscribe = async (key: string): Promise<void> => {
  unsubscribers.push(libraryStore.subscribe(key, vi.fn()));
  await flush();
};

afterEach(() => {
  for (const unsubscribe of unsubscribers.splice(0)) {
    unsubscribe();
  }
  libraryStore.invalidate(); // Drops the now idle entries.
  favorites = [];
  vi.clearAllMocks();
});

const cachedFavorites = (): readonly string[] =>
  (
    libraryStore.getSnapshot<readonly string[]>(queryKeys.albumFavorites) as {
      value: readonly string[];
    }
  ).value;

const KEY = "Artist\u0000Album";

it("sends the key and flag over IPC", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });

  expect(await setAlbumFavorite(KEY, true)).toBeNull();
  expect(ipc).toHaveBeenCalledWith({ albumKey: KEY, favorite: true });
});

it("adds the key to the cached favorites when turning on", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });
  favorites = ["Other\u0000Album"];
  await subscribe(queryKeys.albumFavorites);

  await setAlbumFavorite(KEY, true);

  expect(cachedFavorites()).toEqual(["Other\u0000Album", KEY]);
});

it("removes the key from the cached favorites when turning off", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });
  favorites = ["Other\u0000Album", KEY];
  await subscribe(queryKeys.albumFavorites);

  await setAlbumFavorite(KEY, false);

  expect(cachedFavorites()).toEqual(["Other\u0000Album"]);
});

it("keeps the cached list as it is when the flag already matches", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });
  favorites = [KEY];
  await subscribe(queryKeys.albumFavorites);
  const before = cachedFavorites();

  await setAlbumFavorite(KEY, true);

  expect(cachedFavorites()).toBe(before);
});

it("refetches album lists restricted to favorites and no other", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });
  const restricted = `albums:${JSON.stringify({ favoriteOnly: true })}`;
  await subscribe(restricted);
  await subscribe("albums:{}");
  expect(getAlbums).toHaveBeenCalledTimes(2);

  await setAlbumFavorite(KEY, false);

  // Exactly one refetch, and it is the restricted list's.
  expect(getAlbums).toHaveBeenCalledTimes(3);
  expect(getAlbums).toHaveBeenLastCalledWith({ favoriteOnly: true });
});

it("returns the error and changes nothing when the IPC fails", async () => {
  const error = { name: "Error", message: "boom" };
  ipc.mockResolvedValueOnce({ ok: false, error });
  favorites = [];
  await subscribe(queryKeys.albumFavorites);
  const before = cachedFavorites();

  expect(await setAlbumFavorite(KEY, true)).toEqual(error);
  expect(cachedFavorites()).toBe(before);
});

it("refetches the favorites when their first fetch is still in flight", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });
  const deferred: { resolve?: (value: IpcResult<unknown>) => void } = {};
  getAlbumFavorites.mockImplementationOnce(
    () =>
      new Promise<IpcResult<unknown>>((resolve) => {
        deferred.resolve = resolve;
      }),
  );
  unsubscribers.push(libraryStore.subscribe(queryKeys.albumFavorites, vi.fn()));
  expect(getAlbumFavorites).toHaveBeenCalledTimes(1);

  favorites = [KEY]; // What the DB holds after the IPC.
  await setAlbumFavorite(KEY, true);

  // The pre-mutation response is discarded; the refetch shows the new flag.
  expect(getAlbumFavorites).toHaveBeenCalledTimes(2);
  deferred.resolve?.(ok([]));
  await flush();
  expect(cachedFavorites()).toEqual([KEY]);
});

it("refetches the favorites when their load had failed", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });
  getAlbumFavorites.mockResolvedValueOnce({
    ok: false,
    error: { name: "Error", message: "boom" },
  });
  await subscribe(queryKeys.albumFavorites);
  expect(libraryStore.getSnapshot(queryKeys.albumFavorites).status).toBe(
    "error",
  );

  favorites = [KEY]; // What the DB holds after the IPC.
  await setAlbumFavorite(KEY, true);
  await flush();

  // Nothing to patch: the refetch brings the list back with the new flag.
  expect(getAlbumFavorites).toHaveBeenCalledTimes(2);
  expect(cachedFavorites()).toEqual([KEY]);
});
