# STEP_3C_FACE_LAYER.md — 姉妹共通ボディ＋顔レイヤー化（改修）

これまで「服＝体＋顔＋衣装」を姉妹別々に持っていたのを、**体・服は共通**にして、
**顔を選べるレイヤー**にする改修。owner（姉/妹）の区別を廃止し、全アセットを共通化する。
姉/妹の**ユーザー2人（ミッション/ポイント/ガチャ）はそのまま**。変えるのはアバター素材の扱いだけ。

> 井川さんの環境：開発初心者。**Git操作・実装はすべて Claude Code が行う**。井川さんはマージと実機確認のみ。
> **base = main の新しいブランチで1つのPR**にまとめること。`npm run build` が通る単位でこまめにコミット＆プッシュ。

---

## 0. 前提：素材 zip を先に配置

`face_assets.zip` の中身をリポジトリに追加：
```
src/assets/avatar/both/outfit/  … 顔なし4着（本体＋thumb）
src/assets/avatar/both/face/    … 顔2種 face_genki / face_gentle（本体＋thumb）
src/assets/avatar/both/hair/    … 髪2種（内容そのまま・both へ移動）
```
そのうえで、**旧フォルダの重複ファイルを削除**：
```
src/assets/avatar/younger/outfit/*   （顔つき旧4着 → 顔なし版に置換したので削除）
src/assets/avatar/sister/outfit/*
src/assets/avatar/younger/hair/*     （both/hair へ移動したので削除）
src/assets/avatar/sister/hair/*
```
※ id は変えない（配布済みのため）。owner とフォルダだけ変更。

---

## 1. `src/types.ts`

- `AvatarCategory` に `"face"` を追加：
```ts
export type AvatarCategory =
  | "outfit" | "hair" | "face" | "hat" | "accessory" | "pet" | "background" | "special";
```
- `AvatarConfig` に `faceId` を追加（**常時装備・必須**、outfit/hair と同じ扱い）：
```ts
export interface AvatarConfig {
  outfitId: string;
  hairId: string;
  faceId: string;      // 追加
  hatId?: string;
  accessoryId?: string;
  petId?: string;
  backgroundId?: string;
  specialId?: string;
}
```

---

## 2. `src/data/avatarAssets.ts`

### 2-1. アセット定義：owner を全部 `"both"` に、顔2種を追加
既存4着・髪2種の `owner` を `"both"` に変更し、下記の顔2行を追加（id は据え置き）：
```ts
// 服（both・顔なし）
a("out_younger_pinkfrill", "outfit", "both", "ピンクフリル",   { rarity: "normal" }),
a("out_younger_parka",     "outfit", "both", "きいろパーカー", { rarity: "rare" }),
a("out_sister_sailor",     "outfit", "both", "セーラーふく",   { rarity: "normal" }),
a("out_sister_lavender",   "outfit", "both", "ラベンダー",     { rarity: "rare" }),
// 髪（both）
a("hair_younger_bob",      "hair",   "both", "ぱっつんボブ",   { rarity: "normal" }),
a("hair_sister_midi",      "hair",   "both", "ミディアム",     { rarity: "normal" }),
// 顔（both）← 新規
a("face_genki",            "face",   "both", "げんき",         { rarity: "normal" }),
a("face_gentle",           "face",   "both", "おっとり",       { rarity: "normal" }),
```
※ 帽子（hat・both）はそのまま。

### 2-2. starter を「プロフィール別マップ」に変更
owner による starter 判定を廃止し、**プロフィールごとの初期装備を明示**する：
```ts
const STARTERS: Record<string, { outfit: string; hair: string; face: string }> = {
  younger: { outfit: "out_younger_pinkfrill", hair: "hair_younger_bob", face: "face_genki" },
  sister:  { outfit: "out_sister_sailor",     hair: "hair_sister_midi", face: "face_gentle" },
};
export function starterOutfitId(pid: string) { return STARTERS[pid]?.outfit; }
export function starterHairId(pid: string)   { return STARTERS[pid]?.hair; }
export function starterFaceId(pid: string)   { return STARTERS[pid]?.face; }
export function starterAssetIds(pid: string): string[] {
  const s = STARTERS[pid]; return s ? [s.outfit, s.hair, s.face] : [];
}
```

