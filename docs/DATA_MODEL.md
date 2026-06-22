# DATA_MODEL.md — データ構造とコンテンツ定義

このアプリの心臓部。**コンテンツ（スタンプ/アイテム/ガチャ）はここで定義した形でコードと分離**する。
新コンテンツ追加 = 該当配列に1件足すだけ、を保証する。

> 注: 下記の TypeScript はあくまで定義例。Claude Code は実装時に整合性を取りつつ調整してよいが、
> 「コンテンツ分離」「データ消失防止」「schemaVersion」の原則は変更しないこと。

---

## 1. 共通の型

```ts
// src/types.ts
export type Rarity =
  | "normal" | "rare" | "super_rare"
  | "ultra_rare" | "rainbow" | "legend" | "diamond";

export type ItemCategory =
  | "hair" | "clothes" | "hat" | "accessory" | "background" | "pet";
```

---

## 2. コンテンツ定義（src/data/）

### 2.1 ミッション初期値 `src/data/missions.ts`
```ts
export interface MissionDef {
  id: string;          // 一意。例 "sleep_by_10"
  emoji: string;       // 表示用絵文字
  label: string;       // ひらがな表示名
  doublePoints?: boolean;
  editableLabel?: boolean; // 「じぶんできめた」枠は true
}

export const DEFAULT_MISSIONS: MissionDef[] = [
  { id: "sleep_by_10", emoji: "🌙", label: "10じまでに ねる", doublePoints: true },
  { id: "study",       emoji: "✏️", label: "くもん・しゅくだいを やる" },
  { id: "help_mom",    emoji: "🧹", label: "ママの おてつだい" },
  { id: "brush_teeth", emoji: "🦷", label: "はみがき（あさ・よる）" },
  { id: "wake_self",   emoji: "⏰", label: "じぶんで おきる" },
  { id: "tidy_up",     emoji: "🧸", label: "つかった ものを かたづける" },
  { id: "greeting",    emoji: "👋", label: "あいさつ できた" },
  { id: "my_mission",  emoji: "⭐", label: "じぶんで きめた ミッション", editableLabel: true },
];
```
> 実際のミッションはおうちの人モードで編集され、プロフィールごとに保存される。
> DEFAULT_MISSIONS は初回セットアップ時の初期値。

### 2.2 スタンプ `src/data/stamps.ts`
```ts
export interface StampDef {
  id: string;        // "stamp_hanamaru"
  name: string;      // "はなまる"
  rarity: Rarity;    // 図鑑やかけら価値の基準
  asset: string;     // 絵文字 or 画像パス。例 "💮" / "/icons/stamps/hanamaru.png"
  starter?: boolean; // 初期から所持しているか
}

export const STAMPS: StampDef[] = [
  { id: "stamp_hanamaru", name: "はなまる", rarity: "normal", asset: "💮", starter: true },
  { id: "stamp_star",     name: "ほし",     rarity: "normal", asset: "⭐", starter: true },
  { id: "stamp_heart",    name: "はーと",   rarity: "normal", asset: "❤️", starter: true },
  // …初期は normal を中心に15〜25個。レア以上はガチャ景品として追加していく
];
```

### 2.3 着せ替えアイテム `src/data/items.ts`
```ts
export interface ItemDef {
  id: string;            // "hair_twintail_pink"
  name: string;          // "ピンクのツインテール"
  category: ItemCategory;
  rarity: Rarity;
  asset: string;         // 画像パス or レイヤー情報
  starter?: boolean;
}

export const ITEMS: ItemDef[] = [
  { id: "hair_default",  name: "きほんの かみがた", category: "hair",    rarity: "normal", asset: "...", starter: true },
  { id: "clothes_tshirt",name: "白いTシャツM",      category: "clothes", rarity: "normal", asset: "...", starter: true },
  // …各カテゴリ初期15〜25個。レア以上はガチャで増やす
];
```
> アバターは「レイヤー合成」で表現する想定（背景→体→服→髪→帽子→アクセ→ペット）。
> 画像が用意できるまでは絵文字/簡易SVGで代替し、後から差し替え可能にする。

