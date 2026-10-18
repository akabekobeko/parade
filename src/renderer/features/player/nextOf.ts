import type { Music } from "@mp/ipc";
import { indexOf } from "./indexOf";
import type { RepeatMode } from "./types";

/**
 * The track after the current one in the queue
 * (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * Replacement policy (`docs/specs/v1.0/features/playlist.md`): when the
 * queue is replaced mid-playback, the playing track continues and the
 * neighbours resolve against the NEW queue. A current track that is not in
 * the queue therefore has no previous (disabled) and the queue head as its
 * next: finishing the track (or pressing next) enters the new queue from
 * the top.
 *
 * Repeat (`docs/specs/v1.5/architecture/repeat-mode.md`): `all` wraps the
 * tail around to the head, so a one-track queue is its own next. `one`
 * behaves like `off` here: pressing next is the wish to leave the track, and
 * the natural-end restart is decided by `naturalEndOutcomeOf` instead.
 *
 * @param queue - The current queue.
 * @param current - The current track.
 * @param repeat - Repeat mode; `off` keeps the pre-v1.5 behaviour.
 * @returns The next track; the queue head when the current track is not in
 *   the queue (replacement policy above) or at the tail under `all`; `null`
 *   at the tail otherwise or when the queue is empty.
 */
export const nextOf = (
  queue: readonly Music[],
  current: Music | null,
  repeat: RepeatMode = "off",
): Music | null => {
  const index = indexOf(queue, current);
  if (index < 0) {
    return queue[0] ?? null;
  }

  const next = queue[index + 1];
  if (next !== undefined) {
    return next;
  }

  return repeat === "all" ? (queue[0] ?? null) : null;
};
