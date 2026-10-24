import { FormSection } from "@/components/app/FormSection/FormSection";
import { useT } from "@/features/i18n/useT";
import { SmartRulesForm } from "@/pages/playlists/components/SmartRulesForm/SmartRulesForm";
import type { RulesDraftController } from "@/pages/playlists/components/SmartRulesForm/useRulesDraft";
import { DialogTabPanel } from "../DialogTabPanel";
import { NameField } from "./NameField";

type Props = {
  /** Current name field value. */
  readonly name: string;
  /** Called with the edited name. */
  readonly onChangeName: (next: string) => void;
  /** Rules draft and its mutations, bound to the form. */
  readonly rules: RulesDraftController;
};

/**
 * "Details" tab of a smart playlist: the "Name" and "Rules" sections. Only
 * this tab scrolls when the rules outgrow the body.
 */
export const DetailsPanel = ({ name, onChangeName, rules }: Props) => {
  const t = useT();
  return (
    <DialogTabPanel
      value="details"
      className="flex flex-col gap-6 overflow-y-auto"
    >
      <NameField value={name} onChange={onChangeName} />
      <FormSection label={t("playlistInfo.rules")}>
        <SmartRulesForm {...rules} />
      </FormSection>
    </DialogTabPanel>
  );
};
