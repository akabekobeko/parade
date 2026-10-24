import type { IpcResult, Playlist } from "@mp/ipc";
import { afterEach, expect, it, vi } from "vitest";
import { libraryStore } from "../../library/queryStore/libraryStore";
import { queryKeys } from "../../library/queryStore/queryKeys";
import { updatePlaylistInfo } from "./updatePlaylistInfo";

const ipc = vi.fn<(request: unknown) => Promise<IpcResult<Playlist>>>();

vi.stubGlobal("window", { mp: { playlist: { update: ipc } } });

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it("sends the patch and invalidates only the list for a rename", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: {} as Playlist });
  const invalidate = vi.spyOn(libraryStore, "invalidate");

  const result = await updatePlaylistInfo({
    id: 3,
    kind: "smart",
    name: "N",
  });

  expect(result).toBeNull();
  expect(ipc).toHaveBeenCalledWith({ id: 3, kind: "smart", name: "N" });
  expect(invalidate).toHaveBeenCalledWith(queryKeys.playlists);
  expect(invalidate).not.toHaveBeenCalledWith(queryKeys.musicsByPlaylist("s3"));
});

it("invalidates the playlist's tracks too when the rules changed", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: {} as Playlist });
  const invalidate = vi.spyOn(libraryStore, "invalidate");

  await updatePlaylistInfo({
    id: 3,
    kind: "smart",
    rules: { version: 1, match: "all", conditions: [] },
  });

  expect(invalidate).toHaveBeenCalledWith(queryKeys.playlists);
  expect(invalidate).toHaveBeenCalledWith(queryKeys.musicsByPlaylist("s3"));
});

it("returns the error and invalidates nothing when the IPC fails", async () => {
  const error = { name: "Error", message: "boom" };
  ipc.mockResolvedValueOnce({ ok: false, error });
  const invalidate = vi.spyOn(libraryStore, "invalidate");

  expect(await updatePlaylistInfo({ id: 1, kind: "static", name: "N" })).toBe(
    error,
  );
  expect(invalidate).not.toHaveBeenCalled();
});
