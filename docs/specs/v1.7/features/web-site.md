# 公式サイトへの反映

再生速度の追加と、公式サイト ([公式サイトの仕様](../../web/README.md)) 自体の構成変更をまとめて反映します。レイアウトは [公式サイトの機能一覧のレイアウト](web-feature-layout.md)、ヘッダーは [公式サイトのヘッダー](web-header.md) を参照してください。ここでは文言、スクリーンショット、既存の仕様書の更新を扱います。

## 方針

- トップ ページの機能一覧には **リリース済みの機能だけ** を載せます ([トップ ページ](../../web/features/top-page.md))。再生速度の説明は Phase 5 で、アプリ側の PR が main に入ってから行います
- サイトの変更は main へのマージで自動公開されるため、**サイトの更新 PR は v1.7 の Release を Publish したあとにマージ** します ([デプロイ](../../web/architecture/deploy.md))
- レイアウトとヘッダーの変更は v1.7 の機能に依存しませんが、スクリーンショットに再生速度ボタンが写るため、撮影を含めて 1 つのサイト更新 PR にまとめます ([ロードマップ](../roadmap.md))

## トップ ページの文言

| 機能 | 変更 |
| --- | --- |
| Play your way | 本文に速度を足す。例: "Queue songs up, shuffle them, repeat an album or a single song, and slow down or speed up playback while the pitch stays put. Control it all from the media keys of your OS. Parade plays mp3, flac, m4a / mp4, ogg / opus, wav, aiff, wma and ape." |
| Choose your language and theme (旧 English and Japanese) | 「Light and dark」の項目を統合する ([公式サイトの機能一覧のレイアウト](web-feature-layout.md)) |

- `home.feature.player.body` と `home.feature.player.alt` を en / ja で更新します (`en.ts` のキーが型なので、ja に欠けるとビルドで分かる)。alt は速度の Popover が写る構図に合わせます
- 各画像に添えるテーマの表記 (`home.screenshot.dark` / `home.screenshot.light`: "Dark" / "Light"、「ダーク」/「ライト」) を足します

## スクリーンショット

全シーンをダークとライトの両方で撮り、ファイル名は `<scene>.png` (ダーク) と `<scene>-light.png` (ライト) にします。既存の `artists-light.png` はこの規則に合っています。

| シーン | ダーク | ライト | 備考 |
| --- | --- | --- | --- |
| `artists` | 撮り直し | 既存の `artists-light` を撮り直し | プレーヤー バーにボタンが 1 つ増える |
| `albums` / `playlists` / `favorites` / `music-info` / `settings` | 撮り直し | 新規 | 同上。`settings` はテーマの項目が Dark / Light で写り分ける |
| `player` | 撮り直し | 新規 | 構図を変える (下記) |

- 撮影の条件 (macOS、Retina、1280x800、英語 UI、`pnpm demo`、CDP 方式) とマスク処理は既存どおりです ([スクリーンショット](../../web/features/screenshots.md))
- 手順は「ダークで全シーンを撮り、Settings の Theme を Light にして同じ操作を繰り返す」の 2 周にします。お気に入り、カラム設定、プレイリストの選択はデモ用データと設定に残るので、2 周目は画面の移動と再生のやり直しが中心です。テーマは `window.mp.settings.set({ patch: { theme: "light" } })` と `location.reload()` で切り替えてもかまいません。撮影後に Dark へ戻します
- `player` 以外のシーンでは速度は 1x (消灯) のままにします。点灯したアイコンが写るのは `player` だけにし、他のシーンの主題から目を引かないようにします (リピートと同じ規則)

### `player` シーンの構図

再生キューの Popover に代えて、**再生速度の Popover を開いた状態** で撮ります。キューは v1.0 から写してきましたが、v1.7 の主題は速度で、Popover の中身 (プリセット、スライダー、ピッチ維持) が機能をそのまま説明するためです。キューは本文で触れます。

- `artists` と同じ構図で再生中に、リピート ボタンを押して `all` (点灯) にし、速度の Popover で 1.25x を選ぶ (ボタンが点灯し、1.25x のプリセットが塗りつぶされる)。Keep pitch は ON のまま。Popover を開いたまま撮る (Popover のフォーカスはボタンに残るので外す操作は不要)
- 切り出しは今までどおりプレーヤー バー付近です。Popover はバーの上に開くので、`crop` の `y` と `height` を Popover 全体が入るように見直します。manifest には `player` と `player-light` の両方に同じ `crop` を書きます

```json
{
  "player": { "crop": { "x": 0, "y": 784, "width": 2784, "height": 1008 } },
  "player-light": { "crop": { "x": 0, "y": 784, "width": 2784, "height": 1008 } }
}
```

## 既存の仕様書の更新

- `docs/specs/web/README.md` の決定事項「スクリーンショット」を「macOS、英語 UI、全シーンをダーク / ライトの 2 枚」にし、テーマの「hover 時の glow 効果」の記述を「枠線 + glow と角丸矩形の塗り」に改める
- `docs/specs/web/scope.md` の外観「メニューとボタンの hover にアプリと同じ glow 効果」を現在のアプリの hover に合わせる
- `docs/specs/web/features/pages.md` の固定ヘッダー: 中央のページ リンクの hover を「lamp glow」から「枠線 + glow」に、左のアイコンと製品名の hover を「角丸矩形の塗り」にする
- `docs/specs/web/architecture/theme.md` の glow 効果の表: lamp glow の行を削除し、ring (`glow-ring`) と tint の行を足す ([公式サイトのヘッダー](web-header.md))
- `docs/specs/web/features/top-page.md` の「2. 主な機能」: 配置を縦レイアウトに、機能の表を 7 項目にし、画像の節に「ダークとライトの 2 枚」と `sizes` を書く ([公式サイトの機能一覧のレイアウト](web-feature-layout.md))。「Play your way」の要点に速度 (v1.7) を足す
- `docs/specs/web/features/screenshots.md`: 「撮影する画面」の前文を「全シーンをダークとライトで撮る」に改め、`artists-light` の行を外して命名規則と 2 周の手順を書き、`player` の操作を速度の Popover に置き換える。確認項目の枚数 (14 枚) を更新する
- `docs/specs/README.md` に v1.7 のリンクを足す (本仕様書の作成時に実施)
