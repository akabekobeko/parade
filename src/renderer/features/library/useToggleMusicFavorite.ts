import type { Music } from "@mp/ipc";
import { useT } from "@/features/i18n/useT";
import { toastStore } from "@/features/toast/toastStore";
import { setMusicFavorite } from "./setMusicFavorite";

/**
 * The Star click of a track row (`docs/specs/v1.4/features/music-favorite.md`):
 * flip the favorite through `setMusicFavorite`, which patches every cached
 * list and the player's queue, and show a toast when the IPC failed (the
 * rows then simply keep showing the old value). Shared by the Artists /
 * Albums track lists and the Playlist table so the three views report a
 * failure the same way.
 *
 * @returns Handler taking the clicked row's track and the new flag value.
 */
export const useToggleMusicFavorite = (): ((
  music: Music,
  favorite: boolean,
) => void) => {
  const t = useT();
  return (music, favorite) => {
    const report = (message: string): void => {
      toastStore.show(t("favorite.failed", { message }));
    };
    setMusicFavorite(music, favorite).then(
      (error) => {
        if (error !== null) {
          report(error.message);
        }
      },
      // A rejected invoke (bridge not ready, no handler) is a failure too,
      // not an unhandled rejection the user never hears about.
      (reason: unknown) => {
        report(reason instanceof Error ? reason.message : String(reason));
      },
    );
  };
};