### 2.4 ガチャ `src/data/gacha.ts`
```ts
import type { Rarity } from "../types";

// レア度テーブル（重み = 確率%）。合計100。
export const GACHA_RARITY_WEIGHTS: Record<Rarity, number> = {
  normal: 40, rare: 25, super_rare: 15,
  ultra_rare: 10, rainbow: 5, legend: 3, diamond: 1,
};

// レア度別の「ハズレ無し」ポイント付与量（景品がポイントだった場合）
export const RARITY_POINT_REWARD: Record<Rarity, number> = {
  normal: 1, rare: 2, super_rare: 3,
  ultra_rare: 4, rainbow: 6, legend: 8, diamond: 10,
};

// ダブり時にもらえるかけら量（レア度が高いほど多い）
export const RARITY_TO_KAKERA: Record<Rarity, number> = {
  normal: 1, rare: 3, super_rare: 6,
  ultra_rare: 10, rainbow: 20, legend: 40, diamond: 80,
};

// 交換所でアイテム/スタンプを買うのに必要なかけら（レア度別）
export const KAKERA_PRICE: Record<Rarity, number> = {
  normal: 5, rare: 12, super_rare: 25,
  ultra_rare: 50, rainbow: 100, legend: 200, diamond: 400,
};

// 景品プールはスタンプ/アイテムの定義から rarity で自動構成してもよいし、
// ランク内で「ポイント枠」も混ぜる。下は混在比率の例（各ランク内の内訳）。
export const PRIZE_KIND_WEIGHTS = {
  // ランクごとに [ポイント, スタンプ, アイテム] の出やすさ
  default: { points: 20, stamp: 40, item: 40 },
};
```

> **抽選アルゴリズム（lib/gacha.ts）**
> 1. `GACHA_RARITY_WEIGHTS` で重み付き抽選 → ランク決定
> 2. `PRIZE_KIND_WEIGHTS` で景品種別を決定
> 3. スタンプ/アイテムなら、そのランクの未所持優先で抽選（全所持ならポイント or かけらにフォールバック）
> 4. 既所持を引いたら `RARITY_TO_KAKERA` でかけら変換
> 5. プール枯渇時は必ずポイント付与にフォールバック（エラーで止めない）

---

## 3. 保存データ（永続化スキーマ）

`localStorage` キー: `otakara_mission_v1`（`schemaVersion` で将来移行）。

```ts
export interface SaveData {
  schemaVersion: number;            // 例 1
  activeProfileId: string;          // 最後に選んだプロフィール
  settings: AppSettings;
  profiles: Profile[];              // 姉/妹の2件
}

export interface AppSettings {
  pinHash: string | null;           // おうちの人モードのPIN（ハッシュ化推奨）
  yenPerPoint: number;              // 換算レート 既定 10
  weeklyYenCap: number | null;      // 週上限 既定 300（null=上限なし）
  appVersion: string;               // 表示用バージョン
}

export interface Profile {
  id: string;                       // "sister" / "younger" など
  name: string;                     // 表示名
  avatar: AvatarConfig;             // 現在の着せ替え
  missions: MissionDef[];           // このプロフィールのミッション（編集反映）
  points: { total: number; thisWeek: number };
  kakera: number;
  ownedStampIds: string[];
  ownedItemIds: string[];
  dailyRecords: Record<string, DailyRecord>;  // キー "YYYY-MM-DD"
  weekState: WeekState;
}

export interface AvatarConfig {
  hair?: string; clothes?: string; hat?: string;
  accessory?: string; background?: string; pet?: string;
}

export interface DailyRecord {
  stamps: Record<string, string>;   // missionId -> stampId（押されたもの）
  myMissionLabel?: string;          // 「じぶんできめた」内容
  completed: boolean;               // 全クリア達成済みか
  gachaPulled: boolean;             // その日ガチャを引いたか
}

export interface WeekState {
  weekStartDate: string;            // 今週の月曜 "YYYY-MM-DD"
  completedDays: number;            // 今週のコンプリート日数（0〜7）
  weeklyBonusGiven: boolean;        // 週間ボーナス付与済みか
}
```

### 不変条件（再掲・厳守）
- 日付キーは端末ローカル時間の `YYYY-MM-DD`。
- 1日のガチャは `gachaPulled` で1回に固定。
- `weekStartDate` が変わったら週カウンタをリセットし、`points.thisWeek` は精算時のみリセット。
- 所持・ポイント・かけらはバグで減らさない。書き込みは読み出し→更新→保存を一貫して行う。

---

## 4. ロジック配置（src/lib/）

| ファイル | 責務 |
|---|---|
| `storage.ts` | SaveData の load/save、初期化、マイグレーション、export/import |
| `date.ts` | 今日のキー生成、週の月曜計算、週またぎ判定 |
| `points.ts` | スタンプ→ポイント計算（2倍含む）、ボーナス加算、今週分集計 |
| `complete.ts` | 1日コンプリート判定、二重付与防止 |
| `weekly.ts` | 週コンプリート日数の更新、週間ボーナス判定 |
| `gacha.ts` | レア度抽選・景品抽選・ダブり→かけら変換・フォールバック |
| `exchange.ts` | かけら交換所の購入処理 |

---

## 5. コンテンツを増やす手順（運用メモ）

1. 画像（または絵文字）を用意。画像は `public/icons/...` に置く。
2. `src/data/stamps.ts` か `items.ts` に1件追記（id重複に注意）。
3. レア度を設定すれば、ガチャ・かけら価値・交換価格は自動で反映される。
4. ビルド→デプロイ。子どもの端末はPWA更新で自動反映。

**コードのロジックは一切触らないこと。** これが守られている限り、中身は無限に増やせる。
