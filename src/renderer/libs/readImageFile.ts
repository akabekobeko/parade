/** Image payload shared by `mp:library:setArtistPicture` and `mp:playlist:setPicture`. */
export type ImageFilePayload = {
  /** MIME type reported by the browser for the picked file. */
  readonly mimeType: string;
  /** The file's raw bytes. */
  readonly data: Uint8Array;
};

/**
 * Read a user-picked image file into the request shape the picture channels
 * take (`docs/specs/v1.6/architecture/ipc.md`).
 *
 * @param file - Image file picked in a dialog.
 * @returns MIME type and bytes of the file.
 */
export const readImageFile = async (file: File): Promise<ImageFilePayload> => ({
  mimeType: file.type,
  data: new Uint8Array(await file.arrayBuffer()),
});
