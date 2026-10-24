import type { DatabaseSync } from "node:sqlite";
import type { PictureInfo } from "@akabeko/music-metadata-editor";
import { IMAGE_EXTENSION_BY_MIME } from "../../shared/constants";
import { imagesDirectory } from "../protocol/imagesDirectory";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { saveArtwork } from "./saveArtwork";

/** Image bytes picked by the user, as both picture channels receive them. */
export type UserPicture = {
  /** MIME type of the image (`"image/jpeg"`, `"image/png"`, ...). */
  readonly mimeType: string;
  /** Raw image bytes read from the user-selected file. */
  readonly data: Uint8Array;
};

/** Where {@link storeUserPicture} put the image. */
export type StoredPicture = {
  /** Absolute path of the stored image under `userData/images/`. */
  readonly picturePath: string;
  /** The `pictures` row that points at `picturePath`. */
  readonly pictureId: number;
};

/**
 * Validate a user-selected image, persist it into the artwork directory
 * (content-hash dedup) and resolve its `pictures` row. Shared by
 * `mp:library:setArtistPicture` and `mp:playlist:setPicture`
 * (`docs/specs/v1.6/architecture/ipc.md`) so both accept the same types and
 * report the same errors.
 *
 * The row is inserted outside the caller's transaction: it is referenced
 * right after, and an unreferenced row is collected by the next orphan GC.
 *
 * @param db - The open library connection.
 * @param picture - The picked image.
 * @param kind - Picture kind for `saveArtwork`; the content-hash file name
 *   does not depend on it.
 * @returns Path and row id of the stored image.
 * @throws When the image is empty or its MIME type is not an accepted image type.
 */
export const storeUserPicture = async (
  db: DatabaseSync,
  picture: UserPicture,
  kind: PictureInfo["kind"],
): Promise<StoredPicture> => {
  if (picture.data.byteLength === 0) {
    throw new Error("The selected image is empty.");
  }

  if (IMAGE_EXTENSION_BY_MIME[picture.mimeType.toLowerCase()] === undefined) {
    throw new Error(`Unsupported image type: ${picture.mimeType}`);
  }

  const picturePath = await saveArtwork(imagesDirectory(), {
    mimeType: picture.mimeType,
    kind,
    data: picture.data,
  });
  return { picturePath, pictureId: getOrCreatePictureId(db, picturePath) };
};
