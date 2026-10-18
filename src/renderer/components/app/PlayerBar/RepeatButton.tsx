import { Repeat1 as Repeat1Icon, Repeat as RepeatIcon } from "lucide-react";
import { useT } from "@/features/i18n/useT";
import type { RepeatMode } from "@/features/player/types";
import { IconButton } from "../Buttons/IconButton";

type Props = {
  /** Current repeat mode; decides the icon, the lit state and the label. */
  readonly mode: RepeatMode;
  /** Button click; `PlayerBand` maps it to `commands.cycleRepeat`. */
  readonly onCycle: () => void;
};

/**
 * Label key per mode. The label names the CURRENT mode, not the one a click
 * leads to: unlike the shuffle toggle, three states need telling apart.
 */
const LABEL_KEYS = {
  off: "player.repeatOff",
  all: "player.repeatAll",
  one: "player.repeatOne",
} as const;

/**
 * Repeat-mode cycle button between the seek bar and the shuffle toggle
 * (`docs/specs/v1.5/features/repeat-button.md`). Each click steps off, all,
 * one, off; there is no way back. `IconButton` renders the lit state
 * (`pressed` coloured icon) from `aria-pressed`, which is on for `all` and
 * `one` alike: the two differ by the icon only (`Repeat1` carries a "1").
 * Enabled without a current track, so the mode can be set before playing.
 *
 * The accessible name changes with the mode, on purpose: a boolean
 * `aria-pressed` cannot tell `all` from `one`, so the label carries the
 * mode. This departs from the toggle-button pattern (stable name, state in
 * `aria-pressed`) and some assistive technology re-announces a control
 * whose name changed; the spec accepts that over a hidden live region.
 */
export const RepeatButton = ({ mode, onCycle }: Props) => {
  const t = useT();
  const label = t(LABEL_KEYS[mode]);
  return (
    <IconButton
      variant="ring"
      aria-label={label}
      title={label}
      aria-pressed={mode !== "off"}
      onClick={onCycle}
    >
      {mode === "one" ? <Repeat1Icon /> : <RepeatIcon />}
    </IconButton>
  );
};
