import { expect, it } from "vitest";
import { isReorderable } from "./isReorderable";

it("allows reordering a static playlist shown unfiltered in its own order", () => {
  expect(isReorderable("static", false, true)).toBe(true);
});

it("refuses a smart playlist", () => {
  expect(isReorderable("smart", false, true)).toBe(false);
});

it("refuses while a toolbar filter narrows the rows", () => {
  expect(isReorderable("static", true, true)).toBe(false);
});

it("refuses while the rows are sorted", () => {
  expect(isReorderable("static", false, false)).toBe(false);
});
