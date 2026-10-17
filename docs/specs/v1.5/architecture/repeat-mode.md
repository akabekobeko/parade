# リピート モード

リピート再生を PlayerProvider の state とコマンドでどう持ち、曲の終端と前後曲の解決にどう効かせるかの仕様です。ボタンの見た目と操作は [リピート ボタン](../features/repeat-button.md) を参照してください。

## 状態

```ts
// src/renderer/features/player/types.ts
export type RepeatMode = "off" | "all" | "one";

export type PlayerState = {
  // ...既存の queue / orderedQueue / queueSource / current / shuffle
  /** Repeat mode (PlayerBar cycle button); decides what happens at the ends. */
  readonly repeat: RepeatMode;
};
```

- `INITIAL_PLAYER_STATE.repeat` は `off` です。起動時は保存値で上書きします ([再生モードの永続化](playback-settings.md))
- `shuffle` と同じく、キューを置き換えても (`played` / `queueReplaced`) モードは変わりません。`played` アクションは `shuffle` を運びますが `repeat` は運ばず、reducer は `state.repeat` を引き継ぎます
- モードの切り替えは `repeatChanged` アクション (`{ type: "repeatChanged"; repeat: RepeatMode }`) で、`actions/repeatChanged.ts` に置きます。reducer は `repeat` を差し替えるだけで、キューと現在曲には触れません

## コマンド

```ts
// PlayerCommands
/** Set the repeat mode (Controls menu). Playback keeps running. */
readonly setRepeat: (mode: RepeatMode) => void;
/** Cycle the repeat mode: off -> all -> one -> off (PlayerBar button). */
readonly cycleRepeat: () => void;
```

- `setRepeat` が本体で、`repeatChanged` を dispatch したあとメニューと設定へ新しいモードを伝えます (下記)。同じモードを指定したときは何もしません
- `cycleRepeat` は純関数 `nextRepeatMode(mode: RepeatMode): RepeatMode` (`repeatMode.ts`) で `stateRef` の現在値から次のモードを求め、`setRepeat` を呼びます
- `off → all → one → off` の順です。クリックのたびに 1 段進み、戻る操作はありません ([リピート ボタン](../features/repeat-button.md))
- モードの切り替えは再生に影響しません。エンジンには触れず、次の終端や前後曲の操作から新しいモードが効きます

### モードの変更を外へ伝える

シャッフルとリピートのモードは、プレーヤー バー以外にアプリケーション メニューのチェック ([コントロール メニュー](../features/controls-menu.md)) と `settings.json` ([再生モードの永続化](playback-settings.md)) にも現れます。state は PlayerProvider の 1 つだけにし、**モードを変えるコマンドの中で** dispatch に続けて両方へ伝えます (変化を起こした場所で副作用も実行する。[状態管理](../../v1.0/renderer/state-management.md) の方針)。

| コマンド | モードの変化 | 伝える先 |
| --- | --- | --- |
| `toggleShuffle` | `shuffle` の反転 | メニュー、設定 |
| `playShuffled` | `shuffle` を ON (すでに ON なら変化なし) | メニュー、設定 |
| `setRepeat` / `cycleRepeat` | `repeat` の変更 | メニュー、設定 |
| `setVolume` | 音量の変更 (モードではないが同じ `playback` に保存する) | 設定 |

- メニューへは `menuStateSync.patch({ shuffle })` / `patch({ repeat })` で伝えます。`isPlaying` / `hasTrack` と合わせた snapshot にまとめて `mp:menu:setState` を送るのは `menuStateSync` の役割です
- 設定へは `savePlayback({ shuffle, repeat, volume })` で伝えます。3 つの値をいつも送り (音量は engine host の `getVolume()`)、Main が `playback` を丸ごと置き換えます
- どちらも fire-and-forget で、失敗しても state は戻しません (メニューと設定は state の写しで、次の変更で追いつきます)
- `playMusic` は `shuffle` を変えないので伝えません (`played` アクションが `shuffle` を運ぶのは既存の形を保つためで、値は `stateRef` の現在値です)

## 曲の終端

`startEngine` が `ended` のフォローアップとして行っていた「次曲があれば再生、なければ停止」を、モードを含めた判断に置き換えます。判断は純関数にし、エンジンに依存しないテストで押さえます。

```ts
// src/renderer/features/player/naturalEndOutcomeOf.ts
export type NaturalEndOutcome =
  | { readonly type: "advance"; readonly music: Music } // start another track
  | { readonly type: "restart" }                        // start the current track again
  | { readonly type: "stop" };                          // rewind to 0:00 and stop

export const naturalEndOutcomeOf = (state: PlayerState): NaturalEndOutcome => { ... };
```

