import { clampPlaybackRate } from "../../../shared/clampPlaybackRate";
import { PLAYBACK_RATE_STEP } from "../../../shared/constants";

/**
 * One step (`PLAYBACK_RATE_STEP`) up or down from a rate, stopped at the
 * range ends (`docs/specs/v1.7/features/speed-control.md`): the +/-
 * buttons of the speed popover.
 *
 * @param rate - Current playback rate.
 * @param direction - `-1` for slower, `1` for faster.
 * @returns The next rate on the step grid, clamped into the range.
 */
export const steppedPlaybackRate = (rate: number, direction: -1 | 1): number =>
  clampPlaybackRate(clampPlaybackRate(rate) + direction * PLAYBACK_RATE_STEP);
