# Playlists のお気に入りカラム

Playlists のテーブル ([v1.3 Playlists のテーブル](../../v1.3/features/playlist-table.md)) にお気に入りカラムを足します。

## カラム定義

`PLAYLIST_COLUMNS` に `favorite` を追加します ([カラム定義](../../v1.3/features/columns.md))。

| id | 幅 | pinned | 既定の表示 | resizable | sortable | align |
| --- | --- | --- | --- | --- | --- | --- |
| `favorite` | 48 | はい | はい | いいえ | はい | center |

- **常に表示するカラム (pinned)** にし、連番とタイトルの間の左端に固定します。表示順は「連番、Star、タイトル」で、曲リスト行の「Star、番号、タイトル」に近い配置です (連番は左端固定のため、番号の左には置けない)
- pinned にする理由は 2 つです。お気に入りは v1.4 の中心機能で常に見えてよいこと、そして `visibleIds` (表示する任意カラムの保存値) に新しいカラムを足す移行を避けられることです。v1.3 で設定を保存済みのユーザーにも、起動した時点で表示されます
- pinned のため、カラム メニューに項目はなく、ヘッダーのドラッグによる並べ替えもできません ([表示カラムの切り替え](../../v1.3/features/column-visibility.md)、[カラムの並べ替え](../../v1.3/features/column-reorder.md))。非表示にする操作は [スコープ](../scope.md) の「やらないこと」です
- 幅は `MIN_COLUMN_WIDTH` (48) に合わせ、リサイズできません (アイコン 1 つのカラムに幅の調整は不要)。`widths` にも保存しません
- `align` に `"center"` を足します。アイコンだけのカラムは中央寄せが自然なためで、既存の `"start"` / `"end"` の扱いは変えません
- `labelKey` は `playlist.column.favorite` ("Favorite" / "お気に入り") で、ヘッダーの `aria-label` に使います

## ヘッダー

- カラム名は **テキストではなく Star アイコン** です。`PlaylistColumn` に `headerIcon?: "star"` を足し、`PlaylistTableHeader` が `headerIcon` を持つカラムでは `t(labelKey)` の代わりに `Star` (輪郭、`size-3.5`、`text-muted-foreground`) を描きます
- `labelKey` は残し、ヘッダーの `aria-label` に使います
- ソート中の矢印 (`ChevronUp` / `ChevronDown`) はアイコンの右に出します。他のカラムと同じです
- pinned のため、ヘッダーはドラッグできず、リサイズ ハンドルもありません

## セル

- セルの中身は曲リスト行と同じ `FavoriteStarButton` です ([Star ボタン](favorite-star-button.md))。`renderPlaylistCell` の `favorite` の分岐で描きます
- セルは `data-row-control` を持ち、クリックは行の選択や再生に伝わりません (`isRowEvent` の除外規則をそのまま使う)
- 対象はクリックした行の曲だけです ([曲のお気に入り](music-favorite.md))。同じ曲が複数行にあれば、キャッシュの差し替えで全ての行が変わります

## ソート

`comparePlaylistRows` に `favorite` の比較を足します ([ソート](../../v1.3/features/column-sort.md))。

- 比較値は ON を 1、OFF を 0 とした数値です
- **このカラムの昇順は ON が先頭** です。ヘッダーを初めてクリックしたときにお気に入りの曲がまとまって上に来るようにするためで、「ソート中でないカラムをクリックすると昇順」の規則は保ちます。降順は OFF が先頭です
- 「値のない行」はありません。OFF は値であり、末尾へ寄せる規則の対象にしません
- 同値は登録順の昇順です (既存の規則)
- ソート中に行の Star を切り替えると、その行は次の描画で新しい位置へ移ります。ソートはレンダー中の導出のため、追加の処理は要りません

## 絞り込みとの関係

「お気に入りのみ表示」が有効なときの挙動は [お気に入りの絞り込み](../architecture/favorite-filter.md) を参照してください。絞り込み中もカラムは表示され、全ての行が ON です。
