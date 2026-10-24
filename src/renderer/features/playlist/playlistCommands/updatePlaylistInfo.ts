import type { IpcError, PlaylistUpdateRequest } from "@mp/ipc";
import { invalidate } from "./invalidate";

/**
 * Apply a name / rules patch from the playlist info dialog
 * (`docs/specs/v1.6/features/playlist-info-dialog.md`).
 *
 * The same `mp:playlist:update` call as `updatePlaylist`, but it hands the
 * failure back instead of logging it, because the dialog shows the error
 * message and stays open. On success the list is refetched, and the
 * playlist's tracks too when the rules changed (a rename leaves them as they
 * are, so a smart playlist is not re-evaluated for it).
 *
 * @param request - `mp:playlist:update` payload.
 * @returns `null` on success, the IPC error otherwise.
 */
export const updatePlaylistInfo = async (
  request: PlaylistUpdateRequest,
): Promise<IpcError | null> => {
  const result = await window.mp.playlist.update(request);
  if (!result.ok) {
    return result.error;
  }

  invalidate(
    request.rules !== undefined
      ? { id: request.id, kind: request.kind }
      : undefined,
  );
  return null;
};
