# 公式サイトの機能一覧のレイアウト

トップ ページの「主な機能」を、機能ごとに「見出し、説明文、ダークとライトのスクリーンショットの横並び」の縦レイアウトにします ([トップ ページ](../../web/features/top-page.md))。

## 現在と変更後

現在は「説明文とスクリーンショット 1 枚」を 2 カラムで左右交互に置いています (`HomePage.astro` の `md:grid-cols-2` と `md:order-2`)。変更後は交互の配置をやめ、どの機能も同じ縦の構成にします。

```
現在 (md 以上)                          変更後 (md 以上)
┌──────────────┬──────────────┐        ┌─────────────────────────────┐
│ 見出し        │              │        │ 見出し                       │
│ 説明文        │  スクショ     │        │ 説明文                       │
├──────────────┼──────────────┤        ├──────────────┬──────────────┤
│              │ 見出し        │        │ ダーク        │ ライト        │
│  スクショ     │ 説明文        │        │  Dark        │  Light       │
└──────────────┴──────────────┘        └──────────────┴──────────────┘
```

- 機能 1 件は `flex flex-col gap-4` の `li` で、`h3`、`p`、画像の 2 カラム グリッド (`grid gap-4 md:grid-cols-2 md:gap-6`) の順です。見出しと説明文は左寄せのまま、幅は `max-w-prose` で読みやすい行長に抑えます
- 画像は `figure` で包み、下に `figcaption` としてテーマ名 ("Dark" / "Light"、`home.screenshot.dark` / `home.screenshot.light`) を `text-xs text-muted-foreground` で中央寄せに添えます。2 枚が「同じ画面のテーマ違い」であることを文字でも示し、スクリーン リーダーには alt でテーマを読ませます
- ダークを左、ライトを右に固定します。`md` 未満ではダーク、ライトの順に縦に並びます
- 機能と機能の間隔は `ul` の `gap-14` にします (現在の `gap-12` より広げ、画像 2 枚のブロックの区切りを見やすくする)。間隔はすべて gap と padding で、margin は使いません
- アプリの「Light and dark」の説明は不要になるので、ヒーローの直後にテーマ切り替えの案内は足しません。サイト自体のテーマ切り替えはヘッダーにあります

## 機能一覧の項目

すべての項目をダークとライトで見せるため、ライト テーマの紹介のためだけにあった「Light and dark」(`theme`、`artists-light`) の項目を廃止し、テーマの説明を設定の項目に統合します。項目は 8 から 7 になります。

| キー | 見出し (en) | スクリーンショット | 変更 |
| --- | --- | --- | --- |
| `artists` | Browse by artist | `artists` / `artists-light` | 変更なし |
| `albums` | Filter your albums | `albums` / `albums-light` | 変更なし |
| `playlists` | Playlists and smart playlists | `playlists` / `playlists-light` | 変更なし |
| `favorites` | Keep your favorites close | `favorites` / `favorites-light` | 変更なし |
| `metadata` | Edit and complete metadata | `music-info` / `music-info-light` | 変更なし |
| `player` | Play your way | `player` / `player-light` | 本文に速度を足す ([公式サイトへの反映](web-site.md)) |
| `settings` (旧 `language`) | Choose your language and theme | `settings` / `settings-light` | 「Light and dark」を統合。本文の例: "Pick English, Japanese or your system language in the settings dialog, and switch between the dark and light themes there as well, or follow your OS." |

- 辞書のキーは `home.feature.theme.*` を削除し、`home.feature.language.*` を `home.feature.settings.*` に改めます (内容が言語とテーマの両方になるため)。ja も同時に直します
- 見出しは動詞から始める規則 ([トップ ページ](../../web/features/top-page.md)) に合わせ、"English and Japanese" を "Choose your language and theme" にします。ja は「言語とテーマを選ぶ」
- 現在の `settings` の説明にある「設定ページ」は、v1.6 でダイアログになったので「設定ダイアログ」に直します

## ヒーロー

ヒーローのスクリーンショット (`artists`、ダーク) は 1 枚のままです。サイトのテーマに合わせてダーク / ライトを切り替える案は、両方の画像を eager で読み込むことになるため v1.7 では採らず、候補として残します ([スコープ](../scope.md))。

## 画像

- `Picture` の `widths` と `formats` は現在のまま (`[640, 1280, 2560]`、`avif` と `webp`) です。`sizes` は画像 1 枚がコンテンツ幅の半分になる現在の `FEATURE_SIZES` をそのまま使えます (2 カラムの片側という条件は変わらない)
- 機能一覧の画像はすべて `loading="lazy"` のままです。1 ページの画像は 14 枚になりますが、初期表示で読むのはヒーローの 1 枚だけです
- Phase 5 で Lighthouse (モバイル) とトップ ページの転送量を計測し直し、3 MB の目安 ([公式サイトのスコープ](../../web/scope.md)) を超えるようなら `widths` から 2560 を外すことを検討します
- `HomePage.astro` の `features` 配列は `{ key, dark, light }` の形にし、画像の import を 14 個にします
