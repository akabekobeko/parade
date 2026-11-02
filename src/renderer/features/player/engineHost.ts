import { clampPlaybackRate } from "../../../shared/clampPlaybackRate";
import { clampVolume } from "../audio/clampVolume";
import type {
  AudioEngine,
  AudioEngineOptions,
  PlaybackSnapshot,
} from "../audio/types";

/**
 * React-free holder of the active audio engine
 * (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * `useSyncExternalStore` needs a stable `subscribe` identity, but the engine
 * is replaced on every track change. The host bridges that gap: components
 * subscribe to the host once, and the host re-wires itself to whichever
 * engine is current (notifying on swaps as well as on engine changes).
 *
 * The host also owns the app-level volume, playback rate and pitch
 * preservation — the engine is the authority only while it exists; these
 * values must survive between tracks and before the first one
 * (`docs/specs/v1.7/architecture/playback-rate.md`).
 */

/** The app-level values handed to every new engine. */
type Held = Required<AudioEngineOptions>;

/** Snapshot shown when no engine exists (before the first playback). */
const idleSnapshot = (held: Held): PlaybackSnapshot => ({
  state: "stopped",
  currentTime: 0,
  duration: 0,
  volume: held.volume,
  rate: held.rate,
  preservesPitch: held.preservesPitch,
  seeking: false,
  error: null,
});

/** Host handle; see module docs. */
export type EngineHost = {
  /** Swap in the next engine (or `null`); the previous one is closed. */
  readonly set: (engine: AudioEngine | null) => void;
  /**
   * The active engine, or `null` before the first track (an engine exists
   * exactly while a track is loaded).
   */
  readonly get: () => AudioEngine | null;
  /** App-level volume: applied to the active engine and kept for the next. */
  readonly setVolume: (volume: number) => void;
  /** The app-level volume in `[0, 1]`; handed to every new engine. */
  readonly getVolume: () => number;
  /**
   * App-level playback rate (`clampPlaybackRate`): applied to the active
   * engine and kept for the next.
   */
  readonly setRate: (rate: number) => void;
  /** The app-level playback rate; handed to every new engine. */
  readonly getRate: () => number;
  /**
   * App-level pitch preservation: applied to the active engine and kept
   * for the next.
   */
  readonly setPreservesPitch: (enabled: boolean) => void;
  /** The app-level pitch preservation; handed to every new engine. */
  readonly getPreservesPitch: () => boolean;
  /**
   * Register a listener; returns the unsubscribe function. Fires on engine
   * swaps, on every change of the active engine, and on volume / rate /
   * pitch changes while idle. The identity is stable across swaps.
   */
  readonly subscribe: (listener: () => void) => () => void;
  /**
   * The active engine's snapshot, or an idle `stopped` snapshot carrying
   * the app-level volume, rate and pitch preservation while no engine
   * exists.
   */
  readonly getSnapshot: () => PlaybackSnapshot;
};

/**
 * The host implementation: every mutable piece is a private field declared
 * here, and the idle snapshot is a pure projection of `#held`. Created
 * through {@link createEngineHost}; the class is an implementation detail.
 *
 * Methods are arrow properties so they can be passed around detached
 * (`useSyncExternalStore(host.subscribe, host.getSnapshot)`).
 */
class EngineHostImpl implements EngineHost {
  readonly #listeners = new Set<() => void>();
  #engine: AudioEngine | null = null;
  #detachEngine: (() => void) | null = null;
  #held: Held;
  #idle: PlaybackSnapshot;

  constructor(initial: AudioEngineOptions) {
    this.#held = {
      volume: clampVolume(initial.volume ?? 1),
      rate: clampPlaybackRate(initial.rate ?? 1),
      preservesPitch: initial.preservesPitch ?? true,
    };
    this.#idle = idleSnapshot(this.#held);
  }

  readonly set = (next: AudioEngine | null): void => {
    this.#detachEngine?.();
    this.#detachEngine = null;
    this.#engine?.close();
    this.#engine = next;
    if (next !== null) {
      this.#detachEngine = next.subscribe(this.#notify);
    }

    this.#notify();
  };

  readonly get = (): AudioEngine | null => this.#engine;

  readonly setVolume = (volume: number): void => {
    const next = clampVolume(volume);
    this.#hold({ volume: next }, (engine) => engine.setVolume(next));
  };

  readonly getVolume = (): number => this.#held.volume;

  readonly setRate = (rate: number): void => {
    const next = clampPlaybackRate(rate);
    this.#hold({ rate: next }, (engine) => engine.setRate(next));
  };

  readonly getRate = (): number => this.#held.rate;

  readonly setPreservesPitch = (enabled: boolean): void => {
    this.#hold({ preservesPitch: enabled }, (engine) =>
      engine.setPreservesPitch(enabled),
    );
  };

  readonly getPreservesPitch = (): boolean => this.#held.preservesPitch;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): PlaybackSnapshot =>
    this.#engine?.getSnapshot() ?? this.#idle;

  readonly #notify = (): void => {
    for (const listener of [...this.#listeners]) {
      listener();
    }
  };

  /**
   * Keep a value and either forward it to the active engine (whose own
   * snapshot change notifies) or refresh the idle snapshot and notify.
   */
  #hold(patch: Partial<Held>, forward: (engine: AudioEngine) => void): void {
    this.#held = { ...this.#held, ...patch };
    this.#idle = idleSnapshot(this.#held);
    if (this.#engine !== null) {
      forward(this.#engine);
    } else {
      this.#notify();
    }
  }
}

/**
 * Create an engine host.
 *
 * @param initial - Volume, playback rate and pitch preservation before the
 *   first engine exists (defaults: `1`, `1`, `true`).
 * @returns The host.
 */
export const createEngineHost = (
  initial: AudioEngineOptions = {},
): EngineHost => new EngineHostImpl(initial);
