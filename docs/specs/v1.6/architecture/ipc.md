# IPC

プレイリスト画像の設定チャネルと、`Playlist` 型の拡張です。既存の `mp:library:setArtistPicture` と同じ形で、Main が画像ファイルの保存と DB の更新を行い、Renderer が応答後にキャッシュを差し替えます。

## チャネル

| チャネル | 方向 | 内容 |
| --- | --- | --- |
| `mp:playlist:setPicture` | invoke | プレイリスト 1 件の画像を設定 (差し替え) する |

- `mp:playlist:list` / `create` / `update` / `remove` / `getMusics` はチャネルを変えません。`list` / `create` / `update` の返す `Playlist` に `picturePath` と `musicCount` が加わります ([データベース](database.md))
- 名前とルールの変更は今までどおり `mp:playlist:update` です。ダイアログの Apply は名前とルールを 1 つの patch にまとめて送ります ([プレイリスト情報の確認ダイアログ](../features/playlist-info-dialog.md))
- `mp:library:changed` は broadcast しません。プレイリストの変更は単一ウィンドウからしか起きず、Renderer が自分でキャッシュを更新します (既存のプレイリスト コマンドと同じ)

## 型

```ts
// src/shared/schemas/playlistSchema.ts
export const playlistSchema = z.object({
  // ...既存の項目
  /**
   * Absolute path of the playlist picture under `userData/images/`, or
   * `null` when none is set. Renderer turns this into a `media-file://` URL.
   */
  picturePath: z.string().nullable(),
  /**
   * Number of tracks: entries of a static playlist (duplicates counted), or
   * the rule evaluation's row count of a smart playlist (0 when the stored
   * rules are corrupted).
   */
  musicCount: z.number().int(),
});

// src/main/ipc/types.ts
/** Request payload for `mp:playlist:setPicture`. */
export type SetPlaylistPictureRequest = {
  /** Row id within the table of `kind`; an unknown id fails the request. */
  readonly id: number;
  /** Which table the playlist lives in. */
  readonly kind: PlaylistKind;
  /** MIME type of the image (`"image/jpeg"`, `"image/png"`, ...). */
  readonly mimeType: string;
  /** Raw image bytes read from the user-selected file. */
  readonly data: Uint8Array;
};

/** Successful payload of `mp:playlist:setPicture`. */
export type SetPlaylistPictureOk = {
  /** Absolute path of the stored image under `userData/images/`. */
  readonly picturePath: string;
};
```

- `ipcKeys` に `PlaylistSetPicture: "mp:playlist:setPicture"` を足し、preload の `playlist` に `setPicture` を足します。`MpApi.playlist.setPicture` の型も同様です
- `SetArtistPictureRequest` と `mimeType` / `data` の形を揃え、Renderer 側の `File` から `Uint8Array` を作る処理を共有できるようにします

## Main の処理

`onSetPlaylistPicture` (`src/main/ipc/onSetPlaylistPicture.ts`) は `onSetArtistPicture` と同じ手順です。

1. `data` が空、または `IMAGE_EXTENSION_BY_MIME` にない MIME はエラーにする (アーティストと同じ文言)
2. `saveArtwork(imagesDirectory(), { mimeType, kind: PictureKind.Other, data })` でファイルを保存する。ファイル名は内容の SHA-256 なので、`kind` は名前に影響しない
3. `getOrCreatePictureId` で `pictures` の行を得る
4. `setPlaylistPicture(db, { id, kind }, pictureId, now)` (`src/main/playlist/setPlaylistPicture.ts`) を呼ぶ。`assertPlaylistExists` で存在を確かめ、トランザクションの中で `UPDATE` と `deleteOrphanedPictures` を実行し、孤児のファイル パスを返す ([データベース](database.md))
5. コミット後に `deleteArtworkFiles(orphaned)` でファイルを消し、`{ picturePath }` を返す

- 失敗は `toIpcError` で `IpcResult` に包みます。single-flight の制御は要りません (ダイアログは Apply 中にボタンを無効にする)
- `onPlaylistRemove` は `removePlaylist` の戻り値 (孤児のファイル パス) を受け取り、`deleteArtworkFiles` を呼ぶように変えます

## Renderer の処理

`src/renderer/features/playlist/playlistCommands/setPlaylistPicture.ts` を足し、ダイアログはこの関数だけを呼びます。

```
setPlaylistPicture(ref, file)
  1. file.arrayBuffer() から Uint8Array を作り、window.mp.playlist.setPicture({ ...ref, mimeType: file.type, data })
  2. 失敗なら IpcError を返す (ダイアログがエラーを表示する)
  3. libraryStore.patch(queryKeys.playlists, ...) で同じ (kind, id) の Playlist の picturePath を差し替える
  4. null を返す
```

- 既存のプレイリスト コマンドは `invalidate` で一覧を再取得しますが、画像は `setArtistPicture` と同じく **キャッシュをその場で差し替え** ます。再取得しないため、サイドバーとヘッダーに即座に反映され、スマートプレイリストの `musicCount` の再評価も走りません
- 戻り値の形 (`Promise<IpcError | null>`) は `setArtistPicture` に合わせます。他のプレイリスト コマンド (`boolean` や `Playlist | null`) と違うのは、ダイアログがエラー文言を表示する必要があるためです
- 名前とルールは既存の `updatePlaylist` コマンドをそのまま使います。`invalidate` が一覧と曲リストを再取得するので、ルールの変更がテーブルと `musicCount` に反映されます
- 画像の `media-file://` URL への変換は `toMediaFileUrl` で、アーティストと同じです。`imagesDirectory()` の下だけを配信する制限もそのまま効きます
