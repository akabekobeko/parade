# ロードマップ

v1.7 の実装フェーズ分割です。v1.6 と同じく「動くものが確認できる」単位で区切り、順に積み上げます。詳細タスクは実装時に issue 化します。

```
Phase 1  基盤          clampPlaybackRate / エンジンの rate と preservesPitch / engine host / コマンド / MediaSession
Phase 2  ボタン        SpeedControl (ボタンと Popover) / PlayerBand への配置 / i18n
Phase 3  永続化        AppSettings.playback の rate と preservesPitch / sanitize / 起動時の復元 / 変更時の保存
Phase 4  仕上げ        既存の仕様書の更新 / 実機での QA
Phase 5  公式サイト    機能一覧の縦レイアウト / ヘッダーの hover / 文言 / 全シーンのダークとライトの撮影 / web 仕様書の更新
```

## Phase 1: 基盤

**ゴール: エンジンが速度とピッチ維持を受け付け、コマンドから変えられる (UI はまだない)。**

- `PLAYBACK_RATE_*` の定数と純関数 `clampPlaybackRate` (`src/shared/`)、そのテスト ([再生速度](architecture/playback-rate.md))
- `InternalPlayback` / `PlaybackSnapshot` の `rate` / `preservesPitch`、イベント `rateChanged` / `preservesPitchChanged`、`createInitialPlayback` のオプション、`reducePlayback` と `snapshotOfPlayback` のテスト
- `WebAudioEngine` の `setRate` / `setPreservesPitch` と、要素への適用 (`defaultPlaybackRate` / `playbackRate` / `preservesPitch`)
- `createEngineHost` のオプション化 (`volume` / `rate` / `preservesPitch`) と `setRate` / `getRate` / `setPreservesPitch` / `getPreservesPitch`、idle snapshot、テスト
- `PlayerCommands.setPlaybackRate` / `setPreservesPitch` と、`startEngine` でのエンジンへの引き継ぎ
- `positionStateOf` の `playbackRate` を snapshot の値にする、テスト

## Phase 2: ボタン

**ゴール: プレーヤー バーの Popover から速度とピッチ維持を変えられ、再生中にその場で効く。**

- `SpeedControl` (ボタン、Popover、`useSpeedControl`) と `PlayerBand` への配置 ([再生速度ボタンと Popover](features/speed-control.md))
- 純関数 `formatPlaybackRate` / `steppedPlaybackRate` とそのテスト、`SpeedControl` の markup テスト (`renderToStaticMarkup`)
- en / ja の文言 (`player.speed*`、`player.keepPitch`)
- 再生中に各プリセットとスライダーで速度を変え、ピッチ維持の ON / OFF で音程が変わる / 変わらないこと、シーク バーと曲の終端が正しいことの確認

## Phase 3: 永続化

**ゴール: 速度とピッチ維持が `settings.json` に残り、次回起動でボタンと Popover に復元される。**

- `PlaybackSettings.rate` / `preservesPitch` と `sanitizePlayback` の拡張、`sanitizeSettings` / `mergeSettings` のテスト ([再生速度の永続化](architecture/playback-settings.md))
- `PlayerProvider` の `initialPlayback` から engine host への注入
- `setPlaybackRate` / `setPreservesPitch` からの保存 (`persistPlayback` の 5 項目化)

## Phase 4: 仕上げ

**ゴール: 仕様書が揃い、配布できる。**

- 既存の仕様書の更新 ([README](README.md) の「既存の仕様書への影響」のうちアプリ側)
- 実データでの QA: 各プリセットと端の値 (0.25x / 2x) の音、ピッチ維持 ON / OFF、スライダーのドラッグ中の途切れ、速度 2x での曲の終端と次曲、リピート `one` との組み合わせ、再生前の Popover 操作と最初の曲への反映、再起動後の復元、OS のメディア コントロールの位置表示、v1.6 の `settings.json` からの起動
- 0.25x から 0.5x の音質を手元の楽曲で確認し、下限を据え置くかを判断する (変える場合は定数と仕様書を直す)

## Phase 5: 公式サイト

**ゴール: トップ ページが新しいレイアウトとヘッダーで公開され、全シーンにダークとライトのスクリーンショットが揃う。**

- 機能一覧の縦レイアウトとダーク / ライトの横並び、項目の見直し (`theme` の項目の廃止、`settings` への統合) と辞書 ([公式サイトの機能一覧のレイアウト](features/web-feature-layout.md))
- ヘッダーのボタンの hover の変更と `glow-lamp` の廃止 ([公式サイトのヘッダー](features/web-header.md))
- 「Play your way」の説明の更新と、全シーンのダーク / ライトの撮影 (`player` は速度の Popover を開いた構図)、マスクの manifest ([公式サイトへの反映](features/web-site.md))
- web の仕様書の更新 ([README](README.md) の「既存の仕様書への影響」のうちサイト側)
- Lighthouse の計測と転送量の確認

## フェーズ間の依存関係

- Phase 2 / 3 はいずれも Phase 1 に依存します。Phase 1 は UI がないため単体では動作を確認できず、Phase 1 と 2 を 1 つの PR にまとめてもかまいません
- Phase 3 は Phase 2 と独立に実装できますが、復元した値の確認には Phase 2 のボタンが要ります
- Phase 5 のレイアウトとヘッダーの変更は Phase 1 から 4 に依存しませんが、スクリーンショットには再生速度ボタンが写るため、撮影は Phase 2 のマージ後に行います。レイアウト、ヘッダー、撮影を 1 つのサイト更新 PR にまとめ、**v1.7 の Release を Publish したあとにマージ** します ([公式サイトへの反映](features/web-site.md))
