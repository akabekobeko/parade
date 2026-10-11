# IPC の型定義

[IPC](ipc.md) と [データベース](database.md) で使う型です。

## Music

```ts
// src/shared/schemas/musicSchema.ts
export const musicSchema = z.object({
  // ...
  /** Normalised rating in [0, 1] from the file tag; null when untagged. */
  rating: z.number().nullable(),
  /** User-set favorite flag; stored as 0 / 1 in SQLite, never in the file. */
  favorite: z.union([z.literal(0), z.literal(1)]).transform((value) => value === 1),
  // ...
});
```

- `Music.favorite` は Renderer では `boolean` です。SQLite の 0 / 1 は schema の `transform` で変換し、UI が数値を見ないようにします
- `MusicTagPatch` には足しません。お気に入りはタグではなく、`mp:library:updateMusics` の経路 (ファイルの書き換え) を通りません

## リクエスト

```ts
// src/main/ipc/types.ts

/** Request payload for `mp:library:setMusicFavorite`. */
export type SetMusicFavoriteRequest = {
  /** Row id of the track. */
  readonly musicId: number;
  /** New flag value. */
  readonly favorite: boolean;
};

/** Request payload for `mp:library:setAlbumFavorite`. */
export type SetAlbumFavoriteRequest = {
  /** Identity key from {@link AlbumSummary.albumKey} / `AlbumGroup.key`. */
  readonly albumKey: string;
  /** New flag value. */
  readonly favorite: boolean;
};
```

## AlbumFilter

```ts
export type AlbumFilter = {
  readonly text?: string;
  readonly musicTitle?: string;
  readonly genres?: readonly string[];
  readonly decades?: ReadonlyArray<number | null>;
  /**
   * Keep only albums flagged as favorite. Fed by the content toolbar's
   * filter menu like `musicTitle`; never persisted in `AppSettings`.
   */
  readonly favoriteOnly?: boolean;
};
```

- `sanitizeAlbumFilter` は `favoriteOnly` を捨てます (`musicTitle` と同じ扱い)。`AppSettings.albumFilter` には保存しません
- `serializeAlbumFilter` (クエリ キーの文字列化) には含めます。絞り込みの ON / OFF で別のキーになり、キャッシュが混ざりません

## window.mp.library

```ts
readonly setMusicFavorite: (
  request: SetMusicFavoriteRequest,
) => Promise<IpcResult<void>>;
readonly setAlbumFavorite: (
  request: SetAlbumFavoriteRequest,
) => Promise<IpcResult<void>>;
/** Identity keys of every favorite album. */
readonly getAlbumFavorites: () => Promise<IpcResult<readonly string[]>>;
```

## クエリ キー

```ts
// src/renderer/features/library/queryStore/queryKeys.ts
albumFavorites: "albumFavorites",
```

`fetchLibraryQuery` はこのキーを `window.mp.library.getAlbumFavorites` に対応づけ、結果は `ReadonlySet<string>` ではなく `readonly string[]` のまま保持します。集合への変換は購読側の `useMemo` で行います (キャッシュの型を IPC の型と揃えるため)。

## フィルター状態

```ts
// src/renderer/features/trackFilter/trackFilterStore.ts
export type TrackFilterSnapshot = {
  readonly draft: TrackFilterValues;
  readonly applied: TrackFilterValues;
  /** Per-section "favorites only" toggle; applied immediately (no debounce). */
  readonly favoriteOnly: Readonly<Record<TrackFilterSection, boolean>>;
};
```

`AppSettings` は変更しません。
