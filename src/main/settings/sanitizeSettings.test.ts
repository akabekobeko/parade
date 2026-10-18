import { expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./constants";
import { sanitizeSettings } from "./sanitizeSettings";

it("returns defaults for non-object input", () => {
  expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  expect(sanitizeSettings("broken")).toEqual(DEFAULT_SETTINGS);
  expect(sanitizeSettings(42)).toEqual(DEFAULT_SETTINGS);
});

it("keeps valid persisted fields", () => {
  const settings = sanitizeSettings({
    version: 1,
    window: { x: 10, y: 20, width: 1280, height: 800, maximized: true },
    locale: "ja",
    theme: "dark",
    albumFilter: { text: "abc", genres: ["Rock"], decades: [1990, null] },
    sidebar: { open: false, width: 300 },
    lastView: { section: "artists", artist: "Queen" },
    playlistColumns: { visibleIds: ["artist"], widths: { title: 320 } },
  });
  expect(settings.window).toEqual({
    x: 10,
    y: 20,
    width: 1280,
    height: 800,
    maximized: true,
  });
  expect(settings.locale).toBe("ja");
  expect(settings.theme).toBe("dark");
  expect(settings.albumFilter).toEqual({
    text: "abc",
    genres: ["Rock"],
    decades: [1990, null],
  });
  expect(settings.sidebar).toEqual({ open: false, width: 300 });
  expect(settings.lastView).toEqual({ section: "artists", artist: "Queen" });
  expect(settings.playlistColumns).toEqual({
    visibleIds: ["artist"],
    widths: { title: 320 },
  });
});

it("drops the toolbar-fed album filter fields that are never persisted", () => {
  const settings = sanitizeSettings({
    albumFilter: { text: "abc", musicTitle: "rain", favoriteOnly: true },
  });
  expect(settings.albumFilter).toEqual({ text: "abc" });
});

it("drops invalid fields and falls back to defaults", () => {
  const settings = sanitizeSettings({
    window: { width: "wide", height: Number.NaN, maximized: "yes" },
    locale: "fr",
    theme: "solarized",
    albumFilter: { text: 1, genres: "Rock" },
    sidebar: { open: "yes", width: -10 },
    lastView: { section: "settings" },
    playlistColumns: { visibleIds: "artist", widths: { title: 320 } },
  });
  expect(settings.window).toEqual(DEFAULT_SETTINGS.window);
  expect(settings.locale).toBeUndefined();
  expect(settings.theme).toBeUndefined();
  expect(settings.albumFilter).toBeUndefined();
  expect(settings.sidebar).toBeUndefined();
  expect(settings.lastView).toBeUndefined();
  expect(settings.playlistColumns).toBeUndefined();
});

it("keeps the visible columns when only the widths are broken", () => {
  const settings = sanitizeSettings({
    playlistColumns: { visibleIds: ["artist", 1], widths: ["320"] },
  });
  expect(settings.playlistColumns).toEqual({
    visibleIds: ["artist"],
    widths: {},
  });
});

it("ignores unknown keys instead of persisting them", () => {
  const settings = sanitizeSettings({ __proto__: { polluted: true }, x: 1 });
  expect(settings).toEqual(DEFAULT_SETTINGS);
  expect(
    (settings as unknown as { polluted?: boolean }).polluted,
  ).toBeUndefined();
});

it("keeps a non-empty importDialogPath and drops other values", () => {
  expect(
    sanitizeSettings({ importDialogPath: "/music/albums" }).importDialogPath,
  ).toBe("/music/albums");
  expect(
    sanitizeSettings({ importDialogPath: "" }).importDialogPath,
  ).toBeUndefined();
  expect(
    sanitizeSettings({ importDialogPath: 42 }).importDialogPath,
  ).toBeUndefined();
});

it("keeps a valid playback and repairs its broken fields one by one", () => {
  expect(
    sanitizeSettings({
      version: 1,
      window: {},
      playback: { shuffle: true, repeat: "one", volume: 0.3 },
    }).playback,
  ).toEqual({ shuffle: true, repeat: "one", volume: 0.3 });
  expect(
    sanitizeSettings({
      version: 1,
      window: {},
      playback: { shuffle: true, repeat: "twice", volume: 0.5 },
    }).playback,
  ).toEqual({ shuffle: true, repeat: "off", volume: 0.5 });
});

it("drops a non-object playback", () => {
  expect(
    sanitizeSettings({ version: 1, window: {}, playback: "loud" }).playback,
  ).toBeUndefined();
});
