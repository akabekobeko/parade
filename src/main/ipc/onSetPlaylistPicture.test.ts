import { afterEach, beforeEach, expect, it } from "vitest";
import { closeDatabase, getDatabase, openDatabase } from "../db/connection";
import { createPlaylist } from "../playlist/createPlaylist";
import { onSetPlaylistPicture } from "./onSetPlaylistPicture";

const ev = {} as Electron.IpcMainInvokeEvent;
const NOW = "2026-08-10T00:00:00.000Z";

beforeEach(() => {
  openDatabase(":memory:");
  createPlaylist(getDatabase(), { kind: "static", name: "P" }, NOW);
});

afterEach(() => {
  closeDatabase();
});

const pictureCount = (): number =>
  (
    getDatabase().prepare("SELECT COUNT(*) AS n FROM pictures").get() as {
      n: number;
    }
  ).n;

it("rejects an empty image as an IpcResult error", async () => {
  const result = await onSetPlaylistPicture(ev, {
    id: 1,
    kind: "static",
    mimeType: "image/png",
    data: new Uint8Array(),
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.message).toBe("The selected image is empty.");
  }
  expect(pictureCount()).toBe(0);
});

it("rejects an unsupported MIME type as an IpcResult error", async () => {
  const result = await onSetPlaylistPicture(ev, {
    id: 1,
    kind: "static",
    mimeType: "image/svg+xml",
    data: new Uint8Array([1, 2, 3]),
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.message).toBe("Unsupported image type: image/svg+xml");
  }
  expect(pictureCount()).toBe(0);
});

it("rejects an unknown playlist before storing anything", async () => {
  const result = await onSetPlaylistPicture(ev, {
    id: 99,
    kind: "smart",
    mimeType: "image/png",
    data: new Uint8Array([1, 2, 3]),
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.message).toMatch(/not found/i);
  }
  expect(pictureCount()).toBe(0);
});
