import { Plus, Sparkles } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { IconButton } from "@/components/app/Buttons/IconButton";
import { HStack, Stack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import { playlistRouteId } from "@/features/playlist/playlistRouteId";
import { SmartRulesDialog } from "../SmartRulesDialog/SmartRulesDialog";
import { PlaylistRow } from "./PlaylistRow";
import { usePlaylistListPanel } from "./usePlaylistListPanel";

/**
 * Playlist list in the Sidebar's secondary area
 * (`docs/specs/v1.0/features/playlist.md`): a fixed header (name filter,
 * icon-only "New playlist" / "New smart playlist" with delayed tooltips),
 * every playlist of both kinds as `PlaylistRow`s (inline rename included),
 * and deletion behind a confirmation dialog. The selected playlist lives in
 * the URL (`/playlists/<routeId>`).
 */
export const PlaylistListPanel = () => {
  const t = useT();
  const {
    playlists,
    playlistsState,
    selectedRouteId,
    editingRouteId,
    setEditingRouteId,
    deleting,
    setDeleting,
    creatingSmart,
    setCreatingSmart,
    query,
    setQuery,
    openPlaylist,
    create,
    createSmart,
    rename,
    confirmDelete,
  } = usePlaylistListPanel();

  return (
    <Stack className="h-full gap-0">
      <TooltipProvider delay={TOOLTIP_DELAY_MS}>
        <HStack className="shrink-0 p-2">
          <Input
            type="search"
            placeholder={t("playlist.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <HeaderButton label={t("playlist.new")} onClick={() => void create()}>
            <Plus />
          </HeaderButton>
          <HeaderButton
            label={t("playlist.newSmart")}
            onClick={() => setCreatingSmart(true)}
          >
            <Sparkles />
          </HeaderButton>
        </HStack>
      </TooltipProvider>
      {playlistsState.status === "error" && (
        <p className="break-all px-3 py-2 text-destructive text-xs">
          {t("library.loadFailed", { message: playlistsState.error.message })}
        </p>
      )}
      {playlistsState.status === "success" &&
        playlistsState.value.length === 0 && (
          <p className="px-3 py-2 text-muted-foreground text-xs">
            {t("playlist.empty")}
          </p>
        )}
      <div className="flex-1 overflow-y-auto px-2">
        {playlists.map((playlist) => {
          const routeId = playlistRouteId(playlist);
          return (
            <PlaylistRow
              key={routeId}
              playlist={playlist}
              selected={routeId === selectedRouteId}
              editing={editingRouteId === routeId}
              onOpen={() => openPlaylist(routeId)}
              onStartRename={() => setEditingRouteId(routeId)}
              onRename={(name) => void rename(playlist, name)}
              onCancelRename={() => setEditingRouteId(null)}
              onDelete={() => setDeleting(playlist)}
            />
          );
        })}
      </div>

      {creatingSmart && (
        <SmartRulesDialog
          title={t("playlist.newSmart")}
          initialName={t("playlist.defaultName")}
          onClose={() => setCreatingSmart(false)}
          onSubmit={(rules, name) => void createSmart(rules, name)}
        />
      )}

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("playlist.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("playlist.deleteMessage", { name: deleting?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              {t("playlist.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

/** Delay before the tooltips show — an instant popup is distracting here. */
const TOOLTIP_DELAY_MS = 700;

type HeaderButtonProps = Pick<ComponentProps<typeof IconButton>, "onClick"> & {
  /** Tooltip text, doubling as the accessible name. */
  readonly label: string;
  /** The icon. */
  readonly children: ReactNode;
};

/** One icon-only header button with its delayed tooltip. */
const HeaderButton = ({ label, children, ...props }: HeaderButtonProps) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <IconButton className="shrink-0" aria-label={label} {...props}>
          {children}
        </IconButton>
      }
    />
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);
