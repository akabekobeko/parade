import type { Music } from "@mp/ipc";
import {
  createContext,
  type ReactNode,
  useContext,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toMediaStreamUrl } from "@/libs/toMediaStreamUrl";
import { createAudioEngine } from "../audio/createAudioEngine";
import type { PlaybackSnapshot } from "../audio/types";
import { createEngineHost, type EngineHost } from "./engineHost";
import { registerMediaSessionHandlers } from "./mediaSession/registerMediaSessionHandlers";
import { syncMediaSessionPlayback } from "./mediaSession/syncMediaSessionPlayback";
import { updateMediaSessionMetadata } from "./mediaSession/updateMediaSessionMetadata";
import { menuStateSync } from "./menuStateSync";
import { isNaturalEnd } from "./naturalEnd";
import { naturalEndOutcomeOf } from "./naturalEndOutcomeOf";
import { nextOf } from "./nextOf";
import { nextRepeatMode } from "./nextRepeatMode";
import { setActivePlayer } from "./playerBridge";
import { type PlayerAction, playerReducer } from "./playerReducer";
import { previousOf } from "./previousOf";
import { shuffle } from "./shuffle";
import {
  INITIAL_PLAYER_STATE,
  type PlayerState,
  type QueueSource,
  type RepeatMode,
} from "./types";

/**
 * Queue / current-track state and the playback commands
 * (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * No async actions: commands are plain async functions doing the side
 * effects (engine swap, engine calls) and dispatching pure notifications to
 * the reducer. State and Commands live in separate contexts so command-only
 * consumers never re-render on state changes; the Commands object is
 * created exactly once (useState initializer) and stays referentially
 * stable without useCallback.
 */

/** Commands exposed by the provider. */
export type PlayerCommands = {
  /**
   * Start a track, replacing the queue with the view's list. While shuffle
   * mode is on the track plays first and the rest follows shuffled.
   *
   * @param music - The track to start (becomes `current`).
   * @param queue - The view's list in display order.
   * @param source - Which view supplied the list.
   */
  readonly playMusic: (
    music: Music,
    queue: readonly Music[],
    source: QueueSource,
  ) => Promise<void>;
  /**
   * Turn shuffle mode on and play the view's list in a shuffled order
   * (the headers' shuffle play). An empty list is a no-op.
   *
   * @param queue - The view's list in display order.
   * @param source - Which view supplied the list.
   */
  readonly playShuffled: (
    queue: readonly Music[],
    source: QueueSource,
  ) => Promise<void>;
  /**
   * Toggle shuffle mode: on reshuffles the current queue (current track
   * first), off restores the view order. Playback keeps running; the menu
   * is told the new mode (`menuStateSync`).
   */
  readonly toggleShuffle: () => void;
  /**
   * Set the repeat mode (the Controls menu's radio items). Playback keeps
   * running: the engine is not touched and the mode applies from the next
   * track end or previous / next press. The same mode again is a no-op;
   * otherwise the menu is told the new mode (`menuStateSync`).
   */
  readonly setRepeat: (mode: RepeatMode) => void;
  /**
   * Cycle the repeat mode off, all, one, off (the PlayerBar's repeat
   * button); one step per call, through `setRepeat`.
   */
  readonly cycleRepeat: () => void;
  /**
   * Start the next track (`nextOf` with the repeat mode); a no-op at the
   * queue tail unless repeat is `all`, which wraps to the head. Swaps the
   * engine and leaves the queue untouched.
   */
  readonly playNext: () => Promise<void>;
  /**
   * Start the previous track (`previousOf` with the repeat mode); a no-op
   * at the head (unless repeat is `all`, which wraps to the tail) or when
   * the current track is outside the queue.
   */
  readonly playPrevious: () => Promise<void>;
  /** Pause when playing, otherwise play; a no-op before the first track. */
  readonly togglePlayPause: () => void;
  /** Rewind the active engine to the start and stop; `current` stays. */
  readonly stop: () => void;
  /** Seek the active engine (seconds); a no-op before the first track. */
  readonly seek: (timeSec: number) => void;
  /** Set the app volume (`[0, 1]`); survives across tracks. */
  readonly setVolume: (volume: number) => void;
  /** Replace the queue, keeping the current track and playback running. */
  readonly replaceQueue: (queue: readonly Music[], source: QueueSource) => void;
  /** Insert tracks right after the current one ("Play next"). */
  readonly insertNext: (musics: readonly Music[]) => void;
  /** Append tracks to the queue tail ("Add to queue"). */
  readonly appendToQueue: (musics: readonly Music[]) => void;
  /**
   * Swap edited tracks (re-read after a write) into the queue and the
   * current track; a changed current track also refreshes the OS media
   * controls. Playback is left as it is.
   */
  readonly updateMusics: (musics: readonly Music[]) => void;
};

const PlayerStateContext = createContext<PlayerState | null>(null);
const PlayerCommandsContext = createContext<PlayerCommands | null>(null);
const EngineHostContext = createContext<EngineHost | null>(null);

