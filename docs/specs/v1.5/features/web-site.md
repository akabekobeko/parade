# 公式サイトへの反映

リピートはプレーヤー バーの見た目と機能が変わるため、公式サイト ([公式サイトの仕様](../../web/README.md)) のトップ ページの説明と、プレーヤー バーが写るスクリーンショットを更新します。

## 方針

- トップ ページの機能一覧には **リリース済みの機能だけ** を載せます ([トップ ページ](../../web/features/top-page.md))。説明の更新は Phase 3 で、アプリ側の PR が main に入ってから行います
- サイトの変更は main へのマージで自動公開されるため、**サイトの更新 PR は v1.5 の Release を Publish したあとにマージ** します ([デプロイ](../../web/architecture/deploy.md))
- スクリーンショットは「画面の見た目が変わる PR で撮り直す」規則 ([スクリーンショット](../../web/features/screenshots.md)) に従い、Phase 3 のサイト更新 PR でまとめて撮り直します

## トップ ページの機能一覧

新しい項目は足さず、既存の「Play your way」の本文にリピートを加えます。

| 機能 | 変更 | スクリーンショット |
| --- | --- | --- |
| Play your way | 本文に repeat を足す。例: "Queue, shuffle, repeat an album or a single song, and control playback with your OS media keys." | `player` (撮り直し) |

- `home.feature.player.body` を en / ja の両方で更新します (`en.ts` のキーが型なので、ja に欠けるとビルドで分かる)
- 見出しと alt は変えません

## スクリーンショット

プレーヤー バーは全ルート共通で最下段に写るため、ウィンドウ全体を撮るシーンはすべて見た目が変わります。

| シーン | 更新 | 理由 |
| --- | --- | --- |
| `player` | 撮り直し | 切り出し範囲がプレーヤー バー。リピートを `all` にして点灯した状態で撮る |
| `artists` / `artists-light` / `albums` / `playlists` / `favorites` / `music-info` / `settings` | 撮り直し | 最下段のプレーヤー バーにボタンが 1 つ増える |

- 撮影の条件 (macOS、Retina、1280x800、英語 UI、ダーク テーマ、`pnpm demo`) とマスク処理は既存どおりです
- `player` 以外のシーンではリピートは無効のままにします。点灯したアイコンが写るのは `player` だけにし、他のシーンの主題から目を引かないようにします
- `player` の切り出し座標はボタンが増えた分を確認し、必要ならマスクの manifest を直します

## 既存の仕様書の更新

- `docs/specs/web/features/top-page.md` の機能一覧の表で「Play your way」の要点にリピート (v1.5) を足す
- `docs/specs/web/features/screenshots.md` の `player` の操作に「リピート ボタンを押して `all` にする」を足す
- `docs/specs/README.md` に v1.5 のリンクを足す (本仕様書の作成時に実施)
