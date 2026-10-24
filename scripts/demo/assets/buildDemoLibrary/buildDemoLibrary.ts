import { DEMO_ARTISTS } from "../seed/demoArtists.ts";
import type {
  DemoArtist,
  DemoArtistSeed,
  DemoGenre,
  DemoLibrary,
  DemoPictureAlbum,
} from "../types.ts";
import { buildDemoArtist } from "./buildDemoArtist.ts";
import { buildDemoPlaylists } from "./buildDemoPlaylists.ts";

/**
 * Resolve the seeds' `smartPicture` declarations to albums, keyed by the
 * album's genre. Throws when the declared title does not match (the title
 * generation drifted) or two seeds claim the same genre.
 */
const smartPictureAlbumsOf = (
  seeds: readonly DemoArtistSeed[],
  artists: readonly DemoArtist[],
): Partial<Record<DemoGenre, DemoPictureAlbum>> => {
  const result: Partial<Record<DemoGenre, DemoPictureAlbum>> = {};
  seeds.forEach((seed, index) => {
    if (seed.smartPicture === undefined) {
      return;
    }

    const album = artists[index]?.albums[seed.smartPicture.albumIndex];
    if (album === undefined || album.title !== seed.smartPicture.albumTitle) {
      throw new Error(
        `${seed.name}: album ${seed.smartPicture.albumIndex} is not "${seed.smartPicture.albumTitle}" (got "${album?.title ?? "none"}").`,
      );
    }

    if (result[album.genre] !== undefined) {
      throw new Error(
        `Two seeds declare the smart playlist picture of ${album.genre}.`,
      );
    }

    result[album.genre] = { artist: album.artist, title: album.title };
  });
  return result;
};

/**
 * Build the whole demo library from the seed data.
 *
 * Pure and deterministic: the same seed always yields the same library, so
 * regenerating the assets only changes what the seed changed.
 *
 * @param seeds - Artist definitions; defaults to the committed seed data.
 * @returns Artists, albums, tracks and playlists.
 */
export const buildDemoLibrary = (
  seeds: readonly DemoArtistSeed[] = DEMO_ARTISTS,
): DemoLibrary => {
  const artists: DemoArtist[] = [];
  let albumOffset = 0;
  for (const seed of seeds) {
    artists.push(
      buildDemoArtist(
        seed,
        albumOffset,
        seeds.map((other) => other.name).filter((name) => name !== seed.name),
      ),
    );
    albumOffset += seed.albumCount;
  }

  const tracks = artists.flatMap((artist) =>
    artist.albums.flatMap((album) => album.tracks),
  );
  const playableTracks = tracks.filter((track) => track.playable);
  const playableTrack = playableTracks[0];
  if (playableTrack === undefined || playableTracks.length !== 1) {
    throw new Error("The seed must define exactly one playable track.");
  }

  return {
    artists,
    ...buildDemoPlaylists(
      tracks,
      playableTrack,
      smartPictureAlbumsOf(seeds, artists),
    ),
    playableTrack,
  };
};
