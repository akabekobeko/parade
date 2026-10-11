# IPC

お気に入りの取得と更新のチャネルです。既存の `mp:library:setArtistInitial` (`artist_initials` の更新) と同じ形で、Main は DB の更新だけを行い、Renderer が応答後にキャッシュを差し替えます。型は [型定義](ipc-types.md) にまとめています。

## チャネル

| チャネル | 方向 | 内容 |
| --- | --- | --- |
| `mp:library:setMusicFavorite` | invoke | 曲 1 件のお気に入りを ON / OFF にする |
| `mp:library:setAlbumFavorite` | invoke | アルバム 1 件のお気に入りを ON / OFF にする |
| `mp:library:getAlbumFavorites` | invoke | お気に入り ON のアルバム キーの一覧を返す |

- `mp:library:changed` は broadcast しません。お気に入りの変更はライブラリーのグルーピングや曲の並びを変えないため、全クエリの再取得 ([ライブラリーへの即時反映](../../v1.1/features/library-refresh.md)) は過剰です
- 曲の取得系 (`getMusicsByArtist` / `getMusicsByAlbum` / `getMusics` (playlist)) は `MUSIC_COLUMNS` に `favorite` が加わるだけで、チャネルは変わりません
- `mp:library:getAlbums` は `AlbumFilter.favoriteOnly` を受け取ります ([お気に入りの絞り込み](favorite-filter.md))

## Main の処理

- `onSetMusicFavorite`: `setMusicFavorite(db, musicId, favorite)` を呼ぶ。存在しない id は 0 行の更新として成功扱いにせず、`NOT_FOUND` のエラーで返す
- `onSetAlbumFavorite`: `setAlbumFavorite(db, albumKey, favorite)` を呼ぶ。`albumKey` を `getMusicsByAlbum` と同じ `parseAlbumKey` で分割し、区切りのない文字列はエラーにする。空のアーティスト名は「不明なアーティスト」のアルバムの正当なキーなので受け付ける (タグ編集による引き継ぎでも生じうる)。ON は INSERT、OFF は DELETE ([データベース](database.md))。対象のアルバムに曲があるかは事前に確かめず、同じトランザクション内で `deleteOrphanedAlbumFavorites` を走らせる (`setArtistInitial` と同じ構成。曲のないアルバムの行はその場で消える)
- `onGetAlbumFavorites`: `album_favorites` の全行を `albumKeyOf` でキー文字列の配列にして返す。行数はお気に入りにしたアルバムの数だけで、1 万曲規模でも数百件に収まる
- ハンドラーはいずれも `toIpcError` で `IpcResult` に包む。曲情報の更新のような single-flight の制御は要らない (1 文の UPDATE / INSERT / DELETE で終わる)

## Renderer の処理

`src/renderer/features/library/` に `setMusicFavorite` と `setAlbumFavorite` を置き、UI はこの 2 つの関数だけを呼びます。

### 曲

```
setMusicFavorite(music, favorite)
  1. window.mp.library.setMusicFavorite({ musicId: music.id, favorite })
  2. 失敗なら IpcError を返す (呼び出し元が toast を出す)
  3. libraryStore のキャッシュにある全ての曲リスト (musicsByArtist:* / musicsByAlbum:* / musicsByPlaylist:*) で
     同じ id の Music の favorite を差し替える
  4. PlayerCommands.updateMusics([{ ...music, favorite }]) でキューと現在曲を差し替える (replaceMusics)
```

- 引数は id ではなく `Music` です。キューと現在曲の差し替え (`replaceMusics`) は `Music` 全体を受け取るため、UI が持つ行の `Music` をそのまま渡します。キャッシュ側はキャッシュにある各リストの要素を id で探して差し替え、渡された `Music` は入れません
- キャッシュの差し替えは `libraryStore.patch` を曲リストのキー全てに広げた `patchMusics(updater)` で行います。再取得しないため、1 万曲のアーティストでも Star のクリックが即座に反映されます
- 楽観更新はしません。IPC は 1 文の UPDATE で数ミリ秒で返り、失敗時の巻き戻しを持たない方が単純です
- 同じ曲が複数のプレイリストに入っていても、キャッシュは id で探すので全ての行に反映されます

### アルバム

```
setAlbumFavorite(albumKey, favorite)
  1. window.mp.library.setAlbumFavorite({ albumKey, favorite })
  2. 失敗なら IpcError を返す
  3. albumFavorites のキャッシュでキーを追加または削除する
  4. 「お気に入りのみ表示」が Albums で有効なら albums:* を invalidate する
```

- `albumFavorites` は新しいクエリ キーです。`fetchLibraryQuery` で `mp:library:getAlbumFavorites` に対応づけ、`useLibraryQuery(queryKeys.albumFavorites)` で読みます。Albums 一覧のカード、Artists のアルバム見出し、アルバム情報ダイアログが購読します
- Albums 一覧の表示は `AlbumSummary[]` と `albumFavorites` の集合を突き合わせて決めます。絞り込み中にアルバムを OFF にするとグリッドから消える必要があるため、そのときだけ `albums:*` を再取得します。絞り込んでいなければ表示が変わるのは Star だけなので再取得しません
- 「絞り込み中かどうか」はフィルター UI の状態ではなく、キャッシュにある `albums:*` キー自身 (シリアライズされた `AlbumFilter`) の `favoriteOnly` で判定します (`isFavoriteOnlyAlbumsKey`)。`favoriteOnly: true` のキーだけを `invalidate` するので、絞り込みなしの一覧はローディングに戻りません
- `mp:library:changed` の購読による `libraryStore.invalidate()` は `albumFavorites` にも及びます。インポート・削除・曲情報の更新の後は再取得され、GC とキーの引き継ぎの結果が反映されます

## 失敗時の表示

- 曲の Star: toast でエラーを出し、表示は元のままにする (差し替えをしていないので何もしなくてよい)
- アルバム情報ダイアログの Apply: 曲情報ダイアログと同じく、フッターにエラーを出して開いたままにする ([アルバムのお気に入り](../features/album-favorite.md))
- Albums 一覧の Star: 曲の Star と同じ
