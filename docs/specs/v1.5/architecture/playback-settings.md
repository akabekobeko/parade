# 再生モードの永続化

シャッフルとリピートのモード、音量を `AppSettings` へ保存し、次回起動時に復元します。設定ファイルの扱いは v1.0 の方針 ([プロセス構成](../../v1.0/architecture/process-model.md) の「設定の永続化」) に従います。

## 保存するもの・しないもの

| 状態 | 保存 | 置き場所 |
| --- | --- | --- |
| シャッフル モード | する | `AppSettings.playback.shuffle` |
| リピート モード | する | `AppSettings.playback.repeat` |
| 音量 | する | `AppSettings.playback.volume` |
| ミュート前の音量 (`lastAudible`) | しない | `useVolumeControl` の `useState` (セッション限り。[スコープ](../scope.md)) |
| キュー、現在曲、再生位置 | しない | PlayerProvider の state (セッション限り) |

## 保存の形

```ts
// src/main/ipc/types.ts
export type RepeatMode = "off" | "all" | "one";

/** Playback modes and volume, restored on next launch. */
export type PlaybackSettings = {
  /** Shuffle mode of the PlayerBar toggle. */
  readonly shuffle: boolean;
  /** Repeat mode of the PlayerBar cycle button. */
  readonly repeat: RepeatMode;
  /** App volume in [0, 1]; 0 is muted. */
  readonly volume: number;
};

export type AppSettings = {
  // ...既存の項目
  readonly playback?: PlaybackSettings;
};
```

- `playback` は任意項目で、未保存 (`undefined`) のときは既定値 (`shuffle: false`、`repeat: "off"`、`volume: 1`) です。`DEFAULT_SETTINGS` には足しません (`sidebar` や `playlistColumns` と同じ扱い)
- 音量は engine host が持つ `[0, 1]` の値をそのまま保存します。ミュートは音量 0 なので、ミュート中に終了すると 0 が保存され、次回も無音で始まります。ミュート解除で戻る値 (`lastAudible`) は保存しないため、再起動後の解除は 100% になります
- `version` は 1 のままです。項目の追加だけで、既存の項目の意味は変わりません

## sanitize と merge

`settings.json` は壊れている可能性があるため、読み込み時と patch の適用時に検証します (`src/main/settings/sanitizePlayback.ts`)。

- 値がオブジェクトでなければ `playback` 全体を無効とする (`undefined`。既定値になる)
- `shuffle` は boolean でなければ `false`
- `repeat` は `"off"` / `"all"` / `"one"` のいずれかでなければ `"off"`
- `volume` は有限の数を `[0, 1]` に丸める (`clampVolume` と同じ規則)。数でなければ `1`
- 1 つが不正でも残りは生かす (`{ shuffle: true, repeat: "twice", volume: 0.5 }` は `{ shuffle: true, repeat: "off", volume: 0.5 }`)

`mergeSettings` では `sidebar` と同じく、patch に `playback` があれば sanitize した値で全体を置き換えます。Renderer は常に `{ shuffle, repeat, volume }` の 3 つを送ります。`sanitizeSettings` と `mergeSettings` のテストに `playback` の行を足します。

## 起動時の復元

- ブートストラップ (`renderer.tsx`) が `loadInitialSettings()` で得た `settings.playback` を `PlayerProvider` の `initialPlayback` prop に渡します。`sidebarStore.initialize(settings.sidebar)` と同じく、React のマウント前に値が決まります
- `PlayerProvider` は `useReducer` の初期値を `{ ...INITIAL_PLAYER_STATE, shuffle, repeat }` にし、engine host を `createEngineHost(volume)` で作ります。`initialPlayback` が `undefined` なら既定値です
- 音量は engine host が持ち、最初のエンジン生成時に `options.volume` で引き継がれます (既存の仕組み)。音量ポップオーバーのスライダーは idle snapshot の `volume` を映すので、再生前から復元した値が出ます
- 復元した値はプレーヤー バーのボタンにそのまま出ます。キューは空なので、シャッフル ON で起動しても並べ替える対象はなく、最初の再生からシャッフルされます (`playMusic` の既存の挙動)
- メニューのチェックは `menuStateSync.initialize` の初回 push で復元した値になります ([コントロール メニュー](../features/controls-menu.md))

## 変更時の保存

- モードを変えるコマンド (`toggleShuffle` / `playShuffled` / `setRepeat`) と `setVolume` が、state や engine host の更新に続けて `savePlayback({ shuffle, repeat, volume })` を呼びます ([リピート モード](repeat-mode.md))
- `setVolume` はスライダーのドラッグ中に連続して呼ばれますが、Renderer 側では debounce しません。IPC の送信は軽く、ディスクへの書き込みは Main の 500ms debounce で 1 回にまとまります (サイドバー幅のリサイズと同じ扱い)
- `savePlayback` は `window.mp.settings.set({ patch: { playback } })` を呼ぶ関数で、`PlayerProvider` の prop (`playlistColumnsStore` の保存関数の注入と同じ形) にして本番では `renderer.tsx` が `window.mp.settings.set` を渡します。テストでは差し替えます
- `SettingsProvider` は経由しません。`SettingsProvider` の state は設定ページとテーマのためのもので、`playback` を読む購読者がいないためです。`sidebarStore` や `playlistColumnsStore` が `mp:settings:set` を直接呼ぶのと同じ扱いです
- ディスクへの書き込みは Main の 500ms debounce がまとめ、終了時は `flushSettings` が最後の変更を書きます (既存の仕組み)
- 保存の失敗はログに出すだけで、state は戻しません。モードはセッション中は正しく動き、次の変更で再び保存されます
