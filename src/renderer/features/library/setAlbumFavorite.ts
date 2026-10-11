import type { IpcError } from "@mp/ipc";
import { isFavoriteOnlyAlbumsKey } from "./queryStore/isFavoriteOnlyAlbumsKey";
import { libraryStore } from "./queryStore/libraryStore";
import { queryKeys } from "./queryStore/queryKeys";

/**
 * Turn one album's favorite on or off: run the IPC, then add or remove the
 * key in the cached `albumFavorites` list so every subscriber (album cards,
 * artist album headers, the album info dialog) re-renders without a refetch
 * (`docs/specs/v1.4/architecture/ipc.md`).
 *
 * A list still loading is refetched instead of patched: its in-flight
 * response was read before the UPDATE and would show the old flag.
 *
 * Album lists restricted to favorites are the one place membership changes
 * (an album turned off has to leave the grid), so those keys are
 * invalidated; unrestricted lists only change their Star and are left alone.
 *
 * @param albumKey - Identity key (`AlbumSummary.albumKey` / `AlbumGroup.key`).
 * @param favorite - New flag value.
 * @returns `null` on success, the IPC error otherwise.
 */
export const setAlbumFavorite = async (
  albumKey: string,
  favorite: boolean,
): Promise<IpcError | null> => {
  const result = await window.mp.library.setAlbumFavorite({
    albumKey,
    favorite,
  });
  if (!result.ok) {
    return result.error;
  }

  if (libraryStore.getSnapshot(queryKeys.albumFavorites).status === "loading") {
    libraryStore.invalidate(queryKeys.albumFavorites);
  } else {
    libraryStore.patch<readonly string[]>(queryKeys.albumFavorites, (keys) => {
      const has = keys.includes(albumKey);
      if (favorite) {
        return has ? keys : [...keys, albumKey];
      }

      return has ? keys.filter((key) => key !== albumKey) : keys;
    });
  }

  for (const key of libraryStore.keys()) {
    if (isFavoriteOnlyAlbumsKey(key)) {
      libraryStore.invalidate(key);
    }
  }

  return null;
};
