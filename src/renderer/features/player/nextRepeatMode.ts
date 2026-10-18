import type { RepeatMode } from "./types";

/**
 * The mode after one press of the PlayerBar's repeat button: `off` to
 * `all` to `one` and back to `off` (`docs/specs/v1.5/features/repeat-button.md`).
 * There is no step back; a full cycle takes three presses.
 *
 * @param mode - The current mode.
 * @returns The next mode in the cycle.
 */
export const nextRepeatMode = (mode: RepeatMode): RepeatMode => {
  switch (mode) {
    case "off":
      return "all";
    case "all":
      return "one";
    case "one":
      return "off";
  }
};
