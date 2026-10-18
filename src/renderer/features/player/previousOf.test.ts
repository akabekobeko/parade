import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { previousOf } from "./previousOf";

const music = (id: number): Music => ({ id }) as Music;

const queue = [music(1), music(2), music(3)];

it("returns the neighbour of a mid-queue track", () => {
  expect(previousOf(queue, music(2))?.id).toBe(1);
});

it("returns null before the head", () => {
  expect(previousOf(queue, music(1))).toBeNull();
});

it("resolves a replaced queue: no previous", () => {
  // Queue replacement policy: the playing track is outside the new queue.
  expect(previousOf(queue, music(99))).toBeNull();
});

it("returns null before anything has played", () => {
  expect(previousOf(queue, null)).toBeNull();
});

it("returns null with an empty queue", () => {
  expect(previousOf([], music(1))).toBeNull();
});

it("repeat all wraps the head around to the tail", () => {
  expect(previousOf(queue, music(1), "all")?.id).toBe(3);
});

it("repeat all keeps the neighbour mid-queue", () => {
  expect(previousOf(queue, music(3), "all")?.id).toBe(2);
});

it("repeat all makes a one-track queue its own previous", () => {
  expect(previousOf([music(1)], music(1), "all")?.id).toBe(1);
});

it("repeat all gives an outsider no previous (replacement policy wins)", () => {
  expect(previousOf(queue, music(99), "all")).toBeNull();
  expect(previousOf(queue, null, "all")).toBeNull();
});

it("repeat all still has nothing with an empty queue", () => {
  expect(previousOf([], music(1), "all")).toBeNull();
});

it("repeat one behaves like off", () => {
  expect(previousOf(queue, music(2), "one")?.id).toBe(1);
  expect(previousOf(queue, music(1), "one")).toBeNull();
  expect(previousOf(queue, music(99), "one")).toBeNull();
});
