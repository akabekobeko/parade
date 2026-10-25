# システムメニュー

タイトルバーレス構成におけるシステムメニュー (アプリケーションメニュー) の扱いに関する調査結果と採用方針です。

## 背景: 現在の実装

OS 標準のタイトルバーは全プラットフォームで非表示です ([ルーティングとレイアウト](../renderer/routing-layout.md))。

- macOS: `titleBarStyle: "hiddenInset"` — メニューはシステムのメニューバーに表示されるため、タイトルバーの有無と競合しない
- Windows / Linux: `titleBarStyle: "hidden"` + `titleBarOverlay` (Window Controls Overlay、高さ 40px)
- `installApplicationMenu()` (`src/main/menu/applicationMenu.ts`) は全プラットフォームで `Menu.setApplicationMenu` を呼んでいる

## Windows でのメニュー表示位置

`titleBarStyle: "hidden"` のままアプリケーションメニューを表示すると、**ウィンドウ最上部 (本来タイトルバーがあった帯) に Chromium が描画するネイティブメニューバーが横一列で現れます**。

- メニュー項目 (File / Edit / ...) は左端から並ぶ。macOS と異なりシステム側のメニューバー領域はなく、ウィンドウ自身の最上段に描かれる
- 右端には WCO のキャプションボタン (最小化・最大化・閉じる) が同じ帯に同居する
- この帯はオーバーレイではなく**レイアウトとして高さを消費する**ため、Web コンテンツ全体がメニューバーの高さぶん下に押し下げられる (`window.innerHeight` も縮む)

### 問題点: 二段ヘッダー

Renderer は最上部 40px の帯を PlayerBar (ドラッグ領域 + WCO セーフエリア) として使っているため、ネイティブメニューバーを表示するとその**さらに上にメニューの帯が乗り「二段ヘッダー」の見た目**になります。メニューバーの高さは Chromium 標準 (30px 前後) で `titleBarOverlay.height: 40` とは独立なので、帯の高さも揃いません。

## 先行事例: Slack (Windows 版)

Slack の Windows 版 (Electron 製) は同じ問題に対して**メニューバーを常時表示しない**方式を採っています。

- ウィンドウはタイトルバーなしで、最上部の帯 (ワークスペース名・戻る/進む・検索ボックス) はすべて Renderer 側で自前描画。File / Edit / View の行は普段どこにも存在しない
- ネイティブメニューの機能自体は残し、**Alt キーを押したときだけメインメニューが開く**。[リリースノート](https://slack.com/release-notes/windows) でも「メニューはアクセシビリティの要なので、Alt キーでメインメニューを開くキーストロークを追加した」と明記されている。表示位置はウィンドウ左上、自前ヘッダーの帯を基点にしたドロップダウン
- 旧バージョン (v4 前後) では `autoHideMenuBar` 相当の挙動 (Alt でネイティブメニューバー行が出現しコンテンツを押し下げる) だったが、その後は自前 UI 側へ寄せる方向に整理された
- メニューに載っていた主要操作 (Preferences、ズーム、リロードなど) はキーボードショートカットと画面内 UI から常時アクセスできるようにして、メニューバー自体への依存を減らしている

VS Code も同系統で、自前ヘッダー内のメニューボタン (ハンバーガー) からドロップダウンを開く方式です。

## 対応方針の選択肢

| 方式 | 表示位置 | 特徴 |
| --- | --- | --- |
| ネイティブメニューバー常時表示 | 最上部に専用の帯 | 実装は現状のまま。二段ヘッダーになり PlayerBar 帯とデザインが揃わない |
| `autoHideMenuBar: true` | Alt キー押下時のみ最上部に出現 | 実装コスト最小。表示時はコンテンツが押し下げられる |
| 自前メニューボタン + `Menu.popup()` | PlayerBar 帯内のボタンからドロップダウン | Slack / VS Code 方式。既存の 40px 帯にデザインを揃えられる。Alt キーで popup を開く導線も併設可能 |

いずれの場合も macOS はシステムメニューバーを使うため現状のままとし、Windows (と Linux) のみ表示方法を分岐させます。

## 採用方針: 自前メニューボタン + `Menu.popup()`

Slack / VS Code 方式を採用しました。

- Windows / Linux は、サイドバーツールバー左端のメニューボタン (Lucide `Menu`) から `mp:menu:popup` (send) を経由して `Menu.getApplicationMenu().popup()` を開きます。popup 位置は Renderer がボタンの矩形から算出して渡します ([ルーティングとレイアウト](../renderer/routing-layout.md) のツールバー節)
- `Menu.setApplicationMenu` は従来どおり全プラットフォームで呼び続けます (アクセラレーターと popup の供給源)。Windows / Linux の BrowserWindow には `autoHideMenuBar: true` を設定し、ネイティブメニューバーの帯を常時表示させません。Alt キー押下時のみネイティブバーが現れる、Slack 旧版相当のアクセシビリティフォールバックが残ります
- macOS はシステムメニューバーのため変更なし。メニューボタンも表示しません

## 項目のラベルと role (2026-10-25 追記)

Electron の `role` 項目 (Undo / Copy / Zoom In / Minimize など) と複合 role (`editMenu` / `viewMenu` / `windowMenu`) のラベルは英語固定で、アプリの言語設定に追従しません。大項目 (編集 / 表示 / ウィンドウ) だけが翻訳され、その中の項目が Undo / Redo のまま残っていたのはこのためです。

- `menuBuilder` は複合 role を使わず、Electron の `editMenu` / `viewMenu` / `windowMenu` と同じ構成を項目ごとに書き出し、各項目に `role` (挙動) と `label` (辞書 `menu.*` の翻訳) の両方を持たせます。アプリ メニューの Hide / Hide Others / Show All / Quit、File の Close Window / Exit (Windows) / Quit (Linux) も同じです
- Window メニューには `role: "window"` を付け、macOS がウィンドウ一覧を末尾に追加する対象であることを示します
- 日本語のラベルは macOS の標準メニューの語 (取り消す / やり直す / カット / ペースト / しまう など) に合わせます。Windows の慣用 (切り取り / 貼り付け) とは異なりますが、辞書は 1 つに保ち、主要プラットフォームの macOS に寄せます
- macOS 自身が差し込む項目 (編集メニューの「音声入力を開始」「絵文字と記号」、表示メニューの「フルスクリーンにする」、ウィンドウ メニューのウィンドウ一覧) はテンプレートの外にあり、OS の言語に従います。アプリの言語設定と OS の言語が異なる場合はこれらだけ OS の言語で表示されます。抑止するには `NSUserDefaults` (`NSDisabledDictationMenuItem` / `NSDisabledCharacterPaletteMenuItem`) を立てる必要があり、機能ごと失うため採用しません

## 開発者向け項目

表示メニューの「再読み込み」「強制的に再読み込み」「開発者ツールを表示 / 非表示」(`reload` / `forceReload` / `toggleDevTools`) は開発ビルド (`!app.isPackaged`) だけに出し、リリース版のメニューには含めません (`MenuBuildOptions.devTools`)。再読み込みは Renderer を作り直すため再生が止まりキューも消え、エンドユーザーには開発者ツールと同じく不要なためです。リリース版の表示メニューは実際のサイズ / 拡大 / 縮小 / フルスクリーンの切り替えだけになります。
