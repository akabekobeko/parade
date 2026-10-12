import type { IpcError } from "@mp/ipc";
import { useForm, useStore } from "@tanstack/react-form";
import { useState } from "react";
import {
  type AlbumInfoTarget,
  albumInfoStore,
} from "@/features/library/albumInfoStore";
import { useAlbumFavorites } from "@/features/library/useAlbumFavorites";
import { applyAlbumFavorite } from "./applyAlbumFavorite";
import { canApplyAlbumInfo } from "./canApplyAlbumInfo";

/** The dialog's form: the one editable item. */
export type AlbumInfoFormValues = {
  readonly favorite: boolean;
};

/**
 * Logic of the album info dialog
 * (`docs/specs/v1.4/features/album-favorite.md`): the Favorite form
 * (TanStack Form, one boolean) and the apply / close flow, written like
 * `useMusicInfoDialog` so a later item slots in without a rewrite. Mounted
 * once per album — the session keys the content on the album — so stepping
 * to a neighbouring album with the header arrows discards an unsaved
 * change with the rest of the state.
 *
 * The initial value comes from the cached `albumFavorites` keys. It is read
 * on every render rather than once: when the dialog opens before the list
 * has loaded, the form starts on "off" and follows the loaded value as soon
 * as it lands (TanStack Form adopts changed default values while the form
 * is untouched), and `isDefaultValue` compares against the right flag. A
 * reload of the list while the dialog is open keeps the last loaded keys
 * (`useAlbumFavorites`), so the value does not flicker.
 *
 * Apply is enabled by `canApplyAlbumInfo`. A successful apply closes the
 * dialog (the cache patch has already updated every Star); a failed one
 * keeps it open with the error for the footer, and Apply can be pressed
 * again. Nothing stops playback: no file is written.
 *
 * @param album - Album on display.
 */
export const useAlbumInfoDialog = (album: AlbumInfoTarget) => {
  const favorites = useAlbumFavorites();
  const form = useForm({
    defaultValues: { favorite: favorites.has(album.key) },
  });
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<IpcError | null>(null);

  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);
  const canApply = canApplyAlbumInfo(isDefaultValue, applying);

  const apply = async (): Promise<void> => {
    if (!canApply) {
      return;
    }

    setApplying(true);
    setError(null);
    const failure = await applyAlbumFavorite(
      album.key,
      form.state.values.favorite,
    );
    setApplying(false);
    if (failure !== null) {
      setError(failure);
      return;
    }

    albumInfoStore.close();
  };

  /** Cancel; refused while an apply runs (the session guards Esc / backdrop). */
  const close = (): void => {
    if (!applying) {
      albumInfoStore.close();
    }
  };

  /**
   * Step to the previous / next album of the list the dialog was opened
   * from (header arrows). The store swaps the album and the session
   * remounts the content, so an unsaved change goes with it. Refused while
   * an apply runs, like closing.
   */
  const showPrevious = (): void => {
    if (!applying) {
      albumInfoStore.previous();
    }
  };

  const showNext = (): void => {
    if (!applying) {
      albumInfoStore.next();
    }
  };

  return {
    form,
    applying,
    canApply,
    error,
    apply,
    close,
    showPrevious,
    showNext,
  };
};
