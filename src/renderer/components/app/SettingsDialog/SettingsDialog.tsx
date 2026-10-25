import { useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/features/i18n/useT";
import { settingsDialogStore } from "@/features/settings/settingsDialogStore";
import { SettingsDialogContent } from "./SettingsDialogContent";

/**
 * Settings dialog (toolbar Settings button / menu → Settings…,
 * `docs/specs/v1.0/renderer/routing-layout.md`), mounted once in the
 * AppLayout; visibility follows `settingsDialogStore`. Base UI unmounts the
 * popup while closed, so the content (and its stats subscription) lives
 * only while the dialog is shown, exit animation included.
 */
export const SettingsDialog = () => {
  const t = useT();
  const open = useSyncExternalStore(
    settingsDialogStore.subscribe,
    settingsDialogStore.getSnapshot,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          settingsDialogStore.close();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
        </DialogHeader>
        <SettingsDialogContent />
      </DialogContent>
    </Dialog>
  );
};
