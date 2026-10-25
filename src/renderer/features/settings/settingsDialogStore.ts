/**
 * Open / closed state of the settings dialog (toolbar Settings button and
 * `mp:menu:action` → `openSettings`).
 *
 * React-free store consumed via `useSyncExternalStore`, like `aboutStore`.
 * Settings were a `/settings` route until issue #396; a dialog needs no
 * history navigation to get back to the view it was opened from. The
 * dialog component lives in the AppLayout.
 */
export class SettingsDialogStore {
  #open = false;
  #listeners = new Set<() => void>();

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Whether the dialog is open. */
  readonly getSnapshot = (): boolean => this.#open;

  /** Open the dialog (no-op while already open). */
  open(): void {
    this.#set(true);
  }

  /** Close the dialog (no-op while already closed). */
  close(): void {
    this.#set(false);
  }

  #set(open: boolean): void {
    if (this.#open === open) {
      return;
    }

    this.#open = open;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide settings-dialog store. */
export const settingsDialogStore = new SettingsDialogStore();
