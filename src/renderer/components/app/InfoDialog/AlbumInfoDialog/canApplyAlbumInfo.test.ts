import { expect, it } from "vitest";
import { canApplyAlbumInfo } from "./canApplyAlbumInfo";

it("is disabled while the value equals its default", () => {
  expect(canApplyAlbumInfo(true, false)).toBe(false);
});

it("is enabled once the value differs from its default", () => {
  expect(canApplyAlbumInfo(false, false)).toBe(true);
});

it("is disabled while an apply runs, changed or not", () => {
  expect(canApplyAlbumInfo(false, true)).toBe(false);
  expect(canApplyAlbumInfo(true, true)).toBe(false);
});