/**
 * Build the stable Commands object.
 *
 * @param host - Engine host (owns the active engine + volume).
 * @param stateRef - Always-current player state (updated during render).
 * @param dispatch - The reducer dispatch.
 * @returns The commands; created once per provider mount.
 */
const createCommands = (
  host: EngineHost,
  stateRef: { readonly current: PlayerState },
  dispatch: (action: PlayerAction) => void,
): PlayerCommands => {
  /**
   * Swap the engine to a new track and start playback.
   *
   * The `ended` follow-up (advance, restart under repeat `one`, or stop at
   * the tail; `naturalEndOutcomeOf`) is registered here, in the command
   * that creates the engine, never via useEffect watching `current`
   * (`docs/specs/v1.0/renderer/state-management.md`).
   */
  const startEngine = (music: Music): void => {
    const engine = createAudioEngine(toMediaStreamUrl(music.filePath), {
      volume: host.getVolume(),
    });
    let advanced = false;
    engine.subscribe(() => {
      const snapshot = engine.getSnapshot();
      // OS media controls follow every snapshot change without passing
      // through React rendering (docs/specs/v1.0/features/player-ui.md).
      syncMediaSessionPlayback(snapshot);
      if (advanced || !isNaturalEnd(snapshot)) {
        return;
      }

      advanced = true;
      const outcome = naturalEndOutcomeOf(stateRef.current);
      switch (outcome.type) {
        case "advance":
          // Like next / previous: the queue stays as it is and only the
          // current track moves. Not `playMusic`, which rebuilds the queue
          // and under shuffle would reshuffle it on every advance.
          switchTo(outcome.music);
          break;
        case "restart": {
          // Repeat one: a fresh engine for the same track, like a track
          // switch (not `HTMLMediaElement.loop`, which never fires `ended`
          // and so would bypass this decision). The state does not change,
          // so nothing is dispatched; the current track is read back from
          // the state in case its metadata was edited meanwhile.
          const current = stateRef.current.current;
          if (current !== null) {
            startEngine(current);
          } else {
            engine.stop();
          }
          break;
        }
        case "stop":
          // Queue tail: rewind to 0:00 / stopped, keep the current track.
          engine.stop();
          break;
      }
    });
    host.set(engine); // Closes the previous engine.
    updateMediaSessionMetadata(music);
    syncMediaSessionPlayback(engine.getSnapshot());
    void engine.play(); // Failures surface via snapshot.error; no auto-skip.
  };

  /**
   * Move to another track of the existing queue (next / previous / natural
   * end advance): swap the engine and update `current` only.
   */
  const switchTo = (music: Music): void => {
    startEngine(music);
    dispatch({ type: "currentChanged", music });
  };

  const commands: PlayerCommands = {
    playMusic: async (music, queue, source) => {
      const shuffling = stateRef.current.shuffle;
      const playQueue = shuffling
        ? [music, ...shuffle(queue.filter((entry) => entry.id !== music.id))]
        : queue;
      startEngine(music);
      dispatch({
        type: "played",
        music,
        queue: playQueue,
        orderedQueue: queue,
        source,
        shuffle: shuffling,
      });
    },

    playShuffled: async (queue, source) => {
      const shuffled = shuffle(queue);
      const first = shuffled[0];
      if (first === undefined) {
        return;
      }

      startEngine(first);
      dispatch({
        type: "played",
        music: first,
        queue: shuffled,
        orderedQueue: queue,
        source,
        shuffle: true,
      });
      // Turns shuffle on when it was off; `patch` drops the no-op case.
      menuStateSync.patch({ shuffle: true });
    },

    toggleShuffle: () => {
      const { shuffle: enabled, orderedQueue, current } = stateRef.current;
      if (enabled) {
        dispatch({
          type: "shuffleChanged",
          shuffle: false,
          queue: orderedQueue,
        });
        menuStateSync.patch({ shuffle: false });
        return;
      }

      // The current track leads the shuffled order so playback continues
      // seamlessly; a current outside the queue (replacement policy) just
      // shuffles the whole list.
      const queue =
        current !== null &&
        orderedQueue.some((entry) => entry.id === current.id)
          ? [
              current,
              ...shuffle(
                orderedQueue.filter((entry) => entry.id !== current.id),
              ),
            ]
          : shuffle(orderedQueue);
      dispatch({ type: "shuffleChanged", shuffle: true, queue });
      menuStateSync.patch({ shuffle: true });
    },

    setRepeat: (mode) => {
      if (mode === stateRef.current.repeat) {
        return;
      }

      dispatch({ type: "repeatChanged", repeat: mode });
      menuStateSync.patch({ repeat: mode });
    },

    cycleRepeat: () => {
      commands.setRepeat(nextRepeatMode(stateRef.current.repeat));
    },

    playNext: async () => {
      const { queue, current, repeat } = stateRef.current;
      const next = nextOf(queue, current, repeat);
      if (next === null) {
        return;
      }

      switchTo(next);
    },

    playPrevious: async () => {
      const { queue, current, repeat } = stateRef.current;
      const previous = previousOf(queue, current, repeat);
      if (previous === null) {
        return;
      }

      switchTo(previous);
    },

    togglePlayPause: () => {
      const engine = host.get();
      if (engine === null) {
        return;
      }

      if (engine.getSnapshot().state === "playing") {
        engine.pause();
      } else {
        void engine.play();
      }
    },

    stop: () => {
      host.get()?.stop();
    },

    seek: (timeSec) => {
      host.get()?.seek(timeSec);
    },

    setVolume: (volume) => {
      host.setVolume(volume);
    },

    replaceQueue: (queue, source) => {
      dispatch({ type: "queueReplaced", queue, source });
    },

    insertNext: (musics) => {
      dispatch({ type: "queueInsertedNext", musics });
    },

    appendToQueue: (musics) => {
      dispatch({ type: "queueAppended", musics });
    },

    updateMusics: (musics) => {
      const current = stateRef.current.current;
      const replaced =
        current === null
          ? undefined
          : musics.find((music) => music.id === current.id);
      dispatch({ type: "musicsUpdated", musics });
      // The metadata follows the command that changed the current track,
      // like playMusic / playNext (never an effect watching `current`).
      if (replaced !== undefined) {
        updateMediaSessionMetadata(replaced);
      }
    },
  };

  return commands;
};

