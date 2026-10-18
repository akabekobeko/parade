import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { RepeatMode } from "@/features/player/types";
import { RepeatButton } from "./RepeatButton";

vi.mock("@/features/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

const markupOf = (mode: RepeatMode): string =>
  renderToStaticMarkup(<RepeatButton mode={mode} onCycle={() => {}} />);

it("off is unlit, shows Repeat and names the current mode", () => {
  const markup = markupOf("off");
  expect(markup).toContain('aria-pressed="false"');
  expect(markup).toContain('aria-label="player.repeatOff"');
  expect(markup).toContain('title="player.repeatOff"');
  expect(markup).toContain('class="lucide lucide-repeat"');
  expect(markup).not.toContain('class="lucide lucide-repeat-1"');
});

it("all is lit with the same Repeat icon", () => {
  const markup = markupOf("all");
  expect(markup).toContain('aria-pressed="true"');
  expect(markup).toContain('aria-label="player.repeatAll"');
  expect(markup).toContain('class="lucide lucide-repeat"');
  expect(markup).not.toContain('class="lucide lucide-repeat-1"');
});

it("one is lit and switches to Repeat1", () => {
  const markup = markupOf("one");
  expect(markup).toContain('aria-pressed="true"');
  expect(markup).toContain('aria-label="player.repeatOne"');
  expect(markup).toContain('class="lucide lucide-repeat-1"');
  expect(markup).not.toContain('class="lucide lucide-repeat"');
});

it("is never disabled, so the mode can be set before playing", () => {
  expect(markupOf("off")).not.toContain('disabled=""');
});
