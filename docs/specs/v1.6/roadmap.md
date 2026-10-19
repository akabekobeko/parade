# ロードマップ

v1.6 の実装フェーズ分割です。v1.5 と同じく「動くものが確認できる」単位で区切り、順に積み上げます。詳細タスクは実装時に issue 化します。

```
Phase 1  基盤          マイグレーション 006 / picturePath と musicCount / 孤児 GC / mp:playlist:setPicture / Renderer コマンド
Phase 2  ダイアログ    playlistInfoStore / PlaylistInfoDialog (通常・スマート) / SmartRulesForm の切り出し / メニューの置き換え / i18n
Phase 3  サイドバー    行クラスの共有 / PlaylistRow / スマートのバッジ / Artists のメニュー ボタン化
Phase 4  ヘッダー      PlaylistHeader の画像とバッジ / デモ用データの画像
Phase 5  仕上げ        既存の仕様書の更新 / 実機での QA / 公式サイト
```

## Phase 1: 基盤

**ゴール: DB に画像を持て、IPC で設定でき、一覧に `picturePath` と `musicCount` が返る (UI はまだない)。**

- `006_playlist_pictures.sql` と `migrations/index.ts` への登録 ([データベース](architecture/database.md))
- `deleteOrphanedPictures` の条件にプレイリストの参照を足す。`removePlaylist` をトランザクション化して GC を呼び、ハンドラーがファイルを消す
- `listPlaylists` / `readPlaylist` の `pictures` の LEFT JOIN と `musicCount` の集計、`playlistSchema` の拡張
- `setPlaylistPicture` (Main) と `mp:playlist:setPicture` のハンドラー、`ipcKeys` / preload / `MpApi` ([IPC](architecture/ipc.md))
- Renderer の `setPlaylistPicture` コマンド (キャッシュの差し替え)
- 上記のユニット テスト (`listPlaylists.test.ts`、`removePlaylist.test.ts`、`setPlaylistPicture.test.ts`、`deleteOrphanedPictures.test.ts`、`onSetPlaylistPicture.test.ts`)

## Phase 2: ダイアログ

**ゴール: メニューから「プレイリスト情報の確認」を開き、名前、ルール、画像を適用できる。**

- `playlistInfoStore` と AppLayout への `PlaylistInfoDialog` の配置 ([プレイリスト情報の確認ダイアログ](features/playlist-info-dialog.md))
- `SmartRulesDialog` からルールのフォーム (`SmartRulesForm`) と下書きの hook (`useRulesDraft`) を切り出し、作成ダイアログが使い続けることをテストで確認
- 通常のレイアウト (タブなし) とスマートのレイアウト (詳細 / 画像のタブ)
- Apply の判定と patch の組み立て (純関数) とそのテスト、適用の流れ、エラー表示
- サイドバーの項目のメニューとヘッダーのメニューに項目を足し、「ルールを編集」を外す。en / ja の文言 (`playlistInfo.*`)、`smart.editRules` の削除

## Phase 3: サイドバー

**ゴール: Playlists と Artists の項目が同じ見た目で、どちらも右端のメニュー ボタンから操作できる。**

- `ArtistRow` の行クラスを `sidebarRowClassName` として共有化し、`PlaylistRow` を切り出す ([サイドバーの項目](features/sidebar-rows.md))
- Playlists の項目: 画像 (角丸矩形)、プレースホルダー、スマートのバッジ (`--smart` トークン)、名前と曲数の 2 段、インライン名前変更の維持
- Artists の項目: `ContextMenu` を外し、`RowMenu` を hover か選択中に表示する (Playlists と同じ)。選択中の反転色をメニューのアイコンにも適用する
- 両方の項目で、hover の発光、選択中の塗り、メニューの hover の塗りをライト / ダークで確認

## Phase 4: ヘッダー

**ゴール: コンテンツ ヘッダーの左端に画像が出て、デモ用データでスクリーンショットが撮れる。**

- `PlaylistHeader` のタイルを画像対応にし、スマートのバッジを重ねる ([プレイリスト ヘッダー](features/playlist-header.md))
- デモ用データ (`writeDemoDatabase`) で My Best と Jazz のスマートプレイリストに画像を割り当てる ([公式サイトへの反映](features/web-site.md))

## Phase 5: 仕上げ

**ゴール: 仕様書と公式サイトが揃い、配布できる。**

- 既存の仕様書の更新 ([README](README.md) の「既存の仕様書への影響」)
- 実データでの QA: 通常 / スマート × 画像あり / なし × 選択中 / 非選択の見た目、画像の差し替えで古いファイルが消えること、プレイリストの削除で画像が消えること (他のプレイリストやアートワークと共有している画像は残ること)、壊れたルールのスマートプレイリストの復旧、旧バージョン (v1.5) のバックアップからの起動
- トップ ページの説明とスクリーンショットの更新 ([公式サイトへの反映](features/web-site.md))

## フェーズ間の依存関係

- Phase 2 / 3 / 4 はいずれも Phase 1 に依存します。Phase 1 は UI がないため単体では動作を確認できず、Phase 1 と 2 を 1 つの PR にまとめてもかまいません
- Phase 3 と Phase 4 は互いに独立しており、別々の PR にできます。Phase 3 の Artists のメニュー ボタン化は Phase 1 にも依存しないので、先に単独の PR にしてもかまいません
- Phase 5 の公式サイトの更新は、v1.6 の Release を Publish したあとにマージします ([公式サイトへの反映](features/web-site.md))
