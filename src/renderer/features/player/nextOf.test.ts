import type { Music } from "@mp/ipc";
import { expect, it } from "vitest";
import { nextOf } from "./nextOf";

const music = (id: number): Music => ({ id }) as Music;

const queue = [music(1), music(2), music(3)];

it("returns the neighbour of a mid-queue track", () => {
  expect(nextOf(queue, music(2))?.id).toBe(3);
});

it("returns null after the tail", () => {
  expect(nextOf(queue, music(3))).toBeNull();
});

it("resolves a replaced queue: next is the new head", () => {
  // Queue replacement policy: the playing track is outside the new queue.
  expect(nextOf(queue, music(99))?.id).toBe(1);
});

it("offers the queue head as next before anything has played", () => {
  expect(nextOf(queue, null)?.id).toBe(1);
});

it("returns null with an empty queue", () => {
  expect(nextOf([], music(1))).toBeNull();
  expect(nextOf([], null)).toBeNull();
});

it("matches by id, not by object identity", () => {
  expect(nextOf(queue, { ...music(1) })?.id).toBe(2);
});

it("repeat all wraps the tail around to the head", () => {
  expect(nextOf(queue, music(3), "all")?.id).toBe(1);
});

it("repeat all keeps the neighbour mid-queue and the head for an outsider", () => {
  expect(nextOf(queue, music(1), "all")?.id).toBe(2);
  expect(nextOf(queue, music(99), "all")?.id).toBe(1);
  expect(nextOf(queue, null, "all")?.id).toBe(1);
});

it("repeat all makes a one-track queue its own next", () => {
  expect(nextOf([music(1)], music(1), "all")?.id).toBe(1);
});

it("repeat all still has nothing with an empty queue", () => {
  expect(nextOf([], music(1), "all")).toBeNull();
});

it("repeat one behaves like off", () => {
  expect(nextOf(queue, music(2), "one")?.id).toBe(3);
  expect(nextOf(queue, music(3), "one")).toBeNull();
  expect(nextOf(queue, music(99), "one")?.id).toBe(1);
});
