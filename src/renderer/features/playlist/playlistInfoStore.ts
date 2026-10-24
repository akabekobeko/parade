import type { Playlist } from "@mp/ipc";

/**
 * Pending state of the playlist info flow (sidebar row menu / header menu →
 * "Playlist Info", `docs/specs/v1.6/features/playlist-info-dialog.md`).
 *
 * The menu that starts the flow unmounts when it closes, so the dialog
 * cannot live inside it — the menu item stashes the playlist here and the
 * app-level `PlaylistInfoDialog` (AppLayout) reads it via
 * `useSyncExternalStore`. The subject is the list cache's `Playlist` as it
 * was when the menu item was chosen; a list refetch while the dialog is
 * open does not replace it.
 */
export class PlaylistInfoStore {
  #target: Playlist | null = null;
  #listeners = new Set<() => void>();

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the playlist under edit (`null` = dialog closed). */
  readonly getSnapshot = (): Playlist | null => this.#target;

  /**
   * Open the info dialog for a playlist.
   *
   * @param target - Playlist to edit (a list cache entry).
   */
  open(target: Playlist): void {
    this.#set(target);
  }

  /** Close the dialog (apply and cancel both end the flow). */
  close(): void {
    this.#set(null);
  }

  #set(next: Playlist | null): void {
    this.#target = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide playlist info flow store. */
export const playlistInfoStore = new PlaylistInfoStore();
