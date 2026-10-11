# v1.4

Parade v1.4 の仕様書です。曲とアルバムに「お気に入り」を付け、各ビューで印として表示し、お気に入りだけに絞り込めるようにします。

## テーマ

**曲とアルバムをお気に入りに登録し、Star の印で見分け、お気に入りだけを聴く。**

- 曲リストの行と Playlists のテーブルで、Star アイコンのクリックで曲のお気に入りを切り替えられる
- アルバム情報ダイアログと Albums 一覧で、アルバムのお気に入りを切り替えられる
- コンテンツ ツールバーのフィルター メニューで「お気に入りのみ表示」に切り替えられる
- お気に入りは `rating` (曲の評価) とは独立した ON / OFF の印で、音声ファイルのタグには書かない

## 仕様書の構成

v1.3 と同じく、エントリーポイントを README、機能仕様を `features/` に置きます。1 ファイルの分量は日本語換算 1,000 文字を目安とし、超える場合は項目ごとに分割して分割元からリンクします。

### 計画

- [スコープ](scope.md)
  - v1.4 でやること・やらないこと
- [ロードマップ](roadmap.md)
  - 実装フェーズの分割と順序

### アーキテクチャー

- [データベース](architecture/database.md)
  - `musics.favorite` の追加、`album_favorites` テーブル、マイグレーション 005、孤児 GC
- [IPC](architecture/ipc.md)
  - お気に入りの取得と更新のチャネル、Renderer のキャッシュ更新。[型定義](architecture/ipc-types.md)
- [お気に入りの絞り込み](architecture/favorite-filter.md)
  - フィルター状態の持ち方、各ビューでの適用、曲の絞り込みとの AND、再生キュー

### 機能仕様

- [Star ボタン](features/favorite-star-button.md)
  - 曲とアルバムで共通の Star アイコンの見た目と操作
- [曲のお気に入り](features/music-favorite.md)
  - Artists / Albums の曲リスト行での表示と切り替え
- [Playlists のお気に入りカラム](features/playlist-favorite-column.md)
  - カラムの定義、セル、Star アイコンのヘッダー、ソート
- [アルバムのお気に入り](features/album-favorite.md)
  - アルバム情報ダイアログの編集、Artists のアルバム見出し、Albums 一覧のカード
- [フィルター メニュー](features/filter-menu.md)
  - コンテンツ ツールバーの Funnel ボタンと「お気に入りのみ表示」
- [公式サイトへの反映](features/web-site.md)
  - トップ ページの機能一覧とスクリーンショットの更新

## リリース

v1.4 はマイナーリリースです。機能 PR には `release:minor` ラベルを付与します ([リリース フロー](../../release.md))。DB のマイグレーション (user_version 4 から 5) を含むため、起動時にバックアップ `app.db.backup-v4` が作られます ([データベース](../v1.0/architecture/database.md))。
