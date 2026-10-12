# 公式サイトへの反映

お気に入りは機能と見た目の両方が変わるため、公式サイト ([公式サイトの仕様](../../web/README.md)) のトップ ページと、見た目の変わる画面のスクリーンショットを更新します。

## 方針

- トップ ページの機能一覧には **リリース済みの機能だけ** を載せます ([トップ ページ](../../web/features/top-page.md))。お気に入りの項目は Phase 5 で、アプリ側の PR がすべて main に入ってから追加します
- サイトの変更は main へのマージで自動公開されます ([デプロイ](../../web/architecture/deploy.md))。アプリの Release を待たずに公開されるため、**サイトの更新 PR は v1.4 の Release を Publish したあとにマージ** します。先にマージするとダウンロードできない機能が載ります
- スクリーンショットは「画面の見た目が変わる PR で撮り直す」規則 ([スクリーンショット](../../web/features/screenshots.md)) に従います。ただし v1.4 ではアプリ側の PR が複数に分かれ、各 PR で撮り直すと手戻りになるため、Phase 5 のサイト更新 PR でまとめて撮り直します

## トップ ページの機能一覧

機能一覧 (`web/src/components/HomePage.astro` の `features` と `home.feature.*` の辞書) に 1 項目を足します。

| 機能 | スクリーンショット | 位置 |
| --- | --- | --- |
| Keep your favorites close | `favorites` (新規) | 「Playlists and smart playlists」の次 |

- 見出しは動詞で始めます (既存の Browse / Filter / Edit / Play に揃える)
- 本文は本仕様書の「テーマ」をユーザー視点に言い換えます。例: "Star the songs and albums you love, spot them at a glance in every view, and show only your favorites with one click."
- ja は en の意味を保って訳し、`home.feature.favorites.title` / `.body` / `.alt` を en / ja の両方に足します (`en.ts` のキーが型なので、ja に欠けるとビルドで分かる)
- 画像は既存と同じ `<Picture>` (avif / webp、`loading="lazy"`)

## スクリーンショット

| シーン | 更新 | 理由 |
| --- | --- | --- |
| `favorites` | 新規 | Artists ビューで、お気に入り ON の曲が数曲あり、フィルター メニューを開いて「お気に入りのみ表示」が見える状態 |
| `artists` | 撮り直し | 曲リスト行に Star が加わる |
| `artists-light` | 撮り直し | 同上 (ライト テーマ) |
| `albums` | 撮り直し | カードのタイトル行に Star が加わる |
| `playlists` | 撮り直し | お気に入りカラムが加わる。v1.3 と同じく追加カラムと幅を設定する |
| `music-info` | 変更なし | 曲情報ダイアログは変わらない |
| `player` | 撮り直し | プレーヤー バーとキューは変わらないが、切り出し範囲に曲リストの下半分 (Star が加わる) が入る |
| `settings` | 変更なし | 設定は変わらない |

- 撮影の条件 (macOS、Retina、1280x800、英語 UI、ダーク テーマ、`pnpm demo`) とマスク処理は既存どおりです
- `favorites` はメニューを開いた状態で撮るため、`screenshots.md` のシーン表に手順 (お気に入りにする曲、メニューを開く操作) を追記します
- デモ データ (`pnpm demo:assets`) にお気に入りの初期値は持たせません。撮影前に手で数曲と数アルバムを ON にします。ON にする曲は `artists` のシーンと同じアーティストにし、撮り直しの枚数を増やさないようにします

## 既存の仕様書の更新

- `docs/specs/web/features/top-page.md` の機能一覧の表に `favorites` を足す
- `docs/specs/web/features/screenshots.md` のシーン表に `favorites` を足す
- `docs/specs/README.md` に v1.4 のリンクを足す (本仕様書の作成時に実施)
