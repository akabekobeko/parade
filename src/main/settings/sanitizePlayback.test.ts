import { expect, it } from "vitest";
import { sanitizePlayback } from "./sanitizePlayback";

it("keeps a well-formed value", () => {
  expect(
    sanitizePlayback({
      shuffle: true,
      repeat: "all",
      volume: 0.5,
      rate: 1.25,
      preservesPitch: false,
    }),
  ).toEqual({
    shuffle: true,
    repeat: "all",
    volume: 0.5,
    rate: 1.25,
    preservesPitch: false,
  });
});

it("loads a v1.6 file (three fields) with the rate and pitch defaults", () => {
  expect(
    sanitizePlayback({ shuffle: true, repeat: "all", volume: 0.5 }),
  ).toEqual({
    shuffle: true,
    repeat: "all",
    volume: 0.5,
    rate: 1,
    preservesPitch: true,
  });
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
  ).toEqual({
    shuffle: true,
    repeat: "off",
    volume: 0.5,
    rate: 1,
    preservesPitch: true,
  });
});

it("falls back field by field for an empty object", () => {
  expect(sanitizePlayback({})).toEqual({
    shuffle: false,
    repeat: "off",
    volume: 1,
    rate: 1,
    preservesPitch: true,
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

it("clamps a finite rate onto the range and step grid, defaulting the rest to 1", () => {
  expect(sanitizePlayback({ rate: 3 })?.rate).toBe(2);
  expect(sanitizePlayback({ rate: 0.1 })?.rate).toBe(0.25);
  expect(sanitizePlayback({ rate: 1.13 })?.rate).toBe(1.15);
  expect(sanitizePlayback({ rate: 1.1500000000000001 })?.rate).toBe(1.15);
  expect(sanitizePlayback({ rate: 0.75 })?.rate).toBe(0.75);
  expect(sanitizePlayback({ rate: "1.5" })?.rate).toBe(1);
  expect(sanitizePlayback({ rate: Number.NaN })?.rate).toBe(1);
  expect(sanitizePlayback({})?.rate).toBe(1);
});

it("keeps the pitch unless preservesPitch is exactly false", () => {
  expect(sanitizePlayback({ preservesPitch: false })?.preservesPitch).toBe(
    false,
  );
  expect(sanitizePlayback({ preservesPitch: true })?.preservesPitch).toBe(true);
  expect(sanitizePlayback({ preservesPitch: "false" })?.preservesPitch).toBe(
    true,
  );
  expect(sanitizePlayback({ preservesPitch: 0 })?.preservesPitch).toBe(true);
  expect(sanitizePlayback({})?.preservesPitch).toBe(true);
});
