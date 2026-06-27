# STEP_3B_AVATAR.md — ステップ3-B 実装仕様書（アバター着せ替え）

対象：**avatarAssets.ts のデータ定義 ＋ 着せ替え画面 ＋ ホーム反映 ＋ 親「位置調整モード」**
正の仕様は `docs/AVATAR_SPEC.md`（v4）。本書はそれを **いまのコードに落とす実装指示**。

> 重要な前提（現状コードを実機確認済み）
> - `avatarAssets.ts` / 着せ替え画面 / 親の位置調整モードは**未実装**。アバター画像も**まだ0枚**。
> - `Profile.avatar` は現状 `{}` 固定で、**どの画面からも読み書きされていない**（Homeは絵文字表示のみ）。
>   → だから `AvatarConfig` を v4 の形に置き換えても**既存データは壊れない**（安全）。
> - 図鑑(3-A)・バックアップUIは**本PRの範囲外**。3-B が最初のアバターPR（v4 §10 のビルド順1番目）。
> - **画像が1枚も無くてもUIが動く**ように、未生成アセットは「ラベル＋レア度枠」のプレースホルダで描く。
>   井川さんはGeminiで素材を作りながら、先に画面と配線を実機テストできる。

---

## 0. 井川さんへ（進め方）

この1枚を Claude Code に渡せば実装できます。井川さんの作業は **マージ＆実機確認** だけでOK。
レート制限対策として「動く単位で早めにコミット＆プッシュ」を必ず指示してください（末尾§13にコピペ文あり）。

### おすすめPR分割（安全のため3つに割る）
1PR=1タスクの原則どおり、**3つの小さいPR**に分けるのを推奨します（各PRがビルド通過＝緑になったらマージ→実機確認→次へ）。

1. **PR-A：データ土台**　`types.ts` の型変更＋`avatarAssets.ts`新設＋`storage.ts` マイグレーション(v2→v3)。画面はまだ無し。
   → これだけで `npm run build` が通り、既存アプリは今までどおり動く（見た目は変わらない）。
2. **PR-B：見た目**　レイヤー描画コンポーネント＋**着せ替え画面**＋**ホーム反映**＋ナビ配線。
   → ここで初めて「きせかえ」が触れる。画像が無い分はプレースホルダで表示。
3. **PR-C：親の位置調整モード**　おうちの人モードに調整ツールを追加。

> 急ぐなら PR-B と PR-C を1本にしても良いですが、初めての大きめ機能なので**分けた方が安全**です。

---

## 1. ゴールと範囲

- 集めたアバター素材（outfit/hair/hat/accessory/pet/background/special）を**重ねて着せ替え**できる。
- 着せ替えた姿が**ホーム（ヘッダー）に反映**される。
- 親が各素材の位置を微調整できる**位置調整モード**を用意（確定値は `avatarAssets.ts` に焼き込む方式）。
- **やらないこと**は §12 を参照（図鑑/バックアップ/リアクション演出/実際の絵の生成）。

> **ステップ3全体の順番（HANDOFF_4で更新）**：
> 1. **3-B 着せ替え（本書）** ← イマココ　2. アバター登場＆リアクション　3. 特別立ち絵をガチャ景品/コンプ報酬に
> 4. 図鑑(3-A／旧 `STEP_3A_COLLECTION.md` は絵文字前提なので画像素材前提に作り直し)　5. バックアップUI
> ＝ 図鑑(3-A)とバックアップは**後ろに移動**。3-B が最初のアバターPRで合っている。

---

## 2. データ保護・不変条件（厳守）

`CLAUDE.md` §5・`AVATAR_SPEC.md` §5-3 を守ること。

- **配布済み id は削除・改名しない（追加のみ）**。
- マイグレーションは**加算のみ**。読み込み失敗時に既存データを上書きしない（現状の `catch` 動作は維持）。
- **ポイント・かけら・所持idは勝手に消さない。**
- `ownedItemIds` は既存をそのまま流用し、**アバター素材idを加算**して使う（新フィールドは作らない）。

---

## 3. 型の変更（`src/types.ts`）

### 3-1. 追加：アバター素材の型

```ts
export type AvatarCategory =
  | "outfit" | "hair" | "hat" | "accessory" | "pet" | "background" | "special";

export interface AvatarAsset {
  id: string;
  category: AvatarCategory;
  owner: "sister" | "younger" | "both";
  label: string;        // ひらがな名
  imagePath: string;    // 768×1024 WebP（assets/avatar 配下の相対パス）
  thumbPath: string;    // 192×256 WebP
  rarity?: Rarity;
  offsetX?: number;     // 既定0（−80〜+80）親の微調整
  offsetY?: number;     // 既定0（−80〜+80）
  scale?: number;       // 既定1.0（0.85〜1.15）
  starter?: boolean;
}
```

