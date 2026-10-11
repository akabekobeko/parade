import { getDatabase } from "../db/connection";
import { setMusicFavorite } from "../library/setMusicFavorite";
import type { IpcResult, SetMusicFavoriteRequest } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:library:setMusicFavorite` — flip one track's favorite
 * flag (`docs/specs/v1.4/architecture/ipc.md`).
 *
 * Deliberately no `mp:library:changed` broadcast: the flag changes neither
 * grouping nor order, so the Renderer patches its caches from the request
 * instead of refetching every query.
 *
 * @param _ev - Electron event object (unused).
 * @param request - Track id and the new flag value.
 * @returns `ok` on success; `NOT_FOUND` when the id is not in the library.
 */
export const onSetMusicFavorite = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: SetMusicFavoriteRequest,
): Promise<IpcResult<void>> => {
  try {
    setMusicFavorite(getDatabase(), request.musicId, request.favorite);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
