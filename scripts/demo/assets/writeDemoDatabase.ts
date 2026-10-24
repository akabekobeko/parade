import { readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { smartPlaylistRulesSchema } from "../../../src/shared/schemas/smartPlaylistRulesSchema.ts";
import type { DemoLibrary, DemoPictureAlbum } from "./types.ts";

/** Timestamp of the playlist rows. */
const PLAYLIST_TIMESTAMP = "2026-10-01T09:00:00.000Z";

/** Inputs of {@link writeDemoDatabase}. */
type Params = {
  /** Library to store. */
  readonly library: DemoLibrary;
  /** Destination path of the database file; replaced when it exists. */
  readonly dbPath: string;
  /** Directory of the app's migration scripts (`src/main/db/migrations`). */
  readonly migrationsDir: string;
  /**
   * Absolute path of the demo directory that holds the pictures and the
   * audio file. The stored paths point into it.
   */
  readonly demoDir: string;
};

/**
 * Write the demo library into a fresh SQLite database.
 *
 * The schema comes from the app's own migration scripts, applied the way
 * the app's migration runner does, so the file is exactly what the app
 * would have created. The scripts are taken from the directory in name
 * order because the app's ordered list is built from Vite raw imports and
 * cannot be loaded here; `writeDemoDatabase.test.ts` checks that both
 * agree. The app expects absolute paths in the platform's notation, so the
 * paths of the library, which are relative to the demo directory, are
 * stored resolved against `demoDir`. A playlist picture references the
 * `pictures` row of an album cover (`docs/specs/v1.6/architecture/database.md`).
 *
 * @param params - See {@link Params}.
 * @returns void.
 */
export const writeDemoDatabase = ({
  library,
  dbPath,
  migrationsDir,
  demoDir,
}: Params): void => {
  const toAbsolute = (relativePath: string): string =>
    path.join(demoDir, ...relativePath.split("/"));

  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    rmSync(`${dbPath}${suffix}`, { force: true });
  }

  const migrations = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const db = new DatabaseSync(dbPath);
  try {
    // A single self-contained file without WAL side files.
    db.exec("PRAGMA journal_mode = DELETE");
    db.exec("PRAGMA foreign_keys = ON");
    for (const [index, name] of migrations.entries()) {
      db.exec("BEGIN");
      db.exec(readFileSync(path.join(migrationsDir, name), "utf-8"));
      db.exec(`PRAGMA user_version = ${index + 1}`);
      db.exec("COMMIT");
    }

    db.exec("BEGIN");
    const insertPicture = db.prepare(
      "INSERT INTO pictures (file_path) VALUES (?)",
    );
    const insertMusic = db.prepare(
      `INSERT INTO musics (
         file_path, audio_format, title, artist, album_artist, album, disc,
         track, year, genre, composer, lyricist, producer, conductor,
         publisher, duration_ms, bpm, rating, picture_id, added_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertArtistPicture = db.prepare(
      "INSERT INTO artist_pictures (artist, picture_id) VALUES (?, ?)",
    );

    // `musics.id` per track, to resolve the playlist entries below.
    const musicIds = new Map<string, number | bigint>();
    // `pictures.id` per album cover, to resolve the playlist pictures below.
    const coverPictureIds = new Map<string, number | bigint>();
    const coverKey = (album: DemoPictureAlbum): string =>
      `${album.artist}\u0000${album.title}`;
    const pictureIdOf = (
      album: DemoPictureAlbum | undefined,
    ): number | bigint | null => {
      if (album === undefined) {
        return null;
      }

      const pictureId = coverPictureIds.get(coverKey(album));
      if (pictureId === undefined) {
        throw new Error(
          `Playlist picture album is not in the library: ${album.artist} - ${album.title}`,
        );
      }

      return pictureId;
    };
    for (const artist of library.artists) {
      for (const album of artist.albums) {
        const pictureId = insertPicture.run(
          toAbsolute(album.coverPath),
        ).lastInsertRowid;
        coverPictureIds.set(
          coverKey({ artist: album.artist, title: album.title }),
          pictureId,
        );
        for (const track of album.tracks) {
          const { lastInsertRowid } = insertMusic.run(
            toAbsolute(track.filePath),
            track.audioFormat,
            track.title,
            track.artist,
            track.albumArtist,
            track.album,
            track.disc,
            track.track,
            track.year,
            track.genre,
            track.composer,
            track.lyricist,
            track.producer,
            track.conductor,
            track.publisher,
            track.durationMs,
            track.bpm,
            track.rating,
            pictureId,
            track.addedAt,
            track.addedAt,
          );
          musicIds.set(track.filePath, lastInsertRowid);
        }
      }

      insertArtistPicture.run(
        artist.name,
        insertPicture.run(toAbsolute(artist.picturePath)).lastInsertRowid,
      );
    }

    const insertPlaylist = db.prepare(
      "INSERT INTO playlists (name, sort_order, picture_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    );
    const insertPlaylistMusic = db.prepare(
      "INSERT INTO playlist_musics (playlist_id, position, music_id) VALUES (?, ?, ?)",
    );
    for (const [order, playlist] of library.playlists.entries()) {
      const playlistId = insertPlaylist.run(
        playlist.name,
        order,
        pictureIdOf(playlist.pictureAlbum),
        PLAYLIST_TIMESTAMP,
        PLAYLIST_TIMESTAMP,
      ).lastInsertRowid;
      for (const [position, track] of playlist.tracks.entries()) {
        const musicId = musicIds.get(track.filePath);
        if (musicId === undefined) {
          throw new Error(
            `Playlist track is not in the library: ${track.filePath}`,
          );
        }

        insertPlaylistMusic.run(playlistId, position, musicId);
      }
    }

    const insertSmartPlaylist = db.prepare(
      "INSERT INTO smart_playlists (name, rules, sort_order, picture_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const [order, playlist] of library.smartPlaylists.entries()) {
      insertSmartPlaylist.run(
        playlist.name,
        // Parsed with the app's schema so a rule the app would reject fails
        // here instead of at demo time.
        JSON.stringify(smartPlaylistRulesSchema.parse(playlist.rules)),
        order,
        pictureIdOf(playlist.pictureAlbum),
        PLAYLIST_TIMESTAMP,
        PLAYLIST_TIMESTAMP,
      );
    }

    db.exec("COMMIT");
    db.exec("VACUUM");
  } catch (error) {
    // The previous file is already gone; do not leave a schema-only (or
    // half-written) database that `pnpm demo` would load as an empty library.
    db.close();
    rmSync(dbPath, { force: true });
    throw error;
  } finally {
    if (db.isOpen) {
      db.close();
    }
  }
};
