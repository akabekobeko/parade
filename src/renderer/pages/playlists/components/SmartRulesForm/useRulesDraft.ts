import type { SmartCondition, SmartPlaylistRules } from "@mp/ipc";
import { useState } from "react";
import { defaultCondition } from "./defaultCondition";
import { EMPTY_DRAFT, type RulesDraft } from "./rulesDraft";
import { toDraft } from "./toDraft";

/**
 * The editable rules draft and every draft mutation, shared by the
 * smart-playlist creation dialog and the playlist info dialog
 * (`docs/specs/v1.6/features/playlist-info-dialog.md`). `SmartRulesForm`
 * renders what this hook returns; the owner converts the draft back with
 * `fromDraft` when it submits.
 *
 * @param initialRules - Rules to edit; omit to start from the empty draft.
 */
export const useRulesDraft = (initialRules?: SmartPlaylistRules) => {
  const [draft, setDraft] = useState<RulesDraft>(() =>
    initialRules !== undefined ? toDraft(initialRules) : EMPTY_DRAFT,
  );

  const setMatch = (match: string | null): void => {
    setDraft({ ...draft, match: match as RulesDraft["match"] });
  };

  const setCondition = (index: number, condition: SmartCondition): void => {
    setDraft({
      ...draft,
      conditions: draft.conditions.map((entry, entryIndex) =>
        entryIndex === index ? condition : entry,
      ),
    });
  };

  const addCondition = (): void => {
    setDraft({
      ...draft,
      conditions: [...draft.conditions, defaultCondition("artist")],
    });
  };

  const removeCondition = (index: number): void => {
    setDraft({
      ...draft,
      conditions: draft.conditions.filter(
        (_, entryIndex) => entryIndex !== index,
      ),
    });
  };

  const setSort = (sort: string | null): void => {
    setDraft({ ...draft, sort: sort as RulesDraft["sort"] });
  };

  const setOrder = (order: string | null): void => {
    setDraft({ ...draft, order: order as RulesDraft["order"] });
  };

  const setLimit = (limit: string): void => {
    setDraft({ ...draft, limit });
  };

  return {
    draft,
    setMatch,
    setCondition,
    addCondition,
    removeCondition,
    setSort,
    setOrder,
    setLimit,
  };
};

/** What {@link useRulesDraft} returns: the props of `SmartRulesForm`. */
export type RulesDraftController = ReturnType<typeof useRulesDraft>;
