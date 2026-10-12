import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { AlbumGroup } from "@/features/library/groupAlbums/types";
import { AlbumHeaderRow } from "./AlbumHeaderRow";

vi.mock("@/features/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

// The menu's "Fetch song info" item subscribes to the fetch progress store,
// which has no server snapshot; the menu is not under test here.
vi.mock("@/components/app/RowMenu/useFetchMusicInfoItem", () => ({
  useFetchMusicInfoItem: () => () => ({
    label: "menu.fetchMusicInfo",
    onSelect: () => {},
  }),
}));

const GROUP: AlbumGroup = {
  key: "Artist\u0000Album",
  album: "Album",
  artist: "Artist",
  year: 2001,
  genre: "Rock",
  producer: "",
  conductor: "",
  publisher: "",
  musicCount: 0,
  totalDurationMs: 0,
  picturePath: null,
  discs: [],
};

const headingOf = (favorite: boolean): string => {
  const html = renderToStaticMarkup(
    <AlbumHeaderRow
      group={GROUP}
      musics={[]}
      playing={false}
      favorite={favorite}
      onPlay={vi.fn()}
      onAddToQueue={vi.fn()}
      onAlbumInfo={vi.fn()}
    />,
  );
  const match = /<h2[^>]*>.*?<\/h2>/.exec(html);
  expect(match).not.toBeNull();
  return match?.[0] ?? "";
};

it("shows a solid Star after the title of a favorite album", () => {
  const heading = headingOf(true);
  expect(heading).toMatch(/<svg[^>]*class="[^"]*fill-current[^"]*"/);
  expect(heading).toMatch(/<svg[^>]*aria-hidden="true"/);
  // The heading is a flex row and the title clips before the Star.
  expect(heading).toMatch(/<h2 class="flex min-w-0 items-center gap-2[^"]*"/);
  expect(heading).toMatch(/class="[^"]*truncate[^"]*min-w-0[^"]*"/);
  // A mark only, never a button.
  expect(heading).not.toContain("<button");
});

it("shows nothing for an album that is not a favorite", () => {
  const heading = headingOf(false);
  expect(heading).not.toContain("<svg");
});
