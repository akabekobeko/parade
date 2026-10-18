import type { Music, RepeatMode } from "@mp/ipc";

/**
 * Player-domain types (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * The queue and the current track are pure app state: the audio engine
 * instance never appears here (it lives in the engine host, outside React).
 */

/**
 * Repeat mode (PlayerBar cycle button,
 * `docs/specs/v1.5/architecture/repeat-mode.md`). Defined with the IPC
 * types since Main reads it for the Controls menu; re-exported here as the
 * player domain's own name.
 */
export type { RepeatMode } from "@mp/ipc";

/** Which view operation installed the current queue. */
export type QueueSource = "artist" | "album" | "playlist" | "none";

/** Pure player state managed by the reducer. */
export type PlayerState = {
  /** The current queue (playback order; shuffled while `shuffle` is on). */
  readonly queue: readonly Music[];
  /**
   * The same tracks in the view's natural order — the restore target when
   * shuffle turns off. Equals `queue` while shuffle is off.
   */
  readonly orderedQueue: readonly Music[];
  /**
   * Which view operation installed `queue`; `none` before the first
   * playback. The queue popover passes it back to `playMusic` on a jump.
   */
  readonly queueSource: QueueSource;
  /** Currently loaded track; stays on the tail after the queue ends. */
  readonly current: Music | null;
  /** Shuffle mode (PlayerBar toggle); applies to every queue build. */
  readonly shuffle: boolean;
  /**
   * Repeat mode (PlayerBar cycle button); decides what happens at the ends.
   * Survives queue replacements like `shuffle`.
   */
  readonly repeat: RepeatMode;
  // previous / next are derived from queue + current — never stored.
};

/** State before any playback. */
export const INITIAL_PLAYER_STATE: PlayerState = {
  queue: [],
  orderedQueue: [],
  queueSource: "none",
  current: null,
  shuffle: false,
  repeat: "off",
};
