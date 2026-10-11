# ロードマップ

v1.4 の実装フェーズ分割です。v1.3 と同じく「動くものが確認できる」単位で区切り、順に積み上げます。詳細タスクは実装時に issue 化します。

```
Phase 1  基盤             マイグレーション 005 / Music.favorite / IPC / キャッシュ更新
Phase 2  曲のお気に入り    曲リスト行の Star / Playlists のカラムとソート
Phase 3  アルバムのお気に入り  ダイアログの form と Apply / Artists の見出し / Albums のカード
Phase 4  絞り込み          フィルター メニュー / 各ビューの AND 結合 / 再生キュー
Phase 5  仕上げ            i18n / 実データでの QA / 公式サイト
```

## Phase 1: 基盤

**ゴール: DB と IPC が揃い、Renderer が曲とアルバムのお気に入りを読み書きできる (UI はまだない)。**

- `005_favorites.sql` と `migrations/index.ts` への登録 ([データベース](architecture/database.md))
- `musicSchema` と `MUSIC_COLUMNS` への `favorite` の追加、`upsertMusic` から除外
- `album_favorites` の GC (`deleteOrphanedAlbumFavorites`) を `cleanupLibraryOrphans` へ組み込み、`runUpdateMusics` でのキー引き継ぎ
- `mp:library:setMusicFavorite` / `mp:library:setAlbumFavorite` / `mp:library:getAlbumFavorites` ([IPC](architecture/ipc.md))
- Renderer の `setMusicFavorite` / `setAlbumFavorite` 関数とキャッシュの patch、`albumFavorites` クエリ キー

## Phase 2: 曲のお気に入り

**ゴール: Artists / Albums の曲リストと Playlists のテーブルで、Star のクリックでお気に入りが切り替わり、再生中の曲にも反映される。**

- `FavoriteStarButton` と `StarFillIcon` ([Star ボタン](features/favorite-star-button.md))
- `MusicRow` の先頭セルへの配置 ([曲のお気に入り](features/music-favorite.md))
- `PLAYLIST_COLUMNS` への `favorite` の追加、アイコン ヘッダー、セル、比較関数 ([Playlists のお気に入りカラム](features/playlist-favorite-column.md))

## Phase 3: アルバムのお気に入り

**ゴール: アルバム情報ダイアログと Albums 一覧でお気に入りを切り替えられ、Artists の見出しに印が出る。**

- `AlbumInfoDialog` の form (TanStack Form) と Apply、`useAlbumInfoDialog` ([アルバムのお気に入り](features/album-favorite.md))
- `AlbumHeaderRow` の見出しの Star 表示
- `AlbumCard` のタイトル行の Star ボタン

## Phase 4: 絞り込み

**ゴール: フィルター メニューの「お気に入りのみ表示」が 3 ビューで効き、「曲を絞り込む」と組み合わせても期待どおりに動く。**

- `trackFilterStore` への `favoriteOnly` の追加 ([お気に入りの絞り込み](architecture/favorite-filter.md))
- コンテンツ ツールバーの `FilterMenu` ([フィルター メニュー](features/filter-menu.md))
- Artists / Playlists のメモリー上の絞り込み、Albums の `AlbumFilter.favoriteOnly` と `buildAlbumWhere`
- 絞り込み中の再生キューと Drag & Drop の無効化の確認

## Phase 5: 仕上げ

**ゴール: 文言と見た目が整い、公式サイトも更新されて配布できる。**

- en / ja の文言整備 (ツールチップ、メニュー項目、カラム名、ダイアログの項目)
- ライト / ダーク両テーマでの Star の色と glow の確認、1 万曲規模での切り替えと絞り込みの確認
- トップ ページの機能一覧とスクリーンショットの更新 ([公式サイトへの反映](features/web-site.md))

## フェーズ間の依存関係

- Phase 2 / 3 / 4 はいずれも Phase 1 に依存します
- Phase 2 と Phase 3 は互いに独立しており、別々の PR にできます
- Phase 4 は Phase 2 / 3 の UI がなくても動きますが、お気に入りを付ける手段がないと確認できないため、Phase 2 の後に行います
- Phase 5 の公式サイトの更新は、スクリーンショットに写る画面 (Phase 2 / 3 / 4) が揃ってから行います
