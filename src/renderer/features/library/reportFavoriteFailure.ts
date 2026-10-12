import type { IpcError } from "@mp/ipc";
import { messageOf } from "@/features/playlist/playlistCommands/messageOf";

/**
 * The failure side of a Star click, shared by the track and the album
 * toggles (`docs/specs/v1.4/architecture/ipc.md`, failure display): an IPC
 * error, or a rejected invoke (bridge not ready, no handler), is reported
 * with its message; the rows and cards then simply keep showing the old
 * value, since nothing was swapped in ahead of the answer. A success is
 * silent.
 *
 * @param outcome - What `setMusicFavorite` / `setAlbumFavorite` returned.
 * @param report - Shows the message (a toast in the views).
 * @returns Settles once the outcome is handled.
 */
export const reportFavoriteFailure = (
  outcome: Promise<IpcError | null>,
  report: (message: string) => void,
): Promise<void> =>
  outcome.then(
    (error) => {
      if (error !== null) {
        report(error.message);
      }
    },
    (reason: unknown) => {
      report(messageOf(reason));
    },
  );
