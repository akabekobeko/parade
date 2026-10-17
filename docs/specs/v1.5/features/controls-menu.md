# コントロール メニュー

アプリケーション メニューの「コントロール」にシャッフルとリピートの項目を足し、現在のモードをチェックで表します。モードの意味は [リピート モード](../architecture/repeat-mode.md) を参照してください。

## 項目

```
Controls
  Stop                 CmdOrCtrl+.
  ──────────
  ✓ Shuffle
  Repeat             ▸  • Off
                        • All
                        • One
```

| 項目 | 種類 | キー (en / ja) | 操作 (`MenuAction`) |
| --- | --- | --- | --- |
| Shuffle | `checkbox` | `menu.shuffle` (Shuffle / シャッフル) | `toggleShuffle` |
| Repeat | サブメニュー | `menu.repeat` (Repeat / リピート) | - |
| Repeat > Off | `radio` | `menu.repeatOff` (Off / なし) | `setRepeatOff` |
| Repeat > All | `radio` | `menu.repeatAll` (All / 全曲) | `setRepeatAll` |
| Repeat > One | `radio` | `menu.repeatOne` (One / 1 曲) | `setRepeatOne` |

- 既存の「停止」の下に区切り線を置き、その下にシャッフルとリピートを並べます (Apple Music の Controls と同じ順)
- `checked` はメニュー テンプレートの構築時に `MenuStateSnapshot` から決めます。ネイティブ側のトグルに任せず、Renderer の state を唯一の真実にします
- 項目は常に有効です。現在曲がなくてもモードを切り替えられます (プレーヤー バーのボタンと同じ)
- キーボード ショートカットは設けません ([スコープ](../scope.md))
- 既存の `menu.shufflePlay` (曲メニューの「シャッフル再生」) とは別のキーです。あちらは再生を始める操作、こちらはモードの切り替えです

## 状態の同期 (Main 側)

`MenuStateSnapshot` を広げます。

```ts
export type MenuStateSnapshot = {
  readonly isPlaying: boolean;
  readonly hasTrack: boolean;
  /** Shuffle mode — checks Controls > Shuffle. */
  readonly shuffle: boolean;
  /** Repeat mode — selects the Controls > Repeat radio item. */
  readonly repeat: RepeatMode;
};
```

- `RepeatMode` は Main と Renderer で共有するため `src/main/ipc/types.ts` に置き、Renderer の `features/player/types.ts` はそれを再エクスポートします
- `applicationMenu.ts` の初期値は `{ isPlaying: false, hasTrack: false, shuffle: false, repeat: "off" }` です。起動直後にメニューが表示されたときの既定値で、Renderer の初回 push で保存値に置き換わります
- `menuBuilder` は純関数のままで、`state.shuffle` と `state.repeat` から `checked` を決めます。テストに「シャッフル ON でチェックされる」「リピートの radio は 1 つだけ checked」を足します
- Windows / Linux の `mp:menu:popup` は同じテンプレートなので、追加の対応はありません

## 状態の同期 (Renderer 側)

現在 `mp:menu:setState` は PlayerProvider の engine host の購読から `isPlaying` / `hasTrack` を送っています。モードが加わると送る場所が 2 つになるため、React の外の小さなモジュール `menuStateSync` (`src/renderer/features/player/menuStateSync.ts`) にまとめます。

- 最後に送った snapshot を持ち、`patch(partial)` で一部の項目を更新して、変化があったときだけ `window.mp.menu.setState` を呼びます (既存の重複排除をここへ移す)
- `initialize(initial)` で起動時の値 (保存した `shuffle` / `repeat`) を入れて最初の 1 回を送ります。呼ぶのは PlayerProvider の初期化 (`useState` の initializer) で、engine host の購読と同じ場所です
- engine host の購読は `patch({ isPlaying, hasTrack })`、モードを変えるコマンドは `patch({ shuffle })` / `patch({ repeat })` を呼びます ([リピート モード](../architecture/repeat-mode.md))
- 純関数部分 (patch の結合と変化の判定) を切り出してユニット テストします

## Renderer への経路

`MenuAction` に `toggleShuffle` / `setRepeatOff` / `setRepeatAll` / `setRepeatOne` を足します。Main はこれまでどおり `mp:menu:action` で Renderer へ push し、ブートストラップの `menuActionBus.subscribe` の分岐で処理します。

| `MenuAction` | 処理 |
| --- | --- |
| `toggleShuffle` | `getActivePlayer()?.commands.toggleShuffle()` |
| `setRepeatOff` / `setRepeatAll` / `setRepeatOne` | `getActivePlayer()?.commands.setRepeat("off" / "all" / "one")` |

- `stop` と同じく null-safe にします。PlayerProvider のマウント前は何もしません
- リピートを 3 つの action に分けるのは、`MenuAction` が文字列リテラルの union で payload を持たないためです。`MenuActionPayload` にモードを足すより、既存の形に揃えるほうが小さい変更です
- メニューから切り替えたときも、state の変更はコマンドの中で行われるので、プレーヤー バーのボタン、メニューのチェック、設定の保存はボタンから切り替えたときと同じ経路で追従します
