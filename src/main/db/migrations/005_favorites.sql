-- Favorite flags (docs/specs/v1.4/architecture/database.md).
-- musics.favorite is the per-track flag (1 = on, 0 = off; never NULL, never
-- written to the file's tags). album_favorites holds one row per favorite
-- album keyed by the album identity (display artist, album name); a row
-- means "on", no row means "off", like artist_initials. Rows of albums
-- without any remaining track are GC'd with the other orphan tables.
-- Applied files must never change; schema changes go into new numbered files.

ALTER TABLE musics ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0;

CREATE TABLE album_favorites (
  artist TEXT NOT NULL,
  album  TEXT NOT NULL,
  PRIMARY KEY (artist, album)
);
