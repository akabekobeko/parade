import type { MenuStateSnapshot } from "@mp/ipc";

/**
 * Apply a partial update to the last menu snapshot. Pure: `menuStateSync`
 * uses it to decide whether a `mp:menu:setState` push is due, so the
 * deduplication (snapshots also tick on every `currentTime` update) is
 * testable without IPC.
 *
 * Fields set to `undefined` in `partial` are ignored rather than merged, so
 * a caller forwarding an optional value can never push an incomplete
 * snapshot to Main.
 *
 * @param current - The snapshot last sent to Main.
 * @param partial - The fields that may have changed.
 * @returns The merged snapshot and whether any field actually changed.
 *   When nothing changed, `next` is `current` itself.
 */
export const mergeMenuState = (
  current: MenuStateSnapshot,
  partial: Partial<MenuStateSnapshot>,
): { readonly next: MenuStateSnapshot; readonly changed: boolean } => {
  const keys = Object.keys(partial) as (keyof MenuStateSnapshot)[];
  const changedKeys = keys.filter(
    (key) => partial[key] !== undefined && partial[key] !== current[key],
  );
  if (changedKeys.length === 0) {
    return { next: current, changed: false };
  }

  const next = { ...current };
  for (const key of changedKeys) {
    // Each key is assigned its own type's value; the loop over a union of
    // keys loses that link, hence the cast of the mutable copy.
    (next as Record<keyof MenuStateSnapshot, unknown>)[key] = partial[key];
  }
  return { next, changed: true };
};
