import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { SpeedControl } from "./SpeedControl";

vi.mock("@/features/i18n/useT", () => ({
  useT: () => (key: string, params?: Record<string, string | number>) =>
    params === undefined ? key : `${key}:${JSON.stringify(params)}`,
}));

const markupOf = (rate: number, preservesPitch = true): string =>
  renderToStaticMarkup(
    <SpeedControl
      rate={rate}
      preservesPitch={preservesPitch}
      onRateChange={() => {}}
      onPreservesPitchChange={() => {}}
    />,
  );

it("1x is unlit and shows the gauge", () => {
  const markup = markupOf(1);
  // The class list mentions `data-active:` as a variant; the attribute
  // itself must be absent.
  expect(markup).not.toContain('data-active="true"');
  expect(markup).toContain('class="lucide lucide-gauge"');
});

it("any other rate lights the button through data-active", () => {
  expect(markupOf(1.25)).toContain('data-active="true"');
  expect(markupOf(0.5)).toContain('data-active="true"');
});

it("names the button with the current rate", () => {
  const markup = markupOf(1.25);
  expect(markup).toContain(
    'aria-label="player.speedCurrent:{&quot;rate&quot;:&quot;1.25x&quot;}"',
  );
  expect(markup).toContain(
    'title="player.speedCurrent:{&quot;rate&quot;:&quot;1.25x&quot;}"',
  );
});

it("is never disabled, so the speed can be set before playing", () => {
  expect(markupOf(1)).not.toContain('disabled=""');
});