### 3-2. 置き換え：`AvatarConfig`（v4 §6 の形へ）

```ts
export interface AvatarConfig {
  outfitId: string;     // 常に装備（"なし"不可）
  hairId: string;       // 常に装備（"なし"不可）
  hatId?: string;
  accessoryId?: string;
  petId?: string;
  backgroundId?: string;
  specialId?: string;   // セット時は全レイヤーを上書きして1枚表示
}
```

> 旧 `ItemCategory` / `ItemDef` / `ITEMS`（`src/data/items.ts`・絵文字）は**触らず残す**（stamps等の既存配線を壊さない）。
> アバター用途は `avatarAssets.ts` を使う。`items.ts` の整理は将来の別PR（任意）。

---

## 4. データ定義（`src/data/avatarAssets.ts` 新設）

**方針**：1行＝1素材。`a(...)` ヘルパーで命名規約(§5-1)を強制し「**add 1 row で増やせる**」を維持。
画像URLは `import.meta.glob` で解決し、**存在するwebpだけがマップに入る**＝未生成なら自動でプレースホルダ。

```ts
import type { AvatarAsset, AvatarCategory, Rarity } from "../types";

// 実在する webp だけが入る（未生成は undefined → プレースホルダ表示）
const ASSET_URLS = import.meta.glob("../assets/avatar/**/*.webp", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>;

export function resolveAvatarUrl(imagePath: string | undefined): string | undefined {
  if (!imagePath) return undefined;
  return ASSET_URLS[`../assets/avatar/${imagePath}`];
}

type Owner = "sister" | "younger" | "both";
function a(
  id: string, category: AvatarCategory, owner: Owner, label: string,
  opts: { rarity?: Rarity; starter?: boolean; offsetX?: number; offsetY?: number; scale?: number } = {}
): AvatarAsset {
  return {
    id, category, owner, label,
    imagePath: `${owner}/${category}/${id}.webp`,
    thumbPath: `${owner}/${category}/${id}.thumb.webp`,
    ...opts,
  };
}

export const AVATAR_ASSETS: AvatarAsset[] = [
  // ===== すでにGemini生成済み（正規化WebPを所定フォルダに置けば即・本物表示）=====
  // ---- 妹（younger）----
  a("out_younger_pinkfrill", "outfit", "younger", "ピンクフリル",   { rarity: "normal", starter: true }), // ← starter（確定）
  a("out_younger_parka",     "outfit", "younger", "きいろパーカー", { rarity: "rare" }),
  a("hair_younger_bob",      "hair",   "younger", "ぱっつんボブ",   { rarity: "normal", starter: true }),
  // ---- 姉（sister）----
  a("out_sister_sailor",     "outfit", "sister",  "セーラーふく",   { rarity: "normal", starter: true }), // ← starter（確定）
  a("out_sister_lavender",   "outfit", "sister",  "ラベンダー",     { rarity: "rare" }), // ※画像8は出し直し予定
  a("hair_sister_midi",      "hair",   "sister",  "ミディアム",     { rarity: "normal", starter: true }),

  // ===== これから素材を作る分（画像が無くてもプレースホルダで一覧に出る）=====
  a("hat_both_ribbon",   "hat",        "both",    "リボン",       { rarity: "normal" }),
  a("acc_both_star",     "accessory",  "both",    "ほしのアクセ", { rarity: "normal" }),
  a("pet_both_cat",      "pet",        "both",    "ねこ",         { rarity: "rare" }),
  a("bg_both_sky",       "background", "both",    "あおぞら",     { rarity: "normal" }),
  a("sp_younger_banzai", "special",    "younger", "ばんざい！",   { rarity: "ultra_rare" }),
];
```

> **starter（初期装備）＝確定：妹「ピンクフリル」／姉「セーラーふく」**（髪は生成済みの妹ボブ・姉ミディアム）。
> **id は一度子どものタブレットに配布したら改名禁止**（データ保護）。この id 一覧で実装に進む。
>
> **画像の置き場所**（HANDOFF生成済み分の例）：
> `src/assets/avatar/younger/outfit/out_younger_pinkfrill.webp`（＋ `.thumb.webp`）
> `src/assets/avatar/sister/hair/hair_sister_midi.webp` … という具合。置けば自動で本物に切替（再ビルド必要）。

