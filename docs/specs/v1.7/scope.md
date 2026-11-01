# v1.7 スコープ

v1.7 でやること・やらないことを定義します。

## 方針

速度の変更は **`<audio>` 要素の `playbackRate` と `preservesPitch`** で行います。アプリは Electron (Chromium) 固定なので、ブラウザー間の差 (極端な倍率でのミュート、`preservesPitch` の未対応、速度変更時の途切れ) を考える必要がなく、ピッチ維持込みの速度変更が要素のプロパティー 2 つで済みます。Web Audio API 自体にはピッチを保ったまま速度を変える機能がないため、ノード グラフには手を入れません ([再生速度](architecture/playback-rate.md))。

速度とピッチ維持は **音量と同じ扱い** にします。エンジンは生成時に受け取って要素に適用し、変更はメソッドで受け、snapshot に載せます。曲をまたいで保つ値は engine host が持ち、曲の切り替えで新しいエンジンへ引き継ぎます。PlayerProvider の reducer (キュー、現在曲、シャッフル、リピート) には足しません。

UI は **音量の Popover を踏襲** します。プレーヤー バーの `IconButton` (`variant="ring"`) をトリガーにし、Popover の中で値を変えます ([再生速度ボタンと Popover](features/speed-control.md))。速度の範囲と刻みは、動画・ポッドキャスト・楽器練習アプリの先行例 (粗いプリセットだけでは不満が出る、よく使う値は 1x の近傍、音楽用途では 2x を超える実用性が薄い) を踏まえ、**プリセット 6 段 + 0.05 刻みのスライダー、範囲 0.25x から 2x** にします。

保存は **v1.5 の `playback` に相乗り** します ([再生速度の永続化](architecture/playback-settings.md))。オーディオブック アプリと同じく速度は次回起動でも覚えておき、1x でないことはボタンの点灯色で分かるようにします。

公式サイトの変更は機能の反映と切り離した **サイト単独のフェーズ** にします。トップ ページの機能一覧はすべての機能をダークとライトで見せる縦レイアウトにし ([公式サイトの機能一覧のレイアウト](features/web-feature-layout.md))、ヘッダーのボタンはアプリの現在の hover (v1.4.1 で lamp glow から移行した「枠線 + glow」と「角丸矩形の塗り」) に揃えます ([公式サイトのヘッダー](features/web-header.md))。

## v1.7 でやること

### 再生速度 (エンジンと状態)

- `AudioEngine` に `setRate(rate)` / `setPreservesPitch(enabled)` を足し、snapshot に `rate` / `preservesPitch` を載せる。生成時のオプションでも受け取る ([再生速度](architecture/playback-rate.md))
- reducer のイベント `rateChanged` / `preservesPitchChanged` と、純関数 `clampPlaybackRate` (範囲 `[0.25, 2]`、0.05 刻みの丸め)
- engine host が音量と同じく速度とピッチ維持を持ち、曲の切り替えで新しいエンジンへ渡す
- `PlayerCommands` に `setPlaybackRate` / `setPreservesPitch` を足す
- MediaSession の `setPositionState` に実際の `playbackRate` を渡す

### 再生速度ボタンと Popover

- プレーヤー バーのシャッフル ボタンと再生キュー ボタンの間に `SpeedControl` を置く。1x 以外のときはアイコンを点灯色にする ([再生速度ボタンと Popover](features/speed-control.md))
- Popover: 見出しと現在値、プリセット 6 段 (0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x)、スライダー (0.25x から 2x、0.05 刻み) と ± ボタン、「ピッチを維持」のチェック
- 文言 (ツールチップ、`aria-label`、Popover の見出しとラベル) を en / ja に足す

### 永続化

- `AppSettings.playback` に `rate` / `preservesPitch` を足し、変更のたびに保存する ([再生速度の永続化](architecture/playback-settings.md))
- 起動時に engine host の初期値へ流し込み、ボタンの点灯色と Popover に復元した値を出す

### 公式サイト

