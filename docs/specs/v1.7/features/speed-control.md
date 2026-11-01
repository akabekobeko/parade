# 再生速度ボタンと Popover

プレーヤー バーで再生速度とピッチ維持を変えるボタンと Popover です。値の持ち方と効かせ方は [再生速度](../architecture/playback-rate.md) を参照してください。

## 位置

シャッフル ボタンの右、**再生キュー ボタンの左** に置きます ([プレーヤー UI](../../v1.0/features/player-ui.md))。

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ [Art] Title        [⏮][⏯][⏭]  0:42 ────────●──────── 3:28  [🔁][🔀][⏱] [キュー][🔊] │
│       Artist - Album                                                               │
└────────────────────────────────────────────────────────────────────────────────────┘
```

- `PlayerBand` の並びは `Picture`、`MusicInfo`、`PlayerControls`、`SeekBar`、`RepeatButton`、`ShuffleButton`、**`SpeedControl`**、`SecondaryControls` です。`SecondaryControls` (キューと音量) の中には入れず、リピート / シャッフルと同じ `gap-3` の間隔で並べます
- コンポーネントは `src/renderer/components/app/PlayerBar/SpeedControl/` に `SpeedControl.tsx` (ボタンと Popover) と `useSpeedControl.ts` (ロジック) を置きます。props は `rate` / `preservesPitch` / `onRateChange` / `onPreservesPitchChange` で、`PlayerBand` が `snapshot.rate` / `snapshot.preservesPitch` と `commands.setPlaybackRate` / `commands.setPreservesPitch` をつなぎます (`VolumeControl` と同じ形)

## ボタン

`ShuffleButton` と同じ `IconButton` (`variant="ring"`) を Popover のトリガーにします。

| 状態 | アイコン | 見た目 |
| --- | --- | --- |
| 1x | Lucide `Gauge` | 通常色。hover で円の border + glow |
| 1x 以外 | Lucide `Gauge` | `pressed` 色 (blue) のアイコン。「速度が変わっている」ことを示す |

- 点灯は `aria-pressed` ではなく `data-active` で表します。ボタンは Popover を開くもので、トグルではないためです (フィルター メニューの `ClusterButton` と同じ扱い)。クラスは `data-active:text-pressed data-active:hover:text-pressed` を `SpeedControl` 側で足し、`IconButton` は変えません
- ピッチ維持の ON / OFF は点灯に影響しません。1x ではピッチ維持の違いが音に出ないためです
- `aria-label` と `title` (ツールチップ) は現在の速度を含めた文言 (`player.speedCurrent`、例: "Playback speed: 1.25x") にし、Popover を開かなくても値が分かるようにします
- 現在曲がなくても押せます (音量と同じ)。先に速度を決めてから再生を始められます

## Popover

```
┌────────────────────────────────────┐
│ Playback speed              1.25x  │  見出し (左) と現在値 (右、等幅)
│ [0.5x][0.75x][1x][1.25x][1.5x][2x] │  プリセット。現在値と一致するものを塗りつぶし
│ [−] ─────────●───────────── [+]    │  スライダー (0.25x から 2x、0.05 刻み) と ± ボタン
│ [✓] Keep pitch                     │  ピッチ維持のチェック
└────────────────────────────────────┘
```

- `PopoverContent` は `align="end"`、幅は `w-80` (プリセット 6 つが 1 行に収まる幅)。縦の間隔は `PopoverContent` の `gap-2.5` に任せます
- **見出しと現在値**: 見出しは `player.speed`、現在値は `formatPlaybackRate(rate)` を `font-mono text-xs tabular-nums text-muted-foreground` で右寄せ (音量 Popover の数値と同じ体裁)
- **プリセット**: `PLAYBACK_RATE_PRESETS` の 6 つを `Button` (`size="xs"`) で横に並べます。現在値と一致するものは `bg-foreground text-background border-foreground` (アプリの選択中の見た目。サイドバーの選択行、キューの現在行と同じ)、ほかは `variant="outline"` で hover は枠線の glow。一致判定は `clampPlaybackRate` で丸めた値の等価比較で、スライダーがプリセットの間にあるときはどれも選ばれません。選択中のプリセットは `aria-pressed="true"` にします
- **スライダー**: `Slider` (`appearance="fused"`) を `min={25} max={200} step={5}` の整数 (百分率) で持ち、`rate * 100` との変換は `useSpeedControl` で行います。整数にするのは Base UI の step と浮動小数の誤差を避けるためで、表示は常に `formatPlaybackRate` の形です。ドラッグ中は `onRateChange` を連続して呼び、その場で再生に反映します
- **± ボタン**: `IconButton` (`Minus` / `Plus`) で `steppedPlaybackRate(rate, -1 | +1)` (0.05 刻み、範囲で止まる) を呼びます。端 (0.25x / 2x) では無効にします
- **ピッチ維持**: `Checkbox` と文言 `player.keepPitch` を `<label>` で囲み、どちらをクリックしても切り替わるようにします。既定は ON です
- 「リセット」のボタンは置きません。1x のプリセットがその役です

## 表示の整形

```ts
// src/renderer/features/audio/formatPlaybackRate.ts
/** "1x", "0.75x", "1.25x": up to 2 decimals, trailing zeros dropped. */
export const formatPlaybackRate = (rate: number): string => { ... };