type Props = {
  /** Subtree that may use the player hooks. */
  readonly children: ReactNode;
};

/**
 * Provide player state, commands, and the engine host to the app.
 */
export const PlayerProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(playerReducer, INITIAL_PLAYER_STATE);

  // Commands read the latest state through this ref (a dispatch cannot
  // return state); assigning during render keeps it in sync.
  const stateRef = useRef(state);
  stateRef.current = state;

  const [host] = useState(() => {
    const created = createEngineHost();
    // Seed the native menu with the modes the reducer started with (the
    // persisted ones once v1.5 Phase 4 seeds the reducer), then keep its
    // playback state in sync; `menuStateSync` drops the pushes where
    // nothing changed (snapshots also tick on currentTime updates).
    menuStateSync.initialize({
      isPlaying: false,
      hasTrack: false,
      shuffle: stateRef.current.shuffle,
      repeat: stateRef.current.repeat,
    });
    created.subscribe(() => {
      menuStateSync.patch({
        isPlaying: created.getSnapshot().state === "playing",
        // An engine exists exactly while a current track is loaded.
        hasTrack: created.get() !== null,
      });
    });
    return created;
  });
  const [commands] = useState(() => createCommands(host, stateRef, dispatch));

  // Publish for React-external listeners (hotkeys, MediaSession handlers).
  // Idempotent pointer assignment — safe under StrictMode double-render.
  setActivePlayer({ commands, getSnapshot: host.getSnapshot });
  // One-shot (internally guarded); handlers reach the commands through the
  // bridge above, so they never go stale.
  registerMediaSessionHandlers();

  return (
    <PlayerStateContext.Provider value={state}>
      <PlayerCommandsContext.Provider value={commands}>
        <EngineHostContext.Provider value={host}>
          {children}
        </EngineHostContext.Provider>
      </PlayerCommandsContext.Provider>
    </PlayerStateContext.Provider>
  );
};

/**
 * Read the queue / current-track state.
 *
 * @returns The player state.
 */
export const usePlayerState = (): PlayerState => {
  const state = useContext(PlayerStateContext);
  if (state === null) {
    throw new Error("usePlayerState must be used within PlayerProvider");
  }

  return state;
};

/**
 * Read the playback commands (stable reference — consumers never re-render
 * on state changes).
 *
 * @returns The commands object.
 */
export const usePlayerCommands = (): PlayerCommands => {
  const commands = useContext(PlayerCommandsContext);
  if (commands === null) {
    throw new Error("usePlayerCommands must be used within PlayerProvider");
  }

  return commands;
};

/**
 * Subscribe to the active engine's playback snapshot.
 *
 * The host survives engine swaps, so the subscription registered here stays
 * valid across track changes (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * @returns The current playback snapshot (idle before the first track).
 */
export const useAudioPlayer = (): PlaybackSnapshot => {
  const host = useContext(EngineHostContext);
  if (host === null) {
    throw new Error("useAudioPlayer must be used within PlayerProvider");
  }

  return useSyncExternalStore(host.subscribe, host.getSnapshot);
};

/**
 * Subscribe to the playback state alone (a primitive), so consumers that
 * only need playing / paused — e.g. the track-row highlight — do not
 * re-render on every 250ms `currentTime` tick.
 *
 * @returns The current engine state.
 */
export const usePlaybackState = (): PlaybackSnapshot["state"] => {
  const host = useContext(EngineHostContext);
  if (host === null) {
    throw new Error("usePlaybackState must be used within PlayerProvider");
  }

  return useSyncExternalStore(host.subscribe, () => host.getSnapshot().state);
};
