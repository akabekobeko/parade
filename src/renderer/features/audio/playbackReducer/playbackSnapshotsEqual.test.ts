import { expect, it } from "vitest";
import { createInitialPlayback } from "./createInitialPlayback";
import { playbackSnapshotsEqual } from "./playbackSnapshotsEqual";
import { snapshotOfPlayback } from "./snapshotOfPlayback";
import type { InternalPlayback } from "./types";

const initial = (
  overrides: Partial<InternalPlayback> = {},
): InternalPlayback => ({ ...createInitialPlayback(), ...overrides });

it("snapshot equality detects unchanged projections", () => {
  const a = snapshotOfPlayback(initial());
  const b = snapshotOfPlayback(initial());
  expect(playbackSnapshotsEqual(a, b)).toBe(true);
  const c = snapshotOfPlayback(initial({ currentTime: 1, state: "playing" }));
  expect(playbackSnapshotsEqual(a, c)).toBe(false);
});

it("snapshot equality sees rate and pitch changes", () => {
  const a = snapshotOfPlayback(initial());
  expect(
    playbackSnapshotsEqual(a, snapshotOfPlayback(initial({ rate: 1.5 }))),
  ).toBe(false);
  expect(
    playbackSnapshotsEqual(
      a,
      snapshotOfPlayback(initial({ preservesPitch: false })),
    ),
  ).toBe(false);
  expect(
    playbackSnapshotsEqual(
      a,
      snapshotOfPlayback(initial({ rate: 1, preservesPitch: true })),
    ),
  ).toBe(true);
});

it("snapshot projects rate and pitch as they are", () => {
  const snapshot = snapshotOfPlayback(
    initial({ rate: 0.75, preservesPitch: false }),
  );
  expect(snapshot.rate).toBe(0.75);
  expect(snapshot.preservesPitch).toBe(false);
});
