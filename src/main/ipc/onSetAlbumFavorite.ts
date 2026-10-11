import { getDatabase } from "../db/connection";
import { setAlbumFavorite } from "../library/setAlbumFavorite";
import type { IpcResult, SetAlbumFavoriteRequest } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:library:setAlbumFavorite` — flip one album's favorite
 * (`docs/specs/v1.4/architecture/ipc.md`). Like `setMusicFavorite`, no
 * `mp:library:changed` broadcast follows; the Renderer patches its
 * `albumFavorites` cache from the request.
 *
 * @param _ev - Electron event object (unused).
 * @param request - Album identity key and the new flag value.
 * @returns `ok` on success; an error for a malformed key.
 */
export const onSetAlbumFavorite = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: SetAlbumFavoriteRequest,
): Promise<IpcResult<void>> => {
  try {
    setAlbumFavorite(getDatabase(), request.albumKey, request.favorite);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
