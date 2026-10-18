import type { RepeatMode } from "../types";

/**
 * The repeat mode changed (`setRepeat` / `cycleRepeat`). Only the mode
 * moves: the queue and the current track stay as they are, and playback is
 * not touched (the new mode applies from the next track end or previous /
 * next press).
 */
export type RepeatChangedAction = {
  /** Discriminant. */
  readonly type: "repeatChanged";
  /** Repeat mode after the change. */
  readonly repeat: RepeatMode;
};
