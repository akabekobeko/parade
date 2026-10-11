# お気に入りの絞り込み

フィルター メニュー ([フィルター メニュー](../features/filter-menu.md)) の「お気に入りのみ表示」を、各ビューがどう適用するかの仕様です。

## 状態

- `trackFilterStore` に `favoriteOnly` を足します。「曲を絞り込む」のテキストと同じくセクション (artists / albums / playlists) ごとに持ち、セッション限りで保存しません
- テキストと違い debounce はしません。トグルは 1 クリックで確定し、連続して変わらないためです。`setFavoriteOnly(section, value)` が snapshot を即座に更新します
- 購読者はツールバーのフィルター メニュー (チェックの表示) と各ビューの content hook です。両者は別のコンポーネント ツリーにあるため、React の外の store で共有します

## 「曲を絞り込む」との結合

既存の「曲を絞り込む」はビューによって適用の場所が違います ([ルーティングとレイアウト](../../v1.0/renderer/routing-layout.md))。お気に入りの絞り込みも **同じ場所** に置き、テキストの条件と AND で結合します。

| ビュー | 曲を絞り込む (既存) | お気に入りのみ表示 (v1.4) |
| --- | --- | --- |
| Artists | Renderer で `matchesTrackFilter(title)` | Renderer で `music.favorite` |
| Albums 一覧 | SQL (`AlbumFilter.musicTitle`) | SQL (`AlbumFilter.favoriteOnly`、`album_favorites` の EXISTS) |
| Albums 下段の曲リスト | Renderer で `matchesTrackFilter(title)` | 適用しない (下記) |
| Playlists | Renderer で `matchesTrackFilter(title)` | Renderer で `music.favorite` |

- Albums 一覧の SQL は WHERE 句の fragment を AND で並べるため ([アルバム ビュー](../../v1.0/features/album-view.md))、`buildAlbumWhere` に `favoriteOnly` の fragment を 1 つ足すだけです。サイドバーのジャンル・年代とも AND です
- Renderer 側は `musics.filter((m) => matchesTrackFilter(m.title, text) && (!favoriteOnly || m.favorite))` の形にし、どちらを先に操作しても結果は同じです
- 曲の絞り込み関数は `matchesContentFilter(music, { text, favoriteOnly })` にまとめ、Artists / Playlists / Albums 下段が同じ関数を使います。`matchesTrackFilter` はその内部で使います

## ビューごとの挙動

### Artists

- 選択中アーティストの曲をお気に入りで絞り込み、`groupAlbums` で組み直します。お気に入りの曲を含まないアルバムは表示されません
- 曲数、Play / Shuffle の対象、`AlbumIndexPicker` は絞り込み後の曲に基づきます (テキストの絞り込みと同じ)
- サイドバーのアーティスト一覧は絞り込みません。お気に入りの曲がないアーティストも一覧に残り、選ぶと「曲がない」表示になります
- **アルバムのお気に入りは Artists の絞り込みに使いません。** Artists の絞り込み対象は曲です

### Albums

- 一覧は **お気に入り ON のアルバム** だけになります。曲のお気に入りは見ません
- 下段の曲リスト (展開中のアルバム) は絞り込みません。「このアルバムを聴く」文脈で曲が欠けないようにするためです。テキストの絞り込みは従来どおり適用します
- 絞り込み中に展開中のアルバムを OFF にすると、再取得で一覧から消え、下段は閉じます (既存の「フィルター変更で選択中アルバムが一覧から消えた場合も閉じる」のルール)
- 空の状態は既存の「条件に一致するアルバムがない」表示を使い、Clear filters ボタンはサイドバーの条件だけを消します。お気に入りの絞り込みはフィルター メニューから OFF にします

### Playlists

- 表示中のプレイリストの曲をお気に入りで絞り込み、そのあとソートします ([ソート](../../v1.3/features/column-sort.md) の「絞り込んだ結果をソートする」と同じ)
- 連番は登録順の番号のままです
- 絞り込み中は Drag & Drop での並べ替えを無効にします。条件 `reorderable = static && !filterActive && playlistOrder` の `filterActive` にお気に入りの絞り込みを含めます
- 絞り込み中に行の Star を OFF にすると、その行は表示から消えます。選択していた場合は選択も外れます (位置の集合から消えた行は選択に残さない)

## 再生キュー

「曲を絞り込む」と同じ扱いです。

- キューは再生を始めた時点の **表示中の曲** で作ります。絞り込み中に Play / Shuffle / 行のダブルクリックをすると、お気に入りの曲だけがキューになります
- 絞り込みの切り替えは再生中のキューを変えません。次に再生を始めたときのキューに反映されます
- Albums 一覧のカードの hover 再生はアルバムの全曲をキューにします (お気に入りの絞り込みはアルバム単位なので、曲は欠けません)
- 絞り込み中に曲を OFF にしても、キューからは外れません。キューは表示とは独立したスナップショットです
