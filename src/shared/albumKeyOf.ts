/**
 * Build the album identity key shared by `AlbumSummary.albumKey`,
 * `mp:library:getMusicsByAlbum`, the Renderer's `groupAlbums` and the
 * MusicBrainz album grouping (`groupMusicsByAlbum`).
 *
 * The NUL separator cannot occur in tag strings, so ("A B", "C") and
 * ("A", "B C") can never collide.
 *
 * @param displayArtist - Display artist (`displayArtistOf`).
 * @param album - Album title.
 * @returns The opaque identity key.
 */
export const albumKeyOf = (displayArtist: string, album: string): string =>
  `${displayArtist}\u0000${album}`;

/** The two halves of an album identity key. */
export type AlbumKeyParts = {
  /** Display artist; empty for the unknown-artist bucket. */
  readonly artist: string;
  /** Album title; empty for untitled tracks. */
  readonly album: string;
};

/**
 * Decode a key built by {@link albumKeyOf} back into its parts. The single
 * decoder for every consumer (`getMusicsByAlbum`, `removeAlbumFromLibrary`,
 * `setAlbumFavorite`), so the key format has one encoder and one decoder.
 *
 * @param albumKey - The identity key.
 * @returns The parts, or `null` for a string without the separator (not a
 *   key); each caller decides whether that is an error or an empty result.
 */
export const parseAlbumKey = (albumKey: string): AlbumKeyParts | null => {
  const separator = albumKey.indexOf("\u0000");
  if (separator < 0) {
    return null;
  }

  return {
    artist: albumKey.slice(0, separator),
    album: albumKey.slice(separator + 1),
  };
};
