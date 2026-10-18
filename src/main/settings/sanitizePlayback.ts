import type { PlaybackSettings, RepeatMode } from "../ipc/types";
import { asFiniteNumber } from "./asFiniteNumber";

/** The repeat modes a saved value may carry; anything else falls back. */
const REPEAT_MODES: readonly RepeatMode[] = ["off", "all", "one"];

/**
 * Validate an unknown value as `AppSettings["playback"]`
 * (`docs/specs/v1.5/architecture/playback-settings.md`).
 *
 * Unlike `sanitizeSidebar`, one broken field does not discard the rest:
 * each falls back to its own default (`shuffle: false`, `repeat: "off"`,
 * `volume: 1`), and a finite volume is clamped into `[0, 1]` like
 * `clampVolume` on the Renderer side. Only a non-object discards the whole
 * value.
 *
 * @param value - Raw `playback` value from disk or a patch.
 * @returns The validated settings, or `undefined` for a non-object.
 */
export const sanitizePlayback = (
  value: unknown,
): PlaybackSettings | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const volume = asFiniteNumber(raw.volume);
  return {
    shuffle: raw.shuffle === true,
    repeat: REPEAT_MODES.includes(raw.repeat as RepeatMode)
      ? (raw.repeat as RepeatMode)
      : "off",
    volume: volume === undefined ? 1 : Math.min(1, Math.max(0, volume)),
  };
};
