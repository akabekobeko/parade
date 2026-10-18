import { setMenuState } from "../menu/applicationMenu";
import type { MenuStateSnapshot, RepeatMode } from "./types";

/** The repeat modes a snapshot may carry; anything else falls back to off. */
const REPEAT_MODES: readonly RepeatMode[] = ["off", "all", "one"];

/**
 * Channel handler for the `mp:menu:setState` send channel.
 *
 * The payload crosses the IPC boundary unvalidated; every field is coerced
 * (booleans to `true` / `false`, the mode to a known literal) so a malformed
 * snapshot cannot reach `Menu.buildFromTemplate` as `checked` / `enabled`.
 *
 * @param _ev - Electron event object (unused).
 * @param snapshot - Menu-relevant state pushed by the Renderer.
 */
export const onMenuSetState = (
  _ev: Electron.IpcMainEvent,
  snapshot: MenuStateSnapshot,
): void => {
  setMenuState({
    isPlaying: snapshot?.isPlaying === true,
    hasTrack: snapshot?.hasTrack === true,
    shuffle: snapshot?.shuffle === true,
    repeat: REPEAT_MODES.includes(snapshot?.repeat) ? snapshot.repeat : "off",
  });
};
