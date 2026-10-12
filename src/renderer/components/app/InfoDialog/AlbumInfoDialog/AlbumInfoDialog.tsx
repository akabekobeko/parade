import { useRef, useSyncExternalStore } from "react";
import {
  type AlbumInfoState,
  albumInfoStore,
} from "@/features/library/albumInfoStore";
import { AlbumInfoDialogSession } from "./AlbumInfoDialogSession";

/**
 * Album info dialog (album menu → "Album Info"), mounted once in the
 * AppLayout (the menu that started the flow is gone by the time this
 * opens). Reads the album from `albumInfoStore` and mounts one
 * `AlbumInfoDialogSession` per open spell: the session keys its content on
 * the album, so a new album always starts from a fresh form, and a reopen
 * starts a new session so the tab is back on "Details".
 *
 * Unlike `MusicInfoDialog`, the session stays mounted after the store
 * empties, showing the last album with the popup closed, so the popup's
 * exit transition plays (as it did in v1.0).
 */
export const AlbumInfoDialog = () => {
  const state = useSyncExternalStore(
    albumInfoStore.subscribe,
    albumInfoStore.getSnapshot,
  );
  // The album the session shows (kept through the exit transition) and the
  // spell counter that remounts the session on each open; both derived
  // during render so the open frame already shows the new album.
  const shown = useRef<AlbumInfoState | null>(null);
  const spell = useRef(0);
  const wasOpen = useRef(false);
  const open = state !== null;
  if (open !== wasOpen.current) {
    wasOpen.current = open;
    if (open) {
      spell.current += 1;
    }
  }

  if (state !== null) {
    shown.current = state;
  }

  if (shown.current === null) {
    return null;
  }

  return (
    <AlbumInfoDialogSession
      key={spell.current}
      open={open}
      state={shown.current}
    />
  );
};
