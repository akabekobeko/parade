import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClusterButton } from "./ClusterButton";
import { TOOLTIP_DELAY_MS } from "./constants";

type Props = {
  /** The trigger's icon. */
  readonly icon: ReactNode;
  /** Tooltip text of the trigger, doubling as its accessible name. */
  readonly label: string;
  /** Something the menu controls is in effect: the trigger's icon fills. */
  readonly active?: boolean;
  /** The menu entries. */
  readonly children: ReactNode;
};

/**
 * Shell of the content toolbar's menus (`ColumnsMenu`, `FilterMenu`): a
 * `ClusterButton` trigger — glowing icon, delayed tooltip, opt-out of the
 * window drag region — opening a `DropdownMenu` aligned to the toolbar's
 * right edge. The menus differ only in their entries.
 */
export const ToolbarMenu = ({ icon, label, active, children }: Props) => (
  <DropdownMenu>
    <TooltipProvider delay={TOOLTIP_DELAY_MS}>
      <DropdownMenuTrigger
        render={
          <ClusterButton label={label} active={active}>
            {icon}
          </ClusterButton>
        }
      />
    </TooltipProvider>
    <DropdownMenuContent align="end">{children}</DropdownMenuContent>
  </DropdownMenu>
);
