import { PictureKind } from "@akabeko/music-metadata-editor";
import { getDatabase } from "../db/connection";
import { deleteArtworkFiles } from "../library/deleteArtworkFiles";
import { setArtistPicture } from "../library/setArtistPicture";
import { storeUserPicture } from "../library/storeUserPicture";
import type {
  IpcResult,
  SetArtistPictureOk,
  SetArtistPictureRequest,
} from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:library:setArtistPicture` — persist a user-selected image
 * into the artwork directory (content-hash dedup) and point the artist's
 * `artist_pictures` row at it. A picture orphaned by the swap is GC'd and
 * its file deleted.
 */
export const onSetArtistPicture = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: SetArtistPictureRequest,
): Promise<IpcResult<SetArtistPictureOk>> => {
  try {
    const db = getDatabase();
    const { picturePath, pictureId } = await storeUserPicture(
      db,
      request,
      PictureKind.Artist,
    );
    const orphaned = setArtistPicture(db, request.artist, pictureId);
    await deleteArtworkFiles(orphaned);
    return { ok: true, value: { picturePath } };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
