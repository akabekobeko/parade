/**
 * Content toolbar filters, one set per library section: the song-filter
 * text (`docs/specs/v1.0/renderer/routing-layout.md`) and the filter menu's
 * "favorites only" toggle (`docs/specs/v1.4/architecture/favorite-filter.md`).
 *
 * React-free store consumed via `useSyncExternalStore`, shared by the
 * toolbar (controls) and the section views (filtering). Like the album
 * filter, the `draft` text follows every keystroke while `applied` — what
 * the views actually filter with — trails it by a debounce, so the Album
 * view's SQL-backed query does not fire an IPC round-trip per character.
 * The toggle has no debounce: one click settles it, and it never changes
 * in a burst. Session scoped; nothing is persisted.
 */

/** Library sections owning an independent song-filter text. */
export type TrackFilterSection = "artists" | "albums" | "playlists";

/** Filter text per section. */
export type TrackFilterValues = Readonly<Record<TrackFilterSection, string>>;

/** "Favorites only" toggle per section. */
export type FavoriteOnlyValues = Readonly<Record<TrackFilterSection, boolean>>;

/** UI-facing snapshot: the live input values and the views' filter values. */
export type TrackFilterSnapshot = {
  /** What the toolbar inputs display; follows every change immediately. */
  readonly draft: TrackFilterValues;
  /** What the views filter with; trails `draft` by the debounce. */
  readonly applied: TrackFilterValues;
  /** The filter menu's "favorites only" toggle; applied immediately. */
  readonly favoriteOnly: FavoriteOnlyValues;
};

/** Delay between the last keystroke and applying it to the views. */
const APPLY_DELAY_MS = 200;

const EMPTY_VALUES: TrackFilterValues = {
  artists: "",
  albums: "",
  playlists: "",
};

const ALL_OFF: FavoriteOnlyValues = {
  artists: false,
  albums: false,
  playlists: false,
};

/**
 * The store class. Holds the immutable snapshot and debounces
 * draft → applied.
 */
export class TrackFilterStore {
  #snapshot: TrackFilterSnapshot = {
    draft: EMPTY_VALUES,
    applied: EMPTY_VALUES,
    favoriteOnly: ALL_OFF,
  };
  #listeners = new Set<() => void>();
  #applyTimer: ReturnType<typeof setTimeout> | null = null;

  /** Register a snapshot listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the current snapshot. Pure; stable until the next change. */
  readonly getSnapshot = (): TrackFilterSnapshot => this.#snapshot;

  /**
   * Update one section's filter text: the draft immediately, the applied
   * value after the debounce.
   *
   * @param section - Section whose input changed.
   * @param text - The new filter text.
   */
  setText(section: TrackFilterSection, text: string): void {
    this.#setSnapshot({
      ...this.#snapshot,
      draft: { ...this.#snapshot.draft, [section]: text },
    });
    if (this.#applyTimer !== null) {
      clearTimeout(this.#applyTimer);
    }

    this.#applyTimer = setTimeout(() => {
      this.#applyTimer = null;
      this.#setSnapshot({ ...this.#snapshot, applied: this.#snapshot.draft });
    }, APPLY_DELAY_MS);
  }

  /**
   * Switch one section's "favorites only" toggle; the views follow at once.
   * An unchanged value does not notify.
   *
   * @param section - Section whose menu item was toggled.
   * @param value - Whether only favorites are shown.
   */
  setFavoriteOnly(section: TrackFilterSection, value: boolean): void {
    if (this.#snapshot.favoriteOnly[section] === value) {
      return;
    }

    this.#setSnapshot({
      ...this.#snapshot,
      favoriteOnly: { ...this.#snapshot.favoriteOnly, [section]: value },
    });
  }

  #setSnapshot(next: TrackFilterSnapshot): void {
    this.#snapshot = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide song-filter store behind the content toolbar inputs. */
export const trackFilterStore = new TrackFilterStore();
