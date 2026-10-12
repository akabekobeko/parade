import type { IpcError } from "@mp/ipc";
import { useT } from "@/features/i18n/useT";
import { toastStore } from "@/features/toast/toastStore";
import { reportFavoriteFailure } from "./reportFavoriteFailure";

/**
 * `reportFavoriteFailure` bound to the toast and the active locale: the
 * failure toast of a Star click, shared by the track and the album toggles.
 *
 * @returns Function taking the outcome of `setMusicFavorite` / `setAlbumFavorite`.
 */
export const useReportFavoriteFailure = (): ((
  outcome: Promise<IpcError | null>,
) => void) => {
  const t = useT();
  return (outcome) => {
    void reportFavoriteFailure(outcome, (message) => {
      toastStore.show(t("favorite.failed", { message }));
    });
  };
};
