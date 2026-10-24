# スクリーンショット

デモ モードで macOS のスクリーンショットを撮影し、個人情報をマスクしてサイトに載せる手順です。撮影は AI (Claude Code) がローカルでアプリを起動して行う想定ですが、人が同じ手順で撮っても同じ結果になるようにします。

## 前提

- macOS。デモ用データの生成に `sips` と `afconvert` が必要 ([デモ モード](../../../demo/README.md))
- Retina ディスプレイ (2x) で撮影する。ウィンドウ 1280 x 800 を 2x の PNG で保存する。`screencapture -l` は影の余白を含めるので、画像は 2784 x 1824 になる (ウィンドウ本体は 2560 x 1600)
- 表示の拡大率はシステム既定 (「デフォルト」)。メニュー バーとドックの状態は写らないので任意

## 手順

1. `pnpm demo` でアプリを起動する。初回はデモ用データの生成に 30 秒ほどかかる。AI が操作する場合は下記の CDP 方式で起動する
2. 必要なら `pnpm demo:assets` で初期状態に戻す (前回の撮影で設定や選択を変えている場合)
3. 撮影する画面ごとに [撮影する画面](#撮影する画面) の操作を行う
4. ウィンドウ単位でキャプチャーする
   - ウィンドウ ID (CGWindowID) を取得する: 人が撮る場合は `GetWindowID` (Homebrew) で `GetWindowID Electron --list` のように取得する。AI が操作する場合は `CGWindowListCopyWindowInfo` を呼ぶ小さな Swift スクリプト (scratchpad に書く) で取得する。開発起動のプロセス名は `Electron`
   - 撮影の直前に `osascript` でアプリを前面にする。`screencapture -l` は前面にないウィンドウを非アクティブな見た目 (灰色の信号ボタン、小さい影) で撮る
   - `screencapture -l <windowId> <scene>.png` で保存する。影を含めたまま撮る (`-o` を付けない)。サイトでは枠や影を付けない前提 ([テーマとスタイル](../architecture/theme.md))
   - 保存先は Claude Code の scratchpad など、リポジトリーの外。マスク前の画像は commit しない
5. [マスク](#マスク) を施して `web/src/assets/screenshots/<scene>.png` へ出力する
6. 画像を目視で確認し、ファイル パス、ユーザー名、実在の人物や作品が写っていないことを確かめる

### AI が操作する場合 (CDP 方式)

AI (Claude Code) が操作する場合は CDP (Chrome DevTools Protocol) 方式で行います。v1.3 以降の撮影はすべてこの方法で、2026-10-18 にこれを標準にしました (`cmux-cua` による AX 経由の操作は Accessibility と Screen Recording の許可が必要なため使いません)。

- 起動: `pnpm build` のあとに `PARADE_USER_DATA_DIR=<demo-N のパス> ./node_modules/.bin/electron dist/main/main.js --remote-debugging-port=9222` で起動する。`pnpm demo` は dev モードで CDP のポートを渡せないので使わない (デモ用データの生成が必要なら先に `pnpm demo:assets`)
- 操作: `http://127.0.0.1:9222/json` の page ターゲットへ WebSocket で接続し、`Runtime.evaluate` でレンダラーの DOM を操作する。ボタンは `element.click()`、曲の再生は行への `dblclick` イベント、スクロールは `scrollTop`。仮想スクロールの行は見える位置までスクロールしないと DOM にない。設定で済む状態 (プレイリストのカラムなど) は `window.mp.settings.set` で書いて `location.reload()` すると早い
- 前面: Electron は背面にあると描画を止める (requestAnimationFrame が走らず仮想スクロールも更新されない) ので、操作と撮影の前に `osascript` でアプリを前面にする
- hover: 操作の最後に `mousemove` イベントで見出しの空き領域へポインターを移し、行の hover を残さない
- 撮影とマスクは手順 4 以降と同じ。次の撮影まで時間が空くときはリピートを `one` にしておくと、曲の終端のエラー トーストを避けられる (撮影前に `off` へ戻す)

## 撮影する画面

テーマはデモ設定の既定 (ダーク) を基本にし、テーマ紹介用に 1 枚だけライトを撮ります。アプリの言語は英語だけです (設定の Language を English にする。OS が日本語の場合は System のままだと日本語になる)。日本語 UI は撮らず、対応言語は `settings` の画面と文章で伝えます。

| scene | 画面 | 操作 | 注意 |
| --- | --- | --- | --- |
| `artists` | Artists ビュー、Milo Ashgrove、再生中 | 起動直後の状態 (Milo Ashgrove が選択済み)。アルバム Modulations の 1 曲目 Test Tone Serenade を再生する。再生位置が 0:30 前後になるまで待つ | 再生できるのはこの曲だけ。他の曲は再生するとエラーになる |
| `artists-light` | 同上、ライト テーマ | Settings → Theme を Light にしてから `artists` と同じ状態にする | 撮影後に Dark へ戻す |
| `albums` | Albums ビュー、フィルター適用 | サイドバーのジャンルで Jazz、年代で 1990s を選び、アルバムが 10 - 20 枚程度並ぶ状態にする。再生中のまま | ジャケットは生成した抽象図形なので権利の問題はない |
| `playlists` | Playlists ビュー、テーブル。サイドバーに My Best (画像あり)、Jazz (画像とスマートのバッジ)、Rock (プレースホルダー) の項目が並び、ヘッダーに My Best の画像が出る (v1.6) | My Best を開く。コンテンツ ツールバーのカラム メニューで Album artist と Genre と Year を表示し、ウィンドウ幅に収まるようにカラム幅を縮める (Title 150、Artist 140、Album 140、Album artist 130、Genre 90、Year 60。v1.4 でお気に入りカラムが加わった分、Title を 190 から縮めた)。1 行目 (Test Tone Serenade) を再生中にする。お気に入りカラム (常に表示) には 1 行目のほか、8 行目 Hidden Map と 11 行目 Daydream in Slow Motion の Star を ON にしておく | 右クリック メニューは閉じる。サイドバーとヘッダーの画像はデモ用データが持つ (`pnpm demo:assets` が My Best に Modulations、Jazz に Songs for the Parade のアートワークを割り当て、Rock は画像なし。[公式サイトへの反映](../../v1.6/features/web-site.md))。撮影時の操作は増えない |
| `favorites` | Artists ビュー、お気に入りとフィルター メニュー | `artists` と同じ構図 (Milo Ashgrove、Modulations の見出しが上から 2 行目、Test Tone Serenade を再生中。再生位置は問わない) で、曲リストの Star を 4 曲 (Test Tone Serenade、Electric Engine、The Anchor、Umbrella) クリックして ON にし、アルバム Modulations もアルバム メニューの Album info から Favorite を ON にして Apply する (見出しに Star が出る)。コンテンツ ツールバーの Funnel ボタンでフィルター メニューを開き、「Favorites only」の項目が見える状態にする (チェックは OFF のまま。ON にすると曲が減って Star の意味が伝わりにくい) | `artists` / `artists-light` / `player` の撮影でも同じ曲とアルバムを ON にしておく。`albums` では Jazz / 1990s のアルバムのうち Songs for the Parade、Atlas & Evening、Broken Desert をカードの Star で ON にする。デモ用データにお気に入りの初期値はないので、`pnpm demo:assets` で戻したときは付け直す |
| `music-info` | 曲情報ダイアログ | Test Tone Serenade の行メニューから Song info を開き、Details タブを表示する | **File タブはファイル パスが出るので撮らない。** Details タブでもファイル名が見える場合はマスクする |
| `player` | プレーヤー バーとキュー | `artists` と同じ構図で再生中に、リピート ボタンを押して `all` (点灯) にし、キュー ボタンでキュー ポップオーバーを開く (開いた直後はゴミ箱ボタンにフォーカスが移るので外す)。ウィンドウ全体を撮り、サイト側でプレーヤー バー付近を切り出す | 切り出しの座標はマスクの manifest に書く。切り出し範囲には曲リストの下半分が入るので、曲リストの見た目が変わる PR ではこのシーンも撮り直す。リピートが点灯するのはこのシーンだけで、他のシーンは `off` のまま撮る |
| `settings` | Settings ページ | サイドバーから Settings を開く。Theme が Dark、Language が English の状態 | ライブラリー統計はデモ用データの数値なのでそのままでよい |

- 撮影の前に、トースト通知、ツールチップ、ホバー状態が残っていないことを確認する。再生できる曲は 1:47 で終わり、次の曲へ進むと再生エラーのトースト (ファイル パスを含む) が出るので、撮影のたびに再生し直す
- ウィンドウの位置は画面の中央にし、他のウィンドウを重ねない
- 撮り直す場合は同じ scene 名で上書きする。画面が変わっていない scene は撮り直さない (差分を小さくするため)

## マスク

スクリーンショットに次が写り得ます。

- 音楽ファイルのパス: `~/Library/Application Support/Parade/demo-N/musics/...`。ユーザー名を含む。曲情報ダイアログの File タブ、取り込みダイアログ、曲情報の適用失敗の表示に出る
- 設定のライブラリー統計 (曲数など): 個人情報ではないが、デモ用データの数値なのでそのままでよい

対応は「写さない」を優先し、どうしても写る場合だけモザイクを掛けます。

- 撮影する画面の選び方で File タブと取り込みダイアログを避ける
- モザイクは `web/scripts/maskScreenshots.ts` で掛ける。`sharp` で対象領域を 1/16 に縮小してから最近傍補間で元のサイズに戻し、元画像に合成する (ぼかしではなくモザイク。ぼかしは復元される可能性がある)
- 領域は `web/screenshots.manifest.json` に scene ごとに記録する (`x`、`y`、`width`、`height`、2x の座標)。切り出し (`player`) も同じ manifest に書く。`player` は幅を 2784 のまま高さ 1008 で切り出し、上端は曲リストの再生中の行が枠線ごと入る位置にする (構図が数 px ずれたら撮り直すより `y` を直す)
- 実行は `pnpm --filter parade-web screenshots:mask -- <input-dir>`。入力はマスク前の画像のディレクトリー、出力は `web/src/assets/screenshots/`

```json
{
  "music-info": {
    "mask": [{ "x": 640, "y": 1180, "width": 1280, "height": 48 }]
  },
  "player": {
    "crop": { "x": 0, "y": 796, "width": 2784, "height": 1008 }
  }
}
```

## 確認項目

commit する前に次を確認します。

- [ ] ファイル パス、ユーザー名、メール アドレスが写っていない
- [ ] 実在のアーティスト名、曲名、アルバム名がない (デモ用データは架空だが、偶然の一致は `docs/demo/README.md` の注意のとおり)
- [ ] トースト、ツールチップ、ホバー状態が残っていない
- [ ] 画像サイズが 2784 x 1824 (切り出した `player` を除く) で、ファイル サイズが 1 枚 1 MB 以内を目安にする (ジャケットが並ぶ `albums` は可逆圧縮では 1.2 MB 程度になる)
- [ ] `pnpm --filter parade-web build` で画像最適化が通る

## 更新の契機

画面の見た目が変わった PR (新しいビュー、レイアウト変更、配色変更) で撮り直します。バージョン番号だけの変更では撮り直しません。スクリーンショットに写る画面を変える PR では、この手順で撮り直した画像を同じ PR に含めます。
