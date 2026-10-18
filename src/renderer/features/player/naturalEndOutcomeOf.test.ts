import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { naturalEndOutcomeOf } from "./naturalEndOutcomeOf";
import type { PlayerState, RepeatMode } from "./types";

const music = (id: number): Music => ({ id }) as Music;

const queue = [music(1), music(2), music(3)];

const stateOf = (
  repeat: RepeatMode,
  current: Music | null,
  tracks: readonly Music[] = queue,
  shuffle = false,
): PlayerState => ({
  queue: tracks,
  orderedQueue: tracks,
  queueSource: "album",
  current,
  shuffle,
  repeat,
});

it("off advances to the next track mid-queue", () => {
  expect(naturalEndOutcomeOf(stateOf("off", music(1)))).toEqual({
    type: "advance",
    music: music(2),
  });
});

it("off stops at the tail", () => {
  expect(naturalEndOutcomeOf(stateOf("off", music(3)))).toEqual({
    type: "stop",
  });
});

it("off stops with an empty queue", () => {
  expect(naturalEndOutcomeOf(stateOf("off", music(1), []))).toEqual({
    type: "stop",
  });
});

it("off enters a replaced queue from its head", () => {
  expect(naturalEndOutcomeOf(stateOf("off", music(99)))).toEqual({
    type: "advance",
    music: music(1),
  });
});

it("all advances to the next track mid-queue", () => {
  expect(naturalEndOutcomeOf(stateOf("all", music(2)))).toEqual({
    type: "advance",
    music: music(3),
  });
});

it("all wraps from the tail to the head", () => {
  expect(naturalEndOutcomeOf(stateOf("all", music(3)))).toEqual({
    type: "advance",
    music: music(1),
  });
});

it("all advances a one-track queue to the same track (not a restart)", () => {
  expect(naturalEndOutcomeOf(stateOf("all", music(1), [music(1)]))).toEqual({
    type: "advance",
    music: music(1),
  });
});

it("all stops with an empty queue", () => {
  expect(naturalEndOutcomeOf(stateOf("all", music(1), []))).toEqual({
    type: "stop",
  });
});

it("all wraps the shuffled order as it is", () => {
  const shuffled = [music(2), music(3), music(1)];
  expect(naturalEndOutcomeOf(stateOf("all", music(1), shuffled, true))).toEqual(
    { type: "advance", music: music(2) },
  );
});

it("one restarts mid-queue and at the tail", () => {
  expect(naturalEndOutcomeOf(stateOf("one", music(1)))).toEqual({
    type: "restart",
  });
  expect(naturalEndOutcomeOf(stateOf("one", music(3)))).toEqual({
    type: "restart",
  });
});

it("one restarts even with an empty queue or an outsider track", () => {
  expect(naturalEndOutcomeOf(stateOf("one", music(1), []))).toEqual({
    type: "restart",
  });
  expect(naturalEndOutcomeOf(stateOf("one", music(99)))).toEqual({
    type: "restart",
  });
});
