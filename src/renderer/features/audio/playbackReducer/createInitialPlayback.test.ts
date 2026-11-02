import { expect, it } from "vitest";
import { createInitialPlayback } from "./createInitialPlayback";

it("starts loading with the given volume clamped", () => {
  expect(createInitialPlayback({ volume: 2 }).volume).toBe(1);
  expect(createInitialPlayback({ volume: -1 }).volume).toBe(0);
  expect(createInitialPlayback({ volume: 0.5 }).state).toBe("loading");
});

it("defaults to volume 1, rate 1 and pitch preserved", () => {
  expect(createInitialPlayback()).toMatchObject({
    volume: 1,
    rate: 1,
    preservesPitch: true,
  });
});

it("takes the given rate clamped and stepped, and the pitch flag as is", () => {
  expect(createInitialPlayback({ rate: 3 }).rate).toBe(2);
  expect(createInitialPlayback({ rate: 1.13 }).rate).toBe(1.15);
  expect(createInitialPlayback({ preservesPitch: false }).preservesPitch).toBe(
    false,
  );
});
