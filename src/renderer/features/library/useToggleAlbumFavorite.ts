import { setAlbumFavorite } from "./setAlbumFavorite";
import { useReportFavoriteFailure } from "./useReportFavoriteFailure";

/**
 * The Star click of an album card
 * (`docs/specs/v1.4/features/album-favorite.md`, Albums grid): flip the
 * favorite through `setAlbumFavorite`, which patches the cached key list,
 * and show a toast when it failed (`useReportFavoriteFailure`). The album
 * counterpart of `useToggleMusicFavorite`.
 *
 * @returns Handler taking the album's identity key and the new flag value.
 */
export const useToggleAlbumFavorite = (): ((
  albumKey: string,
  favorite: boolean,
) => void) => {
  const report = useReportFavoriteFailure();
  return (albumKey, favorite) => {
    report(setAlbumFavorite(albumKey, favorite));
  };
};
