import type { IpcError, Playlist } from "@mp/ipc";
import { readImageFile } from "@/libs/readImageFile";
import { libraryStore } from "../../library/queryStore/libraryStore";
import { queryKeys } from "../../library/queryStore/queryKeys";
import type { PlaylistRef } from "../types";

/**
 * Apply a user-selected image to a playlist
 * (`docs/specs/v1.6/architecture/ipc.md`): run `mp:playlist:setPicture`,
 * then patch the cached playlist list in place so the sidebar and the
 * header update immediately.
 *
 * Unlike the other playlist commands this does not `invalidate` a loaded
 * list: a refetch would re-evaluate every smart playlist's `musicCount` for
 * a change that only touched one picture. Only a list that is absent or
 * still loading is invalidated instead, since there is nothing to patch and
 * an in-flight response read before the mutation must not land as the
 * newest state. The return shape matches `setArtistPicture` because the
 * dialog shows the error message.
 *
 * @param ref - Target playlist.
 * @param file - Image file picked in the playlist info dialog.
 * @returns `null` on success, the IPC error otherwise.
 */
export const setPlaylistPicture = async (
  ref: PlaylistRef,
  file: File,
): Promise<IpcError | null> => {
  const result = await window.mp.playlist.setPicture({
    id: ref.id,
    kind: ref.kind,
    ...(await readImageFile(file)),
  });
  if (!result.ok) {
    return result.error;
  }

  if (libraryStore.getSnapshot(queryKeys.playlists).status !== "success") {
    libraryStore.invalidate(queryKeys.playlists);
    return null;
  }

  libraryStore.patch<readonly Playlist[]>(queryKeys.playlists, (playlists) =>
    playlists.map((entry) =>
      entry.kind === ref.kind && entry.id === ref.id
        ? { ...entry, picturePath: result.value.picturePath }
        : entry,
    ),
  );
  return null;
};
