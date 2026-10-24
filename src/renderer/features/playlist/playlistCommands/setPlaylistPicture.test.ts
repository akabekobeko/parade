import type { IpcResult, Playlist, SetPlaylistPictureOk } from "@mp/ipc";
import { afterEach, expect, it, vi } from "vitest";
import { libraryStore } from "../../library/queryStore/libraryStore";
import { queryKeys } from "../../library/queryStore/queryKeys";
import { setPlaylistPicture } from "./setPlaylistPicture";

const playlist = (id: number, kind: Playlist["kind"]): Playlist => ({
  id,
  kind,
  name: `${kind} ${id}`,
  sortOrder: 0,
  picturePath: null,
  musicCount: 0,
});

const PLAYLISTS: readonly Playlist[] = [
  playlist(1, "static"),
  playlist(1, "smart"),
  playlist(2, "static"),
];

const ipc =
  vi.fn<(request: unknown) => Promise<IpcResult<SetPlaylistPictureOk>>>();

vi.stubGlobal("window", {
  mp: {
    playlist: {
      setPicture: ipc,
      list: () => Promise.resolve({ ok: true, value: PLAYLISTS }),
    },
  },
});

const unsubscribers: Array<() => void> = [];

/** Put the playlist list into the cache the way a mounted view would. */
const cachePlaylists = async (): Promise<ReturnType<typeof vi.fn>> => {
  const listener = vi.fn();
  unsubscribers.push(libraryStore.subscribe(queryKeys.playlists, listener));
  await Promise.resolve();
  return listener;
};

const cached = (): readonly Playlist[] =>
  (
    libraryStore.getSnapshot<readonly Playlist[]>(queryKeys.playlists) as {
      value: readonly Playlist[];
    }
  ).value;

afterEach(() => {
  for (const unsubscribe of unsubscribers.splice(0)) {
    unsubscribe();
  }
  libraryStore.invalidate();
  vi.clearAllMocks();
});

const file = new File([new Uint8Array([1, 2, 3])], "cover.png", {
  type: "image/png",
});

it("sends the playlist ref with the file's MIME type and bytes", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: { picturePath: "/i/a.png" } });

  expect(await setPlaylistPicture({ id: 2, kind: "static" }, file)).toBeNull();
  expect(ipc).toHaveBeenCalledWith({
    id: 2,
    kind: "static",
    mimeType: "image/png",
    data: new Uint8Array([1, 2, 3]),
  });
});

it("invalidates the list instead of patching when it is not loaded yet", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: { picturePath: "/i/a.png" } });
  const invalidate = vi.spyOn(libraryStore, "invalidate");

  expect(await setPlaylistPicture({ id: 1, kind: "static" }, file)).toBeNull();

  expect(invalidate).toHaveBeenCalledWith(queryKeys.playlists);
  invalidate.mockRestore();
});

it("patches only the matching (kind, id) entry of the cached list", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: { picturePath: "/i/a.png" } });
  const listener = await cachePlaylists();
  const before = cached();
  const notifiedBefore = listener.mock.calls.length;

  const invalidate = vi.spyOn(libraryStore, "invalidate");

  await setPlaylistPicture({ id: 1, kind: "smart" }, file);

  expect(invalidate).not.toHaveBeenCalled();
  invalidate.mockRestore();
  expect(cached().map((entry) => entry.picturePath)).toEqual([
    null,
    "/i/a.png",
    null,
  ]);
  // Untouched entries keep their instance; subscribers were notified once.
  expect(cached()[0]).toBe(before[0]);
  expect(listener).toHaveBeenCalledTimes(notifiedBefore + 1);
});

it("returns the error and leaves the cache as it is when the IPC fails", async () => {
  const error = { name: "Error", code: "NOT_FOUND", message: "gone" };
  ipc.mockResolvedValueOnce({ ok: false, error });
  await cachePlaylists();
  const before = cached();

  expect(await setPlaylistPicture({ id: 1, kind: "static" }, file)).toEqual(
    error,
  );
  expect(cached()).toBe(before);
});
