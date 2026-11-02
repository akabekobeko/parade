import {
  Gauge as GaugeIcon,
  Minus as MinusIcon,
  Plus as PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";
import { IconButton } from "../../Buttons/IconButton";
import { HStack } from "../../stacks";
import { useSpeedControl } from "./useSpeedControl";

type Props = {
  /** Current playback rate (`[0.25, 2]`). */
  readonly rate: number;
  /** Whether the pitch is kept while the rate differs from 1x. */
  readonly preservesPitch: boolean;
  /**
   * Called with the new rate from a preset, the slider (on every move,
   * applied at once) or the +/- buttons; `PlayerBand` maps it to
   * `commands.setPlaybackRate`.
   */
  readonly onRateChange: (rate: number) => void;
  /** Pitch checkbox; `PlayerBand` maps it to `commands.setPreservesPitch`. */
  readonly onPreservesPitchChange: (enabled: boolean) => void;
};

/**
 * Playback speed button and popover between the shuffle toggle and the
 * queue (`docs/specs/v1.7/features/speed-control.md`).
 *
 * The trigger is the player's ring `IconButton` with a gauge. Away from 1x
 * it takes the `pressed` colour through `data-active` rather than
 * `aria-pressed`: it opens a popover and is not a toggle (the toolbar's
 * `ClusterButton` does the same). The accessible name and tooltip carry
 * the current rate so the value reads without opening the popover.
 * Enabled without a current track, like the volume, so the speed can be
 * set before playing.
 *
 * The popover: heading and current value, the six presets (the current one
 * filled like the app's selected rows, `aria-pressed`), the slider between
 * the - / + buttons (disabled at the ends), and the pitch checkbox in a
 * `<label>` so its text toggles it too. No reset button: the 1x preset is
 * that.
 */
export const SpeedControl = ({
  rate,
  preservesPitch,
  onRateChange,
  onPreservesPitchChange,
}: Props) => {
  const t = useT();
  const control = useSpeedControl(rate, onRateChange);
  const current = t("player.speedCurrent", { rate: control.label });

  return (
    <Popover>
      <PopoverTrigger
        render={
          <IconButton
            variant="ring"
            aria-label={current}
            title={current}
            data-active={control.active || undefined}
            className="data-active:text-pressed data-active:hover:text-pressed"
          />
        }
      >
        <GaugeIcon />
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <HStack className="justify-between">
          <span className="font-medium">{t("player.speed")}</span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {control.label}
          </span>
        </HStack>
        <HStack className="gap-1">
          {control.presets.map((preset) => (
            <Button
              key={preset.rate}
              size="xs"
              variant="outline"
              aria-pressed={preset.selected}
              className={cn(
                "flex-1 px-1 font-mono tabular-nums",
                // The app's selected look (sidebar row, playing queue row);
                // the dark overrides beat `outline`'s `dark:border-input` /
                // `dark:bg-input/30`.
                preset.selected &&
                  "border-foreground bg-foreground text-background dark:border-foreground dark:bg-foreground",
              )}
              onClick={() => onRateChange(preset.rate)}
            >
              {preset.label}
            </Button>
          ))}
        </HStack>
        <HStack>
          <IconButton
            aria-label={t("player.speedDecrease")}
            title={t("player.speedDecrease")}
            disabled={control.slowerDisabled}
            onClick={control.slower}
          >
            <MinusIcon />
          </IconButton>
          <Slider
            appearance="fused"
            aria-label={t("player.speed")}
            min={control.percentRange.min}
            max={control.percentRange.max}
            step={control.percentRange.step}
            value={control.percent}
            onValueChange={control.setPercent}
          />
          <IconButton
            aria-label={t("player.speedIncrease")}
            title={t("player.speedIncrease")}
            disabled={control.fasterDisabled}
            onClick={control.faster}
          >
            <PlusIcon />
          </IconButton>
        </HStack>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: Base UI's Checkbox renders a hidden native input inside the label, which the lint cannot see. */}
        <label className="flex w-fit cursor-default items-center gap-2">
          <Checkbox
            checked={preservesPitch}
            onCheckedChange={onPreservesPitchChange}
          />
          <span>{t("player.keepPitch")}</span>
        </label>
      </PopoverContent>
    </Popover>
  );
};
