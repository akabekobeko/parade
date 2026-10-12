import { expect, it } from "vitest";
import { favoriteKeysOf } from "./favoriteKeysOf";

const KEYS = ["Artist\u0000Album"];

it("hands out the loaded list", () => {
  expect(favoriteKeysOf({ status: "success", value: KEYS }, [])).toBe(KEYS);
});

it("keeps the previous list while a load is in flight", () => {
  expect(favoriteKeysOf({ status: "loading" }, KEYS)).toBe(KEYS);
});

it("keeps the previous list when a load failed", () => {
  expect(
    favoriteKeysOf(
      { status: "error", error: { name: "Error", message: "boom" } },
      KEYS,
    ),
  ).toBe(KEYS);
});

it("is empty before the first load", () => {
  expect(favoriteKeysOf({ status: "loading" }, [])).toEqual([]);
});
