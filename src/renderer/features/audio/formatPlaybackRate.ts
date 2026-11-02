/**
 * Format a playback rate for display: `"1x"`, `"0.75x"`, `"1.25x"`
 * (`docs/specs/v1.7/features/speed-control.md`). Up to 2 decimals with
 * trailing zeros dropped; the same text in every locale, like the time
 * labels.
 *
 * @param rate - Playback rate (already on the step grid).
 * @returns The display text.
 */
export const formatPlaybackRate = (rate: number): string =>
  `${Number(rate.toFixed(2))}x`;
