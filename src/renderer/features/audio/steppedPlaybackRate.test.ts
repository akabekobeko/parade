import { expect, it } from "vitest";
import {
  PLAYBACK_RATE_MAX,
  PLAYBACK_RATE_MIN,
} from "../../../shared/constants";
import { steppedPlaybackRate } from "./steppedPlaybackRate";

it("moves one step up or down on the grid", () => {
  expect(steppedPlaybackRate(1, 1)).toBe(1.05);
  expect(steppedPlaybackRate(1, -1)).toBe(0.95);
  expect(steppedPlaybackRate(1.25, 1)).toBe(1.3);
});

it("stops at the range ends", () => {
  expect(steppedPlaybackRate(PLAYBACK_RATE_MAX, 1)).toBe(PLAYBACK_RATE_MAX);
  expect(steppedPlaybackRate(PLAYBACK_RATE_MIN, -1)).toBe(PLAYBACK_RATE_MIN);
  expect(steppedPlaybackRate(1.98, 1)).toBe(PLAYBACK_RATE_MAX);
});

it("steps from a rounded value, leaving no floating point residue", () => {
  expect(steppedPlaybackRate(1.1500000000000001, 1)).toBe(1.2);
  expect(steppedPlaybackRate(1.13, -1)).toBe(1.1);
});
