import type { SmartPlaylistRules } from "@mp/ipc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { fromDraft } from "../SmartRulesForm/fromDraft";
import { SmartRulesForm } from "../SmartRulesForm/SmartRulesForm";
import { useRulesDraft } from "../SmartRulesForm/useRulesDraft";

type Props = {
  /** Dialog heading ("New smart playlist"). */
  readonly title: string;
  /** Initial value of the name input. */
  readonly initialName: string;
  /**
   * Save button click, with the rules built from the draft and the trimmed
   * name. The caller closes the dialog.
   */
  readonly onSubmit: (rules: SmartPlaylistRules, name: string) => void;
  /** Cancel click or dismissal (Escape / backdrop); the caller unmounts. */
  readonly onClose: () => void;
};

/**
 * Smart-playlist creation dialog (`docs/specs/v1.0/features/playlist.md`):
 * the name input above the shared `SmartRulesForm`, starting from the
 * empty draft. Editing an existing playlist's rules moved to the playlist
 * info dialog (`docs/specs/v1.6/features/playlist-info-dialog.md`).
 *
 * Mount conditionally (`{open && <SmartRulesDialog …/>}`) — unmounting is
 * what resets the form state.
 */
export const SmartRulesDialog = ({
  title,
  initialName,
  onSubmit,
  onClose,
}: Props) => {
  const t = useT();
  const rules = useRulesDraft();
  const [name, setName] = useState(initialName);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <Input
            autoFocus
            placeholder={t("playlist.defaultName")}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <SmartRulesForm {...rules} />
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => onSubmit(fromDraft(rules.draft), name.trim())}>
            {t("smart.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
