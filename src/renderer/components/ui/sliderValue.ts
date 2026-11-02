/**
 * Coerce Base UI's single-or-array `Slider` value into a number: the
 * `onValueChange` payload is an array only for multi-thumb sliders, and
 * every slider of the app has one thumb.
 *
 * @param value - The value Base UI handed to `onValueChange`.
 * @returns The first (only) thumb's value.
 */
export const sliderValueAsNumber = (
  value: number | readonly number[],
): number => (Array.isArray(value) ? (value[0] ?? 0) : (value as number));