### 2-3. owner絞り込みを廃止 → カテゴリで全件返す
`assetsForOwner(profileId, category)` を廃止し、**owner を見ずカテゴリで全件返す**関数に：
```ts
export function assetsInCategory(category: AvatarCategory): AvatarAsset[] {
  return AVATAR_ASSETS.filter((x) => x.category === category);
}
```
（`assetsForOwner` の既存呼び出しは全て `assetsInCategory(category)` に置換。所持判定は画面側で `ownedItemIds` を使う。）

---

## 3. `src/lib/storage.ts`（マイグレーション v3 → v4・加算のみ）

```ts
import { starterAssetIds, starterFaceId } from "../data/avatarAssets";

const CURRENT_SCHEMA_VERSION = 4; // 3 → 4

// migrate() の末尾に追加：
if ((data.schemaVersion ?? 0) < 4) {
  data = {
    ...data,
    profiles: data.profiles.map((p) => {
      const owned = Array.from(new Set([...(p.ownedItemIds ?? []), ...starterAssetIds(p.id)])); // 加算のみ
      const prev = p.avatar ?? {};
      return {
        ...p,
        ownedItemIds: owned,
        avatar: { ...prev, faceId: prev.faceId ?? starterFaceId(p.id) ?? "" },
      };
    }),
  };
  data.schemaVersion = 4;
}
```
`buildDefaultProfile()` の avatar にも `faceId: starterFaceId(id) ?? ""` を追加。
**加算のみ／読み込み失敗で上書きしない／所持は減らさない**を厳守。

---

## 4. `src/components/Avatar.tsx`（顔レイヤーを追加）

z順に **face を outfit と hair の間**へ入れる：
```
background → outfit → face → hair → hat → accessory → pet
```
`LAYERS` に `{ key: "faceId" }` を outfit の直後・hair の直前へ追加するだけ。
special/hooded の既存挙動は変更しない（hooded は hair を隠す。face は隠さない）。
`liveOverride` の仕組みもそのまま（顔調整時に効く）。

---

## 5. `src/screens/Dressup.tsx`（かおタブ追加・owner廃止）

- カテゴリタブに **「かお」** を追加（順序例：ふく / かみ / **かお** / ぼうし / こもの / ペット / はいけい / とくべつ）。
- `assetsForOwner(profile.id, cat)` を **`assetsInCategory(cat)`** に置換。表示は従来どおり `ownedItemIds` に含まれる物だけ（special のロックは従来どおり）。
- **face は必須**（「なし」タイルを出さない。outfit/hair と同じ扱い）。
- 装備ロジックに `case "face": next.faceId = id!; break;` を追加。

---

## 6. `src/screens/AvatarAdjust.tsx`（合成プレビューに顔を含める）

- 下地 `cfg` に **`faceId: starterFaceId(profileId) ?? ""`** を追加。
- カテゴリ切替の switch に **`case "face": cfg.faceId = selectedAsset.id; break;`** を追加。
- `starterFaceId` を import。これで顔も調整プレビューで確認できる。

---

## 7. 受け入れ条件

1. `npm ci && npm run build`（tsc含む）が通る。`any` 不使用。
2. 起動時に v3→v4 マイグレーションが走り、**妹=げんき顔・姉=おっとり顔**が初期装備される（今までと同じ見た目）。
3. ホーム・きせかえで、体＝共通・顔＝レイヤーで正しく合成表示される（顔なしのっぺらが出ない）。
4. きせかえに「かお」タブがあり、げんき／おっとりを選べる（顔に「なし」は無い）。
5. **owner絞り込みが無くなり**、どの服・髪・顔も両プロフィールで選べる（所持していれば）。
6. おうちの人モードの🎯調整で、顔を含む合成プレビューが表示される。
7. 既存機能（ミッション/スタンプ/ガチャ/週月ビュー）は従来どおり。ポイント・所持は減らない。

---

## 8. Claude Code への指示（コピペ用・1回で渡す）

> `docs/STEP_3C_FACE_LAYER.md` と 添付の `face_assets.zip` を使って、姉妹共通ボディ＋顔レイヤー化を実装してください。base = main の新しいブランチ、1つのPRにまとめ、`npm run build` が通る単位でこまめにコミット＆プッシュ。手順は仕様書§0〜§6のとおり（zip配置＋旧ファイル削除→型→データ→マイグレv3→v4→Avatar/Dressup/AvatarAdjust）。データ保護厳守（id改名しない・加算のみ・読み込み失敗で上書きしない）。受け入れ条件§7を満たすこと。
