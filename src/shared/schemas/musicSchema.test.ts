import { expect, it } from "vitest";
import { musicSchema } from "./musicSchema";

const ROW = {
  id: 1,
  filePath: "/m/a.mp3",
  audioFormat: "mp3",
  title: "T",
  artist: "Artist",
  albumArtist: "",
  album: "Album",
  disc: 1,
  track: 0,
  year: null,
  genre: "",
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 1000,
  bpm: null,
  rating: null,
  favorite: 0,
  pictureId: null,
  picturePath: null,
  addedAt: "2026-08-10T00:00:00.000Z",
  updatedAt: "2026-08-10T00:00:00.000Z",
};

it("accepts a row of the track SELECT as it is", () => {
  expect(musicSchema.parse(ROW)).toEqual({ ...ROW, favorite: false });
});

it("turns the 0 / 1 favorite column into a boolean", () => {
  expect(musicSchema.parse({ ...ROW, favorite: 0 }).favorite).toBe(false);
  expect(musicSchema.parse({ ...ROW, favorite: 1 }).favorite).toBe(true);
});

it("rejects a favorite value other than 0 / 1", () => {
  expect(() => musicSchema.parse({ ...ROW, favorite: 2 })).toThrow();
  expect(() => musicSchema.parse({ ...ROW, favorite: null })).toThrow();
  expect(() => musicSchema.parse({ ...ROW, favorite: true })).toThrow();
});

it("accepts fractional durations and tag numbers mme may report", () => {
  expect(
    musicSchema.parse({ ...ROW, durationMs: 1234.5, bpm: 120.5, rating: 0.5 }),
  ).toMatchObject({ durationMs: 1234.5, bpm: 120.5, rating: 0.5 });
});

it("rejects a value whose type drifted from the column contract", () => {
  expect(() => musicSchema.parse({ ...ROW, year: "1999" })).toThrow();
  expect(() => musicSchema.parse({ ...ROW, title: null })).toThrow();
  expect(() => musicSchema.parse({ ...ROW, id: 1.5 })).toThrow();
});

it("rejects an audio format mme does not know", () => {
  expect(() => musicSchema.parse({ ...ROW, audioFormat: "dsf" })).toThrow();
});

it("rejects a row missing a column", () => {
  const { updatedAt: _updatedAt, ...partial } = ROW;
  expect(() => musicSchema.parse(partial)).toThrow();
});
