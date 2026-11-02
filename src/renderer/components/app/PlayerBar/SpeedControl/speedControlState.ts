import { formatPlaybackRate } from "@/features/audio/formatPlaybackRate";
import { clampPlaybackRate } from "../../../../../shared/clampPlaybackRate";
import {
  PLAYBACK_RATE_MAX,
  PLAYBACK_RATE_MIN,
  PLAYBACK_RATE_PRESETS,
  PLAYBACK_RATE_STEP,
} from "../../../../../shared/constants";

/**
 * Pure decisions behind `useSpeedControl`
 * (`docs/specs/v1.7/features/speed-control.md`), kept out of the hook so
 * they are unit-testable without a DOM.
 *
 * The slider holds the rate as an integer percentage (`25` to `200`, step
 * `5`): Base UI's `step` on a fractional grid accumulates floating point
 * residue, integers do not.
 */

/** Slider bounds and step as integer percentages. */
export const SPEED_PERCENT = {
  min: Math.round(PLAYBACK_RATE_MIN * 100),
  max: Math.round(PLAYBACK_RATE_MAX * 100),
  step: Math.round(PLAYBACK_RATE_STEP * 100),
} as const;

/**
 * The slider value for a rate.
 *
 * @param rate - Playback rate.
 * @returns The rate as an integer percentage.
 */
export const percentOfRate = (rate: number): number =>
  Math.round(clampPlaybackRate(rate) * 100);

/**
 * The rate for a slider value.
 *
 * @param percent - Integer percentage from the slider.
 * @returns The rate on the step grid, clamped into the range.
 */
export const rateOfPercent = (percent: number): number =>
  clampPlaybackRate(percent / 100);

/**
 * Whether a preset is the current rate (equality of the rounded values, so
 * a slider position between presets selects none).
 *
 * @param rate - Current playback rate.
 * @param preset - One of `PLAYBACK_RATE_PRESETS`.
 * @returns `true` when the preset matches.
 */
export const isPresetSelected = (rate: number, preset: number): boolean =>
  clampPlaybackRate(rate) === clampPlaybackRate(preset);

/**
 * Whether the "slower" button is disabled (the rate sits at the lower end).
 *
 * @param rate - Current playback rate.
 * @returns `true` at `PLAYBACK_RATE_MIN`.
 */
export const isSlowerDisabled = (rate: number): boolean =>
  clampPlaybackRate(rate) <= PLAYBACK_RATE_MIN;

/**
 * Whether the "faster" button is disabled (the rate sits at the upper end).
 *
 * @param rate - Current playback rate.
 * @returns `true` at `PLAYBACK_RATE_MAX`.
 */
export const isFasterDisabled = (rate: number): boolean =>
  clampPlaybackRate(rate) >= PLAYBACK_RATE_MAX;

/**
 * The preset buttons in display order with their labels, computed once:
 * only "which one is selected" changes per render.
 */
export const SPEED_PRESETS: readonly { rate: number; label: string }[] =
  PLAYBACK_RATE_PRESETS.map((rate) => ({
    rate,
    label: formatPlaybackRate(rate),
  }));
