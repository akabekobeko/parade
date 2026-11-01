# 再生速度の永続化

再生速度とピッチ維持を `AppSettings.playback` へ保存し、次回起動時に復元します。v1.5 の [再生モードの永続化](../../v1.5/architecture/playback-settings.md) の仕組みに項目を足すだけで、新しい経路は作りません。

## 保存するもの

| 状態 | 保存 | 置き場所 |
| --- | --- | --- |
| 再生速度 | する | `AppSettings.playback.rate` |
| ピッチ維持 | する | `AppSettings.playback.preservesPitch` |
| Popover の開閉 | しない | Base UI の Popover のローカル状態 |

## 保存の形

```ts
// src/main/ipc/types.ts
export type PlaybackSettings = {
  readonly shuffle: boolean;
  readonly repeat: RepeatMode;
  readonly volume: number;
  /** Playback rate in `[0.25, 2]`; `1` is the original speed. */
  readonly rate: number;
  /** Keep the pitch while `rate` differs from `1` (`HTMLMediaElement.preservesPitch`). */
  readonly preservesPitch: boolean;
};
```

- `playback` が未保存 (`undefined`) のときの既定値は、既存の 3 つに加えて `rate: 1`、`preservesPitch: true` です
- `version` は 1 のままです。項目の追加だけで、既存の項目の意味は変わりません
- v1.6 以前の `settings.json` (`playback` に 3 項目だけ) は sanitize で `rate` / `preservesPitch` が既定値になり、そのまま起動します。古いバージョンへ戻した場合は未知の項目が捨てられるだけです

## sanitize と merge

`sanitizePlayback` に 2 項目の検証を足します。1 つが不正でも残りは生かす既存の規則のままです。

- `rate` は有限の数なら `clampPlaybackRate` ([再生速度](playback-rate.md)) で `[0.25, 2]` に丸める。数でなければ `1`
- `preservesPitch` は `false` のときだけ `false`、それ以外 (`true`、未定義、不正な型) は `true`。`shuffle` (`=== true` で `false` 既定) と逆向きなのは、既定が ON だからです
- `mergeSettings` は `playback` を sanitize した値で丸ごと置き換える既存の動きのままです。Renderer は常に 5 項目を送ります
- `sanitizePlayback.test.ts` / `sanitizeSettings.test.ts` / `mergeSettings.test.ts` に `rate` / `preservesPitch` の行 (範囲外、刻みの外、不正な型、欠落) を足します

## 起動時の復元

- ブートストラップ (`renderer.tsx`) は今までどおり `settings.playback` を `PlayerProvider` の `initialPlayback` に渡します
- `PlayerProvider` は `createEngineHost({ volume, rate, preservesPitch })` で host を作ります。`initialPlayback` が `undefined` なら既定値です。reducer の初期値 (`shuffle` / `repeat`) は変わりません
- 復元した値は idle snapshot に載るので、再生前からボタンの点灯色 (1x 以外) と Popover の値に出ます。最初の曲のエンジンは `startEngine` が host から値を引き継ぎます ([再生速度](playback-rate.md))
- アプリケーション メニューには速度の状態がないため、`menuStateSync.initialize` は変わりません

## 変更時の保存

- `setPlaybackRate` / `setPreservesPitch` は host を更新したあと `persistPlayback({})` を呼びます。`persistPlayback` は `savedModes` (シャッフルとリピート) に `volume` / `rate` / `preservesPitch` を host から読んで足し、5 項目を `savePlayback` に渡します。Main が `playback` を丸ごと置き換えるため、常に全項目を送ります
- スライダーのドラッグ中は連続して呼ばれますが、音量と同じく Renderer では debounce しません。IPC は軽く、ディスクへの書き込みは Main の 500ms debounce が 1 回にまとめます
- 保存の失敗はログに出すだけで、host の値は戻しません。次の変更で再び保存されます
