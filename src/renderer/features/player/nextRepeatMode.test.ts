import { expect, it } from "vitest";
import { nextRepeatMode } from "./nextRepeatMode";

it("steps off to all", () => {
  expect(nextRepeatMode("off")).toBe("all");
});

it("steps all to one", () => {
  expect(nextRepeatMode("all")).toBe("one");
});

it("steps one back to off", () => {
  expect(nextRepeatMode("one")).toBe("off");
});

it("returns to off after three presses", () => {
  expect(nextRepeatMode(nextRepeatMode(nextRepeatMode("off")))).toBe("off");
});
