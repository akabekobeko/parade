import type { PlaybackSnapshot } from "../../audio/types";

/**
 * Build the `setPositionState` payload for a snapshot.
 *
 * The OS media controls extrapolate the position from `playbackRate`
 * between updates, so the actual rate is passed (a fixed `1` would lag
 * behind the real position at 2x).
 *
 * @param snapshot - Engine snapshot.
 * @returns The payload, or `null` while the duration is unknown (the
 *   position state is then cleared).
 */
export const positionStateOf = (
  snapshot: PlaybackSnapshot,
): { duration: number; position: number; playbackRate: number } | null =>
  snapshot.duration > 0
    ? {
        duration: snapshot.duration,
        position: Math.min(
          Math.max(0, snapshot.currentTime),
          snapshot.duration,
        ),
        playbackRate: snapshot.rate,
      }
    : null;
