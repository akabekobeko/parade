import type { ComponentProps, ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconButton } from "../Buttons/IconButton";

type Props = Pick<
  ComponentProps<typeof IconButton>,
  "onClick" | "render" | "nativeButton"
> & {
  /** Tooltip text, doubling as the accessible name. */
  readonly label: string;
  /**
   * Something the button opens is in effect (the filter menu's "favorites
   * only"): the icon is filled, through `data-active` rather than
   * `aria-pressed`, since the button opens a menu and is not a toggle.
   */
  readonly active?: boolean;
  /** The icon. */
  readonly children: ReactNode;
};

/**
 * One icon button of `ToolbarIconCluster` (hover fills a rounded rectangle,
 * the "tint" look of `IconButton`) with its delayed tooltip (the delay comes
 * from the cluster's `TooltipProvider`).
 */
export const ClusterButton = ({
  label,
  active = false,
  children,
  ...props
}: Props) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <IconButton
          aria-label={label}
          data-active={active || undefined}
          className="app-region-no-drag data-active:[&_svg]:fill-current"
          {...props}
        >
          {children}
        </IconButton>
      }
    />
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);
