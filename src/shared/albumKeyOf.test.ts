import { expect, it } from "vitest";
import { albumKeyOf, parseAlbumKey } from "./albumKeyOf";

it("joins the display artist and album with a NUL separator", () => {
  expect(albumKeyOf("Artist", "Album")).toBe("Artist\u0000Album");
});

it("keeps ('A B', 'C') and ('A', 'B C') distinct", () => {
  expect(albumKeyOf("A B", "C")).not.toBe(albumKeyOf("A", "B C"));
});

it("parseAlbumKey decodes what albumKeyOf encoded, empty halves included", () => {
  expect(parseAlbumKey(albumKeyOf("Artist", "Album"))).toEqual({
    artist: "Artist",
    album: "Album",
  });
  expect(parseAlbumKey(albumKeyOf("", "Album"))).toEqual({
    artist: "",
    album: "Album",
  });
  expect(parseAlbumKey(albumKeyOf("Artist", ""))).toEqual({
    artist: "Artist",
    album: "",
  });
});

it("parseAlbumKey returns null for a string without the separator", () => {
  expect(parseAlbumKey("Artist Album")).toBeNull();
});
