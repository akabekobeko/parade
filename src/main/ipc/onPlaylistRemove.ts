import { getDatabase } from "../db/connection";
import { deleteArtworkFiles } from "../library/deleteArtworkFiles";
import { removePlaylist } from "../playlist/removePlaylist";
import type { IpcResult, PlaylistRemoveRequest } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:playlist:remove` — a thin request/response adapter over
 * `removePlaylist`. A picture orphaned by the removal is GC'd there and its
 * file deleted here, after the transaction committed.
 */
export const onPlaylistRemove = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: PlaylistRemoveRequest,
): Promise<IpcResult<void>> => {
  try {
    const orphaned = removePlaylist(getDatabase(), request);
    await deleteArtworkFiles(orphaned);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
