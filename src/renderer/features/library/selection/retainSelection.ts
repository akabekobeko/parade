import { EMPTY_SELECTION, type SelectionState } from "./applySelectionClick";

/**
 * Drop the rows no longer on display from a selection
 * (`docs/specs/v1.4/architecture/favorite-filter.md`): a selected track
 * hidden by the toolbar's filters leaves the selection instead of coming
 * back selected once the filter is lifted, and a Shift range never starts
 * from a hidden anchor. Returns the same instance when nothing changed, so
 * callers can adjust state only on a real change.
 *
 * @param selection - Current selection.
 * @param ids - Row ids on display.
 * @returns The selection restricted to `ids`.
 */
export const retainSelection = (
  selection: SelectionState,
  ids: readonly number[],
): SelectionState => {
  const shown = new Set(ids);
  const selectedIds = [...selection.selectedIds].filter((id) => shown.has(id));
  const anchorId =
    selection.anchorId !== null && shown.has(selection.anchorId)
      ? selection.anchorId
      : null;
  if (
    selectedIds.length === selection.selectedIds.size &&
    anchorId === selection.anchorId
  ) {
    return selection;
  }

  return selectedIds.length === 0 && anchorId === null
    ? EMPTY_SELECTION
    : { selectedIds: new Set(selectedIds), anchorId };
};
