# アルバムのお気に入り

アルバム単位のお気に入りを、アルバム情報ダイアログと Albums 一覧で切り替え、Artists のアルバム見出しに印として出します。値は `album_favorites` に持ち ([データベース](../architecture/database.md))、Renderer は `albumFavorites` クエリのキー集合で参照します ([IPC](../architecture/ipc.md))。

## アルバム情報ダイアログ

曲メニュー・アルバム メニューの「Album info」で開く `AlbumInfoDialog` は v1.0 では表示専用でした。v1.4 で Favorite の項目を足し、曲情報ダイアログ ([曲情報ダイアログの編集](../../v1.1/features/music-info-dialog.md)) と同じ form の流れで保存します。

```
┌ Album Info ──────────────────────── [<] [>] ┐
│ [Details] [Artwork]                         │
│ Album        Album Title                    │
│ Artist       Artist Name                    │
│ Year         2001                           │
│ ...                                         │
│ Favorite     [☆]                            │
│                                             │
│ 適用に失敗しました: ... (失敗時のみ)          │
│                          [Cancel] [Apply]   │
└─────────────────────────────────────────────┘
```

- Details タブの末尾に Favorite の行を足します。値は [Star ボタン](favorite-star-button.md) で、クリックで form の値を反転します。この時点では保存しません
- 他の項目 (アルバム名、アーティスト、年、ジャンル、曲数、時間) は表示のままです。アルバム名などの編集は曲情報ダイアログの役割です
- フッターに Apply (primary) を足し、Cancel (outline) と並べます。曲情報ダイアログと同じ配置です
- **Apply の活性条件は「Favorite が初期値と異なる」かつ「適用中でない」** です。項目は 1 つなので validation はありません
- Apply で `setAlbumFavorite(albumKey, favorite)` を呼び、成功したら閉じます。失敗したらフッターにエラーを出して開いたままにし、Apply を再度押せます
- 適用中は Apply / Cancel を非活性にし、Apply にスピナーを出します。1 文の INSERT / DELETE で終わるため一瞬ですが、曲情報ダイアログと同じ作法にします
- Cancel / Esc / 背景クリックで閉じ、未適用の変更は破棄します。適用中は閉じられません
- 前後移動 (`<` / `>`) で別のアルバムへ移ると、未適用の変更を破棄します (曲情報ダイアログと同じ)。適用中は前後のボタンを非活性にします
- 曲情報ダイアログとは異なり、再生は止めません。ファイルを書き換えないためです

### 実装

- ロジックは `useAlbumInfoDialog` に分離します。TanStack Form で `{ favorite: boolean }` を扱い、初期値は `albumFavorites` の集合から求めます。変更の判定は `isDefaultValue` を使います ([form ライブラリー選定](../../v1.1/architecture/form-library.md))
- `albumInfoStore` の subject (`AlbumSummary` または `AlbumGroup`) は変えません。`albumKey` を持っていれば足ります
- 項目が 1 つの form に TanStack Form は大げさに見えますが、曲情報ダイアログと同じ書き方にして、将来の項目追加 (v1.x の候補) で作り直さないようにします

## Artists のアルバム見出し

`AlbumHeaderRow` のアルバム名の **右** に、ON のときだけ塗りつぶしの Star (`StarFillIcon`、`size-4`、`text-foreground`) を出します。

- 表示だけで、ボタンではありません。切り替えはアルバム メニューの「Album info」から行います
- 見出し (`h2`) を `flex min-w-0 items-center gap-2` にし、アルバム名の `EllipsisText` に `min-w-0` を付けて、長い名前は Star を残して省略します (`PlaylistHeader` の名前と Badge の並べ方と同じ)
- OFF のときは何も出しません。Artists の見出しは曲リストの上にある情報表示であり、薄い Star を常設すると曲の Star と並んで目立つためです

## Albums 一覧のカード

`AlbumCard` のタイトル行の右端に Star ボタンを **常設** します。

```
┌────────────┐
│            │
│  Artwork   │
│            │
└────────────┘
Album Title…  [☆]
Artist Name
2001
```

- 表示と操作は曲リスト行の Star と同じです ([Star ボタン](favorite-star-button.md))。OFF は薄く、hover で通常色と glow、ON は塗りつぶし
- タイトル行を `flex items-center gap-1` にし、タイトルの `EllipsisText` に `min-w-0 flex-1`、Star に `shrink-0` を付けて、**タイトルの幅が Star と重ならない** ようにします。長いタイトルは Star の手前で省略します
- クリックは `setAlbumFavorite(album.albumKey, next)` を呼びます。カード (アートワーク) のクリックによる下段の開閉には伝わらないよう、`stopPropagation` ではなく Star をアートワークの `<button>` の外 (タイトル行) に置くことで分けます
- 「お気に入りのみ表示」が有効なとき、OFF にしたアルバムは一覧の再取得で消えます ([お気に入りの絞り込み](../architecture/favorite-filter.md))
- 下段の `AlbumDetail` のヘッダーには Star を置きません。カードと二重になるためです。アルバム情報ダイアログからは切り替えられます
