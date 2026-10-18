import { expect, it } from "vitest";
import { sanitizePlayback } from "./sanitizePlayback";

it("keeps a well-formed value", () => {
  expect(
    sanitizePlayback({ shuffle: true, repeat: "all", volume: 0.5 }),
  ).toEqual({ shuffle: true, repeat: "all", volume: 0.5 });
});

it("returns undefined for non-object input", () => {
  expect(sanitizePlayback(undefined)).toBeUndefined();
  expect(sanitizePlayback(null)).toBeUndefined();
  expect(sanitizePlayback("all")).toBeUndefined();
  expect(sanitizePlayback(1)).toBeUndefined();
});

it("keeps the valid fields when one is broken", () => {
  expect(
    sanitizePlayback({ shuffle: true, repeat: "twice", volume: 0.5 }),
  ).toEqual({ shuffle: true, repeat: "off", volume: 0.5 });
});

it("falls back field by field for an empty object", () => {
  expect(sanitizePlayback({})).toEqual({
    shuffle: false,
    repeat: "off",
    volume: 1,
  });
});

it("treats a non-boolean shuffle as off", () => {
  expect(sanitizePlayback({ shuffle: "true" })?.shuffle).toBe(false);
  expect(sanitizePlayback({ shuffle: 1 })?.shuffle).toBe(false);
});

it("accepts every repeat mode and rejects the rest", () => {
  expect(sanitizePlayback({ repeat: "off" })?.repeat).toBe("off");
  expect(sanitizePlayback({ repeat: "all" })?.repeat).toBe("all");
  expect(sanitizePlayback({ repeat: "one" })?.repeat).toBe("one");
  expect(sanitizePlayback({ repeat: "ALL" })?.repeat).toBe("off");
  expect(sanitizePlayback({ repeat: 1 })?.repeat).toBe("off");
});

it("clamps a finite volume into [0, 1] and defaults the rest to 1", () => {
  expect(sanitizePlayback({ volume: 1.5 })?.volume).toBe(1);
  expect(sanitizePlayback({ volume: -0.2 })?.volume).toBe(0);
  expect(sanitizePlayback({ volume: 0 })?.volume).toBe(0);
  expect(sanitizePlayback({ volume: Number.NaN })?.volume).toBe(1);
  expect(sanitizePlayback({ volume: Number.POSITIVE_INFINITY })?.volume).toBe(
    1,
  );
  expect(sanitizePlayback({ volume: "0.5" })?.volume).toBe(1);
});
