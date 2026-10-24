# Star ボタン

曲とアルバムのお気に入りを切り替える、共通の Star アイコン ボタンです。曲リスト行 ([曲のお気に入り](music-favorite.md))、Playlists のセル ([Playlists のお気に入りカラム](playlist-favorite-column.md))、Albums 一覧のカード ([アルバムのお気に入り](album-favorite.md)) で同じ部品 (`FavoriteStarButton`) を使います。

## 見た目

Lucide の `Star` を使い、塗りつぶしは既存の `PlayFillIcon` と同じく Tailwind の `fill-current` で行います (`Icons/StarFillIcon.tsx` を追加。lucide の [Filled icons](https://lucide.dev/guide/lucide/advanced/filled-icons) の方式)。

| 状態 | 通常 | hover |
| --- | --- | --- |
| OFF | 輪郭のみ。薄い色 (`text-muted-foreground/40` 程度) | 通常色 (`text-foreground`) にする |
| ON | 塗りつぶし (`fill-current`)。通常色 | 変化なし |

- 当初は `HoverIconButton` と同じ `drop-shadow` の glow を hover に付けていましたが、v1.6 で廃止しました (2026-10-24)。hover の変化は OFF の色だけです
- サイズは曲リスト行とセルでは `size-4` (既存の再生ボタンと同じ)、Albums 一覧のカードでも `size-4` です
- 色の遷移は `transition-[color,filter]` で短く (既存の 200ms 以内) 付けます
- ライト / ダーク両テーマで OFF の薄さと ON の塗りつぶしが見分けられることを確認します

## 操作

- `<button type="button">` にし、`aria-pressed` で ON / OFF を表します。`aria-label` は ON なら「Remove from favorites」、OFF なら「Add to favorites」(i18n キー `favorite.add` / `favorite.remove`)
- クリックで ON / OFF を反転します。処理は呼び出し元から渡された `onToggle(next: boolean)` に委ね、ボタン自身は IPC を知りません
- 行の中に置くときはクリックが行の選択・再生・ダブルクリックへ伝わらないようにします。行全体がクリック対象の Playlists では `data-row-control` を持つセルで包みます (既存の `isRowEvent` の除外規則 `[data-row-control] button`)。`MusicRow` ではタイトルの `<button>` の外に置くだけで足ります ([曲のお気に入り](music-favorite.md))
- 既存の `HoverIconButton` は hover まで非表示にしますが、Star は **常に表示** します。OFF の薄い色が「まだお気に入りでない」ことを示す印です
- ツールチップは出しません。`aria-label` だけにします (行の中で hover のたびにツールチップが出るのを避ける)
- 連打の抑止はしません。IPC は数ミリ秒で返り、最後のクリックの値が残れば十分です

## 無効な状態

- ボタンに `disabled` の状態は設けません。お気に入りの切り替えは常に可能です
- IPC が失敗したときは toast でエラーを出し、表示は元の値のままです ([IPC](../architecture/ipc.md))
