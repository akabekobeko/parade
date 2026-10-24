import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import type { Playlist } from "../ipc/types";
import { countSmartPlaylistMusics } from "./countSmartPlaylistMusics";
import {
  playlistRowSchema,
  smartPlaylistRulesJsonSchema,
  staticPlaylistRowSchema,
} from "./playlistRowSchema";
import {
  SMART_PLAYLIST_SELECT,
  STATIC_PLAYLIST_SELECT,
} from "./playlistSelect";

/** Smart row with the rules still encoded; decoded per row below. */
const smartPlaylistRawRowSchema = playlistRowSchema.extend({
  rules: z.string(),
});

/**
 * List every playlist of both kinds, each ordered by sort order then name.
 * Static playlists come first (`mp:playlist:list`,
 * `docs/specs/v1.0/features/playlist.md`).
 *
 * Each entry carries its picture path and track count
 * (`docs/specs/v1.6/architecture/database.md`): a static playlist's count is
 * a subquery over `playlist_musics`, a smart playlist's count evaluates its
 * rules once per entry.
 *
 * A smart playlist whose stored rules fail to decode is listed without
 * `rules` and with `musicCount: 0` (and logged) rather than failing the
 * whole list: the entry stays visible so the user can remove or re-edit it,
 * while opening it reports the error through `getPlaylistMusics`.
 *
 * @param db - The open library connection.
 * @param now - Evaluation instant of the smart playlists' relative dates.
 * @returns Playlists; smart entries carry their parsed rules.
 */
export const listPlaylists = (
  db: DatabaseSync,
  now: Date = new Date(),
): Playlist[] => {
  const statics = staticPlaylistRowSchema
    .array()
    .parse(
      db
        .prepare(`${STATIC_PLAYLIST_SELECT} ORDER BY x.sort_order, x.name`)
        .all(),
    );
  const smarts = smartPlaylistRawRowSchema
    .array()
    .parse(
      db
        .prepare(`${SMART_PLAYLIST_SELECT} ORDER BY x.sort_order, x.name`)
        .all(),
    );
  return [
    ...statics.map((row): Playlist => ({ ...row, kind: "static" })),
    ...smarts.map(({ rules, ...row }): Playlist => {
      const decoded = smartPlaylistRulesJsonSchema.safeParse(rules);
      if (!decoded.success) {
        // The list still shows the playlist (without rules) so the user can
        // repair or delete it; the zod detail is a development aid.
        if (import.meta.env.DEV) {
          console.warn(
            `[playlist] smart playlist #${row.id}: stored rules are corrupted`,
            decoded.error,
          );
        }

        return { ...row, kind: "smart", musicCount: 0 };
      }

      return {
        ...row,
        kind: "smart",
        rules: decoded.data,
        musicCount: countSmartPlaylistMusics(db, decoded.data, now),
      };
    }),
  ];
};
