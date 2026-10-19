# v1.6

Parade v1.6 の仕様書です。プレイリストに画像を設定できるようにし、サイドバーとコンテンツ ヘッダーでアーティストと同じように画像を見せます。あわせて、名前、ルール、画像をまとめて編集する「プレイリスト情報の確認」ダイアログを足し、サイドバーの Playlists と Artists の項目をメニュー ボタン付きの同じ見た目に揃えます。

## テーマ

**プレイリストに顔 (画像) を持たせ、アーティストやアルバムと同じ目線で眺めて選ぶ。**

- プレイリスト (通常、スマートとも) に画像を 1 枚設定できる。画像は `pictures` を介して `userData/images/` に置き、アーティスト画像と同じ仕組みで保存、配信、GC する
- プレイリストのメニュー (サイドバーの項目、コンテンツ ヘッダー) に「プレイリスト情報の確認」を足し、ダイアログで名前と画像 (スマートプレイリストはルールも) を編集する。スマートプレイリストの「ルールを編集」はこのダイアログに置き換える
- サイドバーの Playlists の項目を Artists と同じ構成 (画像、名前と曲数の 2 段、右端のメニュー ボタン) にする。画像は角丸矩形で、スマートプレイリストは右下のバッジで見分ける
- サイドバーの Artists の項目も Playlists と同じく hover か選択中にメニュー ボタンを出すようにし、右クリック メニューを廃止する
- コンテンツ ヘッダー左端のアイコンも、画像があればサイドバーと同じ画像にする

## 仕様書の構成

v1.5 と同じく、エントリーポイントを README、機能仕様を `features/` に置きます。1 ファイルの分量は日本語換算 1,000 文字を目安とし、超える場合は項目ごとに分割して分割元からリンクします。

### 計画

- [スコープ](scope.md)
  - v1.6 でやること・やらないこと
- [ロードマップ](roadmap.md)
  - 実装フェーズの分割と順序

### アーキテクチャー

- [データベース](architecture/database.md)
  - `playlists.picture_id` / `smart_playlists.picture_id` の追加、マイグレーション 006、孤児 GC、一覧クエリの `picturePath` と `musicCount`
- [IPC](architecture/ipc.md)
  - `mp:playlist:setPicture` の追加、`Playlist` 型の拡張、Renderer のキャッシュ更新

### 機能仕様

- [プレイリスト情報の確認ダイアログ](features/playlist-info-dialog.md)
  - 通常 (名前と画像、タブなし) とスマート (詳細タブと画像タブ) のレイアウト、適用の流れ、メニューの置き換え
- [サイドバーの項目](features/sidebar-rows.md)
  - Playlists の項目の新しい構成 (画像、バッジ、2 段の文言、メニュー ボタン)、Artists の項目のメニュー ボタン化
- [プレイリスト ヘッダー](features/playlist-header.md)
  - コンテンツ ヘッダー左端の画像とバッジ、メニューの項目
- [公式サイトへの反映](features/web-site.md)
  - トップ ページの機能説明とスクリーンショットの更新

## 既存の仕様書への影響

実装のフェーズで次の仕様書を更新します ([ロードマップ](roadmap.md))。

- [プレイリスト](../v1.0/features/playlist.md): 「作成・編集」にプレイリスト情報の確認ダイアログを足し、「動的プレイリスト」の「Edit rules ボタン」をダイアログの参照に置き換える。サイドバーの項目の構成を [サイドバーの項目](features/sidebar-rows.md) の参照にする
- [Artist ビュー](../v1.0/features/artist-view.md): 「項目の右クリックメニュー」を「項目のメニュー ボタン」に改め、アーティスト情報の確認ダイアログの開き方を合わせる
- [データベース](../v1.0/architecture/database.md): `playlists` / `smart_playlists` に `picture_id` を足し、`pictures` の孤児判定にプレイリストの参照を加える
- [IPC](../v1.0/architecture/ipc.md): チャネル一覧と preload に `mp:playlist:setPicture` を足す
- [トップ ページ](../web/features/top-page.md) と [スクリーンショット](../web/features/screenshots.md): [公式サイトへの反映](features/web-site.md)

## リリース

v1.6 はマイナーリリースです。機能 PR には `release:minor` ラベルを付与します ([リリース フロー](../../release.md))。DB のマイグレーション (user_version 5 から 6) を含むため、起動時にバックアップ `app.db.backup-v5` が作られます ([データベース](../v1.0/architecture/database.md))。`settings.json` は変わりません。
