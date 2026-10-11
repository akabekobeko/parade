# 曲のお気に入り

Artists ビューと Albums ビュー下段の曲リスト行 (`MusicRow`) で、曲のお気に入りを表示し切り替えます。Playlists のテーブルは [Playlists のお気に入りカラム](playlist-favorite-column.md) を参照してください。

## 行の構成

```
┌ 行 ─────────────────────────────────────────────────────────────┐
│ [☆]  3   Title of the song                  3:45  [⋯]           │
│  ↑   ↑                                                           │
│ Star  トラック番号 (hover で再生ボタン)                               │
└──────────────────────────────────────────────────────────────────┘
```

- Star をトラック番号の **左隣** に置きます。既存の先頭セル (`w-7`、番号の右寄せ) の左に `size-4` の Star セルを足し、行の `gap-2` で間隔を取ります
- トラック番号セルの振る舞い (hover で再生、再生中は `AudioLines`、一時停止中は `Volume`) は変えません
- Star は先頭セルと同じくタイトルの `<button>` の外に置くため、クリックは行の選択やダブルクリック再生に伝わりません。`MusicRow` の行コンテナー自体にはクリック ハンドラーがないので、Playlists の `data-row-control` のような除外の印は要りません ([Star ボタン](favorite-star-button.md))
- 選択中の行、再生中の行 (glow 付きの枠) でも Star の見た目は同じです。行の背景色に対して OFF の薄い色が見えることを確認します

## 操作

| 操作 | 挙動 |
| --- | --- |
| OFF の Star をクリック | その曲を ON にする |
| ON の Star をクリック | その曲を OFF にする |

- 対象は **クリックした行の曲だけ** です。複数選択していても、選択中の他の行は変わりません (曲メニューの「選択中の曲すべて」の規則は適用しない)
- `setMusicFavorite(music.id, !music.favorite)` を呼び、成功後にキャッシュとキューの `Music.favorite` が差し替わって再描画されます ([IPC](../architecture/ipc.md))
- 同じ曲が Artists の曲リストと再生キューの両方にあれば、両方に反映されます

## 表示する場所

| 場所 | コンポーネント | Star |
| --- | --- | --- |
| Artists のアルバム セクションの曲 | `ArtistMusicRow` (`MusicRow`) | あり |
| Albums 下段の展開中アルバムの曲 | `AlbumDetail` の `MusicRow` | あり |
| Playlists のテーブル | `PlaylistTableRow` | カラムとして ([Playlists のお気に入りカラム](playlist-favorite-column.md)) |
| プレーヤー バーのキュー ポップオーバー | 変更なし | なし (v1.4 では表示しない。[スコープ](../scope.md)) |

## 曲情報ダイアログとの関係

- 曲情報ダイアログ (Details タブ) に Favorite の項目は足しません。ダイアログはファイルのタグの編集であり、お気に入りはタグではないためです
- `rating` の入力は従来どおりです。星の数を変えてもお気に入りは変わらず、お気に入りを変えても `rating` は変わりません

## 実装

- `MusicRow` に `favorite` の表示と `onToggleFavorite` の呼び出しを足します。IPC の呼び出しは `useArtistContent` / `useAlbumDetail` が `setMusicFavorite` を使って行い、`MusicRow` は値とハンドラーを受け取るだけにします ([コーディングルール](../../../coding-rules/README.md))
- 行の高さ (`h-9`、`MUSIC_ROW_HEIGHT` 36px) は変えません
- 失敗時の toast は `useArtistContent` / `useAlbumDetail` が出します
