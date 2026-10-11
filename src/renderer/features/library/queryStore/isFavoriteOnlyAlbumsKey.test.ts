import { expect, it } from "vitest";
import { isFavoriteOnlyAlbumsKey } from "./isFavoriteOnlyAlbumsKey";
import { queryKeys } from "./queryKeys";

it("matches an album-list key whose filter is favorites only", () => {
  expect(
    isFavoriteOnlyAlbumsKey(queryKeys.albums({ favoriteOnly: true })),
  ).toBe(true);
  expect(
    isFavoriteOnlyAlbumsKey(
      queryKeys.albums({ genres: ["Jazz"], favoriteOnly: true }),
    ),
  ).toBe(true);
});

it("ignores album-list keys without the restriction", () => {
  expect(isFavoriteOnlyAlbumsKey(queryKeys.albums({}))).toBe(false);
  expect(isFavoriteOnlyAlbumsKey(queryKeys.albums({ text: "x" }))).toBe(false);
  expect(
    isFavoriteOnlyAlbumsKey(queryKeys.albums({ favoriteOnly: false })),
  ).toBe(false);
});

it("ignores every other key family", () => {
  expect(isFavoriteOnlyAlbumsKey(queryKeys.albumFavorites)).toBe(false);
  expect(isFavoriteOnlyAlbumsKey(queryKeys.musicsByAlbum("A\u0000B"))).toBe(
    false,
  );
  expect(isFavoriteOnlyAlbumsKey(queryKeys.artists)).toBe(false);
});
