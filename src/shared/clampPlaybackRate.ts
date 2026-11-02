import {
  PLAYBACK_RATE_MAX,
  PLAYBACK_RATE_MIN,
  PLAYBACK_RATE_STEP,
} from "./constants";

/**
 * Decimal places of the step, so the final rounding lands exactly on the
 * grid whatever the step is (`0.05` -> 2 places).
 */
const STEP_DECIMALS = (String(PLAYBACK_RATE_STEP).split(".")[1] ?? "").length;
const STEP_SCALE = 10 ** STEP_DECIMALS;

/**
 * Clamp a playback rate into `[PLAYBACK_RATE_MIN, PLAYBACK_RATE_MAX]` and
 * round it onto the `PLAYBACK_RATE_STEP` grid
 * (`docs/specs/v1.7/architecture/playback-rate.md`).
 *
 * Lives in `src/shared/` so the Renderer engine and Main's settings
 * sanitizer (Phase 3) use the same rounding: neither the state nor
 * `settings.json` should carry a floating point residue such as
 * `1.1500000000000001` from repeated slider / button steps.
 *
 * @param rate - Raw rate value.
 * @returns The clamped rate on the step grid; `1` for a non-finite input.
 */
export const clampPlaybackRate = (rate: number): number => {
  if (!Number.isFinite(rate)) {
    return 1;
  }

  const clamped = Math.min(
    PLAYBACK_RATE_MAX,
    Math.max(PLAYBACK_RATE_MIN, rate),
  );
  const stepped = Math.round(clamped / PLAYBACK_RATE_STEP) * PLAYBACK_RATE_STEP;
  return Math.round(stepped * STEP_SCALE) / STEP_SCALE;
};
