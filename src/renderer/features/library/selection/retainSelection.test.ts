import { expect, it } from "vitest";
import { EMPTY_SELECTION } from "./applySelectionClick";
import { retainSelection } from "./retainSelection";

it("keeps the same instance when every selected row is still shown", () => {
  const selection = { selectedIds: new Set([1, 3]), anchorId: 3 };
  expect(retainSelection(selection, [1, 2, 3])).toBe(selection);
  expect(retainSelection(EMPTY_SELECTION, [1, 2])).toBe(EMPTY_SELECTION);
});

it("drops the hidden rows and keeps the shown anchor", () => {
  const selection = { selectedIds: new Set([1, 2, 3]), anchorId: 1 };
  expect(retainSelection(selection, [1, 3])).toEqual({
    selectedIds: new Set([1, 3]),
    anchorId: 1,
  });
});

it("forgets a hidden anchor so a Shift range cannot start from it", () => {
  const selection = { selectedIds: new Set([1, 2]), anchorId: 2 };
  expect(retainSelection(selection, [1])).toEqual({
    selectedIds: new Set([1]),
    anchorId: null,
  });
});

it("returns the empty selection when nothing selected is shown", () => {
  const selection = { selectedIds: new Set([2]), anchorId: 2 };
  expect(retainSelection(selection, [1, 3])).toBe(EMPTY_SELECTION);
});
