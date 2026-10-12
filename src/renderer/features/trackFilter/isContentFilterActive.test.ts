import { expect, it } from "vitest";
import { isContentFilterActive } from "./isContentFilterActive";

it("is inactive with a blank text and favorites-only off", () => {
  expect(isContentFilterActive({ text: "", favoriteOnly: false })).toBe(false);
  expect(isContentFilterActive({ text: "  ", favoriteOnly: false })).toBe(
    false,
  );
});

it("is active with a text", () => {
  expect(isContentFilterActive({ text: "rain", favoriteOnly: false })).toBe(
    true,
  );
});

it("is active with favorites-only alone", () => {
  expect(isContentFilterActive({ text: "", favoriteOnly: true })).toBe(true);
});
