import type { AppSettings } from "@mp/ipc";

/**
 * Open / closed state and width of the sidebar column
 * (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * React-free store consumed via `useSyncExternalStore`, shared by the
 * sidebar toolbar (the toggle lives there while open), the content toolbar
 * (which hosts the replacement icon cluster while closed) and the AppLayout
 * (which sizes the sidebar panel). Every change is pushed to
 * `AppSettings.sidebar` through the injected saver (Main debounces the disk
 * write), and the bootstrap seeds the store from the loaded settings so the
 * sidebar layout survives a restart.
 */

/** The persisted part of the sidebar state (`AppSettings.sidebar`). */
export type SidebarSettings = NonNullable<AppSettings["sidebar"]>;

/** UI-facing snapshot of the sidebar column. */
export type SidebarSnapshot = {
  /** Whether the sidebar is visible. */
  readonly open: boolean;
  /** Sidebar column width in pixels. */
  readonly width: number;
  /**
   * How many times the sidebar has been shown again in this session (0 for
   * the first showing). Not persisted. `AppLayout` derives the id of the
   * sidebar panel from it so that react-resizable-panels, which remembers the
   * last requested layout per set of panel ids and prefers it over
   * `defaultSize` when the same set mounts again, sizes every reopen from the
   * persisted width instead of a percentage of an earlier window width.
   */
  readonly generation: number;
};

/** Width on first launch — matches the previous fixed `w-56` (14rem). */
export const SIDEBAR_DEFAULT_WIDTH = 224;
/** Resize limits of the sidebar panel, in pixels. */
export const SIDEBAR_MIN_WIDTH = 160;
export const SIDEBAR_MAX_WIDTH = 480;

/** Clamp a persisted / dragged width into the allowed range. */
const clampWidth = (width: number): number =>
  Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));

/**
 * The store class. Holds the immutable snapshot and forwards every change to
 * the injected settings saver.
 */
export class SidebarStore {
  #snapshot: SidebarSnapshot = {
    open: true,
    width: SIDEBAR_DEFAULT_WIDTH,
    generation: 0,
  };
  #listeners = new Set<() => void>();
  #save: (sidebar: SidebarSettings) => void;

  /**
   * @param save - Persists a change (production: `mp:settings:set`).
   */
  constructor(save: (sidebar: SidebarSettings) => void) {
    this.#save = save;
  }

  /** Register a snapshot listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the current snapshot. Pure; stable until the next change. */
  readonly getSnapshot = (): SidebarSnapshot => this.#snapshot;

  /**
   * Seed the store from the persisted settings. Called once in the bootstrap
   * before the first render — no save-back.
   *
   * @param sidebar - `AppSettings.sidebar` (or `undefined` when unset).
   */
  initialize(sidebar: AppSettings["sidebar"]): void {
    if (sidebar === undefined) {
      return;
    }

    this.#snapshot = {
      ...this.#snapshot,
      open: sidebar.open,
      width: clampWidth(sidebar.width),
    };
  }

  /**
   * Flip the sidebar between open and closed, and persist the change. Opening
   * counts as a new showing (see `SidebarSnapshot.generation`).
   */
  toggle(): void {
    const { open, generation } = this.#snapshot;
    this.#setSnapshot({
      ...this.#snapshot,
      open: !open,
      generation: open ? generation : generation + 1,
    });
  }

  /**
   * Record the width after a resize drag, and persist the change.
   *
   * @param width - New sidebar width in pixels (clamped to the limits).
   */
  setWidth(width: number): void {
    const clamped = clampWidth(width);
    if (clamped === this.#snapshot.width) {
      return;
    }

    this.#setSnapshot({ ...this.#snapshot, width: clamped });
  }

  #setSnapshot(next: SidebarSnapshot): void {
    this.#snapshot = next;
    this.#save({ open: next.open, width: next.width });
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide sidebar store, wired to the settings channel. */
export const sidebarStore = new SidebarStore((sidebar) => {
  void window.mp.settings.set({ patch: { sidebar } });
});
