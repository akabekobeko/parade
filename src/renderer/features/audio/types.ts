/**
 * Public surface of the audio engine
 * (`docs/specs/v1.0/renderer/audio-engine.md`).
 *
 * The engine knows exactly one source URL. Queue, next/previous track, and
 * track metadata are PlayerProvider's business; switching tracks means
 * `close()` on the old engine and `createAudioEngine` for the new one.
 */

/** Lifecycle state exposed to the UI. */
export type PlaybackState =
  | "loading"
  | "playing"
  | "paused"
  | "stopped"
  | "error";

/** Error surfaced through the snapshot — never only `console.error`. */
export type PlaybackError = {
  /** Which stage failed: opening the source or playback. */
  readonly kind: "open" | "playback";
  /**
   * Human-readable detail: the thrown `Error.message`, or the media
   * element's error message (falling back to a text naming its code).
   */
  readonly message: string;
};

/**
 * Immutable snapshot of the playback state.
 *
 * Replaced (never mutated) on every observable change so
 * `useSyncExternalStore` re-renders exactly when something changed.
 */
export type PlaybackSnapshot = {
  /**
   * Lifecycle state. A new engine starts in `loading`; `error` is terminal
   * (playback never resumes after a failure). The engine host reports
   * `stopped` while no engine exists.
   */
  readonly state: PlaybackState;
  /** Playback position in seconds. While a seek is in flight: the target. */
  readonly currentTime: number;
  /** Duration in seconds; `0` means not yet known. */
  readonly duration: number;
  /** User volume in `[0, 1]`. */
  readonly volume: number;
  /** Playback rate in `[0.25, 2]` on the 0.05 grid; `1` is the original speed. */
  readonly rate: number;
  /** Whether the pitch is kept while `rate` differs from `1`. */
  readonly preservesPitch: boolean;
  /**
   * A seek is waiting for the media element to land (data may have to be
   * fetched first); the UI shows a spinner / pulse.
   */
  readonly seeking: boolean;
  /** Failure detail while `state` is `error`; `null` otherwise. */
  readonly error: PlaybackError | null;
};

/** Initial values handed to a new engine (what survives across tracks). */
export type AudioEngineOptions = {
  /** Initial volume (`[0, 1]`); defaults to `1`. */
  readonly volume?: number;
  /** Initial playback rate (`[0.25, 2]`); defaults to `1`. */
  readonly rate?: number;
  /** Initial pitch preservation; defaults to `true`. */
  readonly preservesPitch?: boolean;
};

/** Engine handle returned by `createAudioEngine`. */
export type AudioEngine = {
  /**
   * Start or resume playback from the held position. Resolves once the
   * request settled; failures land in `snapshot.error`, never as a
   * rejection. A no-op after `close()` or in `error`.
   */
  readonly play: () => Promise<void>;
  /** Pause, keeping the position. A no-op after `close()` or in `error`. */
  readonly pause: () => void;
  /** Rewind to the start and stop. */
  readonly stop: () => void;
  /**
   * Seek to a position in seconds (negative values clamp to `0`). `seeking`
   * stays on until the media element reports `seeked`; the snapshot shows
   * the target as `currentTime` meanwhile.
   */
  readonly seek: (timeSec: number) => void;
  /** Set the user volume (`[0, 1]`). */
  readonly setVolume: (volume: number) => void;
  /**
   * Set the playback rate (clamped into `[0.25, 2]` and rounded to the
   * 0.05 grid); applies at once, also mid-playback.
   */
  readonly setRate: (rate: number) => void;
  /** Keep (or stop keeping) the pitch while the rate differs from `1`. */
  readonly setPreservesPitch: (enabled: boolean) => void;
  /** Release everything up to `AudioContext.close`; calls become no-ops. */
  readonly close: () => void;
  /** Current snapshot; the same reference until an observable change. */
  readonly getSnapshot: () => PlaybackSnapshot;
  /**
   * Register a change listener; returns the unsubscribe function (a no-op
   * after `close()`).
   */
  readonly subscribe: (listener: () => void) => () => void;
  /** High-frequency spectrum read for rAF consumers; bypasses the snapshot. */
  readonly getSpectrums: () => Uint8Array | null;
};
