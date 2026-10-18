# フィルター メニュー

コンテンツ ツールバーに Funnel アイコンのメニュー ボタンを置き、「お気に入りのみ表示」を切り替えます。状態の持ち方と各ビューでの適用は [お気に入りの絞り込み](../architecture/favorite-filter.md) を参照してください。

## 位置

ツールバーの右側の並びに、「曲を絞り込む」の **左隣** として足します ([ルーティングとレイアウト](../../v1.0/renderer/routing-layout.md))。

```
Artists / Albums
┌ ツールバー ─────────────────────────── [▽] [曲を絞り込む      ] ┐

Playlists
┌ ツールバー ────────────────── [カラム] [▽] [曲を絞り込む      ] ┐
```

- Playlists ではカラム表示メニュー ([表示カラムの切り替え](../../v1.3/features/column-visibility.md)) と「曲を絞り込む」の間です。並びは「カラム表示メニュー、フィルター メニュー、曲を絞り込む」
- 表示する条件は「曲を絞り込む」と同じで、Artists / Albums / Playlists のルートで表示し、Settings では表示しません
- ボタンは `ColumnsMenu` と同じ `ClusterButton` (アイコン ボタン + ツールチップ) で、アイコンは Lucide の `Funnel`。ツールチップは「Filter」(`toolbar.filter`)
- 絞り込みが有効なとき、ボタンの Funnel を塗りつぶし (`fill-current`) にして、メニューを開かなくても有効だと分かるようにします。`aria-pressed` ではなく `data-active` で見た目を切り替えます (ボタンの役割はメニューを開くことで、トグルではないため)

## メニュー

`ColumnsMenu` と同じ `DropdownMenu` (Base UI の Menu) を使い、`align="end"` で開きます。

| 項目 | 種類 | 挙動 |
| --- | --- | --- |
| Favorites only (`toolbar.favoritesOnly`) | `DropdownMenuCheckboxItem` | 表示中のセクションの `favoriteOnly` を反転する |

- チェック項目はトグルなので、ON のときはチェック マークを表示します。`closeOnClick={false}` にはせず、クリックでメニューを閉じます (項目が 1 つで、続けて操作するものがない)
- 項目はセクションごとの値を映します。Artists で ON にしても Playlists のメニューは OFF のままです
- 項目の文言は対象を言い分けません。Artists / Playlists では曲、Albums ではアルバムを絞り込みますが、「お気に入りのみ表示」で意図は伝わります。ja は「お気に入りのみ表示」

## 曲を絞り込むとの関係

- 両方を同時に使えます。結果は AND です ([お気に入りの絞り込み](../architecture/favorite-filter.md))
- どちらか一方でも有効なら「絞り込み中」と見なし、Playlists の Drag & Drop を無効にします
- 「曲を絞り込む」のテキストを消してもお気に入りの絞り込みは残ります。逆も同じです

## 実装

- `src/renderer/components/app/Toolbar/FilterMenu.tsx` を追加し、`useContentToolbar` が `trackFilterStore` の `favoriteOnly` と `setFavoriteOnly` をセクション付きで返します
- `ContentToolbar` の並びは `ToolbarIconCluster`、spacer、`ColumnsMenu` (Playlists のみ)、`FilterMenu`、`Input` です
- 将来のフィルター項目 (未評価の曲のみ、など) はこのメニューに項目を足して広げます。v1.4 は 1 項目です
