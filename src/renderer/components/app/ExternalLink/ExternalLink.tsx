import type { ReactNode } from "react";
import { cn } from "@/libs/utils";

type Props = {
  /** Absolute `https:` URL. */
  readonly href: string;
  /** Opens the URL outside the app (production: `mp:app:openExternal`). */
  readonly onOpen: (url: string) => void;
  readonly children: ReactNode;
  readonly className?: string;
};

/**
 * A link that opens in the user's default browser instead of navigating the
 * sandboxed renderer. It stays a real anchor with `href` so it reads as a
 * link to assistive technology and shows the URL on hover; the click is
 * intercepted and handed to `onOpen`.
 */
export const ExternalLink = ({ href, onOpen, children, className }: Props) => (
  <a
    href={href}
    className={cn(
      "underline underline-offset-3 hover:text-foreground",
      className,
    )}
    onClick={(event) => {
      event.preventDefault();
      onOpen(href);
    }}
  >
    {children}
  </a>
);
