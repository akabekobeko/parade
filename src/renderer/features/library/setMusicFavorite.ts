import type { IpcError, Music } from "@mp/ipc";
import { getActivePlayer } from "@/features/player/playerBridge";
import { libraryStore } from "./queryStore/libraryStore";

/**
 * Turn one track's favorite on or off: run the IPC, then swap the flag into
 * every cached track list and into the player's queue / current track, so
 * every row showing the track updates at once without a refetch
 * (`docs/specs/v1.4/architecture/ipc.md`).
 *
 * No optimistic update: the IPC is a single UPDATE, and not having to roll
 * back keeps this simple. Same shape as `setArtistInitial`.
 *
 * @param music - The track (the row the Star was clicked on).
 * @param favorite - New flag value.
 * @returns `null` on success, the IPC error otherwise (the caller shows a
 *   toast; nothing was changed on this side).
 */
export const setMusicFavorite = async (
  music: Music,
  favorite: boolean,
): Promise<IpcError | null> => {
  const result = await window.mp.library.setMusicFavorite({
    musicId: music.id,
    favorite,
  });
  if (!result.ok) {
    return result.error;
  }

  // Cached lists keep their own copies; patch those rather than inserting
  // the caller's object, and leave lists without the track untouched.
  libraryStore.patchMusics((musics) => {
    let changed = false;
    const next = musics.map((entry) => {
      if (entry.id !== music.id) {
        return entry;
      }

      changed = true;
      return { ...entry, favorite };
    });
    return changed ? next : musics;
  });
  // Null-safe: the bridge is set once PlayerProvider mounts.
  getActivePlayer()?.commands.updateMusics([{ ...music, favorite }]);
  return null;
};
