# 再生速度

再生速度とピッチ維持をオーディオ エンジン、engine host、PlayerProvider のコマンドでどう持ち、どう効かせるかの仕様です。ボタンと Popover は [再生速度ボタンと Popover](../features/speed-control.md)、保存は [再生速度の永続化](playback-settings.md) を参照してください。

## 実現方法

`HTMLMediaElement` の `playbackRate` と `preservesPitch` を使います ([オーディオエンジン](../../v1.0/renderer/audio-engine.md) の streaming 構成の `<audio>`)。

- `playbackRate` は double で、0.05 刻みの値をそのまま入れられます。Chromium は 0.0625 から 16 を受け付け、範囲外は `NotSupportedError` になります。アプリの範囲 `[0.25, 2]` は余裕で内側です
- `preservesPitch` (既定 `true`) はタイム ストレッチで音程を保ちます。`false` にするとテープの早回しのように速度に応じて音程が変わります。Chromium 86 以降で対応し、プレフィックスは要りません
- `MediaElementAudioSourceNode` を通しても、Chromium は `playbackRate` / `preservesPitch` を正しく反映します。音源は `media-stream://` を `crossOrigin = "anonymous"` で読んでいるので、別オリジン扱いで無音になる問題も起きません
- 速度を連続して更新しても途切れないため、スライダーのドラッグ中にリアルタイムで反映して問題ありません
- Web Audio API 本体 (`AudioBufferSourceNode.playbackRate` / `detune`) にはピッチ維持がないため、ノード グラフには手を入れません。EQ の挿入ポイントもそのままです

HTML の media element load algorithm は `playbackRate` を `defaultPlaybackRate` に戻すため、エンジンは `src` の設定後に **`defaultPlaybackRate` と `playbackRate` の両方** を同じ値にし、以後の変更でも両方を更新します。`preservesPitch` は load で戻りません。

## エンジンの API

```ts
// src/renderer/features/audio/types.ts
export type PlaybackSnapshot = {
  // ...既存の state / currentTime / duration / volume / seeking / error
  /** Playback rate in `[0.25, 2]`; `1` is the original speed. */
  readonly rate: number;
  /** Whether the pitch is kept while `rate` differs from `1`. */
  readonly preservesPitch: boolean;
};

export type AudioEngine = {
  // ...既存の play / pause / stop / seek / setVolume / close / getSnapshot / subscribe / getSpectrums
  /** Set the playback rate (clamped into `[0.25, 2]`); applies at once. */
  readonly setRate: (rate: number) => void;
  /** Keep (or stop keeping) the pitch while the rate differs from `1`. */
  readonly setPreservesPitch: (enabled: boolean) => void;
};

export const createAudioEngine = (
  url: string,
  options?: {
    readonly volume?: number;
    readonly rate?: number;
    readonly preservesPitch?: boolean;
  },
): AudioEngine => { ... };
```

- `InternalPlayback` に `rate` / `preservesPitch` を足し、`createInitialPlayback` はオプション (`volume` / `rate` / `preservesPitch`) から初期値を作ります。既定は音量 1、速度 1、ピッチ維持 ON です
- イベントは `{ type: "rateChanged"; rate }` と `{ type: "preservesPitchChanged"; enabled }` です。reducer は `rate` を `clampPlaybackRate` で丸めて差し替え、`closed` のあとは無視します (既存の規則)。`snapshotOfPlayback` はそのまま写します
- `setRate` / `setPreservesPitch` は `setVolume` と同じ形で、`closed` なら何もせず、要素に適用してから `#dispatch` します。`error` 状態でも受け付けます (値は保持され、害がない)
- `#attachStreaming` は要素の生成時に初期値を適用します。速度が 1 でピッチ維持 ON の既定でも明示的に設定し、Chromium の既定に依存しません
- 250ms の `tick` は要素の `currentTime` を読むので、速度に関わらず位置は正しく進みます。`durationchange` / `ended` / `seeked` の扱いも変わりません

### 範囲と刻み

```ts
// src/shared/constants.ts
export const PLAYBACK_RATE_MIN = 0.25;
export const PLAYBACK_RATE_MAX = 2;
export const PLAYBACK_RATE_STEP = 0.05;
export const PLAYBACK_RATE_PRESETS: readonly number[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

// src/shared/clampPlaybackRate.ts
/** Clamp into `[MIN, MAX]` and round to the step (2 decimals); non-finite -> 1. */
export const clampPlaybackRate = (rate: number): number => { ... };
```

