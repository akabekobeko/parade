import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { matchesContentFilter } from "./matchesContentFilter";

const musicOf = (title: string, favorite: boolean): Music =>
  ({ title, favorite }) as Music;

const rainOn = musicOf("Singin' in the Rain", true);
const rainOff = musicOf("Rainy Day", false);
const sunOn = musicOf("Here Comes the Sun", true);

it("matches everything with a blank text and favorites-only off", () => {
  const filter = { text: "", favoriteOnly: false };
  expect(matchesContentFilter(rainOn, filter)).toBe(true);
  expect(matchesContentFilter(rainOff, filter)).toBe(true);
});

it("applies the text alone when favorites-only is off", () => {
  const filter = { text: "rain", favoriteOnly: false };
  expect(matchesContentFilter(rainOn, filter)).toBe(true);
  expect(matchesContentFilter(rainOff, filter)).toBe(true);
  expect(matchesContentFilter(sunOn, filter)).toBe(false);
});

it("keeps only favorites when favorites-only is on and the text is blank", () => {
  const filter = { text: "", favoriteOnly: true };
  expect(matchesContentFilter(rainOn, filter)).toBe(true);
  expect(matchesContentFilter(rainOff, filter)).toBe(false);
  expect(matchesContentFilter(sunOn, filter)).toBe(true);
});

it("combines the text and favorites-only with AND", () => {
  const filter = { text: "rain", favoriteOnly: true };
  expect(matchesContentFilter(rainOn, filter)).toBe(true);
  expect(matchesContentFilter(rainOff, filter)).toBe(false);
  expect(matchesContentFilter(sunOn, filter)).toBe(false);
});
