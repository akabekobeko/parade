# サイドバーの項目

サイドバーの Playlists の項目を Artists の項目と同じ構成にし、Artists の項目のメニューを右クリックから右端のメニュー ボタン (hover か選択中に表示) に変えます。両方の項目は行のクラスを共有します。

## 構成

```
Artists                                  Playlists
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ (○) Milo Ashgrove       [⋯] │ ←選択   │ [▣] My Best             [⋯] │ ←選択
│     34 songs                 │         │     20 songs                 │
├──────────────────────────────┤         ├──────────────────────────────┤
│ (○) Nadia Vell               │         │ [▣]✱ Jazz                    │
│     12 songs                 │         │     87 songs                 │
└──────────────────────────────┘         ├──────────────────────────────┤
                                         │ [≡] Rock                     │
                                         │     120 songs                │
                                         └──────────────────────────────┘
  (○) 円の画像                             [▣] 角丸矩形の画像、✱ スマートのバッジ、[≡] プレースホルダー
  [⋯] メニュー ボタン (hover か選択中の項目だけに出る)
```

| 要素 | Artists | Playlists |
| --- | --- | --- |
| 高さ | 48px (`ARTIST_ROW_HEIGHT`) | 48px (`PLAYLIST_ROW_HEIGHT`、同じ値) |
| 画像 | `size-8 rounded-full object-cover` | `size-8 rounded-md object-cover` |
| プレースホルダー | `rounded-full bg-muted` + `UserRound` | `rounded-md bg-muted` + `ListMusic` (通常) / `Sparkles` (スマート)。いまのアイコンをそのまま使う |
| 文言 | 名前 (`EllipsisText`) と曲数 (`artist.songs`) の 2 段 | 同じ。曲数は `Playlist.musicCount` ([データベース](../architecture/database.md)) |
| メニュー | `RowMenu` (`variant="tint"`)、hover か選択中に表示、垂直中央 | 同じ (いまの表示条件のまま) |
| 種別の印 | なし | 画像のあるスマートプレイリストだけバッジ ([スマートプレイリストのバッジ](#スマートプレイリストのバッジ)) |

- 行のクラス (`rowClassName`) は `ArtistRow` から `src/renderer/components/app/Sidebar/sidebarRowClassName.ts` へ移し、両方の項目で使います。hover の発光 (`foreground` の枠線 + ぼかし)、選択中の塗り (`bg-foreground text-background`)、曲数の `text-muted-foreground` / 選択中の `text-background/70` はそのままです
- 位置の指定は共有しません。Artists は仮想スクロールで `absolute inset-x-2 top-0` + `translateY`、Playlists は通常の並びで `mx-2` です。Playlists の項目は `ARTIST_ROW_HEIGHT` と同じ高さを `style` ではなく `h-12` で持ちます
- 行は `div` (`group`、行のクラス) の中に「画像と文言の `button` (`flex-1`、クリックで遷移)」と「`RowMenu`」を並べます。`button` の中に `button` を置けないため、いまの `ArtistRow` (行全体が `button`) の構成は変えます。hover の発光は `div` に付き、文言の `button` も `RowMenu` も同じ行として光ります
- Playlists のインライン名前変更 (ダブルクリック、メニューの「名前を変更」) は残します。編集中は文言の 2 段が `Input` (`h-8`) に置き換わり、画像とメニューはそのままです
- Playlists の項目のコンポーネントは `PlaylistListPanel` から `PlaylistRow` (`src/renderer/pages/playlists/components/PlaylistListPanel/PlaylistRow.tsx`) に切り出します

## Artists のメニュー ボタン

- `ArtistRow` の `ContextMenu` を外し、`RowMenu` を右端に置きます。項目は右クリック メニューと同じ「アーティスト情報の確認 (空名バケット以外) / 区切り / ライブラリーから削除」です
- 表示の条件は Playlists の項目がいま持つ「hover か選択中だけ表示」と同じです (`opacity-0 group-hover:opacity-100`、選択中は常に表示)。非選択の項目は文言だけの静かな一覧のままで、ポインターを乗せるとメニューが現れます。キーボードでメニュー ボタンにフォーカスしたときも表示します (`group-focus-within:opacity-100`)
- 右クリック メニューは廃止します。曲行の右クリック メニュー ([⋯] と同じ項目) はそのままで、変えるのはサイドバーの 2 つの項目だけです

## 選択中のメニュー アイコン

選択中の項目は `foreground` で塗られ、文言は `background` に反転します。メニューのアイコンも同じ反転色にします。

- `IconButton` は `text-foreground` を持つので、選択中は `text-background hover:text-background` で上書きします (`RowMenu` に `className` を通す)
- `tint` の hover の塗り (半透明の `foreground`) は `foreground` の塗りの上では見えないため、選択中は `hover:bg-background/15` にします。ライトでは薄く明るく、ダークでは薄く暗く見え、どちらでも「ボタンが反応した」と分かります
- 開いている間 (`aria-expanded`) も同じ塗りを保ちます
- 非選択の項目では `IconButton` の既定どおりです

## スマートプレイリストのバッジ

画像のあるスマートプレイリストは、画像の右下に小さな丸いバッジを重ね、Lucide `Asterisk` を白で描きます。画像のない項目はプレースホルダーのアイコン (`Sparkles`) で見分けられるので、バッジは付けません。

```
┌──────┐
│      │
│  画像 │
│     ┌┴─┐
└─────┤✱ │
      └──┘
```

- 画像の枠 (`relative size-8 shrink-0`) の中に `absolute -right-1.5 -bottom-1` で置き、角丸矩形から右に少しはみ出させます
- 大きさは `size-4` の円 (`rounded-full`)、アイコンは `size-3`、`stroke-width` は 2.5 で小さくても潰れないようにします
- 塗りは新しい色トークン `--smart` で、**ライト / ダーク共通の 1 色** です。候補はブルー (`oklch(0.62 0.16 255)`。`--pressed` と同じ色相で、テーマごとに明度を変えない固定値) とオレンジ (`oklch(0.72 0.17 55)`) で、実装時にダークの選択中 (白い塗りの上) とライトの選択中 (黒い塗りの上) の両方で見比べて決めます。アイコンの白 (`text-white`) は両方に乗ります。イエローは Asterisk の連想に合いますが、ダークの選択中の白い塗りに埋もれるので使いません
- 立体的に重なって見えるよう、行の背景と同じ色の `ring-2` で縁取り、`shadow-sm` を付けます。非選択の行は `ring-sidebar`、選択中の行は `ring-foreground` (塗りと同じ色) にして、バッジの縁が常に背景を「くり抜く」ように見せます。hover の発光は行の枠線だけなので縁取りの色は変わりません
- バッジは装飾で `aria-hidden` です。種別はコンテンツ ヘッダーの「Smart」バッジ (文字) で読めます
- `--smart` は `App.css` の `:root` に 1 回だけ定義し、`.dark` では上書きしません。`@theme inline` に `--color-smart` を足して `bg-smart` で使います。コンテンツ ヘッダーのバッジ ([プレイリスト ヘッダー](playlist-header.md)) も同じトークンを使います

## 文言

- 曲数は `artist.songs` (`{count} songs` / `{count} 曲`) をそのまま使います。アーティストと同じ 2 段目なので、文言も同じにします
- メニューのアイコンの `aria-label` は `RowMenu` の既定 ("Menu") のままです
