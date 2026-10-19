# 公式サイトへの反映

プレイリストの画像とサイドバーの項目の見た目が変わるため、公式サイト ([公式サイトの仕様](../../web/README.md)) のトップ ページの説明と、サイドバーが写るスクリーンショットを更新します。

## 方針

- トップ ページの機能一覧には **リリース済みの機能だけ** を載せます ([トップ ページ](../../web/features/top-page.md))。説明の更新は Phase 5 で、アプリ側の PR が main に入ってから行います
- サイトの変更は main へのマージで自動公開されるため、**サイトの更新 PR は v1.6 の Release を Publish したあとにマージ** します ([デプロイ](../../web/architecture/deploy.md))
- スクリーンショットは「画面の見た目が変わる PR で撮り直す」規則 ([スクリーンショット](../../web/features/screenshots.md)) に従い、Phase 5 のサイト更新 PR でまとめて撮り直します

## トップ ページの機能一覧

新しい項目は足さず、既存の「Playlists and smart playlists」の本文に画像を加えます。

| 機能 | 変更 | スクリーンショット |
| --- | --- | --- |
| Playlists and smart playlists | 本文に画像を足す。例: "Hand-picked playlists and smart playlists that update by rules. Give each one a picture, and shape the table with the columns you want." | `playlists` (撮り直し) |

- `home.feature.playlists.body` を en / ja の両方で更新します (`en.ts` のキーが型なので、ja に欠けるとビルドで分かる)
- 見出しと alt は変えません

## スクリーンショット

サイドバーは Artists と Playlists のルートで写り、どちらも項目の見た目 (選択中の項目のメニュー ボタン、Playlists の画像と 2 段の文言) が変わります。

| シーン | 更新 | 理由 |
| --- | --- | --- |
| `playlists` | 撮り直し | 主題。サイドバーに My Best (画像あり)、Jazz (画像とバッジ)、Rock (プレースホルダー) が並び、ヘッダーに My Best の画像が出る |
| `artists` / `artists-light` / `favorites` / `player` / `music-info` | 撮り直し | サイドバーで選択中の Milo Ashgrove の項目にメニュー ボタンが写る (非選択の項目は変わらない) |
| `albums` / `settings` | そのまま | Albums のサイドバーはフィルターで、Settings にサイドバーの項目はない |

- 撮影の条件 (macOS、Retina、1280x800、英語 UI、ダーク テーマ、`pnpm demo`、CDP 方式) とマスク処理は既存どおりです
- `playlists` の操作は今までどおり My Best を開き、カラムと幅、お気に入り、再生中の行を同じにします。画像はデモ用データが持つので、撮影時の操作は増えません
- `player` の切り出し範囲にサイドバーの下端が入る場合はマスクの manifest を確認します

## デモ用データ

`pnpm demo:assets` が作るデモ DB で、My Best と Jazz のスマートプレイリストに画像を割り当てます ([データベース](../architecture/database.md))。

- My Best: 再生できる曲のアルバム Modulations のアートワーク。`artists` のシーンで見出しに出るジャケットと同じ絵になり、「プレイリストに画像を付けられる」ことが伝わる
- Jazz: Jazz のアルバムのうち、`albums` のシーンで Star を付けるもの (Songs for the Parade) のアートワーク。スマートプレイリストのバッジが画像の上に出る
- Rock: 画像なし。プレースホルダーのアイコンも同じ一覧に写り、画像の有無で見た目が変わることが分かる
- 割り当てはデモ ライブラリーの既存の `pictures` 行を参照するだけで、画像ファイルは増えません。`writeDemoDatabase` の `playlists` / `smart_playlists` の INSERT に `picture_id` を足します

## 既存の仕様書の更新

- `docs/specs/web/features/top-page.md` の機能一覧の表で「Playlists and smart playlists」の要点に画像 (v1.6) を足す
- `docs/specs/web/features/screenshots.md` の `playlists` の画面の説明にサイドバーの画像を足し、デモ用データの画像の割り当てを「注意」に書く
- `docs/specs/README.md` に v1.6 のリンクを足す (本仕様書の作成時に実施)
