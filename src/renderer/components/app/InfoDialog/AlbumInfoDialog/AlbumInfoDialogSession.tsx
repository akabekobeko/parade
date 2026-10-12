import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  type AlbumInfoState,
  albumInfoStore,
} from "@/features/library/albumInfoStore";
import {
  AlbumInfoDialogContent,
  type AlbumInfoTab,
} from "./AlbumInfoDialogContent";

type Props = {
  /** Whether the popup is open; `false` plays the exit transition. */
  readonly open: boolean;
  /** The album on display and its neighbours. */
  readonly state: AlbumInfoState;
};

/**
 * One open spell of the album info dialog: the `Dialog` root and its popup,
 * which stay mounted while the header arrows step from album to album, so
 * the popup neither re-animates nor loses the open tab. The content inside
 * is keyed on the album: stepping remounts it, discarding an unsaved
 * Favorite change with the rest of its state
 * (`docs/specs/v1.4/features/album-favorite.md`).
 *
 * Whether an apply is running — Esc / backdrop must not close the dialog
 * then — the content reports through `onApplyingChange`.
 */
export const AlbumInfoDialogSession = ({ open, state }: Props) => {
  const [tab, setTab] = useState<AlbumInfoTab>("details");
  const [applying, setApplying] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !applying) {
          albumInfoStore.close();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg md:max-w-2xl xl:max-w-3xl"
      >
        <AlbumInfoDialogContent
          key={state.album.key}
          album={state.album}
          previous={state.previous}
          next={state.next}
          tab={tab}
          onTabChange={setTab}
          onApplyingChange={setApplying}
        />
      </DialogContent>
    </Dialog>
  );
};
