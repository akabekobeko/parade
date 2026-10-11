import { type LucideProps, Star } from "lucide-react";
import { cn } from "@/libs/utils";

/**
 * Star (solid), the "favorite is on" state of `FavoriteStarButton`.
 *
 * lucide draws outlines only, so the app-wide "solid" look lives here instead
 * of being repeated as `fill-current` at every call site.
 */
export const StarFillIcon = ({ className, ...props }: LucideProps) => (
  <Star className={cn("fill-current", className)} {...props} />
);
