import type { Music } from "@mp/ipc";
import { indexOf } from "./indexOf";
import type { RepeatMode } from "./types";

/**
 * The track before the current one in the queue
 * (`docs/specs/v1.0/renderer/state-management.md`): previous / next are
 * computed from `queue` + `current` during render or in commands; they are
 * never stored in state.
 *
 * Repeat (`docs/specs/v1.5/architecture/repeat-mode.md`): `all` wraps the
 * head around to the tail. A current track outside the queue (replacement
 * policy) still has no previous under `all`: the queue is entered from its
 * head only. `one` behaves like `off`.
 *
 * @param queue - The current queue.
 * @param current - The current track.
 * @param repeat - Repeat mode; `off` keeps the pre-v1.5 behaviour.
 * @returns The previous track; the queue tail at the head under `all`;
 *   `null` at the head otherwise, outside the queue, or with an empty queue.
 */
export const previousOf = (
  queue: readonly Music[],
  current: Music | null,
  repeat: RepeatMode = "off",
): Music | null => {
  const index = indexOf(queue, current);
  if (index < 0) {
    return null;
  }

  if (index > 0) {
    return queue[index - 1] ?? null;
  }

  return repeat === "all" ? (queue[queue.length - 1] ?? null) : null;
};