// 参照ヘルパー
const BY_ID: Record<string, AvatarAsset> = Object.fromEntries(AVATAR_ASSETS.map((x) => [x.id, x]));
export function avatarAsset(id: string | undefined): AvatarAsset | undefined {
  return id ? BY_ID[id] : undefined;
}

// owner 絞り込み（profile.id が "sister" | "younger" と一致）
export function assetsForOwner(profileId: string, category: AvatarCategory): AvatarAsset[] {
  return AVATAR_ASSETS.filter(
    (x) => x.category === category && (x.owner === profileId || x.owner === "both")
  );
}

// starter（owner別）
export function starterOutfitId(profileId: string): string | undefined {
  return AVATAR_ASSETS.find((x) => x.category === "outfit" && x.starter && (x.owner === profileId || x.owner === "both"))?.id;
}
export function starterHairId(profileId: string): string | undefined {
  return AVATAR_ASSETS.find((x) => x.category === "hair" && x.starter && (x.owner === profileId || x.owner === "both"))?.id;
}
export function starterAssetIds(profileId: string): string[] {
  return AVATAR_ASSETS.filter((x) => x.starter && (x.owner === profileId || x.owner === "both")).map((x) => x.id);
}
```

**フォルダ規約（v4 §5-1）**：`src/assets/avatar/<owner>/<category>/<id>.webp` と `.../<id>.thumb.webp`。
（例：`src/assets/avatar/younger/outfit/out_younger_starter.webp`）
画像を入れたら**自動でプレースホルダから本物に切り替わる**（コード変更不要）。

---

## 5. マイグレーション（`src/lib/storage.ts`：v2 → v3）

既存プロフィールに **starterアバターidを加算**し、**装備にstarterを既定セット**する。**加算のみ**。

```ts
// import を追加
import { starterAssetIds, starterOutfitId, starterHairId } from "../data/avatarAssets";
import type { AvatarConfig } from "../types";

const CURRENT_SCHEMA_VERSION = 3; // 2 → 3

// migrate() の末尾、return data; の手前に追加：
if ((data.schemaVersion ?? 0) < 3) {
  data = {
    ...data,
    profiles: data.profiles.map((p) => {
      const starters = starterAssetIds(p.id);
      const owned = Array.from(new Set([...(p.ownedItemIds ?? []), ...starters])); // 加算のみ
      const prev = (p.avatar ?? {}) as Partial<AvatarConfig>;
      return {
        ...p,
        ownedItemIds: owned,
        avatar: {
          ...prev,
          outfitId: prev.outfitId ?? starterOutfitId(p.id) ?? "",
          hairId:   prev.hairId   ?? starterHairId(p.id)   ?? "",
        },
      };
    }),
  };
  data.schemaVersion = 3;
}
```

`buildDefaultProfile()` も新規プロフィールがstarterを持つように修正：

```ts
const starterAvatarIds = starterAssetIds(id);
// ...
  ownedItemIds: [...starterItemIds, ...starterAvatarIds],
  avatar: {
    outfitId: starterOutfitId(id) ?? "",
    hairId:   starterHairId(id)   ?? "",
  },
```

> `?? ""` は型を満たすための保険。万一空でも描画側はプレースホルダで耐える（§6）。

---

## 6. レイヤー描画コンポーネント（`src/components/Avatar.tsx` 新設）

### 6-1. 仕様
- **枠は3:4固定**。各層を同一枠に**絶対配置（contain）**。
- z順（下→上）：`background → outfit → hair → hat → accessory → pet`。
- `specialId` がセットされていて、その素材を**所持**していれば**全レイヤーを無視して special 1枚**を表示。
- 各層は `transform: translate(offsetX, offsetY) scale(scale)`（既定 0/0/1）。
- **プレースホルダ**：素材は定義済みだが画像URLが解決できない（=webp未生成）場合、
  ラベル＋レア度色枠の四角を描く。outfit/hairが未解決でも「すがた」が分かるよう必ず枠を出す。
  optional層（hat等）が**未装備**なら何も描かない。

### 6-2. 実装の目安

```tsx
import type { AvatarConfig } from "../types";
import { avatarAsset, resolveAvatarUrl } from "../data/avatarAssets";
import { RARITY_VISUALS } from "../data/gachaVisuals";
import styles from "./Avatar.module.css";

