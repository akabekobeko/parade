import { expect, it } from "vitest";
import { PLAYLIST_COLUMNS } from "./constants";
import { resolveVisibleColumns } from "./resolveVisibleColumns";

const idsOf = (visibleIds: readonly string[] | undefined): string[] =>
  resolveVisibleColumns(PLAYLIST_COLUMNS, visibleIds).map(
    (column) => column.id,
  );

it("shows the default columns when nothing is saved", () => {
  expect(idsOf(undefined)).toEqual([
    "ordinal",
    "favorite",
    "title",
    "artist",
    "album",
    "duration",
    "menu",
  ]);
});

it("shows only the pinned columns for an empty list", () => {
  expect(idsOf([])).toEqual(["ordinal", "favorite", "title", "menu"]);
});

it("shows the optional columns in the order of the ids", () => {
  expect(idsOf(["duration", "year", "artist"])).toEqual([
    "ordinal",
    "favorite",
    "title",
    "duration",
    "year",
    "artist",
    "menu",
  ]);
});

it("shows a repeated id once, at its first place", () => {
  expect(idsOf(["year", "artist", "year"])).toEqual([
    "ordinal",
    "favorite",
    "title",
    "year",
    "artist",
    "menu",
  ]);
});

it("drops ids that name no column", () => {
  expect(idsOf(["genre", "unknown", ""])).toEqual([
    "ordinal",
    "favorite",
    "title",
    "genre",
    "menu",
  ]);
});

it("keeps a pinned column in its place even when it is listed", () => {
  expect(idsOf(["menu", "album", "title"])).toEqual([
    "ordinal",
    "favorite",
    "title",
    "album",
    "menu",
  ]);
});

it("keeps the favorite column pinned between the ordinal and the title", () => {
  // Also for a layout saved before the column existed (v1.3) and for a
  // saved list that names it: no migration of `visibleIds` is needed.
  expect(idsOf(["artist"])).toEqual([
    "ordinal",
    "favorite",
    "title",
    "artist",
    "menu",
  ]);
  expect(idsOf(["artist", "favorite"])).toEqual([
    "ordinal",
    "favorite",
    "title",
    "artist",
    "menu",
  ]);
});