| `repeat` | 次曲がある | 次曲がない (末尾) | キューが空 |
| --- | --- | --- | --- |
| `off` | `advance` (次曲) | `stop` | `stop` |
| `all` | `advance` (次曲) | `advance` (キュー先頭) | `stop` |
| `one` | `restart` | `restart` | `restart` |

- 「次曲」は `nextOf(queue, current, repeat)` です (下記)。現在曲がキューにない場合はキュー先頭が次曲になる、という既存の置換時の規則 ([プレイリスト](../../v1.0/features/playlist.md)) はそのままです
- `all` で 1 曲だけのキューは、先頭 = 現在曲なので同じ曲を繰り返します。結果は `one` と同じですが、判断は `advance` のままにし、特別扱いしません
- `one` は現在曲がキューに含まれなくても繰り返します。キューはスナップショットで、現在曲は常に `current` にあるためです。`current` が `null` のときは終端が起きないので考慮しません
- `advance` は既存どおり `playMusic(music, queue, queueSource)` で、キューはそのまま現在曲だけを差し替えます
- `restart` は `startEngine(current)` で **エンジンを作り直し** ます。曲の切り替えと同じ経路にし、`advanced` の一度きりのガードもそのままにします。`HTMLMediaElement.loop` は使いません。`loop` だと `ended` が発火せず終端の判断を通らないうえ、再生中にモードを変えたときエンジンの属性を書き換える API が必要になるためです。`state` は変わらないので dispatch はせず、MediaSession のメタデータは `startEngine` が同じ曲で更新し直します
- `stop` は既存どおり `engine.stop()` で、現在曲を末尾に残します

## 前後曲の解決

`nextOf` / `previousOf` に `repeat` を足します。省略時は `off` で、既存の呼び出しは変えません。

```ts
export const nextOf = (queue, current, repeat: RepeatMode = "off"): Music | null;
export const previousOf = (queue, current, repeat: RepeatMode = "off"): Music | null;
```

| `repeat` | 次曲 (末尾で) | 前曲 (先頭で) | 前曲 (現在曲がキューにない) |
| --- | --- | --- | --- |
| `off` | `null` | `null` | `null` |
| `all` | キュー先頭 | キュー末尾 | `null` |
| `one` | `null` (`off` と同じ) | `null` (`off` と同じ) | `null` |

- `all` では前曲 / 次曲ボタンが末尾と先頭でつながり、キューが空でない限り無効になりません。アルバムの最後の曲で次曲を押すと 1 曲目へ戻ります
- `one` の前曲 / 次曲は `off` と同じです。ボタンを押すのは「この曲から移りたい」意思なので、リピートしません。移った先の曲がまた繰り返されます
- `all` で現在曲がキューにない場合の前曲は `null` のままです。置換時の規則「前曲は無効、次曲はキュー先頭」を優先します
- 呼び出し元は `usePlayerBar` (ボタンの有効 / 無効)、`playNext` / `playPrevious` コマンド、`naturalEndOutcomeOf` です。MediaSession の `previoustrack` / `nexttrack` はコマンド経由なので同じ規則になります

## シャッフルとの関係

- シャッフルは **並び**、リピートは **終端の挙動** を決めます。`toggleShuffle` は `repeat` を変えず、`cycleRepeat` は `queue` を変えません
- `all` でシャッフル中に末尾まで行ったら、同じシャッフル済みの並びの先頭へ戻ります。再シャッフルはしません ([スコープ](../scope.md))
- `one` でシャッフル中も現在曲を繰り返します。並びは関係ありません

## キュー操作との関係

| 操作 | リピートへの影響 |
| --- | --- |
| Play / Shuffle / 曲クリック (`played`) | キューが置き換わる。モードはそのまま |
| Add to queue / Play next | キューが伸びる。`all` の折り返し先 (先頭) は変わらない |
| Replace queue (`queueReplaced`) | モードはそのまま。現在曲が新キューにないときの規則は既存どおり |
| Clear queue | キューが空になる。`all` は終端で停止、`one` は現在曲を繰り返す |
| キュー ポップオーバーのジャンプ | `playMusic` なのでキューはそのまま。モードもそのまま |
| 曲情報の編集 (`musicsUpdated`) | 影響なし |

## テスト

- `nextRepeatMode`: 3 つの遷移
- `playerReducer`: `repeatChanged` が `repeat` だけを変えること、`played` が `repeat` を引き継ぐこと
- `menuStateSync`: patch の結合と、変化がないときは送らないこと ([コントロール メニュー](../features/controls-menu.md))
- `nextOf` / `previousOf`: モード × 位置 (先頭 / 中 / 末尾 / キューにない / 空) の表
- `naturalEndOutcomeOf`: 上の終端の表と、1 曲だけのキュー、シャッフル中の `all`
- 既存のスタイルどおり `describe` を使わずフラットな `it()` で書き、DOM は使いません
