import { expect, it, vi } from "vitest";
import type { AudioEngine, PlaybackSnapshot } from "../audio/types";
import { createEngineHost } from "./engineHost";

const snapshot = (patch: Partial<PlaybackSnapshot> = {}): PlaybackSnapshot => ({
  state: "playing",
  currentTime: 1,
  duration: 100,
  volume: 1,
  rate: 1,
  preservesPitch: true,
  seeking: false,
  error: null,
  ...patch,
});

/** Minimal fake engine capturing calls and exposing its own listeners. */
const createFakeEngine = (initial: PlaybackSnapshot = snapshot()) => {
  const listeners = new Set<() => void>();
  let current = initial;
  return {
    engine: {
      play: vi.fn(async () => {}),
      pause: vi.fn(),
      stop: vi.fn(),
      seek: vi.fn(),
      setVolume: vi.fn(),
      setRate: vi.fn(),
      setPreservesPitch: vi.fn(),
      close: vi.fn(),
      getSnapshot: () => current,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSpectrums: () => null,
    } satisfies AudioEngine,
    emit: (next: PlaybackSnapshot) => {
      current = next;
      for (const listener of [...listeners]) {
        listener();
      }
    },
    listenerCount: () => listeners.size,
  };
};

it("returns the idle snapshot before any engine exists", () => {
  const host = createEngineHost({ volume: 0.7 });
  expect(host.getSnapshot()).toMatchObject({
    state: "stopped",
    volume: 0.7,
    rate: 1,
    preservesPitch: true,
  });
  expect(host.getSnapshot()).toBe(host.getSnapshot());
});

it("starts from the given rate (clamped) and pitch preservation", () => {
  const host = createEngineHost({ rate: 1.13, preservesPitch: false });
  expect(host.getRate()).toBe(1.15);
  expect(host.getPreservesPitch()).toBe(false);
  expect(host.getSnapshot()).toMatchObject({
    rate: 1.15,
    preservesPitch: false,
  });
});

it("defaults to volume 1, rate 1 and pitch preserved", () => {
  const host = createEngineHost();
  expect(host.getVolume()).toBe(1);
  expect(host.getRate()).toBe(1);
  expect(host.getPreservesPitch()).toBe(true);
});

it("proxies the active engine's snapshot", () => {
  const host = createEngineHost();
  const { engine } = createFakeEngine(snapshot({ currentTime: 42 }));
  host.set(engine);
  expect(host.getSnapshot().currentTime).toBe(42);
});

it("notifies host subscribers on engine swap and on engine changes", () => {
  const host = createEngineHost();
  const listener = vi.fn();
  host.subscribe(listener);

  const first = createFakeEngine();
  host.set(first.engine);
  expect(listener).toHaveBeenCalledTimes(1);

  first.emit(snapshot({ currentTime: 5 }));
  expect(listener).toHaveBeenCalledTimes(2);
});

it("closes and detaches the previous engine on swap", () => {
  const host = createEngineHost();
  const first = createFakeEngine();
  const second = createFakeEngine();
  host.set(first.engine);
  host.set(second.engine);

  expect(first.engine.close).toHaveBeenCalledTimes(1);
  expect(first.listenerCount()).toBe(0);

  // Events from the abandoned engine no longer reach host subscribers.
  const listener = vi.fn();
  host.subscribe(listener);
  first.emit(snapshot());
  expect(listener).not.toHaveBeenCalled();
});

it("applies the volume to the active engine and keeps it for the next", () => {
  const host = createEngineHost();
  const first = createFakeEngine();
  host.set(first.engine);
  host.setVolume(0.3);
  expect(first.engine.setVolume).toHaveBeenCalledWith(0.3);
  expect(host.getVolume()).toBe(0.3);
});

it("reflects a volume change in the idle snapshot and notifies", () => {
  const host = createEngineHost();
  const listener = vi.fn();
  host.subscribe(listener);
  host.setVolume(0.5);
  expect(host.getSnapshot().volume).toBe(0.5);
  expect(listener).toHaveBeenCalledTimes(1);
});

it("reflects rate and pitch changes in the idle snapshot and notifies", () => {
  const host = createEngineHost();
  const listener = vi.fn();
  host.subscribe(listener);

  host.setRate(1.5);
  expect(host.getSnapshot().rate).toBe(1.5);
  expect(listener).toHaveBeenCalledTimes(1);

  host.setPreservesPitch(false);
  expect(host.getSnapshot().preservesPitch).toBe(false);
  expect(listener).toHaveBeenCalledTimes(2);
});

it("clamps and steps the rate before keeping it", () => {
  const host = createEngineHost();
  host.setRate(1.1500000000000001);
  expect(host.getRate()).toBe(1.15);
  host.setRate(10);
  expect(host.getRate()).toBe(2);
  host.setRate(Number.NaN);
  expect(host.getRate()).toBe(1);
});

it("forwards rate and pitch to the active engine without notifying itself", () => {
  const host = createEngineHost();
  const { engine } = createFakeEngine();
  host.set(engine);
  const listener = vi.fn();
  host.subscribe(listener);

  host.setRate(1.25);
  expect(engine.setRate).toHaveBeenCalledWith(1.25);
  host.setPreservesPitch(false);
  expect(engine.setPreservesPitch).toHaveBeenCalledWith(false);
  // The engine's own snapshot change is what notifies while it exists.
  expect(listener).not.toHaveBeenCalled();
  expect(host.getRate()).toBe(1.25);
  expect(host.getPreservesPitch()).toBe(false);
});

it("keeps rate and pitch across an engine swap", () => {
  const host = createEngineHost();
  const first = createFakeEngine();
  host.set(first.engine);
  host.setRate(2);
  host.setPreservesPitch(false);

  const second = createFakeEngine();
  host.set(second.engine);
  expect(host.getRate()).toBe(2);
  expect(host.getPreservesPitch()).toBe(false);

  host.set(null);
  expect(host.getSnapshot()).toMatchObject({ rate: 2, preservesPitch: false });
});

it("set(null) closes the current engine and falls back to idle", () => {
  const host = createEngineHost();
  const { engine } = createFakeEngine();
  host.set(engine);
  host.set(null);
  expect(engine.close).toHaveBeenCalledTimes(1);
  expect(host.getSnapshot().state).toBe("stopped");
});
