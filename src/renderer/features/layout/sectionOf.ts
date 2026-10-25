import type { ViewSection } from "@mp/ipc";

/**
 * Main section of a router pathname, decided by the route prefix (so every
 * artist / playlist sub-route counts); `null` for paths outside the three
 * main sections (the fallback redirect handles them). Unlike `lastViewOf`
 * this ignores the selection within the section.
 *
 * @param pathname - Current `location.pathname` (hash part without `#`).
 * @returns The section, or `null`.
 */
export const sectionOf = (pathname: string): ViewSection | null =>
  pathname.startsWith("/artists")
    ? "artists"
    : pathname.startsWith("/albums")
      ? "albums"
      : pathname.startsWith("/playlists")
        ? "playlists"
        : null;
