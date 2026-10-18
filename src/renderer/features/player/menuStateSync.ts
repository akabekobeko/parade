import type { MenuStateSnapshot } from "@mp/ipc";
import { mergeMenuState } from "./mergeMenuState";

/**
 * Keeps the native application menu's view of the player in sync
 * (`docs/specs/v1.5/features/controls-menu.md`): the one place that sends
 * `mp:menu:setState`. React-free, since both sources live outside React:
 * the engine host subscription (`isPlaying` / `hasTrack`) and the commands
 * that change a mode (`shuffle` / `repeat`).
 *
 * The menu is a copy of the Renderer's state, never the other way round: a
 * failed push is not retried and the state is not rolled back; the next
 * change catches the menu up.
 */
export class MenuStateSync {
  /** Mirrors Main's startup default (`applicationMenu.ts`). */
  #snapshot: MenuStateSnapshot = {
    isPlaying: false,
    hasTrack: false,
    shuffle: false,
    repeat: "off",
  };
  #send: (snapshot: MenuStateSnapshot) => void;

  /**
   * @param send - Pushes a snapshot to Main (production: `mp:menu:setState`).
   */
  constructor(send: (snapshot: MenuStateSnapshot) => void) {
    this.#send = send;
  }

  /**
   * Seed the snapshot with the startup state and send it when it differs
   * from Main's default. Called from the PlayerProvider initialiser, which
   * StrictMode runs twice in development: the second call finds nothing
   * changed and sends nothing. The modes come from the persisted playback
   * settings (`docs/specs/v1.5/architecture/playback-settings.md`).
   *
   * @param initial - The full snapshot at startup.
   */
  initialize(initial: MenuStateSnapshot): void {
    this.patch(initial);
  }

  /**
   * Merge changed fields and send only when something actually changed.
   *
   * @param partial - The fields that may have changed.
   */
  patch(partial: Partial<MenuStateSnapshot>): void {
    const { next, changed } = mergeMenuState(this.#snapshot, partial);
    if (!changed) {
      return;
    }

    this.#snapshot = next;
    this.#send(next);
  }
}

/** The app-wide sync, wired to the menu channel. */
export const menuStateSync = new MenuStateSync((snapshot) => {
  window.mp.menu.setState(snapshot);
});
