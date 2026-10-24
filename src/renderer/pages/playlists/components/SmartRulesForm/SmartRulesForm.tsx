import { Plus } from "lucide-react";
import { HStack, Stack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/features/i18n/useT";
import { ConditionRow } from "./ConditionRow";
import { SORT_CHOICES } from "./sortChoices";
import type { RulesDraftController } from "./useRulesDraft";

type Props = RulesDraftController;

/**
 * Smart-playlist rules form (`docs/specs/v1.0/features/playlist.md`,
 * `docs/specs/v1.6/features/playlist-info-dialog.md`): match toggle,
 * condition rows (field / operator / value), sort, and limit. Holds no
 * state and no dialog chrome; the owner binds it to `useRulesDraft` and
 * decides what surrounds it (the creation dialog's name field, or the
 * playlist info dialog's details tab).
 */
export const SmartRulesForm = ({
  draft,
  setMatch,
  setCondition,
  addCondition,
  removeCondition,
  setSort,
  setOrder,
  setLimit,
}: Props) => {
  const t = useT();

  return (
    <>
      <HStack>
        <span className="text-muted-foreground text-sm">
          {t("smart.match")}
        </span>
        <Select
          value={draft.match}
          // items maps value → label so SelectValue shows the display
          // name in the trigger instead of the raw value.
          items={{ all: t("smart.matchAll"), any: t("smart.matchAny") }}
          onValueChange={setMatch}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("smart.matchAll")}</SelectItem>
            <SelectItem value="any">{t("smart.matchAny")}</SelectItem>
          </SelectContent>
        </Select>
      </HStack>

      <Stack>
        {draft.conditions.map((condition, index) => (
          <ConditionRow
            // biome-ignore lint/suspicious/noArrayIndexKey: rows have no identity beyond their position; the list is short and replaced wholesale.
            key={index}
            condition={condition}
            onChange={(next) => setCondition(index, next)}
            onRemove={() => removeCondition(index)}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={addCondition}
        >
          <Plus /> {t("smart.addCondition")}
        </Button>
      </Stack>

      <HStack className="flex-wrap gap-4">
        <HStack>
          <span className="text-muted-foreground text-sm">
            {t("smart.sort")}
          </span>
          <Select
            value={draft.sort}
            items={Object.fromEntries(
              SORT_CHOICES.map((choice) => [choice, t(`smart.sort.${choice}`)]),
            )}
            onValueChange={setSort}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_CHOICES.map((choice) => (
                <SelectItem key={choice} value={choice}>
                  {t(`smart.sort.${choice}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {draft.sort !== "none" && draft.sort !== "random" && (
            <Select
              value={draft.order}
              items={{
                asc: t("smart.orderAsc"),
                desc: t("smart.orderDesc"),
              }}
              onValueChange={setOrder}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{t("smart.orderAsc")}</SelectItem>
                <SelectItem value="desc">{t("smart.orderDesc")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </HStack>
        <HStack>
          <span className="text-muted-foreground text-sm">
            {t("smart.limit")}
          </span>
          <Input
            type="number"
            min={1}
            className="w-24"
            placeholder={t("smart.limitNone")}
            value={draft.limit}
            onChange={(event) => setLimit(event.target.value)}
          />
        </HStack>
      </HStack>
    </>
  );
};
