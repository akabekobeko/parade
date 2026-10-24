import { FormSection } from "@/components/app/FormSection/FormSection";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";

type Props = {
  /** Current name field value. */
  readonly value: string;
  /** Called with the edited value. */
  readonly onChange: (next: string) => void;
};

/**
 * "Name" section of the playlist info dialog: a titled text field. Opens
 * with the playlist's name and no selection, since partial edits are the
 * common case here (unlike the sidebar's inline rename).
 */
export const NameField = ({ value, onChange }: Props) => {
  const t = useT();
  return (
    <FormSection label={t("playlistInfo.name")}>
      <Input
        aria-label={t("playlistInfo.name")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormSection>
  );
};
