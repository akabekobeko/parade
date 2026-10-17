# ロードマップ

v1.5 の実装フェーズ分割です。v1.4 と同じく「動くものが確認できる」単位で区切り、順に積み上げます。詳細タスクは実装時に issue 化します。

```
Phase 1  基盤          RepeatMode / reducer / cycleRepeat と setRepeat / 終端の判断 / 前後曲の導出
Phase 2  ボタン        RepeatButton / PlayerBand への配置 / i18n
Phase 3  メニュー      MenuStateSnapshot と MenuAction の拡張 / Controls の項目 / 状態の同期と経路
Phase 4  永続化        AppSettings.playback (モードと音量) / sanitize と merge / 起動時の復元 / 変更時の保存
Phase 5  仕上げ        既存の仕様書の更新 / 実機での QA / 公式サイト
```

## Phase 1: 基盤

**ゴール: state とコマンドが揃い、キューの終端と前後曲がリピート モードに従う (UI はまだない)。**

- `RepeatMode` 型と `PlayerState.repeat`、`INITIAL_PLAYER_STATE` ([リピート モード](architecture/repeat-mode.md))
- `nextRepeatMode` (純関数) と `repeatChanged` アクション、`cycleRepeat` / `setRepeat` コマンド
- `nextOf` / `previousOf` の `repeat` 引数と、`all` での先頭 / 末尾の折り返し
- `naturalEndOutcomeOf` (純関数) と、`startEngine` の `ended` フォローアップの置き換え
- 上記のユニット テスト (`playerReducer.test.ts`、`nextOf.test.ts`、`previousOf.test.ts`、`naturalEndOutcomeOf.test.ts`)

## Phase 2: ボタン

**ゴール: プレーヤー バーのボタンでモードを切り替えられ、アイコンと glow がモードを表す。**

- `RepeatButton` と `PlayerBand` への配置、`usePlayerBar` の `repeat` ([リピート ボタン](features/repeat-button.md))
- en / ja の文言 (`player.repeat*`)
- 再生中にモードを切り替えて、曲の終端で期待どおりに進む / 繰り返す / 止まることの確認

## Phase 3: メニュー

**ゴール: 「コントロール」メニューからシャッフルとリピートを切り替えられ、チェックがプレーヤー バーと一致する。**

- `MenuStateSnapshot` に `shuffle` / `repeat`、`MenuAction` に `toggleShuffle` / `setRepeatOff` / `setRepeatAll` / `setRepeatOne` ([コントロール メニュー](features/controls-menu.md))
- `menuBuilder` の Controls 項目と en / ja の文言 (`menu.shuffle`、`menu.repeat*`)、`menuBuilder` のテスト
- Renderer の `menuStateSync` (React 外で snapshot をまとめて `mp:menu:setState` へ送る) と、ブートストラップの `menuActionBus` の分岐

## Phase 4: 永続化

**ゴール: モードと音量が `settings.json` に残り、次回起動でボタン、メニュー、音量スライダーに復元される。**

- `AppSettings.playback` と `sanitizePlayback`、`mergeSettings` への組み込み、テスト ([再生モードの永続化](architecture/playback-settings.md))
- `PlayerProvider` の `initialPlayback` と、ブートストラップからの注入 (state の初期値と `createEngineHost` の初期音量)
- モードと音量を変えるコマンドからの保存 (`mp:settings:set`) と、起動時の `mp:menu:setState`

## Phase 5: 仕上げ

**ゴール: 仕様書と公式サイトが揃い、配布できる。**

- 既存の仕様書の更新 ([README](README.md) の「既存の仕様書への影響」)
- 実データでの QA: シャッフル ON / OFF × リピート 3 モード × 曲の終端、キューのクリアと置換、1 曲だけのキュー、メニューとボタンの相互反映、再起動後のモードと音量の復元
- トップ ページの説明とスクリーンショットの更新 ([公式サイトへの反映](features/web-site.md))

## フェーズ間の依存関係

- Phase 2 / 3 / 4 はいずれも Phase 1 に依存します。Phase 1 は UI がないため単体では動作を確認できず、小さい変更なので Phase 1 と 2 を 1 つの PR にまとめてもかまいません
- Phase 3 と Phase 4 は互いに独立しており、別々の PR にできます。ただし起動時のメニューのチェック (復元した値) は両方が揃って初めて確認できます
- Phase 5 の公式サイトの更新は、v1.5 の Release を Publish したあとにマージします ([公式サイトへの反映](features/web-site.md))
