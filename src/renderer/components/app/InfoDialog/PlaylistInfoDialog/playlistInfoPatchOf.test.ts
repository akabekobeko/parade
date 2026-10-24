import type { Playlist, SmartPlaylistRules } from "@mp/ipc";
import { expect, it } from "vitest";
import { EMPTY_DRAFT } from "@/pages/playlists/components/SmartRulesForm/rulesDraft";
import { toDraft } from "@/pages/playlists/components/SmartRulesForm/toDraft";
import {
  canApplyPlaylistInfo,
  playlistInfoPatchOf,
} from "./playlistInfoPatchOf";

const RULES: SmartPlaylistRules = {
  version: 1,
  match: "all",
  conditions: [{ field: "genre", operator: "is", value: "Jazz" }],
  sort: { field: "addedAt", order: "desc" },
  limit: 25,
};

const STATIC: Playlist = {
  id: 1,
  kind: "static",
  name: "My Best",
  sortOrder: 0,
  picturePath: null,
  musicCount: 3,
};

const SMART: Playlist = { ...STATIC, id: 2, kind: "smart", rules: RULES };

const file = new File([new Uint8Array([1])], "a.png", { type: "image/png" });

it("sends only the trimmed name when it changed", () => {
  expect(
    playlistInfoPatchOf(STATIC, {
      name: "  Renamed ",
      draft: null,
      file: null,
    }),
  ).toEqual({ update: { name: "Renamed" }, file: null });
});

it("sends only the rules when the draft differs from the stored rules", () => {
  const draft = { ...toDraft(RULES), limit: "10" };
  expect(
    playlistInfoPatchOf(SMART, { name: SMART.name, draft, file: null }),
  ).toEqual({ update: { rules: { ...RULES, limit: 10 } }, file: null });
});

it("sends only the file when nothing else changed", () => {
  expect(
    playlistInfoPatchOf(SMART, {
      name: SMART.name,
      draft: toDraft(RULES),
      file,
    }),
  ).toEqual({ update: null, file });
});

it("combines the name and the rules into one update", () => {
  const draft = { ...toDraft(RULES), match: "any" as const };
  expect(
    playlistInfoPatchOf(SMART, { name: "Jazz", draft, file }).update,
  ).toEqual({ name: "Jazz", rules: { ...RULES, match: "any" } });
});

it("reports no change for an untouched dialog (a trimmed name is equal)", () => {
  const untouched = playlistInfoPatchOf(SMART, {
    name: ` ${SMART.name} `,
    draft: toDraft(RULES),
    file: null,
  });
  expect(untouched).toEqual({ update: null, file: null });
  expect(canApplyPlaylistInfo(untouched, SMART.name, false)).toBe(false);
});

it("never sends an empty name and disables Apply for it", () => {
  const patch = playlistInfoPatchOf(STATIC, { name: "   ", draft: null, file });
  expect(patch).toEqual({ update: null, file });
  expect(canApplyPlaylistInfo(patch, "   ", false)).toBe(false);
});

it("always counts the rules as changed when the stored rules are corrupted", () => {
  const broken: Playlist = { ...SMART, rules: undefined };
  const patch = playlistInfoPatchOf(broken, {
    name: broken.name,
    draft: EMPTY_DRAFT,
    file: null,
  });
  expect(patch.update).toEqual({
    rules: { version: 1, match: "all", conditions: EMPTY_DRAFT.conditions },
  });
});

it("ignores the draft of a static playlist", () => {
  expect(
    playlistInfoPatchOf(STATIC, {
      name: STATIC.name,
      draft: EMPTY_DRAFT,
      file: null,
    }).update,
  ).toBeNull();
});

it("enables Apply for a pending change unless one is in flight", () => {
  const patch = playlistInfoPatchOf(STATIC, {
    name: "N",
    draft: null,
    file: null,
  });
  expect(canApplyPlaylistInfo(patch, "N", false)).toBe(true);
  expect(canApplyPlaylistInfo(patch, "N", true)).toBe(false);
  expect(canApplyPlaylistInfo({ update: null, file }, STATIC.name, false)).toBe(
    true,
  );
});
