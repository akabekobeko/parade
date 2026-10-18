# リピート ボタン

プレーヤー バーでリピート モードを切り替えるボタンです。モードの意味と state は [リピート モード](../architecture/repeat-mode.md) を参照してください。

## 位置

シーク バーの右、**シャッフル ボタンの左隣** に置きます ([プレーヤー UI](../../v1.0/features/player-ui.md))。

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Art] Title        [⏮][⏯][⏭]  0:42 ────────●──────── 3:28  [🔁][🔀] [キュー][🔊] │
│       Artist - Album                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

- `PlayerBand` の並びは `Picture`、`MusicInfo`、`PlayerControls`、`SeekBar`、`RepeatButton`、`ShuffleButton`、`SecondaryControls` です
- コンポーネントは `src/renderer/components/app/PlayerBar/RepeatButton.tsx` で、`ShuffleButton` と同じ構成 (props は `mode` と `onCycle`) です
- `usePlayerBar` が `repeat` を返し、`PlayerBand` が `onCycle` を `commands.cycleRepeat` へつなぎます

## 見た目

`ShuffleButton` と同じ `IconButton` (`variant="circle"`) を使い、点灯は `aria-pressed` で表します。

| モード | アイコン | 点灯 (`aria-pressed`) | 見た目 |
| --- | --- | --- | --- |
| `off` | Lucide `Repeat` | `false` | 通常色。hover で円の border + glow |
| `all` | Lucide `Repeat` | `true` | `pressed` 色 (blue) のアイコン |
| `one` | Lucide `Repeat1` | `true` | `pressed` 色 (blue) のアイコン |

- 点灯色は `IconButton` が `aria-pressed` から描くもので、ボタン側にスタイルは足しません。シャッフル ボタンの ON と同じ見た目になります
- `all` と `one` の違いはアイコンの形 (`Repeat1` の「1」) だけです。色は同じにし、「有効か」を色、「どちらか」をアイコンで読めるようにします
- 無効の `Repeat` とシャッフルの OFF が隣り合うので、両方とも通常色の輪郭だけになります。有効なほうだけが点灯します
- lucide-react の `Repeat` / `Repeat1` はどちらも導入済みのバージョン (1.49.0) にあります

## 操作

- クリックのたびに `off → all → one → off` と 1 段進みます。右クリックや修飾キーでの逆順は設けません
- 現在曲がなくても押せます (シャッフル ボタンと同じ)。先にモードを決めてから再生を始められます
- 連打の抑止はしません。state の切り替えだけで、エンジンには触れません

## アクセシビリティーと文言

- `aria-pressed` は `mode !== "off"` です。3 状態を boolean で表しきれない分は `aria-label` で補います
- `aria-label` と `title` (ツールチップ) は現在のモードを表す文言にし、押したあとの状態ではなく **いまの状態** を示します (シャッフル ボタンが常に「Shuffle」なのと違い、3 状態の区別が必要なため)

| キー | en | ja |
| --- | --- | --- |
| `player.repeatOff` | Repeat off | リピートなし |
| `player.repeatAll` | Repeat all | 全曲をリピート |
| `player.repeatOne` | Repeat one | 1 曲をリピート |

- キーボードでは Tab でフォーカスし、Enter / Space で 1 段進みます。専用のショートカットは設けません ([スコープ](../scope.md))
