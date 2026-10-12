import type { IpcResult } from "@mp/ipc";
import { afterEach, expect, it, vi } from "vitest";
import { applyAlbumFavorite } from "./applyAlbumFavorite";

const ipc = vi.fn<(request: unknown) => Promise<IpcResult<void>>>();

vi.stubGlobal("window", {
  mp: {
    library: {
      setAlbumFavorite: ipc,
      getAlbumFavorites: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
    },
  },
});

afterEach(() => {
  vi.clearAllMocks();
});

const KEY = "Artist\u0000Album";

it("saves the flag and reports success as null", async () => {
  ipc.mockResolvedValueOnce({ ok: true, value: undefined });

  expect(await applyAlbumFavorite(KEY, true)).toBeNull();
  expect(ipc).toHaveBeenCalledWith({ albumKey: KEY, favorite: true });
});

it("hands back the IPC error on failure", async () => {
  const error = { name: "Error", message: "boom" };
  ipc.mockResolvedValueOnce({ ok: false, error });

  expect(await applyAlbumFavorite(KEY, false)).toEqual(error);
});

it("turns a rejected invoke into an error instead of throwing", async () => {
  ipc.mockRejectedValueOnce(new TypeError("no handler"));

  expect(await applyAlbumFavorite(KEY, true)).toEqual({
    name: "TypeError",
    message: "no handler",
  });
});
