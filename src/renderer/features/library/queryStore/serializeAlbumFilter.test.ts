import { expect, it } from "vitest";
import { serializeAlbumFilter } from "./serializeAlbumFilter";

it("drops inactive fields so equivalent filters share one key", () => {
  expect(serializeAlbumFilter({})).toBe("{}");
  expect(
    serializeAlbumFilter({
      text: "  ",
      musicTitle: "",
      genres: [],
      decades: [],
    }),
  ).toBe("{}");
});

it("sorts the OR-set fields", () => {
  expect(serializeAlbumFilter({ genres: ["b", "a"] })).toBe(
    serializeAlbumFilter({ genres: ["a", "b"] }),
  );
  expect(serializeAlbumFilter({ decades: [null, 1990, 1980] })).toBe(
    '{"decades":[1980,1990,null]}',
  );
});

it("keeps favoriteOnly only when it is on", () => {
  expect(serializeAlbumFilter({ favoriteOnly: true })).toBe(
    '{"favoriteOnly":true}',
  );
  expect(serializeAlbumFilter({ favoriteOnly: false })).toBe("{}");
  expect(serializeAlbumFilter({ text: "x", favoriteOnly: true })).toBe(
    '{"text":"x","favoriteOnly":true}',
  );
});
