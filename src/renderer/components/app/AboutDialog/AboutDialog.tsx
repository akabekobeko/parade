import { useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { aboutStore } from "@/features/about/aboutStore";
import { useLocale } from "@/features/i18n/useLocale";
import { useT } from "@/features/i18n/useT";
import { AboutDialogContent } from "./AboutDialogContent";

/**
 * Hand a link to the default browser. A refusal (the main process accepts
 * `https:` only) or a shell failure has no UI; it is logged with the main
 * process's reason so a dead link can be traced.
 */
const openExternal = (url: string): void => {
  void window.mp.app.openExternal({ url }).then((result) => {
    if (!result.ok) {
      console.warn(`[about] could not open ${url}: ${result.error.message}`);
    }
  });
};

/**
 * About dialog (menu → About), mounted once in the AppLayout. Shows the app
 * version, the runtime versions reported by `mp:app:getVersions`, the links
 * to the website and the GitHub project, and the music data credits.
 */
export const AboutDialog = () => {
  const t = useT();
  const locale = useLocale();
  const state = useSyncExternalStore(
    aboutStore.subscribe,
    aboutStore.getSnapshot,
  );
  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          aboutStore.close();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("app.name")}</DialogTitle>
          {state.open && state.versions !== null && (
            <DialogDescription>
              {t("about.version", { version: state.versions.app })}
            </DialogDescription>
          )}
        </DialogHeader>
        {state.open && (
          <AboutDialogContent
            versions={state.versions}
            error={state.error}
            locale={locale}
            onOpenExternal={openExternal}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
