# 公式サイトのヘッダー

ヘッダーのボタンとリンクの hover を、アプリの現在の見た目に揃えます ([ページ構成](../../web/features/pages.md)、[テーマとスタイル](../../web/architecture/theme.md))。

## 背景

サイトの hover は、アプリが v1.4.0 まで使っていた lamp glow (アイコンや文字の形に沿った `drop-shadow`) をそのまま写しています。アプリは v1.4.1 で、アイコンの絵がにじむ、ライト テーマでは影に見える、という理由で lamp glow をやめ、次の 2 種類に移行しました (`IconButton` の `ring` / `tint`)。

| 種類 | アプリでの用途 | 見た目 |
| --- | --- | --- |
| ring (枠線 + glow) | プレーヤー バーのボタン、曲行のメニュー ボタン | 透明な枠線が hover で `foreground` 色になり、ぼかした `box-shadow` で光る。塗りはなし |
| tint (角丸矩形の塗り) | サイドバーのツール ボタン (`ClusterButton`)、コンテンツ ツールバーのメニュー、一般のアイコン ボタン | 角丸矩形が半透明の `foreground` (`bg-foreground/10`) で塗られる。ライトでは少し暗く、ダークでは少し明るく |

サイトも同じ 2 種類に揃え、lamp glow を廃止します。

## 要素ごとの hover

| 要素 | 現在 | 変更後 |
| --- | --- | --- |
| 左端のアイコンとアプリ名 (トップへのリンク) | lamp glow | **tint**: `rounded-md px-2 h-9 hover:bg-foreground/10`。アプリのサイドバーのツール ボタンと同じ |
| ページ リンク (Home / Download) | lamp glow。現在のページは `bg-foreground text-background` の塗りつぶし | **ring**: `border border-transparent` を常に持ち、hover で `glow-ring`。現在のページは塗りつぶしのまま、hover で枠線が `foreground` になるため glow だけが足される |
| 言語切り替え (日本語 / English) | lamp glow | **ring** (ページ リンクと同じ pill) |
| テーマ切り替え (Sun / Moon) | lamp glow | **ring** (円。アプリのプレーヤー バーのアイコン ボタンと同じ) |
| GitHub リンク (アイコン) | lamp glow | **ring** (円) |
| 日本語版の案内バナーの閉じるボタン (X) | lamp glow | **ring** (円)。ヘッダーの外だが、lamp glow を使う最後の要素なので一緒に移す |

- 左端のリンクだけ tint にするのは、アイコンと文字の組み合わせに円や pill の枠線が合わず、アプリでも同じ構成 (アイコンの並ぶツール ボタン) が tint だからです
- ダウンロード ボタン (`ButtonLink`) とダウンロード カードの border glow は変えません

## CSS

`web/src/styles/global.css` のユーティリティを次のようにします。

| ユーティリティ | 変更 | 内容 |
| --- | --- | --- |
| `glow-lamp` | 削除 | 使う要素がなくなる |
| `glow-ring` | 追加 | `border-color: var(--foreground); box-shadow: 0 0 5px 1px color-mix(in oklch, var(--foreground) 60%, transparent)`。アプリの `IconButton` `ring` の hover と同じ値 (`glow-border` にある `0 0 0 1px` の内側の線は含めない。`glow-border` は枠線が常にある `CircleIconButton` 用) |
| `glow-border` / `glow-primary` | そのまま | ボタンとカード用 |
| `transition-glow` | 対象を `border-color, box-shadow` に絞る | `filter` は lamp glow と一緒になくなる。`color` / `background-color` を外し、tint の塗りには transition を付けない (塗りの transition はちらつくため、アプリでも付けていない) |

- ring の要素は `border border-transparent` を常に持ち、hover で枠線の色が付いても大きさが変わらないようにします (アプリの `Button` が `border border-transparent` を基底に持つのと同じ)
- `transition-glow` は ring の要素に付け、tint の要素には付けません
- `prefers-reduced-motion: reduce` で transition を切る扱いはそのままです
- 「hover 時の glow 効果」という表現は仕様書に残りますが、意味は ring (枠線 + glow) になります。[テーマとスタイル](../../web/architecture/theme.md) の表を更新します ([公式サイトへの反映](web-site.md))

## 確認

- ライト / ダークの両テーマで、ring の枠線と glow、tint の塗りが見えること (ライトの tint は少し暗く、ダークは少し明るく)
- 現在のページの pill (塗りつぶし) に hover したとき、文字色が変わらず glow だけが足されること
- キーボード フォーカス (`focus-visible`) の見た目は現在のブラウザー既定のアウトラインのままで、hover の変更で消えないこと
- `pnpm --filter parade-web build` が通り、Lighthouse の Accessibility が下がらないこと
