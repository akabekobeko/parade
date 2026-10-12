import { Columns3 } from "lucide-react";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/features/i18n/useT";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import { ToolbarMenu } from "./ToolbarMenu";

/** One checkbox entry of the columns menu. */
export type ColumnsMenuItem = {
  /** Column the entry shows or hides. */
  readonly id: PlaylistColumnId;
  /** i18n key of the entry's text; the same key as the column's header. */
  readonly labelKey: string;
  /** Whether the column is shown, i.e. the entry is checked. */
  readonly visible: boolean;
};

type Props = {
  /** The optional columns in declaration order. */
  readonly items: readonly ColumnsMenuItem[];
  /** Whether "Reset columns" would change anything; disables it otherwise. */
  readonly resettable: boolean;
  /** Shows or hides a column. */
  readonly onToggle: (columnId: PlaylistColumnId, visible: boolean) => void;
  /** Returns the visible columns and the widths to the defaults. */
  readonly onReset: () => void;
};

/**
 * Columns menu of the content toolbar
 * (`docs/specs/v1.3/features/column-visibility.md`): a checkbox per
 * optional column of the Playlist table, then "Reset columns". Toggling an
 * entry keeps the menu open so several columns can be switched in a row.
 * The pinned columns are not listed. The trigger and the popup are the
 * toolbar's `ToolbarMenu` shell.
 */
export const ColumnsMenu = ({
  items,
  resettable,
  onToggle,
  onReset,
}: Props) => {
  const t = useT();
  return (
    <ToolbarMenu icon={<Columns3 />} label={t("toolbar.columns")}>
      {items.map((item) => (
        <DropdownMenuCheckboxItem
          key={item.id}
          checked={item.visible}
          closeOnClick={false}
          onCheckedChange={(checked) => onToggle(item.id, checked)}
        >
          {t(item.labelKey)}
        </DropdownMenuCheckboxItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={!resettable} onClick={onReset}>
        {t("toolbar.resetColumns")}
      </DropdownMenuItem>
    </ToolbarMenu>
  );
};
