import type { Music } from "@mp/ipc";
import { setMusicFavorite } from "./setMusicFavorite";
import { useReportFavoriteFailure } from "./useReportFavoriteFailure";

/**
 * The Star click of a track row (`docs/specs/v1.4/features/music-favorite.md`):
 * flip the favorite through `setMusicFavorite`, which patches every cached
 * list and the player's queue, and show a toast when it failed
 * (`useReportFavoriteFailure`). Shared by the Artists / Albums track lists
 * and the Playlist table so the three views report a failure the same way.
 *
 * @returns Handler taking the clicked row's track and the new flag value.
 */
export const useToggleMusicFavorite = (): ((
  music: Music,
  favorite: boolean,
) => void) => {
  const report = useReportFavoriteFailure();
  return (music, favorite) => {
    report(setMusicFavorite(music, favorite));
  };
};
