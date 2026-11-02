import { clampPlaybackRate } from "../../../../shared/clampPlaybackRate";
import { clampVolume } from "../clampVolume";
import type { AudioEngineOptions } from "../types";
import type { InternalPlayback } from "./types";

/**
 * Build the state an engine starts in (`state: "loading"` from the first
 * synchronous snapshot — the factory never returns a Promise).
 *
 * @param options - Initial values handed over by PlayerProvider; defaults
 *   are volume `1`, rate `1`, pitch preserved.
 * @returns The initial internal state.
 */
export const createInitialPlayback = (
  options: AudioEngineOptions = {},
): InternalPlayback => ({
  state: "loading",
  intendedPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: clampVolume(options.volume ?? 1),
  rate: clampPlaybackRate(options.rate ?? 1),
  preservesPitch: options.preservesPitch ?? true,
  pendingSeekTime: null,
  error: null,
  closed: false,
});
