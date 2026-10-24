import { expect, it } from "vitest";
import type { DemoArtistSeed } from "../types.ts";
import { buildDemoLibrary } from "./buildDemoLibrary.ts";

const seedsWithPlayableGenre = (
  genre: DemoArtistSeed["genre"],
): DemoArtistSeed[] => [
  {
    name: "Playable Artist",
    genre,
    startYear: 2000,
    albumCount: 1,
    playable: { albumIndex: 0, albumTitle: "Album", trackTitle: "Track" },
  },
  { name: "Other Artist", genre: "Folk", startYear: 2005, albumCount: 2 },
];

it("opens My Best with the playable track", () => {
  const library = buildDemoLibrary(seedsWithPlayableGenre("Electronic"));

  expect(library.playlists[0]?.tracks[0]).toBe(library.playableTrack);
});

it("puts at most one track per artist into My Best", () => {
  const library = buildDemoLibrary(seedsWithPlayableGenre("Electronic"));
  const artists = library.playlists[0]?.tracks.map(
    (track) => track.albumArtist,
  );

  expect(new Set(artists).size).toBe(artists?.length);
});

it("sorts the playable genre's smart playlist by import date, newest first", () => {
  const [first] = buildDemoLibrary(
    seedsWithPlayableGenre("Electronic"),
  ).smartPlaylists;

  expect(first).toMatchObject({
    name: "Electronic",
    rules: { sort: { field: "addedAt", order: "desc" } },
  });
});

it("never creates two smart playlists for the same genre", () => {
  for (const genre of ["Jazz", "Rock"] as const) {
    const names = buildDemoLibrary(
      seedsWithPlayableGenre(genre),
    ).smartPlaylists.map((playlist) => playlist.name);

    expect(names[0]).toBe(genre);
    expect(new Set(names).size).toBe(names.length);
  }
});

it("gives My Best the playable track's album cover as its picture", () => {
  const library = buildDemoLibrary(seedsWithPlayableGenre("Electronic"));

  expect(library.playlists[0]?.pictureAlbum).toEqual({
    artist: library.playableTrack.albumArtist,
    title: library.playableTrack.album,
  });
});

it("gives a smart playlist the cover declared on a seed and leaves the others without one", () => {
  const base = seedsWithPlayableGenre("Electronic");
  const seeds: DemoArtistSeed[] = [
    ...base,
    {
      name: "Jazz Artist",
      genre: "Jazz",
      startYear: 1990,
      albumCount: 2,
      // Pinned to the generated title so the declaration matches.
      smartPicture: {
        albumIndex: 1,
        albumTitle: titleOf("Jazz Artist", 1, base),
      },
    },
    { name: "Rock Artist", genre: "Rock", startYear: 1990, albumCount: 2 },
  ];
  const library = buildDemoLibrary(seeds);
  const byName = new Map(
    library.smartPlaylists.map((playlist) => [playlist.name, playlist]),
  );

  expect(byName.get("Jazz")?.pictureAlbum).toEqual({
    artist: "Jazz Artist",
    title: titleOf("Jazz Artist", 1, base),
  });
  expect(byName.get("Rock")?.pictureAlbum).toBeUndefined();
  expect(byName.get("Electronic")?.pictureAlbum).toBeUndefined();
});

it("leaves a smart playlist without a picture when no seed declares one", () => {
  const library = buildDemoLibrary(seedsWithPlayableGenre("Electronic"));

  expect(
    library.smartPlaylists.find((playlist) => playlist.name === "Jazz")
      ?.pictureAlbum,
  ).toBeUndefined();
});

it("rejects a smart picture declaration whose album title does not match", () => {
  expect(() =>
    buildDemoLibrary([
      ...seedsWithPlayableGenre("Electronic"),
      {
        name: "Jazz Artist",
        genre: "Jazz",
        startYear: 1990,
        albumCount: 2,
        smartPicture: { albumIndex: 0, albumTitle: "Not This One" },
      },
    ]),
  ).toThrow(/is not "Not This One"/);
});

it("uses Songs for the Parade by BRASSWORKS for the committed seed's Jazz playlist", () => {
  const library = buildDemoLibrary();

  expect(
    library.smartPlaylists.find((playlist) => playlist.name === "Jazz")
      ?.pictureAlbum,
  ).toEqual({ artist: "BRASSWORKS", title: "Songs for the Parade" });
  expect(library.playlists[0]?.pictureAlbum).toEqual({
    artist: "Milo Ashgrove",
    title: "Modulations",
  });
});

/** Title the generator gives album `index` of `name` among `others`. */
const titleOf = (
  name: string,
  index: number,
  others: readonly DemoArtistSeed[],
): string =>
  buildDemoLibrary([
    ...others,
    { name, genre: "Jazz", startYear: 1990, albumCount: 2 },
  ]).artists.find((artist) => artist.name === name)?.albums[index]?.title ?? "";