const LAYERS: { key: keyof AvatarConfig; }[] = [
  { key: "backgroundId" }, { key: "outfitId" }, { key: "hairId" },
  { key: "hatId" }, { key: "accessoryId" }, { key: "petId" },
];

function Layer({ id }: { id?: string }) {
  if (!id) return null;
  const asset = avatarAsset(id);
  if (!asset) return null;
  const url = resolveAvatarUrl(asset.imagePath);
  const t = `translate(${asset.offsetX ?? 0}px, ${asset.offsetY ?? 0}px) scale(${asset.scale ?? 1})`;
  if (url) {
    return <img className={styles.layer} src={url} alt="" style={{ transform: t }} />;
  }
  // プレースホルダ（画像未生成）
  const color = asset.rarity ? RARITY_VISUALS[asset.rarity].glowColor : "#ddd";
  return (
    <div className={styles.placeholder} style={{ borderColor: color, transform: t }}>
      {asset.label}
    </div>
  );
}

export default function Avatar({ config, ownedIds }: { config: AvatarConfig; ownedIds: string[] }) {
  const special = config.specialId && ownedIds.includes(config.specialId)
    ? avatarAsset(config.specialId) : undefined;

  return (
    <div className={styles.frame}>
      {special ? (
        <Layer id={special.id} />
      ) : (
        LAYERS.map(({ key }) => <Layer key={key} id={config[key] as string | undefined} />)
      )}
    </div>
  );
}
```

`Avatar.module.css`（目安）：

```css
.frame { position: relative; aspect-ratio: 3 / 4; width: 100%; overflow: hidden; }
.layer { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.placeholder {
  position: absolute; inset: 12%; display: grid; place-items: center;
  border: 3px dashed; border-radius: 16px; font-size: 14px; color: #555;
  background: rgba(255,255,255,.4);
}
```

### 6-3. ホーム用サムネ（`src/components/AvatarThumb.tsx` 新設）
- ヘッダーの丸枠に収めるための薄いラッパ。`Avatar` を小さく出し、円形クリップ。
- **どの層も実画像に解決できない場合のみ**、これまでの絵文字（`👧/🧒`）にフォールバック（ホームが壊れて見えないように）。

---

## 7. 着せ替え画面（`src/screens/Avatar.tsx`＝仮、`Dressup.tsx` でも可）

### 7-1. 画面構成
1. **上部プレビュー**：`<Avatar>` を大きめに表示（現在の装備＝即時反映）。
2. **カテゴリタブ**：`ふく / かみ / ぼうし / こもの / ペット / はいけい / とくべつ`。
3. **グリッド**：選択カテゴリの**所持素材**を `thumbPath` のサムネで並べる（owner絞り込み済み）。
   - **outfit / hair**：「なし」タイルは**出さない**（常時装備）。現在装備中は枠を強調。
   - **hat / accessory / pet / background**：先頭に「なし」タイルを置く（外せる）。
   - 各タイルは**レア度色枠**（`RARITY_VISUALS[rarity].glowColor`）。
4. タイルをタップ＝即装備（`AvatarConfig` を更新→ `onUpdate` 保存）。軽い「できた！」キラ（任意・控えめ）。

### 7-2. 「とくべつ」タブ（v4 §7）
- **所持している special**：選ぶと `specialId` をセット（全レイヤー上書き＝まるごと1枚）。
- **未所持の special**：シルエット＋🔒ロック表示（タップ不可）。
- **「とくべつをはずす」**ボタン：`specialId` を未設定に戻す（outfit/hairの装備はそのまま維持）。

> 注：special を**入手する手段（ガチャ景品/コンプ報酬）はステップ3の後のPR**。よって3-B時点では
> 「とくべつ」タブは**全部ロック表示が正常**（バグではない）。ロックUIの確認用に例として
> `sp_younger_banzai` を1件入れてある。

### 7-3. 所持・owner判定
- 表示対象：`assetsForOwner(profile.id, category)` の中で **`ownedItemIds` に含まれるもの**だけ（specialのロック表示は例外で未所持も並べる）。
- starterは必ず所持済み（§5マイグレーションで保証）。

### 7-4. 装備更新ロジック（目安）
```ts
function equip(category: AvatarCategory, id: string | undefined) {
  const next: AvatarConfig = { ...profile.avatar };
  switch (category) {
    case "outfit":     next.outfitId = id!; break;          // 必須なので undefined にしない
    case "hair":       next.hairId = id!; break;
    case "hat":        next.hatId = id; break;
    case "accessory":  next.accessoryId = id; break;
    case "pet":        next.petId = id; break;
    case "background":  next.backgroundId = id; break;
    case "special":    next.specialId = id; break;
  }
  onUpdateProfile({ ...profile, avatar: next });
}
```

### 7-5. ナビ配線
- `App.tsx` に画面追加：`type Screen = ... | "avatar"`。
- 子どもの導線：**Homeヘッダーのアバター丸枠タップで「きせかえ」へ**＋ 念のため「👗 きせかえ」ボタンも置く。
  - `Home` に `onOpenAvatar` プロップを追加し、`App.tsx` で `setScreen("avatar")`。
- 着せ替え画面 → 戻るで Home。`onUpdateProfile` は Home/App 既存の更新関数と同じ形（`SaveData.profiles` を差し替え）。

```tsx
// App.tsx（TestGacha と同じ要領で1画面追加）
if (screen === "avatar") {
  const ap = saveData.profiles.find(p => p.id === saveData.activeProfileId) ?? saveData.profiles[0];
  return (
    <AvatarScreen
      profile={ap}
      onUpdateProfile={(up) => handleUpdate({ ...saveData, profiles: saveData.profiles.map(p => p.id===up.id?up:p) })}
      onBack={() => setScreen("home")}
    />
  );
}
```

---

## 8. ホーム反映（`src/screens/Home.tsx`）

- ヘッダー `profileRow` の `.avatarCircle`（現状 `AVATAR_EMOJI[...]`）を **`<AvatarThumb>`** に差し替え。
  - `config = currentProfile.avatar`、`ownedIds = currentProfile.ownedItemIds`、`fallbackEmoji = AVATAR_EMOJI[currentProfile.id]`。
  - この丸枠タップで **きせかえ画面へ**（`onOpenAvatar`）。
- `AVATAR_EMOJI` 定数は**フォールバック用に残す**（消さない）。
- 他のステータス表示・ガチャ導線は**変更しない**。

> リアクション（全クリア時に揺れる等）は **本PRの対象外**（v4 §13）。ここでは静止表示でOK。

---

## 9. 親「位置調整モード」（`src/screens/AvatarAdjust.tsx` 新設）

### 9-1. ねらいと方式（正直な設計）
PWAは**自分のソースを書き換えられない**ため、調整値は最終的に **`avatarAssets.ts` のその素材の行に焼き込む**（v4 §2-3）。
この画面は「**プレビューしながら数値を出し、コピペ用スニペットを表示**」するツール。貼り付け＆再デプロイは Claude Code 側で行う。

### 9-2. 入口
- `ParentSettings.tsx` の「開発ツール」セクションに項目追加：
  「アバターのいちちょうせい」→ ボタン「🎯 ちょうせいする」。
- `ParentSettings` に `onOpenAvatarAdjust` を追加 → `App.tsx` で `setScreen("avatarAdjust")`（PINゲートの内側）。

### 9-3. UI
1. **owner選択**（おねえちゃん / いもうと）。
2. **カテゴリ選択** → **素材選択**（その owner の素材一覧。所持に関係なく全部選べる＝調整は親作業）。
3. **プレビュー**：選んだ素材を**単体**で枠に表示（必要なら starter outfit/hair を下敷きに薄く重ねて位置確認できると親切・任意）。
4. **スライダー3本**：
   - `offsetX`：−80〜+80（既定0）
   - `offsetY`：−80〜+80（既定0）
   - `scale`：0.85〜1.15（既定1.0、step 0.01）
5. プレビューは**ライブ更新**（スライダーの値を `transform` に即反映）。
6. **コピペ用スニペット**を表示（タップでコピー）：
   ```
   // out_younger_pinkdress の調整値
   offsetX: 12, offsetY: -8, scale: 1.05
   ```
   井川さん→Claude Code に「この値を avatarAssets.ts の該当行に入れて」と渡せばOK。

### 9-4. スコープ注意
- この画面は **`avatarAssets.ts` を書き換えない**（できない）。**数値を提示するだけ**。
- 「保存」で `saveData` を汚さない（本物データに触れない）。＝ガチャ演出テストと同じ“非破壊”思想。
- ※将来の任意拡張：素材別offsetを `settings` に保存して即時反映する案もあるが、**本PRの範囲外**（v4は焼き込み方式が確定）。

---

## 10. データの不変条件チェック（実装後の自己確認）

- [ ] 既存セーブ（v2）を読み込むと **v3へ加算マイグレーション**され、starterが所持＆装備される。
- [ ] `ownedItemIds` から**何も消えない**（絵文字itemsのidも残る／アバターidが増えるだけ）。
- [ ] 読み込み失敗時は**既存を上書きせず**デフォルトに退避する現状動作を維持。
- [ ] 姉/妹のデータは**混ざらない**（owner絞り込み＆profile別）。

---

## 11. 受け入れ条件（Acceptance Criteria）

PR-A（データ土台）
1. `npm ci && npm run build`（tsc含む）が通る。`any` 不使用。
2. `avatarAssets.ts` が新設され、starterが owner ごとに **outfit×1・hair×1** 定義されている。
3. v2セーブ→起動でクラッシュせず、starterが所持＆装備される（コンソールで `schemaVersion:3` 確認）。
4. 既存機能（スタンプ/ガチャ/週月ビュー/おうちの人モード）は**従来どおり**動く。

PR-B（着せ替え＋ホーム）
5. ホームのアバターが **装備内容で描画**される（画像未生成の素材はプレースホルダ、全滅時は絵文字）。
6. ホームのアバター丸枠タップ、または「👗 きせかえ」で**着せ替え画面**が開く。
7. カテゴリ切替で**所持素材のサムネ**が並ぶ。**owner絞り込み**が効く（自分＋both のみ）。
8. outfit/hair に「なし」が無い。hat/accessory/pet/background は「なし」で外せる。
9. タイル選択で**即装備＆保存**され、プレビューとホームに反映される。
10. 「とくべつ」：所持specialは装備で**全レイヤー上書き**、未所持は🔒、**「とくべつをはずす」**で重ね着せに戻る。
11. レイヤーのz順が正しい（背景→服→髪→帽子→小物→ペット）。

PR-C（親の位置調整）
12. おうちの人モード（PIN内）から調整画面に入れる。
13. スライダーで offsetX/Y(−80〜80)・scale(0.85〜1.15) を動かすと**プレビューがライブ更新**。
14. **コピペ用スニペット**（offsetX/offsetY/scale）が表示され、コピーできる。
15. 調整画面は `saveData` を**書き換えない**（非破壊）。

---

## 12. 本PRの対象外（やらないこと）

- **図鑑(3-A)**・**バックアップUI**（別PR）。
- **リアクション演出**（揺れ/吹き出し/全クリア演出）＝ v4 §13 で別PR。
- **実際の絵（WebP）の生成・正規化スクリプト**（井川さんがGemini→Claudeが正規化）。
- 旧 `items.ts`（絵文字）の削除・置換（残置。整理は将来の任意PR）。

---

## 13. Claude Code への指示テンプレ（コピペ用）

> `docs/AVATAR_SPEC.md`（v4）と `docs/STEP_3B_AVATAR.md` を読んで、**ステップ3-Bを3つのPRに分けて**実装してください。
> 1) PR-A：`types.ts` の型変更（AvatarAsset追加／AvatarConfigをv4の形へ置換）＋`src/data/avatarAssets.ts`新設＋`src/lib/storage.ts`のマイグレーション(v2→v3、加算のみ)。
> 2) PR-B：`Avatar`/`AvatarThumb` コンポーネント＋着せ替え画面＋ホーム反映＋`App.tsx`配線。
> 3) PR-C：おうちの人モードに「位置調整モード」を追加。
> 制約：`any` 禁止。コンテンツとロジックを分離（素材は `avatarAssets.ts` のみ）。データ保護厳守（配布id削除・改名禁止／加算のみ／読み込み失敗で上書きしない）。画像未生成でもプレースホルダでビルド＆動作すること。
> **各PRは `npm run build` が通る単位で、こまめにコミット＆プッシュ**してください（途中で止まっても再開できるように）。受け入れ条件は本書 §11 を満たすこと。

---

## 14. メモ（実装の落とし穴）

- `import.meta.glob` のキーは**呼び出しファイルからの相対パス**。`avatarAssets.ts` が `src/data/` にある前提で `"../assets/avatar/**/*.webp"`。場所を変えたらパスも合わせる。
- WebP透過とプレースホルダの切替は **URL解決の有無だけ**で決まる。画像を追加すれば自動で本物に変わる（再ビルドは必要）。
- `profile.id` は `"sister" | "younger"` で owner と一致しているので、owner絞り込みは `id` 比較で足りる。
- レア度色は既存 `RARITY_VISUALS[rarity].glowColor` を流用（新しい色表を作らない）。
