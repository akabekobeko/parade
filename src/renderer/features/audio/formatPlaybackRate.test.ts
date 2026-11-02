import { expect, it } from "vitest";
import { formatPlaybackRate } from "./formatPlaybackRate";

it("drops trailing zeros and keeps up to 2 decimals", () => {
  expect(formatPlaybackRate(1)).toBe("1x");
  expect(formatPlaybackRate(0.5)).toBe("0.5x");
  expect(formatPlaybackRate(0.75)).toBe("0.75x");
  expect(formatPlaybackRate(1.25)).toBe("1.25x");
  expect(formatPlaybackRate(2)).toBe("2x");
});

it("rounds floating point residue away", () => {
  expect(formatPlaybackRate(1.1500000000000001)).toBe("1.15x");
  expect(formatPlaybackRate(0.30000000000000004)).toBe("0.3x");
});
