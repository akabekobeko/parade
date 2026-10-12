import type { ComponentProps, ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GlowIconButton } from "../Buttons/GlowIconButton";

type Props = Pick<
  ComponentProps<typeof GlowIconButton>,
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
 * One glowing icon button of `ToolbarIconCluster` with its delayed tooltip
 * (the delay comes from the cluster's `TooltipProvider`).
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
        <GlowIconButton
          aria-label={label}
          data-active={active || undefined}
          className="app-region-no-drag data-active:[&_svg]:fill-current"
          {...props}
        >
          {children}
        </GlowIconButton>
      }
    />
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);
