import { createLibraryStore } from "./createLibraryStore";
import { fetchLibraryQuery } from "./fetchLibraryQuery";

/** The app-wide library query store. */
export const libraryStore = createLibraryStore(fetchLibraryQuery);
