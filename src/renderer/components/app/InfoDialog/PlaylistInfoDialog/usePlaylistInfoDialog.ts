import type { IpcError, Playlist } from "@mp/ipc";
import { useEffect, useState } from "react";
import { messageOf } from "@/features/playlist/playlistCommands/messageOf";
import { setPlaylistPicture } from "@/features/playlist/playlistCommands/setPlaylistPicture";
import { updatePlaylistInfo } from "@/features/playlist/playlistCommands/updatePlaylistInfo";
import { playlistInfoStore } from "@/features/playlist/playlistInfoStore";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { useRulesDraft } from "@/pages/playlists/components/SmartRulesForm/useRulesDraft";
import {
  canApplyPlaylistInfo,
  playlistInfoPatchOf,
} from "./playlistInfoPatchOf";

/**
 * Logic of the playlist info dialog's form
 * (`docs/specs/v1.6/features/playlist-info-dialog.md`): the name, the
 * rules draft (smart playlists; the empty draft when the stored rules are
 * corrupted), the picked file with its object-URL preview, and the apply /
 * close flow. The form mounts per opened playlist, so the state starts from
 * `target` and is dropped when the dialog closes.
 *
 * Apply goes picture first, then name and rules in one `mp:playlist:update`.
 * A failure shows under the form and keeps the dialog open; a picture that
 * was already saved then counts as unchanged on the next Apply.
 *
 * @param target - The playlist as the dialog opened it.
 */
export const usePlaylistInfoDialog = (target: Playlist) => {
  const [name, setName] = useState(target.name);
  const rules = useRulesDraft(
    target.kind === "smart" ? target.rules : undefined,
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<IpcError | null>(null);

  // Revoke a preview when it is replaced and when the form unmounts
  // (Cancel, Esc, backdrop and a successful Apply all unmount it).
  useEffect(() => {
    if (previewUrl === null) {
      return;
    }

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const patch = playlistInfoPatchOf(target, {
    name,
    draft: target.kind === "smart" ? rules.draft : null,
    file,
  });

  /** Keep the picked file, or drop it when the picker was cancelled. */
  const selectFile = (next: File | null): void => {
    setFile(next);
    setPreviewUrl(next !== null ? URL.createObjectURL(next) : null);
    setError(null);
  };

  const changeName = (next: string): void => {
    setName(next);
    setError(null);
  };

  const close = (): void => {
    playlistInfoStore.close();
  };

  const apply = async (): Promise<void> => {
    if (!canApplyPlaylistInfo(patch, name, applying)) {
      return;
    }

    const ref = { id: target.id, kind: target.kind };
    setApplying(true);
    try {
      if (patch.file !== null) {
        const failure = await setPlaylistPicture(ref, patch.file);
        if (failure !== null) {
          setError(failure);
          return;
        }

        // Saved: the next Apply (after a failure below) sends no picture.
        setFile(null);
      }

      if (patch.update !== null) {
        const failure = await updatePlaylistInfo({ ...ref, ...patch.update });
        if (failure !== null) {
          setError(failure);
          return;
        }
      }

      close();
    } catch (reason) {
      // A rejected call (unreadable file, failed invoke) is shown like an
      // IPC failure instead of leaving Apply disabled.
      setError({ name: "Error", message: messageOf(reason) });
    } finally {
      setApplying(false);
    }
  };

  return {
    name,
    setName: changeName,
    /** Rules draft controller for `SmartRulesForm` (smart playlists). */
    rules,
    /** Picture to show: the picked file's preview, else the current one. */
    imageUrl:
      previewUrl ??
      (target.picturePath !== null ? toMediaFileUrl(target.picturePath) : null),
    canApply: canApplyPlaylistInfo(patch, name, applying),
    error,
    selectFile,
    apply,
    close,
  };
};
