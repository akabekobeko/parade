import { expect, it } from "vitest";
import {
  fitsInside,
  isScene,
  parseManifest,
  SCENES,
} from "./screenshotManifest";

it("parses mask and crop rectangles per scene", () => {
  const manifest = parseManifest(
    JSON.stringify({
      "music-info": { mask: [{ x: 1, y: 2, width: 3, height: 4 }] },
      player: { crop: { x: 0, y: 10, width: 20, height: 30 } },
      settings: {},
    }),
  );
  expect(manifest["music-info"]?.mask).toEqual([
    { x: 1, y: 2, width: 3, height: 4 },
  ]);
  expect(manifest.player?.crop).toEqual({ x: 0, y: 10, width: 20, height: 30 });
  expect(manifest.settings).toEqual({});
});

it("rejects a rectangle without a positive size", () => {
  expect(() =>
    parseManifest(
      JSON.stringify({
        artists: { mask: [{ x: 0, y: 0, width: 0, height: 4 }] },
      }),
    ),
  ).toThrow();
});

it("rejects unknown keys of a scene", () => {
  expect(() =>
    parseManifest(JSON.stringify({ artists: { masks: [] } })),
  ).toThrow();
});

it("rejects a scene name outside the spec", () => {
  expect(() => parseManifest(JSON.stringify({ hero: {} }))).toThrow();
  expect(isScene("artists")).toBe(true);
  expect(isScene("Artists")).toBe(false);
});

it("accepts every screen in the dark and the light theme, nothing else", () => {
  expect(SCENES).toHaveLength(14);
  expect(isScene("artists-light")).toBe(true);
  expect(isScene("player-light")).toBe(true);
  expect(isScene("artists-dark")).toBe(false);
  expect(isScene("light-artists")).toBe(false);
  expect(isScene("artists_light")).toBe(false);
  const manifest = parseManifest(
    JSON.stringify({
      "player-light": { crop: { x: 0, y: 784, width: 2784, height: 1008 } },
    }),
  );
  expect(manifest["player-light"]?.crop?.height).toBe(1008);
});

it("checks that a rectangle fits inside the image", () => {
  expect(fitsInside({ x: 10, y: 10, width: 90, height: 90 }, 100, 100)).toBe(
    true,
  );
  expect(fitsInside({ x: 10, y: 10, width: 91, height: 90 }, 100, 100)).toBe(
    false,
  );
});
