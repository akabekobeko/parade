import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TrackFilterStore } from "./trackFilterStore";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("starts with empty texts and favorites-only off everywhere", () => {
  const store = new TrackFilterStore();
  expect(store.getSnapshot()).toEqual({
    draft: { artists: "", albums: "", playlists: "" },
    applied: { artists: "", albums: "", playlists: "" },
    favoriteOnly: { artists: false, albums: false, playlists: false },
  });
});

it("updates the draft immediately and the applied value after the debounce", () => {
  const store = new TrackFilterStore();
  store.setText("artists", "rain");
  expect(store.getSnapshot().draft.artists).toBe("rain");
  expect(store.getSnapshot().applied.artists).toBe("");
  vi.runAllTimers();
  expect(store.getSnapshot().applied.artists).toBe("rain");
});

it("keeps sections independent", () => {
  const store = new TrackFilterStore();
  store.setText("albums", "love");
  vi.runAllTimers();
  const { draft, applied } = store.getSnapshot();
  expect(draft.artists).toBe("");
  expect(draft.playlists).toBe("");
  expect(applied.albums).toBe("love");
});

it("applies only the latest draft when typing continues", () => {
  const store = new TrackFilterStore();
  store.setText("playlists", "a");
  store.setText("playlists", "ab");
  vi.runAllTimers();
  expect(store.getSnapshot().applied.playlists).toBe("ab");
});

it("notifies listeners on draft and applied changes", () => {
  const store = new TrackFilterStore();
  const listener = vi.fn();
  store.subscribe(listener);
  store.setText("artists", "x");
  expect(listener).toHaveBeenCalledTimes(1);
  vi.runAllTimers();
  expect(listener).toHaveBeenCalledTimes(2);
});

it("switches favorites-only at once, per section, and notifies", () => {
  const store = new TrackFilterStore();
  const listener = vi.fn();
  store.subscribe(listener);

  store.setFavoriteOnly("artists", true);

  expect(store.getSnapshot().favoriteOnly).toEqual({
    artists: true,
    albums: false,
    playlists: false,
  });
  expect(listener).toHaveBeenCalledTimes(1);

  store.setFavoriteOnly("artists", false);
  expect(store.getSnapshot().favoriteOnly.artists).toBe(false);
  expect(listener).toHaveBeenCalledTimes(2);
});

it("does not notify when favorites-only is set to its current value", () => {
  const store = new TrackFilterStore();
  const listener = vi.fn();
  store.subscribe(listener);
  const before = store.getSnapshot();

  store.setFavoriteOnly("albums", false);

  expect(listener).not.toHaveBeenCalled();
  expect(store.getSnapshot()).toBe(before);
});

it("keeps the texts when favorites-only changes and vice versa", () => {
  const store = new TrackFilterStore();
  store.setText("playlists", "rain");
  vi.runAllTimers();
  store.setFavoriteOnly("playlists", true);
  expect(store.getSnapshot().applied.playlists).toBe("rain");

  store.setText("playlists", "");
  vi.runAllTimers();
  expect(store.getSnapshot().favoriteOnly.playlists).toBe(true);
});
