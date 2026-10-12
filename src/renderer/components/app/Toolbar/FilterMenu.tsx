import { Funnel } from "lucide-react";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { useT } from "@/features/i18n/useT";
import { ToolbarMenu } from "./ToolbarMenu";

type Props = {
  /** Whether the section shows favorites only (the entry's check). */
  readonly favoriteOnly: boolean;
  /** Whether any toolbar filter narrows the section (the filled Funnel). */
  readonly active: boolean;
  /** Switches "favorites only" for the section. */
  readonly onFavoriteOnlyChange: (value: boolean) => void;
};

/**
 * Filter menu of the content toolbar
 * (`docs/specs/v1.4/features/filter-menu.md`): a Funnel button opening one
 * checkbox entry, "Favorites only", which flips the shown section's toggle
 * and closes the menu (nothing to switch in a row). The Funnel is filled
 * while a filter is in effect, so the state shows without opening the
 * menu.
 */
export const FilterMenu = ({
  favoriteOnly,
  active,
  onFavoriteOnlyChange,
}: Props) => {
  const t = useT();
  return (
    <ToolbarMenu icon={<Funnel />} label={t("toolbar.filter")} active={active}>
      <DropdownMenuCheckboxItem
        checked={favoriteOnly}
        // A checkbox item stays open by default (for switching several in
        // a row, as the columns menu does); this one is alone.
        closeOnClick
        onCheckedChange={onFavoriteOnlyChange}
      >
        {t("toolbar.favoritesOnly")}
      </DropdownMenuCheckboxItem>
    </ToolbarMenu>
  );
};