- Main の sanitize と Renderer のエンジンが同じ関数を使うため `src/shared/` に置きます (`albumKeyOf` と同じ扱い)
- 刻みの丸めは `Math.round(rate / STEP) * STEP` を小数第 2 位で丸めます。スライダーや ± の連続操作で `1.1500000000000001` のような値が state と設定に残らないようにします
- プリセットは「よく使う値は 1x の近傍」という先行例の観察から 1x の両側を細かくし、音楽用途で実用性の薄い 2x 超は置きません。利用される値を見てから調整する前提で、定数を 1 か所にまとめます

## engine host

音量と同じく、曲をまたいで保つ値は engine host が持ちます ([状態管理](../../v1.0/renderer/state-management.md))。

```ts
export const createEngineHost = (initial?: {
  readonly volume?: number;
  readonly rate?: number;
  readonly preservesPitch?: boolean;
}): EngineHost;

export type EngineHost = {
  // ...既存の set / get / setVolume / getVolume / subscribe / getSnapshot
  readonly setRate: (rate: number) => void;
  readonly getRate: () => number;
  readonly setPreservesPitch: (enabled: boolean) => void;
  readonly getPreservesPitch: () => boolean;
};
```

- `setRate` / `setPreservesPitch` は値を保持し、エンジンがあれば転送、なければ idle snapshot を更新して通知します (`setVolume` と同じ)。idle snapshot にも `rate` / `preservesPitch` を載せ、再生前から Popover に値が出ます
- `createEngineHost(initialVolume)` の位置引数はオプション オブジェクトに改めます。呼び出し元は `PlayerProvider` とテストだけです
- `startEngine` は `createAudioEngine(url, { volume: host.getVolume(), rate: host.getRate(), preservesPitch: host.getPreservesPitch() })` で新しいエンジンに引き継ぎます。リピート `one` の再開 (`restart`) も `startEngine` を通るので同じです

## コマンド

```ts
// PlayerCommands
/** Set the playback rate (`[0.25, 2]`); survives across tracks and is saved. */
readonly setPlaybackRate: (rate: number) => void;
/** Keep the pitch while the rate differs from `1`; survives across tracks and is saved. */
readonly setPreservesPitch: (enabled: boolean) => void;
```

- どちらも `setVolume` と同じく host を更新してから `persistPlayback({})` を呼びます ([再生速度の永続化](playback-settings.md))。reducer には dispatch しません (PlayerState は変わらない)
- `menuStateSync` には伝えません。アプリケーション メニューに速度の項目はありません ([スコープ](../scope.md))
- Popover は `useAudioPlayer()` の snapshot から `rate` / `preservesPitch` を読み、コマンドで変えます。値の置き場所は host の 1 つです

## MediaSession

`positionStateOf` は `playbackRate: 1` を固定で返していますが、snapshot の `rate` を渡すようにします。OS のメディア コントロールは `setPositionState` の `playbackRate` で位置を外挿するため、固定の 1 では 2x 再生中に表示位置が実際より遅れます。`playbackState` と metadata の扱いは変わりません。

## 音質の限界と将来の差し替え

Chromium のタイム ストレッチは話し声向けの WSOLA 相応で、パラメーターを外から調整する手段はありません。音楽素材での目安は次のとおりです。

| 倍率 | 評価 |
| --- | --- |
| 0.75x から 1.5x | ほぼ問題なし |
| 0.5x から 0.75x、1.5x から 2x | 使えるが分かるアーティファクトがある。練習・学習用途なら許容範囲 |
| 0.25x から 0.5x | 音楽素材では劣化が目立つ。耳コピで一時的に使う程度 |

- 下限 0.25x は「品質を保証しない領域」として置きます。Phase 4 の QA で手元の楽曲を聴き、下限を 0.3x 前後へ上げるかを判断します
- 高音質化するなら AudioWorklet とタイムストレッチ ライブラリー (`soundtouchjs`、Rubber Band の WASM 移植、`signalsmith-stretch` など) への移行になります。差し替えの接点は `AudioEngine` の契約 (`setRate` / `setPreservesPitch` と snapshot) で、PlayerProvider と UI は変えずに `WebAudioEngine` の中を入れ替えられます。v1.7 では追加の抽象層を設けません
- Electron を更新したときは `playbackRate` / `preservesPitch` の挙動 (途切れ、音質、`MediaElementAudioSourceNode` 経由の反映) を一度聴いて確認します

## 参考

- [MDN: HTMLMediaElement.playbackRate](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate)
- [MDN: HTMLMediaElement.preservesPitch](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preservesPitch)
- [Chromium: Remove muting for extreme playbackRates](https://codereview.chromium.org/205093002)
- [whatwg/html PR #3881: preservesPitch](https://github.com/whatwg/html/pull/3881)
