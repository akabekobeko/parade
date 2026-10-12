/**
 * Apply's enabled state in the album info dialog
 * (`docs/specs/v1.4/features/album-favorite.md`): the Favorite differs from
 * its initial value and no apply is running. The one item has nothing to
 * validate, so there is no validity verdict.
 *
 * @param isDefaultValue - TanStack Form's verdict: every value equals its default.
 * @param applying - An apply is in flight.
 * @returns Whether Apply can be pressed.
 */
export const canApplyAlbumInfo = (
  isDefaultValue: boolean,
  applying: boolean,
): boolean => !isDefaultValue && !applying;
