# v1.7

Parade v1.7 の仕様書です。プレーヤー バーに再生速度のボタンを置き、Popover から速度の変更とピッチ維持の ON / OFF をできるようにします。あわせて公式サイトのトップ ページを、各機能をダークとライトの 2 枚のスクリーンショットで見せる縦レイアウトに改め、ヘッダーのボタンの hover をアプリと同じ見た目に揃えます。

## テーマ

**聴き取りたい曲はゆっくり、流して聴きたい曲は速く。音程はそのままに、プレーヤー バーから速度を変える。**

- プレーヤー バーのシャッフル ボタンと再生キュー ボタンの間に再生速度ボタンを置き、クリックで Popover を開く
- Popover ではプリセット (0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x) とスライダー (0.25x から 2x、0.05 刻み) で速度を変え、「ピッチを維持」のチェックで音程を保つかどうかを切り替える
- 速度の変更は `<audio>` 要素の `playbackRate` と `preservesPitch` で行い、再生を止めずにその場で効く
- 速度とピッチ維持は音量と同じく engine host が持ち、曲をまたいで保たれ、`settings.json` に保存して次回起動時に復元する
- 公式サイトのトップ ページは、機能ごとに「見出し、説明文、ダークとライトのスクリーンショットの横並び」の縦レイアウトにする
- 公式サイトのヘッダーは、アイコンや文字だけのボタンの hover をアプリのプレーヤーと同じ「枠線 + glow」にし、左端のアイコンとアプリ名はアプリのサイドバーのツール ボタンと同じ「角丸矩形の塗り」にする

## 仕様書の構成

v1.6 と同じく、エントリーポイントを README、機能仕様を `features/` に置きます。1 ファイルの分量は日本語換算 1,000 文字を目安とし、超える場合は項目ごとに分割して分割元からリンクします。

### 計画

- [スコープ](scope.md)
  - v1.7 でやること・やらないこと
- [ロードマップ](roadmap.md)
  - 実装フェーズの分割と順序

### アーキテクチャー

- [再生速度](architecture/playback-rate.md)
  - `<audio>` の `playbackRate` / `preservesPitch` による実装、エンジンの API と snapshot、engine host とコマンド、MediaSession、音質の限界と将来の差し替え
- [再生速度の永続化](architecture/playback-settings.md)
  - `AppSettings.playback` への `rate` / `preservesPitch` の追加、sanitize、起動時の復元と変更時の保存

### 機能仕様

- [再生速度ボタンと Popover](features/speed-control.md)
  - プレーヤー バーの位置とアイコン、Popover のレイアウト (プリセット、スライダー、ピッチ維持)、操作、アクセシビリティーと文言
- [公式サイトへの反映](features/web-site.md)
  - トップ ページの説明の更新、全シーンのダーク / ライト撮影、`player` シーンの構図、既存の仕様書の更新
- [公式サイトの機能一覧のレイアウト](features/web-feature-layout.md)
  - 機能ごとの縦レイアウト、ダークとライトの横並び、機能一覧の項目の見直し
- [公式サイトのヘッダー](features/web-header.md)
  - ヘッダーのボタンの hover (枠線 + glow、角丸矩形の塗り)、glow ユーティリティの整理

## 既存の仕様書への影響

実装のフェーズで次の仕様書を更新します ([ロードマップ](roadmap.md))。

- [オーディオエンジン](../v1.0/renderer/audio-engine.md): 公開 API に `setRate` / `setPreservesPitch`、snapshot に `rate` / `preservesPitch`、イベントに `rateChanged` / `preservesPitchChanged` を足す。streaming の構成に「`<audio>` の `playbackRate` / `preservesPitch` で速度を変える」を足す
- [状態管理](../v1.0/renderer/state-management.md) の `PlayerCommands`: `setPlaybackRate` / `setPreservesPitch` を足す
- [プレーヤー UI](../v1.0/features/player-ui.md) のレイアウト図と表示要素: シャッフルと再生キューの間に再生速度ボタンを足す
- [プロセス構成](../v1.0/architecture/process-model.md) の「設定の永続化」: `playback` の内容に速度とピッチ維持を足す
- [再生モードの永続化](../v1.5/architecture/playback-settings.md): 保存の形に `rate` / `preservesPitch` を足した旨を [再生速度の永続化](architecture/playback-settings.md) の参照で添える
- [公式サイト](../web/README.md) の決定事項「スクリーンショット」、[スコープ](../web/scope.md) の外観、[ページ構成](../web/features/pages.md) のヘッダー、[テーマとスタイル](../web/architecture/theme.md) の glow 効果、[トップ ページ](../web/features/top-page.md) の主な機能、[スクリーンショット](../web/features/screenshots.md) の撮影する画面: [公式サイトへの反映](features/web-site.md)

## リリース

v1.7 はマイナーリリースです。機能 PR には `release:minor` ラベルを付与します ([リリース フロー](../../release.md))。DB のマイグレーションはありません。`settings.json` は `playback` に項目が 2 つ増えるだけで、`version` は 1 のままです (v1.6 以前の `playback` は速度 1x、ピッチ維持 ON として読まれ、古いバージョンへ戻しても未知の項目は sanitize で捨てられるだけで壊れません)。
