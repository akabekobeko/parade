import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AboutDialogContent, websiteUrlOf } from "./AboutDialogContent";

vi.mock("@/features/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

const versions = {
  app: "1.2.3",
  electron: "45.0.0",
  chrome: "156.0.0.0",
  node: "24.0.0",
};

it("picks the website language from the locale", () => {
  expect(websiteUrlOf("en")).toBe("https://akabekobeko.github.io/parade/");
  expect(websiteUrlOf("ja")).toBe("https://akabekobeko.github.io/parade/ja/");
});

it("lists the runtime versions, the project links and the music data credit", () => {
  const markup = renderToStaticMarkup(
    <AboutDialogContent
      versions={versions}
      error={null}
      locale="ja"
      onOpenExternal={() => {}}
    />,
  );
  expect(markup).toContain("about.runtime");
  expect(markup).toContain("45.0.0");
  expect(markup).toContain('href="https://akabekobeko.github.io/parade/ja/"');
  expect(markup).toContain('href="https://github.com/akabekobeko/parade"');
  expect(markup).toContain("about.links.website");
  expect(markup).toContain("about.links.github");
  expect(markup).toContain("about.musicData.description");
  expect(markup).toContain('href="https://musicbrainz.org/"');
  expect(markup).toContain('href="https://coverartarchive.org/"');
});

it("shows the error and keeps the links while the versions are missing", () => {
  const markup = renderToStaticMarkup(
    <AboutDialogContent
      versions={null}
      error={{ name: "Error", message: "boom" }}
      locale="en"
      onOpenExternal={() => {}}
    />,
  );
  expect(markup).toContain("library.loadFailed");
  expect(markup).not.toContain("about.runtime");
  expect(markup).toContain("about.links");
  expect(markup).toContain("about.musicData");
});
