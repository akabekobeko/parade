# データベース

プレイリストの画像は `pictures` の行への参照として `playlists` / `smart_playlists` の列に持ちます。[v1.0 のデータベース](../../v1.0/architecture/database.md) のマイグレーション運用ルール (forward-only、適用済みファイルの変更禁止、バックアップ) に従います。

## マイグレーション 006

`src/main/db/migrations/006_playlist_pictures.sql` を追加し、`migrations/index.ts` の配列の末尾に登録します。適用後の `PRAGMA user_version` は 6 です。

```sql
-- Playlist pictures (docs/specs/v1.6/architecture/database.md).
-- Both playlist tables reference a `pictures` row like `artist_pictures`
-- does; NULL means the playlist has no picture. A picture referenced only
-- by playlists is kept by the orphan GC, and dropped once no playlist
-- references it any more.
-- Applied files must never change; schema changes go into new numbered files.

ALTER TABLE playlists       ADD COLUMN picture_id INTEGER REFERENCES pictures(id);
ALTER TABLE smart_playlists ADD COLUMN picture_id INTEGER REFERENCES pictures(id);
```

## picture_id

- `INTEGER REFERENCES pictures(id)`、NULL 許容。NULL が「画像なし」で、`musics.picture_id` と同じ持ち方です
- アーティストのような関連付けテーブル (`artist_pictures`) は作りません。アーティストは `musics` からの導出でテーブルを持たないため関連付けが必要でしたが、プレイリストは自分の行を持ちます
- 画像ファイルは `userData/images/<sha256>.<ext>` で、`pictures.file_path` が指します。アートワークやアーティスト画像と同じファイルを選べば同じ行を共有します (内容ハッシュによる重複排除)
- 値の更新は `mp:playlist:setPicture` ([IPC](ipc.md)) だけが行い、`UPDATE <table> SET picture_id = ?, updated_at = ? WHERE id = ?` を実行します。`updated_at` も更新します (画像はプレイリスト自身の属性で、名前の変更と同じ扱い)
- 画像を NULL に戻す操作は v1.6 では持ちません ([スコープ](../scope.md))

## 孤児の GC

`deleteOrphanedPictures` の孤児判定に、プレイリストからの参照を加えます。

```sql
SELECT id, file_path FROM pictures
WHERE id NOT IN (SELECT picture_id FROM musics WHERE picture_id IS NOT NULL)
  AND id NOT IN (SELECT picture_id FROM artist_pictures)
  AND id NOT IN (SELECT picture_id FROM playlists WHERE picture_id IS NOT NULL)
  AND id NOT IN (SELECT picture_id FROM smart_playlists WHERE picture_id IS NOT NULL)
```

- 既存の呼び出し元 (ライブラリーの削除、再インポート、曲情報の更新、アーティスト画像の差し替え、`cleanupLibraryOrphans`) は変えません。プレイリストが参照する画像は、その曲やアーティストが消えても残ります
- 新しい呼び出し元は 2 つです。どちらも同じトランザクションの中で GC を呼び、返ってきたファイル パスをハンドラーがコミット後に `deleteArtworkFiles` で消します
  - `setPlaylistPicture`: 差し替え前の画像が他から参照されていなければ消える (`setArtistPicture` と同じ)
  - `removePlaylist`: 削除したプレイリストの画像が他から参照されていなければ消える。今までトランザクションを張っていなかったので、`BEGIN` / `COMMIT` を足して `DELETE` と GC を 1 つにまとめる
- `playlist_musics` は `ON DELETE CASCADE` のままで、GC の対象に関係しません

## 一覧クエリへの反映

`Playlist` に `picturePath` と `musicCount` を足します ([IPC](ipc.md))。

| クエリ | 変更 |
| --- | --- |
| `listPlaylists` | 両テーブルとも `LEFT JOIN pictures p ON p.id = x.picture_id` で `p.file_path AS picturePath` を返す。`musicCount` は下記 |
| `readPlaylist` | 同じ JOIN と集計。`createPlaylist` / `updatePlaylist` / `setPlaylistPicture` の戻り値がこれを通るため、作成直後も `picturePath: null` と `musicCount` が揃う |
| `playlistRowSchema` | `picturePath: z.string().nullable()` と `musicCount: z.number().int()` を足す |

### musicCount

サイドバーの項目に曲数を出すための集計です ([サイドバーの項目](../features/sidebar-rows.md))。

- 静的プレイリスト: `(SELECT COUNT(*) FROM playlist_musics pm WHERE pm.playlist_id = x.id)` のサブクエリ。重複して入れた曲も数えます (position が identity)
- スマートプレイリスト: ルールごとに `buildSmartSql` で組み立てた SELECT を `SELECT COUNT(*) FROM (...)` で包んで実行します。`limit` があれば件数も上限で止まります (`LIMIT` が内側にあるため)。`sort` は件数に影響しないので、`random` でも結果は安定します
- 壊れたルール (`smartPlaylistRulesJsonSchema` で decode に失敗する行) は `musicCount: 0` にします。一覧に残す規則 ([v1.0 のデータベース](../../v1.0/architecture/database.md) の「クエリ結果の検証」) はそのままです
- コスト: スマートプレイリスト 1 件につき `musics` への SELECT が 1 回増えます。条件は既存のインデックス (artist / album / genre / year) を使え、1 万曲で数ミリ秒です。一覧の取得は `mp:library:changed` とプレイリストの変更時だけで、スクロールや選択では走りません
- コンテンツ ヘッダーの曲数は今までどおり取得した曲リスト (絞り込み後) の件数で、`musicCount` は使いません。サイドバーは絞り込みの影響を受けない全体の件数、ヘッダーは見えている件数、と役割が分かれます

## デモ用データ

`scripts/demo/assets/writeDemoDatabase.ts` は 006 適用後のスキーマで書くため、`playlists` / `smart_playlists` の INSERT に `picture_id` を足します。My Best と Jazz のスマートプレイリストにはデモ ライブラリーのアルバム アートワーク (既存の `pictures` 行) を割り当て、Rock のスマートプレイリストは NULL のままにします ([公式サイトへの反映](../features/web-site.md))。
