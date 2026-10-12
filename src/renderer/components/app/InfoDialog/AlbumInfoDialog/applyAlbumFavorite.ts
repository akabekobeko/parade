import type { IpcError } from "@mp/ipc";
import { toBridgeError } from "@/features/import/importStore/toBridgeError";
import { setAlbumFavorite } from "@/features/library/setAlbumFavorite";

/**
 * The dialog's Apply: save the Favorite through `setAlbumFavorite` (which
 * patches the cached keys so every Star follows) and turn any failure into
 * the error the footer shows. A rejected invoke (bridge not ready, no
 * handler) is a failure like an IPC error, never an unhandled rejection.
 *
 * @param albumKey - Identity key of the album on display.
 * @param favorite - The form's value.
 * @returns `null` on success, the error to show otherwise.
 */
export const applyAlbumFavorite = (
  albumKey: string,
  favorite: boolean,
): Promise<IpcError | null> =>
  setAlbumFavorite(albumKey, favorite).catch(toBridgeError);
