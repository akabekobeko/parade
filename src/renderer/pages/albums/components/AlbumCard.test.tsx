import type { AlbumSummary } from "@mp/ipc";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AlbumCard } from "./AlbumCard";

vi.mock("@/features/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

const ALBUM: AlbumSummary = {
  albumKey: "Artist\u0000Album",
  album: "Album",
  artist: "Artist",
  year: 2001,
  genre: "Rock",
  producer: "",
  conductor: "",
  publisher: "",
  musicCount: 10,
  totalDurationMs: 60000,
  picturePath: null,
};

const markupOf = (favorite: boolean): string =>
  renderToStaticMarkup(
    <AlbumCard
      album={ALBUM}
      width={160}
      expanded={false}
      playing={false}
      favorite={favorite}
      onToggle={vi.fn()}
      onPlay={vi.fn()}
      onToggleFavorite={vi.fn()}
    />,
  );

it("puts the Star in the title row, after the artwork button has closed", () => {
  const html = markupOf(false);
  const artworkEnd = html.indexOf("</button>", html.indexOf("aria-expanded"));
  const star = html.indexOf('aria-pressed="false"');
  expect(artworkEnd).toBeGreaterThan(-1);
  expect(star).toBeGreaterThan(artworkEnd);
  expect(html).toContain('aria-label="favorite.add"');
});

it("lets the title shrink and clip before the Star", () => {
  const html = markupOf(true);
  expect(html).toContain('aria-pressed="true"');
  expect(html).toContain('aria-label="favorite.remove"');
  // The title row is a flex row; the title span shrinks (min-w-0 flex-1)
  // and the Star keeps its width (shrink-0).
  expect(html).toMatch(/class="flex items-center gap-1 pt-2"/);
  expect(html).toMatch(/class="[^"]*truncate[^"]*min-w-0 flex-1[^"]*"/);
  expect(html).toMatch(
    /<button[^>]*aria-pressed="true"[^>]*class="[^"]*shrink-0[^"]*"/,
  );
});
