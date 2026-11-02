import { expect, it } from "vitest";
import { clampPlaybackRate } from "./clampPlaybackRate";
import {
  PLAYBACK_RATE_MAX,
  PLAYBACK_RATE_MIN,
  PLAYBACK_RATE_PRESETS,
} from "./constants";

it("clamps into [MIN, MAX]", () => {
  expect(clampPlaybackRate(0)).toBe(PLAYBACK_RATE_MIN);
  expect(clampPlaybackRate(-3)).toBe(PLAYBACK_RATE_MIN);
  expect(clampPlaybackRate(16)).toBe(PLAYBACK_RATE_MAX);
  expect(clampPlaybackRate(PLAYBACK_RATE_MIN)).toBe(PLAYBACK_RATE_MIN);
  expect(clampPlaybackRate(PLAYBACK_RATE_MAX)).toBe(PLAYBACK_RATE_MAX);
});

it("defaults non-finite values to 1", () => {
  expect(clampPlaybackRate(Number.NaN)).toBe(1);
  expect(clampPlaybackRate(Number.POSITIVE_INFINITY)).toBe(1);
  expect(clampPlaybackRate(Number.NEGATIVE_INFINITY)).toBe(1);
});

it("removes floating point residue from stepped values", () => {
  expect(clampPlaybackRate(1.1500000000000001)).toBe(1.15);
  expect(clampPlaybackRate(0.1 + 0.2 + 0.75)).toBe(1.05);
  expect(clampPlaybackRate(1 + 0.05 + 0.05 + 0.05)).toBe(1.15);
});

it("rounds values between steps onto the step grid", () => {
  expect(clampPlaybackRate(1.13)).toBe(1.15);
  expect(clampPlaybackRate(1.12)).toBe(1.1);
  expect(clampPlaybackRate(0.26)).toBe(0.25);
  expect(clampPlaybackRate(1.99)).toBe(2);
});

it("leaves every preset unchanged", () => {
  for (const preset of PLAYBACK_RATE_PRESETS) {
    expect(clampPlaybackRate(preset)).toBe(preset);
  }
});
