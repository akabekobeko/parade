import type { DatabaseSync } from "node:sqlite";
import { parseAlbumKey } from "../../shared/albumKeyOf";
import { musicSchema } from "../../shared/schemas/musicSchema";
import type { Music } from "../ipc/types";
import { MUSIC_COLUMNS } from "./constants";

/**
 * All tracks of one album in play order (`mp:library:getMusicsByAlbum`).
 *
 * @param db - The open library connection.
 * @param albumKey - Identity key from `AlbumSummary.albumKey`: the display
 *   artist and album name joined with a NUL separator (`getAlbums`).
 * @returns The album's tracks (disc → track order), or an empty list for a
 *   malformed key.
 */
export const getMusicsByAlbum = (
  db: DatabaseSync,
  albumKey: string,
): Music[] => {
  const parts = parseAlbumKey(albumKey);
  if (parts === null) {
    return [];
  }

  return musicSchema.array().parse(
    db
      .prepare(
        `SELECT ${MUSIC_COLUMNS}
         FROM musics m
         LEFT JOIN pictures p ON p.id = m.picture_id
         WHERE COALESCE(NULLIF(m.album_artist, ''), m.artist) = ? AND m.album = ?
         ORDER BY m.disc, m.track, m.title`,
      )
      .all(parts.artist, parts.album),
  );
};
