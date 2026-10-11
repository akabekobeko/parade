import type { PlaylistColumn } from "@/features/playlistColumns/types";

/** Flex alignment of a cell's or header button's content per column alignment. */
export const COLUMN_JUSTIFY_CLASS_NAMES: Record<
  PlaylistColumn["align"],
  string
> = {
  start: "justify-start",
  end: "justify-end",
  center: "justify-center",
};

/** Text alignment of a cell or a plain header label per column alignment. */
export const COLUMN_TEXT_ALIGN_CLASS_NAMES: Record<
  PlaylistColumn["align"],
  string
> = {
  start: "text-start",
  end: "text-end",
  center: "text-center",
};

/**
 * Height of the table's header row in px. A constant rather than a measured
 * value, so the row virtualisation can offset by the same number.
 */
export const PLAYLIST_TABLE_HEADER_HEIGHT = 32;

/**
 * Horizontal padding of the table's scroll container in px. Leaves room for
 * the playing row's glow, and is subtracted from the container's width to
 * get the width available to the columns.
 */
export const PLAYLIST_TABLE_PADDING_X = 24;

/**
 * `right` offset in px of the sticky menu column (header and cells). A
 * sticky box is held inside the scroll container's padding, so the negative
 * padding brings the column flush with the container's right edge while the
 * table is scrolled sideways: no sliver of the passing cells shows between
 * the column and the edge. At the end of the scroll the row itself holds
 * the column back, at its place in the row.
 */
export const PLAYLIST_TABLE_MENU_STICKY_RIGHT = -PLAYLIST_TABLE_PADDING_X;

/**
 * Vertical padding in px before the first and after the last row, inside
 * the table body. Keeps the first row's glow clear of the fixed header.
 */
export const PLAYLIST_TABLE_PADDING_Y = 8;
