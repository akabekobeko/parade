import type { Music } from "@mp/ipc";
import { nextOf } from "./nextOf";
import type { PlayerState } from "./types";

/**
 * What `PlayerProvider` does when the current track ends on its own
 * (`docs/specs/v1.5/architecture/repeat-mode.md`).
 */
export type NaturalEndOutcome =
  /** Start another track (the next one, or the queue head under `all`). */
  | { readonly type: "advance"; readonly music: Music }
  /** Start the current track again from the top (`one`). */
  | { readonly type: "restart" }
  /** Rewind to 0:00 and stop, keeping the current track (`off` at the tail). */
  | { readonly type: "stop" };

/**
 * Decide the follow-up of a natural track end from the player state. Pure:
 * the engine is not involved, so the whole table is unit-testable.
 *
 * `one` always restarts, even when the current track is outside the queue
 * (the queue is a snapshot; the track itself lives in `current`). `off` and
 * `all` advance to `nextOf(queue, current, repeat)` when there is one: under
 * `all` the tail wraps to the head, so a one-track queue advances to itself
 * (not special-cased as a restart). With no next track, which under `all`
 * means an empty queue, playback stops.
 *
 * @param state - The player state at the moment the track ended.
 * @returns The outcome to carry out.
 */
export const naturalEndOutcomeOf = (state: PlayerState): NaturalEndOutcome => {
  if (state.repeat === "one") {
    return { type: "restart" };
  }

  const next = nextOf(state.queue, state.current, state.repeat);
  return next === null ? { type: "stop" } : { type: "advance", music: next };
};