// src/renderer/features/audio/steppedPlaybackRate.ts
/** One step (0.05) up or down from `rate`, clamped into the range. */
export const steppedPlaybackRate = (rate: number, direction: -1 | 1): number => { ... };
```

- 表記は「1.25x」の 1 種類です。「×1.25」「125%」「BPM」は作りません ([スコープ](../scope.md))。小数点以下の桁数が値によって変わるため、数値は等幅 + `tabular-nums` で揃えます
- 文言の中の値 (`player.speedCurrent` の `{rate}`) にも同じ関数の結果を渡します。ロケールで数値の書式を変えません (アプリの時間表示と同じ)

## 操作

- プリセット、スライダー、± のどれで変えても経路は `onRateChange(rate)` の 1 つで、host を更新して再生に反映し、設定へ保存します ([再生速度](../architecture/playback-rate.md)、[再生速度の永続化](../architecture/playback-settings.md))
- 速度の変更で再生は止まりません。再生中でも一時停止中でも、再生前でも操作できます
- キーボードでは Tab でボタンにフォーカスし、Enter / Space で Popover を開きます。Popover の中はプリセット、−、スライダー、+、チェックの順に Tab で移り、スライダーは ← / → で 0.05 刻み、Home / End で端の値です。Esc で閉じてボタンへ戻ります (Base UI の Popover の既定)。専用のショートカットは設けません ([スコープ](../scope.md))

## アクセシビリティーと文言

| キー | en | ja |
| --- | --- | --- |
| `player.speed` | Playback speed | 再生速度 |
| `player.speedCurrent` | Playback speed: {rate} | 再生速度: {rate} |
| `player.speedDecrease` | Slower | 遅く |
| `player.speedIncrease` | Faster | 速く |
| `player.keepPitch` | Keep pitch | ピッチを維持 |

- ボタンの `aria-label` / `title` は `player.speedCurrent`、Popover の見出しとスライダーの `aria-label` は `player.speed`、± は `player.speedDecrease` / `player.speedIncrease`、プリセットは値の文字列そのものがラベルです
- `SpeedControl` の markup テストは `RepeatButton.test.tsx` と同じ `renderToStaticMarkup` で、1x で `data-active` がないこと、1x 以外で付くこと、ラベルに値が入ることを確認します。`useSpeedControl` の判定 (百分率との変換、プリセットの一致、± の無効) は純関数に切り出してテストします