- トップ ページの「Play your way」の説明に速度変更を足し、`player` シーンを再生速度の Popover を開いた構図で撮り直す ([公式サイトへの反映](features/web-site.md))
- 機能一覧を「見出し、説明文、ダークとライトのスクリーンショットの横並び」の縦レイアウトにし、全シーンをダークとライトの両方で撮る ([公式サイトの機能一覧のレイアウト](features/web-feature-layout.md))
- ヘッダーのボタンの hover を「枠線 + glow」と「角丸矩形の塗り」にし、lamp glow を廃止する ([公式サイトのヘッダー](features/web-header.md))

## v1.7 でやらないこと

| 機能 | 備考 |
| --- | --- |
| AudioWorklet とタイムストレッチ ライブラリーによる高音質化 | 音質は Chromium 内蔵 (WSOLA 相応) に任せる。差し替えの接点は `AudioEngine` の契約で、音質に不満が出た時点で検討する ([再生速度](architecture/playback-rate.md)) |
| 曲ごと、アルバムごとの速度の記憶 | 保存するのはアプリ全体の 1 つの値だけ。オーディオブック アプリの「タイトルごとの速度」は v1.x の候補 |
| 「125%」や BPM の表示切り替え | 表示は「1.25x」の 1 種類。元の BPM はメタデータにないため BPM 表示は作れない |
| A-B ループ、ループごとのテンポ アップ | 再生位置マーキング ([v1.0 README](../v1.0/README.md) の構想) と一緒に検討する |
| アプリケーション メニューの「コントロール」の項目、キーボード ショートカット | Popover で足りる。Apple Music にも速度の項目はない。シャッフル / リピートと同じく誤操作を避け、v1.x の候補にする |
| MediaSession からの速度変更 | MediaSession API に速度の action はない。`setPositionState` へ実際の速度を渡すだけ |
| 2x 超、0.25x 未満 | Chromium は 0.0625 から 16 を受け付けるが、音楽素材では 2x 超の実用性が薄く、0.25x 未満は劣化が大きい |
| 速度を加味した残り時間の表示 | シーク バーの時間は今までどおり音源の時間 (経過 / 総時間)。残り時間の表示自体がない |
| ヒーローのスクリーンショットのサイトのテーマへの追従 | ヒーローはダークの 1 枚のまま。候補として残す |
| 日本語 UI、Windows / Linux のスクリーンショット | 今までどおり macOS の英語 UI だけ ([公式サイトのスコープ](../web/scope.md)) |
| ダウンロード ページ、フッターのレイアウト変更 | 変えるのはヘッダーのボタンの hover とトップ ページの機能一覧だけ。ボタンやカードの border glow は今のまま |

## 非機能要件

- 速度とピッチ維持の変更は再生を止めない。スライダーのドラッグ中もリアルタイムに反映し、音の途切れやエラーを起こさない (Chromium は連続更新で途切れない)
- 速度を変えても、シーク バーの位置と時間表示、曲の自然終了 (`ended`) と次曲への遷移、MediaSession の位置がずれない
- ボタンの点灯色、Popover の値、`settings.json` の 3 か所が同じ値を示す。値の置き場所は engine host の 1 つで、Popover と設定は snapshot と保存の経路で追従する
- 範囲の判定、刻みの丸め、表示の整形、プリセットの一致判定は純関数にし、ユニット テストで押さえる (jsdom は入れず、hook の判定を純関数に切り出す既存の方針)
- `settings.json` の `rate` / `preservesPitch` が壊れていても起動に影響せず、既定値 (1x、ピッチ維持 ON) になる
- 公式サイトは画像が 2 倍 (7 シーン × 2 テーマ) になっても Lighthouse (モバイル) の Performance / Accessibility / SEO 90 以上を保つ。機能一覧の画像は遅延読み込みのままにし、トップ ページの転送量を計測し直す
- 公式サイトの間隔は gap と padding で調整し、margin は使わない。hover の塗りには transition を付けず、枠線と glow の transition だけを残す (アプリと同じ)
