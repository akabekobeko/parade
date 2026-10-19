# プレイリスト ヘッダー

Playlists のコンテンツ領域のヘッダー (`PlaylistHeader`) の左端のタイルを、画像があればサイドバーと同じ画像にします。レイアウトは `ArtistHeader` に倣った現在の構成のままです。

## タイル

```
画像あり (通常)            画像あり (スマート)         画像なし
┌────────┐               ┌────────┐               ┌────────┐
│        │               │        │               │        │
│  画像   │               │  画像   │               │   ≡    │
│        │               │       ┌┴─┐             │        │
└────────┘               └───────┤✱ │             └────────┘
                                 └──┘
```

| 状態 | 表示 |
| --- | --- |
| `picturePath` あり | `size-16 rounded-md object-cover` の画像 |
| `picturePath` なし | いまのプレースホルダー (`size-16 rounded-md bg-muted` + `ListMusic` または `Sparkles`、`size-7`) |
| スマートで画像あり | 画像の右下にサイドバーと同じバッジ ([サイドバーの項目](sidebar-rows.md))。大きさは `size-5` の円、アイコンは `size-3.5`、位置は `-right-2 -bottom-1.5`、縁取りは `ring-background` |

- hover の再生オーバーレイ (中央の丸い Play ボタン) はそのままです。バッジはオーバーレイと重ならない位置 (右下の角) にあり、オーバーレイより下の層に置きます (`z-0`、オーバーレイは `z-10`)
- タイルの枠は `overflow-hidden` にしません。バッジが角丸矩形からはみ出すためです。画像自身に `rounded-md` を付けます
- 名前の右の「Smart」バッジ (`Badge variant="secondary"`) はそのまま残します。画像のバッジは装飾 (`aria-hidden`) で、文字のバッジが種別を読む手段です
- `ArtistHeader` の画像の枠にある hover の発光 (枠線 + ぼかし) は付けません。v1.6 で変えるのは画像の表示だけで、ヘッダーの枠の見た目はいまのままです

## データ

- `PlaylistHeader` の props に `picturePath: string | null` を足し、`usePlaylistContent` が一覧キャッシュの `Playlist` から渡します。`name` と同じ経路で、`Playlist` の読み込みが終わるまでは `null` (プレースホルダー) です
- 画像を差し替えると `setPlaylistPicture` がキャッシュを差し替えるので ([IPC](../architecture/ipc.md))、ヘッダーもサイドバーと同時に新しい画像になります
- 曲数と総時間は今までどおり取得した曲リスト (絞り込み後) から求め、`musicCount` は使いません

## メニュー

ヘッダーの [⋯] メニューの項目を次のようにします。

| 項目 | 通常 | スマート |
| --- | --- | --- |
| プレイリストを再生 | ○ | ○ |
| シャッフル再生 | ○ | ○ |
| プレイリストに追加 ▸ | ○ | ○ |
| (区切り) | ○ | ○ |
| プレイリスト情報の確認 | ○ | ○ |

- 「ルールを編集」は「プレイリスト情報の確認」に置き換えます ([プレイリスト情報の確認ダイアログ](playlist-info-dialog.md))。アイコンは `NotepadText` (アーティスト情報の確認と同じ)
- `onEditRules` の prop と `usePlaylistContent` の `rulesEditor` (開閉と submit) は不要になり、`PlaylistContent` から `SmartRulesDialog` の配置を外します。項目の `onSelect` は `playlistInfoStore.open(playlist)` を呼ぶだけです
- 通常のプレイリストにも項目が付くため、通常とスマートでメニューの長さが同じになります
