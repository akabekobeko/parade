import { useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/features/i18n/useT";
import { playlistInfoStore } from "@/features/playlist/playlistInfoStore";
import { playlistRouteId } from "@/features/playlist/playlistRouteId";
import { PlaylistInfoForm } from "./PlaylistInfoForm";

/**
 * Playlist info dialog (sidebar row menu / header menu → "Playlist Info",
 * `docs/specs/v1.6/features/playlist-info-dialog.md`), mounted once in the
 * AppLayout: the menu that started the flow is gone by the time this opens,
 * so the subject comes from `playlistInfoStore`. The form is mounted only
 * while open and keyed by the playlist, so its inputs start from the
 * opened playlist and the native file input resets between sessions.
 */
export const PlaylistInfoDialog = () => {
  const t = useT();
  const target = useSyncExternalStore(
    playlistInfoStore.subscribe,
    playlistInfoStore.getSnapshot,
  );

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          playlistInfoStore.close();
        }
      }}
    >
      {/* No close button in the popup corner, like the song / album / artist
          dialogs: Cancel, Esc and the backdrop close it. */}
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg md:max-w-2xl xl:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle>{t("playlistInfo.title")}</DialogTitle>
        </DialogHeader>
        {target !== null && (
          <PlaylistInfoForm key={playlistRouteId(target)} target={target} />
        )}
      </DialogContent>
    </Dialog>
  );
};
