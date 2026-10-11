import type { IpcResult, Music } from "@mp/ipc";
import { afterEach, expect, it, vi } from "vitest";
import type { PlayerCommands } from "@/features/player/PlayerProvider";
import { setActivePlayer } from "@/features/player/playerBridge";
import { libraryStore } from "./queryStore/libraryStore";
import { queryKeys } from "./queryStore/queryKeys";
import { setMusicFavorite } from "./setMusicFavorite";

const music = (id: number, favorite = false): Music =>
  ({ id, title: `Track ${id}`, favorite }) as Music;

const ok = (value: unknown): IpcResult<unknown> => ({ ok: true, value });
const flush = (): Promise<void> => Promise.resolve();

const unsubscribers: Array<() => void> = [];

/** Put one track list into the cache the way a mounted view would. */
const cache = async (key: string, musics: readonly Music[]): Promise<void> => {
  lists.set(key, musics);
  unsubscribers.push(libraryStore.subscribe(key, vi.fn()));
  await flush();
};

const lists = new Map<string, readonly Music[]>();
const ipc = vi.fn<(request: unknown) => Promise<IpcResult<void>>>();
const updateMusics = vi.fn();

vi.stubGlobal("window", {
  mp: {
    library: {
      setMusicFavorite: ipc,
      getMusicsByArtist: ({ artist }: { artist: string }) =>
        Promise.resolve(ok(lists.get(queryKeys.musicsByArtist(artist)))),
      getMusicsByAlbum: ({ albumKey }: { albumKey: string }) =>
        Promise.resolve(ok(lists.get(queryKeys.musicsByAlbum(albumKey)))),
    },
    playlist: {
      getMusics: ({ playlistId }: { playlistId: number }) =>
        Promise.resolve(
          ok(lists.get(queryKeys.musicsByPlaylist(`p${playlistId}`))),
        ),
    },
  },
});

setActivePlayer({
  commands: { updateMusics } as unknown as PlayerCommands,
  getSnapshot: () => {
    throw new Error("unused");
  },
});

afterEach(() => {
  for (const unsubscribe of unsubscribers.splice(0)) {
    unsubscribe();
  }
  libraryStore.invalidate(); // Drops the now idle entries.
  lists.clear();
  vi.clearAllMocks();
});

const cached = (key: string): readonly Music[] =>
  (
    libraryStore.getSnapshot<readonly Music[]>(key) as {
      value: readonly Music[];
    }
  ).value;

it("sends the id and flag over IPC", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });

  expect(await setMusicFavorite(music(1), true)).toBeNull();
  expect(ipc).toHaveBeenCalledWith({ musicId: 1, favorite: true });
});

it("flips the flag in every cached list holding the track", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });
  await cache(queryKeys.musicsByArtist("A"), [music(1), music(2)]);
  await cache(queryKeys.musicsByAlbum("A\u0000B"), [music(2)]);
  await cache(queryKeys.musicsByPlaylist("p1"), [music(2), music(3)]);

  await setMusicFavorite(music(2), true);

  expect(cached(queryKeys.musicsByArtist("A")).map((m) => m.favorite)).toEqual([
    false,
    true,
  ]);
  expect(cached(queryKeys.musicsByAlbum("A\u0000B"))[0]?.favorite).toBe(true);
  expect(
    cached(queryKeys.musicsByPlaylist("p1")).map((m) => m.favorite),
  ).toEqual([true, false]);
});

it("patches the cached copy of the track, not the caller's object", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });
  const cachedCopy = { ...music(1), title: "Cached title" };
  await cache(queryKeys.musicsByArtist("A"), [cachedCopy]);

  await setMusicFavorite({ ...music(1), title: "Stale title" }, true);

  expect(cached(queryKeys.musicsByArtist("A"))[0]).toEqual({
    ...cachedCopy,
    favorite: true,
  });
});

it("leaves lists without the track as they are (same instance)", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });
  const others = [music(5)];
  await cache(queryKeys.musicsByArtist("B"), others);

  await setMusicFavorite(music(1), true);

  expect(cached(queryKeys.musicsByArtist("B"))).toBe(others);
});

it("hands the updated track to the player for the queue and current track", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });

  await setMusicFavorite(music(1), true);

  expect(updateMusics).toHaveBeenCalledWith([music(1, true)]);
});

it("returns the error and changes nothing when the IPC fails", async () => {
  const error = { name: "Error", code: "NOT_FOUND", message: "gone" };
  ipc.mockResolvedValueOnce({ ok: false, error });
  const before = [music(1)];
  await cache(queryKeys.musicsByArtist("A"), before);

  expect(await setMusicFavorite(music(1), true)).toEqual(error);
  expect(cached(queryKeys.musicsByArtist("A"))).toBe(before);
  expect(updateMusics).not.toHaveBeenCalled();
});
