import type { Playlist } from "@mp/ipc";
import { expect, it } from "vitest";
import { PlaylistInfoStore } from "./playlistInfoStore";

const PLAYLIST: Playlist = {
  id: 1,
  kind: "static",
  name: "P",
  sortOrder: 0,
  picturePath: null,
  musicCount: 0,
};

it("opens with the given playlist and notifies subscribers", () => {
  const store = new PlaylistInfoStore();
  let notified = 0;
  store.subscribe(() => {
    notified += 1;
  });

  store.open(PLAYLIST);

  expect(store.getSnapshot()).toBe(PLAYLIST);
  expect(notified).toBe(1);
});

it("close clears the playlist", () => {
  const store = new PlaylistInfoStore();
  store.open(PLAYLIST);
  store.close();
  expect(store.getSnapshot()).toBeNull();
});

it("unsubscribing stops notifications", () => {
  const store = new PlaylistInfoStore();
  let notified = 0;
  const unsubscribe = store.subscribe(() => {
    notified += 1;
  });
  unsubscribe();
  store.open(PLAYLIST);
  expect(notified).toBe(0);
});
