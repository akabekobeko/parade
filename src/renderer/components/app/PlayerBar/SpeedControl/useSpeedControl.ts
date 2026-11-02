import { sliderValueAsNumber } from "@/components/ui/sliderValue";
import { formatPlaybackRate } from "@/features/audio/formatPlaybackRate";
import { steppedPlaybackRate } from "@/features/audio/steppedPlaybackRate";
import {
  isFasterDisabled,
  isPresetSelected,
  isSlowerDisabled,
  percentOfRate,
  rateOfPercent,
  SPEED_PERCENT,
  SPEED_PRESETS,
} from "./speedControlState";

/**
 * Logic of `SpeedControl` (`docs/specs/v1.7/features/speed-control.md`):
 * the integer-percentage slider over the rate, the preset matching, the
 * +/- stepping and their disabled ends. Every way of changing the rate
 * goes through the one `onRateChange`; the decisions themselves are the
 * pure functions of `speedControlState`. Holds no React state, so it is
 * a plain function that tests call directly.
 *
 * @param rate - Current playback rate.
 * @param onRateChange - Called with the new rate on every change.
 */
export const useSpeedControl = (
  rate: number,
  onRateChange: (rate: number) => void,
) => ({
  /** Display text of the current rate (`"1.25x"`). */
  label: formatPlaybackRate(rate),
  /** The rate differs from 1x: the trigger button lights up. */
  active: !isPresetSelected(rate, 1),
  /** The presets with their display text and whether each is current. */
  presets: SPEED_PRESETS.map((preset) => ({
    ...preset,
    selected: isPresetSelected(rate, preset.rate),
  })),
  /** Slider bounds (integer percentages). */
  percentRange: SPEED_PERCENT,
  /** Slider value: the rate as an integer percentage. */
  percent: percentOfRate(rate),
  /** Slider change handler (takes Base UI's single-or-array value). */
  setPercent: (value: number | readonly number[]): void => {
    onRateChange(rateOfPercent(sliderValueAsNumber(value)));
  },
  slowerDisabled: isSlowerDisabled(rate),
  fasterDisabled: isFasterDisabled(rate),
  slower: (): void => {
    onRateChange(steppedPlaybackRate(rate, -1));
  },
  faster: (): void => {
    onRateChange(steppedPlaybackRate(rate, 1));
  },
});
