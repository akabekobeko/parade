import { PictureKind } from "@akabeko/music-metadata-editor";
import { getDatabase } from "../db/connection";
import { deleteArtworkFiles } from "../library/deleteArtworkFiles";
import { storeUserPicture } from "../library/storeUserPicture";
import { assertPlaylistExists } from "../playlist/assertPlaylistExists";
import { setPlaylistPicture } from "../playlist/setPlaylistPicture";
import type {
  IpcResult,
  SetPlaylistPictureOk,
  SetPlaylistPictureRequest,
} from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:playlist:setPicture` — persist a user-selected image into
 * the artwork directory (content-hash dedup) and point the playlist's
 * `picture_id` at it, the same steps as `mp:library:setArtistPicture`
 * (`docs/specs/v1.6/architecture/ipc.md`). A picture orphaned by the swap
 * is GC'd and its file deleted after the transaction committed.
 */
export const onSetPlaylistPicture = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: SetPlaylistPictureRequest,
): Promise<IpcResult<SetPlaylistPictureOk>> => {
  try {
    const db = getDatabase();
    // Checked first so a stale id leaves neither a file nor a row behind.
    assertPlaylistExists(db, request.kind, request.id);
    const { picturePath, pictureId } = await storeUserPicture(
      db,
      request,
      PictureKind.Other,
    );
    const orphaned = setPlaylistPicture(
      db,
      { id: request.id, kind: request.kind },
      pictureId,
      new Date().toISOString(),
    );
    await deleteArtworkFiles(orphaned);
    return { ok: true, value: { picturePath } };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
