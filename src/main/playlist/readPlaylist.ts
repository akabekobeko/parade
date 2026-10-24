import type { DatabaseSync } from "node:sqlite";
import type { Playlist } from "../ipc/types";
import { countSmartPlaylistMusics } from "./countSmartPlaylistMusics";
import {
  smartPlaylistRowSchema,
  staticPlaylistRowSchema,
} from "./playlistRowSchema";
import {
  SMART_PLAYLIST_SELECT,
  STATIC_PLAYLIST_SELECT,
} from "./playlistSelect";

/**
 * Read one playlist row back, throwing when the id does not exist.
 *
 * Returns the same shape as `listPlaylists` (picture path and track count),
 * so the results of `createPlaylist` / `updatePlaylist` match the list
 * (`docs/specs/v1.6/architecture/database.md`).
 *
 * @param db - The open library connection.
 * @param kind - Which table to read from.
 * @param id - The playlist id.
 * @param now - Evaluation instant of a smart playlist's relative dates.
 * @returns The playlist.
 */
export const readPlaylist = (
  db: DatabaseSync,
  kind: Playlist["kind"],
  id: number,
  now: Date = new Date(),
): Playlist => {
  if (kind === "static") {
    const row = staticPlaylistRowSchema
      .optional()
      .parse(db.prepare(`${STATIC_PLAYLIST_SELECT} WHERE x.id = ?`).get(id));
    if (row === undefined) {
      throw new Error(`Playlist not found: ${kind} #${id}`);
    }

    return { ...row, kind };
  }

  const row = smartPlaylistRowSchema
    .optional()
    .parse(db.prepare(`${SMART_PLAYLIST_SELECT} WHERE x.id = ?`).get(id));
  if (row === undefined) {
    throw new Error(`Playlist not found: ${kind} #${id}`);
  }

  return {
    ...row,
    kind,
    musicCount: countSmartPlaylistMusics(db, row.rules, now),
  };
};
