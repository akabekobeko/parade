# トップ ページ

アプリの概要、主な機能、代表的な画面を 1 ページで見せます。

## 構成

上から順に次のセクションを置きます。

### 1. ヒーロー

- アプリ アイコン (大)、製品名、タグライン `A music player for local audio libraries` (`package.json` の `description` と同じ。日本語は「ローカルの音楽ライブラリーのためのミュージック プレーヤー」)
- 一文の補足: macOS / Windows / Linux で動く、英語と日本語の UI、オープン ソース (MIT)、Electron 製
- 主ボタン「Download」(ダウンロード ページへ)。`navigator.platform` / `userAgentData.platform` が判定できる場合はラベルを「Download for macOS」のように変える (JavaScript なしでは「Download」のまま)
- 副ボタン「View on GitHub」(outline、border glow)
- 直下にメインのスクリーンショット (Artists ビュー、再生中、ダーク)。Retina 2x の画像を `<Picture>` で配信する

### 2. 主な機能

機能ごとに「見出し、2 - 3 文の説明、同じ画面のダークとライトのスクリーンショット」を縦に並べます (2026-11-03 改訂。v1.6 までは説明文と 1 枚のスクリーンショットを 2 カラムで左右交互に置いていた。[公式サイトの機能一覧のレイアウト](../../v1.7/features/web-feature-layout.md))。項目は現在のバージョン (v1.7) の機能から選びます。

- 機能 1 件は `li` (`flex flex-col gap-4`) で、`h3`、`p` (`max-w-prose`)、画像の 2 カラム グリッド (`grid gap-4 md:grid-cols-2 md:gap-6`) の順。機能と機能の間隔は `ul` の `gap-14`
- 画像は `figure` で包み、`figcaption` にテーマ名 ("Dark" / "Light"、`home.screenshot.dark` / `home.screenshot.light`) を `text-xs text-muted-foreground` で中央寄せに添える。ダークを左、ライトを右に固定し、`md` 未満ではダーク、ライトの順に縦に並ぶ
- 画像の `alt` は機能の alt にテーマ名を添えた `home.screenshot.alt` ("{alt} ({theme} theme)") で、スクリーン リーダーにも 2 枚がテーマ違いであることが伝わる

| 機能 (キー) | 説明の要点 | スクリーンショット |
| --- | --- | --- |
| Browse by artist (`artists`) | 頭文字のグリッドからアーティストを選び、アルバムと曲を眺めながら再生する。アーティスト画像とアートワークを活かした一覧 | `artists` / `artists-light` |
| Filter your albums (`albums`) | ジャンル、年代、テキストでアルバムを絞り込むサイドバー。ジャケットを並べて眺められる | `albums` / `albums-light` |
| Playlists and smart playlists (`playlists`) | 手で並べる通常のプレイリストと、条件で自動更新されるスマート プレイリスト。プレイリストに画像を付けられる (v1.6)。カラムの表示、幅、並び順、ソートを変えられるテーブル (v1.3) | `playlists` / `playlists-light` |
| Keep your favorites close (`favorites`) | 曲とアルバムに Star を付け、どのビューでもひと目で分かる。フィルター メニューの「お気に入りのみ表示」でお気に入りだけに絞り込める (v1.4) | `favorites` / `favorites-light` |
| Edit and complete metadata (`metadata`) | 曲情報ダイアログでタイトル、アーティスト、アートワークなどを編集し、ファイルへ書き戻す (v1.1)。複数の曲をまとめて編集できる。MusicBrainz から不足している情報とアートワークを取得して補完する (v1.2) | `music-info` / `music-info-light` |
| Play your way (`player`) | 再生キュー、シャッフル、リピート (アルバム全体と 1 曲。v1.5)、再生速度とピッチ維持 (v1.7)、OS のメディア キー対応 (MediaSession)。対応形式: mp3, flac, m4a/mp4, ogg/opus, wav, aiff, wma, ape | `player` / `player-light` (プレーヤー バーと再生速度のポップオーバー。リピートを `all`、速度を 1.25x にして点灯した状態) |
| Choose your language and theme (`settings`) | 設定ダイアログで言語を English / 日本語 / System から選べる。ダークとライトのテーマも同じ設定ダイアログで切り替えるか OS に追従させる。スクリーンショットは英語 UI だけなので、日本語対応はここで明記する。v1.6 までの「Light and dark」(`artists-light` 1 枚) の項目は、全項目をダークとライトで見せるようになったため v1.7 で統合した | `settings` / `settings-light` |

- MusicBrainz 取得の画面はスクリーンショットを撮らず、文章だけで説明する。デモ用データのアーティストは架空のため MusicBrainz に一致せず、結果の画面を再現できない ([スクリーンショット](screenshots.md))。説明文で MusicBrainz と Cover Art Archive の名前を出し、フッターのクレジットと対応させる ([ページ構成](pages.md))
- 対応プラットフォームの一覧と対応形式は、ヒーローとこのセクションに分けて置く
- 将来の機能 (再生位置マーキング、回転寿司プレイリスト) はトップ ページに載せない。未実装の機能を紹介すると実物との差で信頼を損なう

### 3. ダウンロードへの誘導

- 最新バージョンと公開日 ([リリース情報の取得](../architecture/release-data.md) の結果) を 1 行で示し、ダウンロード ページへのボタンを置く
- 「未署名のため初回起動に手順が要る」旨は、ここでは触れずダウンロード ページで案内する

## 文章

- 英語を正とし、辞書 (`en.ts`) に置く。日本語は `ja.ts` ([多言語対応](../architecture/i18n.md))
- 機能の説明は仕様書 (`docs/specs/v1.x`) の「テーマ」の文を元に、利用者の視点で書き直す。実装の用語 (IPC、SQLite、Virtualization) は出さない
- 見出しは動詞から始める (Browse / Filter / Edit / Play) ことで統一する

## 画像

- スクリーンショットは `web/src/assets/screenshots/` から `<Picture>` で読み込み、`widths` を `[640, 1280, 2560]`、形式を `avif` と `webp` にする
- 主な機能の画像は 1 機能につきダークとライトの 2 枚 (`<scene>.png` / `<scene>-light.png`、計 14 枚)。`sizes` は画像 1 枚がコンテンツ幅の半分 (2 カラムの片側) になる前提のまま。ヒーローのスクリーンショットはダークの 1 枚のまま (サイトのテーマに追従して切り替える案は、両方の画像を eager で読むことになるため候補として保留)
- ヒーロー以外は `loading="lazy"`。1 ページの画像は 15 枚になるが、初期表示で読むのはヒーローの 1 枚だけ
- `alt` は辞書から与え、画面の内容 (「Artists view showing albums of Milo Ashgrove」) を書く。機能の画像にはテーマ名を添える
