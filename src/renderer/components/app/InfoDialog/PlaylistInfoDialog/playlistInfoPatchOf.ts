import type { Playlist, PlaylistUpdateRequest } from "@mp/ipc";
import { fromDraft } from "@/pages/playlists/components/SmartRulesForm/fromDraft";
import type { RulesDraft } from "@/pages/playlists/components/SmartRulesForm/rulesDraft";

/** The dialog's current inputs. */
export type PlaylistInfoInput = {
  /** Name field value (compared trimmed). */
  readonly name: string;
  /** Rules draft of a smart playlist; `null` for a static one. */
  readonly draft: RulesDraft | null;
  /** Picked image file, or `null` when none was picked. */
  readonly file: File | null;
};

/** What Apply would send (`docs/specs/v1.6/features/playlist-info-dialog.md`). */
export type PlaylistInfoPatch = {
  /** `mp:playlist:update` patch; `null` when neither name nor rules changed. */
  readonly update: Pick<PlaylistUpdateRequest, "name" | "rules"> | null;
  /** The picked image file; `null` when none was picked. */
  readonly file: File | null;
};

/**
 * Decide what the playlist info dialog saves.
 *
 * - The name counts as changed when its trimmed value differs from the
 *   target's. An empty name is never sent (Apply is disabled instead, see
 *   {@link canApplyPlaylistInfo}).
 * - The rules count as changed when the draft, converted back with
 *   `fromDraft`, serialises differently from the target's rules. A target
 *   without rules (corrupted on disk) always counts as changed so Apply can
 *   overwrite it.
 *
 * @param target - The playlist as the dialog opened it.
 * @param input - The current inputs.
 * @returns The update patch and the picked file.
 */
export const playlistInfoPatchOf = (
  target: Playlist,
  input: PlaylistInfoInput,
): PlaylistInfoPatch => {
  const name = input.name.trim();
  const nameChanged = name !== "" && name !== target.name;
  const rules =
    target.kind === "smart" && input.draft !== null
      ? fromDraft(input.draft)
      : undefined;
  const rulesChanged =
    rules !== undefined &&
    (target.rules === undefined ||
      JSON.stringify(rules) !== JSON.stringify(target.rules));
  return {
    update:
      nameChanged || rulesChanged
        ? {
            ...(nameChanged ? { name } : {}),
            ...(rulesChanged ? { rules } : {}),
          }
        : null,
    file: input.file,
  };
};

/**
 * Whether the Apply button is enabled: something to save, a non-empty name,
 * and no apply in flight.
 *
 * @param patch - Result of {@link playlistInfoPatchOf}.
 * @param name - Name field value.
 * @param applying - Whether an apply is in flight.
 * @returns `true` when Apply may run.
 */
export const canApplyPlaylistInfo = (
  patch: PlaylistInfoPatch,
  name: string,
  applying: boolean,
): boolean =>
  (patch.update !== null || patch.file !== null) &&
  name.trim() !== "" &&
  !applying;
