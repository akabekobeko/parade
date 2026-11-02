import { expect, it } from "vitest";
import { PLAYBACK_RATE_PRESETS } from "../../../../../shared/constants";
import {
  isFasterDisabled,
  isPresetSelected,
  isSlowerDisabled,
  percentOfRate,
  rateOfPercent,
  SPEED_PERCENT,
  SPEED_PRESETS,
} from "./speedControlState";

it("slider bounds are the rate range as integer percentages", () => {
  expect(SPEED_PERCENT).toEqual({ min: 25, max: 200, step: 5 });
});

it("converts a rate to the slider percentage and back", () => {
  expect(percentOfRate(1)).toBe(100);
  expect(percentOfRate(0.75)).toBe(75);
  expect(percentOfRate(1.1500000000000001)).toBe(115);
  expect(rateOfPercent(100)).toBe(1);
  expect(rateOfPercent(125)).toBe(1.25);
  expect(rateOfPercent(115)).toBe(1.15);
  for (let percent = 25; percent <= 200; percent += 5) {
    expect(percentOfRate(rateOfPercent(percent))).toBe(percent);
  }
});

it("clamps out-of-range slider values into the rate range", () => {
  expect(rateOfPercent(0)).toBe(0.25);
  expect(rateOfPercent(500)).toBe(2);
});

it("selects the preset equal to the rounded rate", () => {
  expect(isPresetSelected(1, 1)).toBe(true);
  expect(isPresetSelected(1.25, 1.25)).toBe(true);
  expect(isPresetSelected(1.2500000000000002, 1.25)).toBe(true);
  expect(isPresetSelected(1.3, 1.25)).toBe(false);
  expect(
    SPEED_PRESETS.filter(({ rate }) => isPresetSelected(1.1, rate)),
  ).toEqual([]);
});

it("lists the shared presets with their display labels", () => {
  expect(SPEED_PRESETS.map(({ rate }) => rate)).toEqual(PLAYBACK_RATE_PRESETS);
  expect(SPEED_PRESETS.map(({ label }) => label)).toEqual([
    "0.5x",
    "0.75x",
    "1x",
    "1.25x",
    "1.5x",
    "2x",
  ]);
});

it("disables the step buttons at the range ends only", () => {
  expect(isSlowerDisabled(0.25)).toBe(true);
  expect(isSlowerDisabled(0.3)).toBe(false);
  expect(isSlowerDisabled(2)).toBe(false);
  expect(isFasterDisabled(2)).toBe(true);
  expect(isFasterDisabled(1.95)).toBe(false);
  expect(isFasterDisabled(0.25)).toBe(false);
});
