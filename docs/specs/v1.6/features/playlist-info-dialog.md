# プレイリスト情報の確認ダイアログ

プレイリストの名前、画像、スマートプレイリストのルールをまとめて編集するダイアログです。アーティスト情報の確認ダイアログ ([Artist ビュー](../../v1.0/features/artist-view.md)) を踏襲し、画像の保存は [IPC](../architecture/ipc.md) の `mp:playlist:setPicture`、名前とルールは既存の `mp:playlist:update` で反映します。

## 開き方

| 場所 | 項目 | 対象 |
| --- | --- | --- |
| サイドバーの項目のメニュー ([サイドバーの項目](sidebar-rows.md)) | プレイリスト情報の確認 (先頭) / 名前を変更 / 区切り / 削除 | 通常、スマートとも |
| コンテンツ ヘッダーのメニュー ([プレイリスト ヘッダー](playlist-header.md)) | プレイリストを再生 / シャッフル再生 / プレイリストに追加 / 区切り / プレイリスト情報の確認 | 通常、スマートとも |

- スマートプレイリストのヘッダー メニューにあった「ルールを編集」は **この項目に置き換え** ます。`smart.editRules` の文言は削除します
- `SmartRulesDialog` はスマートプレイリストの **作成** 専用になります (サイドバーの「New smart playlist」ボタン)。ルールのフォーム部分は切り出して本ダイアログと共有します ([ルールのフォームの共有](#ルールのフォームの共有))
- メニューはどちらも閉じるとアンマウントされるため、アーティストと同じく React 外のストア `playlistInfoStore` (`src/renderer/features/playlist/playlistInfoStore.ts`) に対象の `Playlist` を置き、AppLayout に 1 つだけ置いた `PlaylistInfoDialog` (`src/renderer/components/app/InfoDialog/PlaylistInfoDialog/`) が `useSyncExternalStore` で読みます
- 対象は一覧キャッシュの `Playlist` そのものです (`id`、`kind`、`name`、`picturePath`、`rules`)。開いている間に一覧が再取得されても対象は差し替えず、Apply 後に閉じます

## 通常のプレイリスト

編集するのは名前と画像だけなので、タブは分けません。

```
┌ プレイリスト情報の確認 ───────────────────────────┐
│                                                  │
│  名前                                            │
│  ──────────────────────────────────────────────  │
│  [ My Best                                    ]  │
│                                                  │
│  画像                                            │
│  ──────────────────────────────────────────────  │
│  ┌────────────────────────────────────────────┐  │
│  │                                            │  │
│  │              (AspectFitPicture)            │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│  [ファイルを選択] 選択されていません              │
│                                                  │
├──────────────────────────────────────────────────┤
│                              [キャンセル] [適用] │
└──────────────────────────────────────────────────┘
```

- `DialogContent` の幅 (`sm:max-w-lg md:max-w-2xl xl:max-w-3xl`) と `DialogBody` の高さ (`h-[60vh]`) はアーティストと同じにし、ポップアップの大きさを揃えます
- 名前と画像は見出し付きのセクションで分け、見出しの見た目は設定ページの `SettingsSection` と同じ (`border-b pb-1 font-medium text-muted-foreground text-sm`) にします。`SettingsSection` を `src/components/app/` へ `FormSection` として昇格させ、設定ページと本ダイアログで共有します
- 名前は `Input` (`aria-label` は見出しと同じ文言)。開いたときの値は対象の `name` で、全選択はしません (インライン名前変更と違い、部分的な修正が主用途)
- 画像は `AspectFitPicture` (プレースホルダーは `ListMusic`) とファイル選択 (`Input type="file" accept="image/*"`) で、アーティストの `PicturePanel` と同じ構成です。画像の領域が残りの高さを埋めます (`flex-1`)

## スマートプレイリスト

ルールが加わるので、「詳細」と「画像」のタブに分けます (曲情報 / アーティスト情報のダイアログと同じ `Tabs` + `DialogTabList`)。

```
┌ プレイリスト情報の確認 ───────────────────────────┐
│  [ 詳細 ][ 画像 ]                                │
│                                                  │
│  名前                                            │
│  ──────────────────────────────────────────────  │
│  [ Jazz                                       ]  │
│                                                  │
│  ルール                                          │
│  ──────────────────────────────────────────────  │
│  一致  [すべての条件 (AND) ▾]                     │
│  [ジャンル ▾] [が次である ▾] [Jazz          ] [x] │
│  [+ 条件を追加]                                  │
│  並び順 [追加日 ▾] [降順 ▾]      上限 [      ]   │
│                                                  │
├──────────────────────────────────────────────────┤
│                              [キャンセル] [適用] │
└──────────────────────────────────────────────────┘
```

- 詳細タブ: 「名前」と「ルール」の 2 セクション。見出しと区切り線は通常のプレイリストと同じ `FormSection` です。内容が高さを超えたら詳細タブだけがスクロールします (`overflow-y-auto`)
- 画像タブ: アーティストの `PicturePanel` と同じ (プレースホルダーは `Sparkles`)。別のタブを表示している間もマウントしたままにし (`keepMounted`)、選んだファイル名が消えないようにします
- タブを切り替えても入力は保持し、Apply はすべてのタブの変更をまとめて反映します。入力は `usePlaylistInfoDialog` が持ち、タブは描くだけです
- 壊れたルールのスマートプレイリスト (`rules` が `undefined`) は、ルールのセクションを空の下書き (`EMPTY_DRAFT`) で開きます。条件を入れ直して Apply すれば `mp:playlist:update` が検証済みのルールを書き、復旧します

## ルールのフォームの共有

`SmartRulesDialog` を 2 つに分けます。

- `SmartRulesForm` (`src/renderer/pages/playlists/components/SmartRulesForm/`): 一致、条件行、条件の追加、並び順、上限を描くフォーム。props は下書き (`RulesDraft`) と各変更のコールバックで、`Dialog` も名前の入力も持ちません
- `useRulesDraft`: 下書きの state と変更関数 (`setMatch` / `setCondition` / `addCondition` / `removeCondition` / `setSort` / `setOrder` / `setLimit`)。`useSmartRulesDialog` から名前と submit を除いたものです
- `SmartRulesDialog` は作成用に残し、名前の入力と `SmartRulesForm` を `useRulesDraft` でつなぎます。プレイリスト情報の確認ダイアログの詳細タブも同じ組み合わせです
- `toDraft` / `fromDraft` / `defaultCondition` / `conditionFields` / `operatorsFor` / `sortChoices` はそのまま `SmartRulesForm` の隣に移します

## 適用

`usePlaylistInfoDialog` が入力と適用の流れを持ちます。判定は純関数 `playlistInfoPatchOf` に切り出し、テストで押さえます。

```ts
type PlaylistInfoPatch = {
  /** `mp:playlist:update` の patch。名前もルールも変わっていなければ null */
  readonly update: Pick<PlaylistUpdateRequest, "name" | "rules"> | null;
  /** 選んだ画像ファイル。選んでいなければ null */
  readonly file: File | null;
};
```

- 名前は trim して比較し、空なら「変更なし」ではなく **Apply を無効** にします (空の名前は保存しない。インライン名前変更が空を無視するのと同じ結果)
- ルールは下書きを `fromDraft` でルールに戻し、対象の `rules` と `JSON.stringify` で比較します。`rules` が `undefined` (壊れている) なら下書きが空でも「変更あり」とみなし、Apply で上書きできるようにします
- Apply は `update !== null || file !== null` で、かつ名前が空でなく、適用中でないときに有効です
- 適用の順序は **画像 → 名前とルール** です (アーティストの画像 → 頭文字と同じ)
  1. `file` があれば `setPlaylistPicture(ref, file)`。失敗したらエラーを表示して止める (名前とルールは送らない)
  2. `update` があれば `updatePlaylist({ ...ref, ...update })`。失敗したらエラーを表示して止める (画像は保存済みのまま。もう一度 Apply すれば画像は「変更なし」で名前とルールだけ送られる)
  3. 成功したら閉じる
- エラーはタブの下 (通常のプレイリストでは本文の下) に `playlistInfo.failed` の文言で出し、どのタブを表示していても見えます。`updatePlaylist` は失敗を `null` で返すだけなので、本ダイアログ向けに `IpcError` を返す形に変えるか、`setPlaylistPicture` と同じ戻り値の関数を足します
- キャンセル、Esc、背景クリックで閉じ、選んだ画像の `URL.createObjectURL` を revoke します。ポップアップ右上の閉じるボタンは置きません (曲 / アルバム / アーティストのダイアログと同じ)

## 文言

| キー | en | ja |
| --- | --- | --- |
| `playlistInfo.menu` | Playlist Info | プレイリスト情報の確認 |
| `playlistInfo.title` | Playlist Info | プレイリスト情報の確認 |
| `playlistInfo.tab.details` | Details | 詳細 |
| `playlistInfo.tab.picture` | Picture | 画像 |
| `playlistInfo.name` | Name | 名前 |
| `playlistInfo.rules` | Rules | ルール |
| `playlistInfo.imageFile` | Image file | 画像ファイル |
| `playlistInfo.apply` | Apply | 適用 |
| `playlistInfo.failed` | Failed to update the playlist info: {message} | プレイリスト情報の更新に失敗しました: {message} |

- `smart.editRules` は削除します。`smart.*` の他のキーは `SmartRulesForm` が使い続けます
- `smart.save` (作成ダイアログの保存ボタン) はそのままです
