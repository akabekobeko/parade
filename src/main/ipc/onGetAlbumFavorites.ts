import { getDatabase } from "../db/connection";
import { getAlbumFavorites } from "../library/getAlbumFavorites";
import type { IpcResult } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:library:getAlbumFavorites` — the identity keys of every
 * favorite album (`docs/specs/v1.4/architecture/ipc.md`). Backs the
 * Renderer's `albumFavorites` query key.
 *
 * @param _ev - Electron event object (unused).
 * @returns The album keys.
 */
export const onGetAlbumFavorites = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<readonly string[]>> => {
  try {
    return { ok: true, value: getAlbumFavorites(getDatabase()) };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
