# データベース

曲のお気に入りは `musics` のカラム、アルバムのお気に入りは関連付けテーブルに持ちます。[v1.0 のデータベース](../../v1.0/architecture/database.md) のマイグレーション運用ルール (forward-only、適用済みファイルの変更禁止、バックアップ) に従います。

## マイグレーション 005

`src/main/db/migrations/005_favorites.sql` を追加し、`migrations/index.ts` の配列の末尾に登録します。適用後の `PRAGMA user_version` は 5 です。

```sql
-- Favorite flags (docs/specs/v1.4/architecture/database.md).
-- Applied files must never change; schema changes go into new numbered files.

ALTER TABLE musics ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0;

CREATE TABLE album_favorites (
  artist TEXT NOT NULL,
  album  TEXT NOT NULL,
  PRIMARY KEY (artist, album)
);
```

## musics.favorite

- `INTEGER NOT NULL DEFAULT 0`。1 が ON、0 が OFF。ON / OFF 以外の状態はないため NULL を許しません
- `rating` (`REAL`、タグ由来の正規化値) とは別のカラムで、互いに影響しません
- インデックスは張りません。絞り込みは曲リストの取得後に Renderer で行うか、Albums の集計クエリの WHERE 句の 1 条件になるだけで、単独で検索しないためです
- **ファイルのタグには書きません。** `musics` の他のタグ カラムは `upsertMusic` (`musicRepository.ts`) がファイルの再読み込み結果で上書きしますが、`favorite` は INSERT の列と `DO UPDATE SET` の両方から除外します。再インポートと曲情報の編集 ([メタデータの書き込み](../../v1.1/architecture/metadata-write.md)) を経ても値が保たれます
- 値の更新は `mp:library:setMusicFavorite` ([IPC](ipc.md)) だけが行い、`UPDATE musics SET favorite = ? WHERE id = ?` を実行します。`updated_at` は更新しません (タグの更新日時であり、お気に入りはタグではないため)

## album_favorites

- アルバムの同一性キー `(表示アーティスト, アルバム名)` を複合主キーにします。表示アーティストは `album_artist` が空なら `artist` で、SQL では `ALBUM_ARTIST_SQL` (`COALESCE(NULLIF(m.album_artist, ''), m.artist)`)、Renderer では `albumKeyOf` が組み立てる文字列と同じ組です
- **行があれば ON、なければ OFF** です。`artist_initials` と同じく OFF の行は持たず、OFF への変更は DELETE で表します
- ON への変更は `INSERT INTO album_favorites (artist, album) VALUES (?, ?) ON CONFLICT DO NOTHING`
- `albums` テーブルは設けません。アルバムは `musics` からの導出 (`getAlbums` の GROUP BY と Renderer の `groupAlbums`) のままです

### 孤児の GC

曲が 1 曲も残らなくなったアルバムの行は、`artist_pictures` / `artist_initials` と同じ孤児 GC で消します。

- `deleteOrphanedAlbumFavorites` を追加し、`cleanupLibraryOrphans` (削除、再インポート、曲情報の更新の各トランザクション内) から呼びます
- 条件は `WHERE (artist, album) NOT IN (SELECT ALBUM_ARTIST_SQL, m.album FROM musics m)`

### タグ編集によるキーの引き継ぎ

曲情報ダイアログでアルバム名やアルバム アーティストを変えると、曲の属するアルバムのキーが変わります。`runUpdateMusics` は各曲の更新前後のキーを知っているため (`UpdatedMusic.albumKey`)、次のルールで引き継ぎます。

- 更新前のキーが `album_favorites` にあれば、更新後のキーの行を `INSERT ... ON CONFLICT DO NOTHING` で作る
- 更新前のキーの曲が残っていなければ、同じトランザクションの GC で旧キーの行が消える。残っていれば旧キーも ON のまま
- 更新後のキーが既存のアルバム (OFF) なら、そのアルバムは ON になる。「お気に入りの曲を移したアルバムもお気に入り」と解釈し、意図と違えばユーザーが OFF にする

## クエリへの反映

| クエリ | 変更 |
| --- | --- |
| `MUSIC_COLUMNS` (曲の SELECT 共通列) | `m.favorite AS favorite` を追加 |
| `getAlbums` | `AlbumFilter.favoriteOnly` が真なら WHERE に `EXISTS (SELECT 1 FROM album_favorites f WHERE f.artist = ALBUM_ARTIST_SQL AND f.album = m.album)` を AND で加える ([お気に入りの絞り込み](favorite-filter.md)) |
| `getAlbumFavorites` (新規) | `SELECT artist, album FROM album_favorites` を `albumKeyOf` でキー文字列にして返す |

`AlbumSummary` には `favorite` を足しません。Albums 一覧と Artists の見出しは `getAlbumFavorites` の結果 (キーの集合) を参照し、1 つの情報源で表示を揃えます ([IPC](ipc.md))。
