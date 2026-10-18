import type { MenuStateSnapshot } from "@mp/ipc";
import { expect, it } from "vitest";
import { mergeMenuState } from "./mergeMenuState";

const IDLE: MenuStateSnapshot = {
  isPlaying: false,
  hasTrack: false,
  shuffle: false,
  repeat: "off",
};

it("merges a changed field and reports the change", () => {
  const result = mergeMenuState(IDLE, { isPlaying: true, hasTrack: true });
  expect(result.changed).toBe(true);
  expect(result.next).toEqual({ ...IDLE, isPlaying: true, hasTrack: true });
});

it("keeps the other fields of the current snapshot", () => {
  const current = { ...IDLE, shuffle: true, repeat: "all" as const };
  const result = mergeMenuState(current, { hasTrack: true });
  expect(result.next).toEqual({ ...current, hasTrack: true });
});

it("reports no change for the same values and returns the same object", () => {
  const current = { ...IDLE, repeat: "one" as const };
  const result = mergeMenuState(current, { repeat: "one", shuffle: false });
  expect(result.changed).toBe(false);
  expect(result.next).toBe(current);
});

it("reports no change for an empty patch", () => {
  expect(mergeMenuState(IDLE, {}).changed).toBe(false);
});

it("detects a repeat mode change alone", () => {
  const result = mergeMenuState(IDLE, { repeat: "all" });
  expect(result.changed).toBe(true);
  expect(result.next.repeat).toBe("all");
});

it("ignores fields set to undefined instead of merging them", () => {
  const current = { ...IDLE, repeat: "all" as const };
  const result = mergeMenuState(current, { repeat: undefined, hasTrack: true });
  expect(result.changed).toBe(true);
  expect(result.next).toEqual({ ...current, hasTrack: true });
});
