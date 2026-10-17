# 再生モードの永続化

シャッフルとリピートのモードを `AppSettings` へ保存し、次回起動時に復元します。設定ファイルの扱いは v1.0 の方針 ([プロセス構成](../../v1.0/architecture/process-model.md) の「設定の永続化」) に従います。

## 保存するもの・しないもの

| 状態 | 保存 | 置き場所 |
| --- | --- | --- |
| シャッフル モード | する | `AppSettings.playback.shuffle` |
| リピート モード | する | `AppSettings.playback.repeat` |
| キュー、現在曲、再生位置 | しない | PlayerProvider の state (セッション限り。[スコープ](../scope.md)) |
| 音量 | しない | engine host (セッション限り) |

## 保存の形

```ts
// src/main/ipc/types.ts
export type RepeatMode = "off" | "all" | "one";

/** Playback modes, restored on next launch. */
export type PlaybackSettings = {
  /** Shuffle mode of the PlayerBar toggle. */
  readonly shuffle: boolean;
  /** Repeat mode of the PlayerBar cycle button. */
  readonly repeat: RepeatMode;
};

export type AppSettings = {
  // ...既存の項目
  readonly playback?: PlaybackSettings;
};
```

- `playback` は任意項目で、未保存 (`undefined`) のときは既定値 (`shuffle: false`、`repeat: "off"`) です。`DEFAULT_SETTINGS` には足しません (`sidebar` や `playlistColumns` と同じ扱い)
- `version` は 1 のままです。項目の追加だけで、既存の項目の意味は変わりません

## sanitize と merge

`settings.json` は壊れている可能性があるため、読み込み時と patch の適用時に検証します (`src/main/settings/sanitizePlayback.ts`)。

- 値がオブジェクトでなければ `playback` 全体を無効とする (`undefined`。既定値になる)
- `shuffle` は boolean でなければ `false`
- `repeat` は `"off"` / `"all"` / `"one"` のいずれかでなければ `"off"`
- 片方が不正でももう片方は生かす (`{ shuffle: true, repeat: "twice" }` は `{ shuffle: true, repeat: "off" }`)

`mergeSettings` では `sidebar` と同じく、patch に `playback` があれば sanitize した値で全体を置き換えます。Renderer は常に `{ shuffle, repeat }` の両方を送ります。`sanitizeSettings` と `mergeSettings` のテストに `playback` の行を足します。

## 起動時の復元

- ブートストラップ (`renderer.tsx`) が `loadInitialSettings()` で得た `settings.playback` を `PlayerProvider` の `initialPlayback` prop に渡します。`sidebarStore.initialize(settings.sidebar)` と同じく、React のマウント前に値が決まります
- `PlayerProvider` は `useReducer` の初期値を `{ ...INITIAL_PLAYER_STATE, shuffle, repeat }` にします。`initialPlayback` が `undefined` なら既定値です
- 復元した値はプレーヤー バーのボタンにそのまま出ます。キューは空なので、シャッフル ON で起動しても並べ替える対象はなく、最初の再生からシャッフルされます (`playMusic` の既存の挙動)
- メニューのチェックは `menuStateSync.initialize` の初回 push で復元した値になります ([コントロール メニュー](../features/controls-menu.md))

## 変更時の保存

- モードを変えるコマンド (`toggleShuffle` / `playShuffled` / `setRepeat`) が dispatch に続けて `savePlayback({ shuffle, repeat })` を呼びます ([リピート モード](repeat-mode.md))
- `savePlayback` は `window.mp.settings.set({ patch: { playback } })` を呼ぶ関数で、`PlayerProvider` の prop (`playlistColumnsStore` の保存関数の注入と同じ形) にして本番では `renderer.tsx` が `window.mp.settings.set` を渡します。テストでは差し替えます
- `SettingsProvider` は経由しません。`SettingsProvider` の state は設定ページとテーマのためのもので、`playback` を読む購読者がいないためです。`sidebarStore` や `playlistColumnsStore` が `mp:settings:set` を直接呼ぶのと同じ扱いです
- ディスクへの書き込みは Main の 500ms debounce がまとめ、終了時は `flushSettings` が最後の変更を書きます (既存の仕組み)
- 保存の失敗はログに出すだけで、state は戻しません。モードはセッション中は正しく動き、次の変更で再び保存されます
