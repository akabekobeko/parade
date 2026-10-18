import type { MenuStateSnapshot } from "@mp/ipc";
import { expect, it } from "vitest";
import { MenuStateSync } from "./menuStateSync";

const syncWithLog = (): {
  readonly sync: MenuStateSync;
  readonly sent: MenuStateSnapshot[];
} => {
  const sent: MenuStateSnapshot[] = [];
  const sync = new MenuStateSync((snapshot) => sent.push(snapshot));
  return { sync, sent };
};

it("initialize sends a startup snapshot that differs from Main's default", () => {
  const { sync, sent } = syncWithLog();
  sync.initialize({
    isPlaying: false,
    hasTrack: false,
    shuffle: true,
    repeat: "all",
  });
  expect(sent).toEqual([
    { isPlaying: false, hasTrack: false, shuffle: true, repeat: "all" },
  ]);
});

it("initialize sends nothing for the default and nothing twice", () => {
  const { sync, sent } = syncWithLog();
  const initial: MenuStateSnapshot = {
    isPlaying: false,
    hasTrack: false,
    shuffle: false,
    repeat: "one",
  };
  sync.initialize(initial);
  sync.initialize(initial);
  expect(sent).toHaveLength(1);

  const { sync: untouched, sent: none } = syncWithLog();
  untouched.initialize({
    isPlaying: false,
    hasTrack: false,
    shuffle: false,
    repeat: "off",
  });
  expect(none).toEqual([]);
});

it("patch sends the merged snapshot only when a field changed", () => {
  const { sync, sent } = syncWithLog();
  sync.patch({ isPlaying: true, hasTrack: true });
  sync.patch({ isPlaying: true, hasTrack: true });
  sync.patch({ repeat: "all" });
  expect(sent).toEqual([
    { isPlaying: true, hasTrack: true, shuffle: false, repeat: "off" },
    { isPlaying: true, hasTrack: true, shuffle: false, repeat: "all" },
  ]);
});
