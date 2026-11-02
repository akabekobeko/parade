import type { AudioEngine, AudioEngineOptions } from "./types";
import { WebAudioEngine } from "./WebAudioEngine";

/**
 * Factory for the engine — the seam later phases call
 * (`docs/specs/v1.0/renderer/audio-engine.md`). PlayerProvider never uses
 * `new` directly, so the class remains an implementation detail.
 *
 * @param url - `media-stream://` URL of the audio file.
 * @param options - Initial volume, playback rate and pitch preservation
 *   (the values that survive across tracks).
 * @returns The engine handle.
 */
export const createAudioEngine = (
  url: string,
  options: AudioEngineOptions = {},
): AudioEngine => new WebAudioEngine(url, options);
