import type { ReactNode } from "react";

type Props = {
  /** Property label shown in the leading column. */
  readonly label: string;
  /** Display content: text already formatted by the caller, or a control. */
  readonly value: ReactNode;
};

/**
 * Label + value row of an info dialog. The value is plain text for a
 * read-only property; the album info dialog's Favorite row puts its Star
 * toggle there, sitting on the label's baseline like a glyph.
 */
export const PropertyRow = ({ label, value }: Props) => (
  <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-2">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="break-all">{value}</span>
  </div>
);
