import type { ReactNode } from "react";
import { Stack } from "@/components/app/stacks";
import { cn } from "@/libs/utils";

type Props = {
  /** Section heading. */
  readonly label: string;
  /** The section's rows, stacked under the heading. */
  readonly children: ReactNode;
  /**
   * Extra classes of the outer stack: `min-h-0 flex-1` lets the rows fill
   * the remaining height of a flex parent (the inner stack always grows).
   */
  readonly className?: string;
};

/**
 * One titled block of a form: a small muted heading over a rule, then the
 * rows. Shared by the settings dialog and the playlist info dialog
 * (`docs/specs/v1.6/features/playlist-info-dialog.md`) so their sections
 * look the same.
 */
export const FormSection = ({ label, children, className }: Props) => (
  <Stack className={cn("gap-3", className)}>
    <h2 className="shrink-0 border-b pb-1 font-medium text-muted-foreground text-sm">
      {label}
    </h2>
    <Stack className="min-h-0 flex-1 gap-4">{children}</Stack>
  </Stack>
);
