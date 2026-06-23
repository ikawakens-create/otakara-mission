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

export interface RecoveryMissionDef {
  id: string;
  emoji: string;
  label: string;
}
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

### 2.2 スタンプ `src/data/stamps.ts`
```ts
export interface StampDef {
  id: string;        // "stamp_hanamaru"
  name: string;      // "はなまる"
  rarity: Rarity;    // 図鑑やかけら価値の基準
  asset: string;     // 絵文字 or 画像パス
  starter?: boolean; // 初期から所持しているか
}
```

### 2.3 着せ替えアイテム `src/data/items.ts`
```ts
export interface ItemDef {
  id: string;            // "hair_twintail_pink"
  name: string;          // "ピンクのツインテール"
  category: ItemCategory;
  rarity: Rarity;
  asset: string;
  starter?: boolean;
}
```

### 2.4 ガチャ `src/data/gacha.ts`
```ts
// レア度テーブル（重み = 確率%）。合計100。
export const GACHA_RARITY_WEIGHTS: Record<Rarity, number> = {
  normal: 40, rare: 25, super_rare: 15,
  ultra_rare: 10, rainbow: 5, legend: 3, diamond: 1,
};

export const RARITY_POINT_REWARD: Record<Rarity, number> = { ... };
export const RARITY_TO_KAKERA: Record<Rarity, number> = { ... };
export const KAKERA_PRICE: Record<Rarity, number> = { ... };
export const PRIZE_KIND_WEIGHTS = { default: { points: 20, stamp: 40, item: 40 } };
```

### 2.5 レア度ビジュアル `src/data/gachaVisuals.ts`（ステップ2-A で追加）
```ts
export interface RarityVisual {
  label: string;        // 表示用レア度名（日本語）
  capsuleColor: string; // カプセルの色（CSS色）
  glowColor: string;    // グロー効果の色（CSS色）
  level: number;        // 0〜6（演出強度・音の段数に使用）
}

export const RARITY_VISUALS: Record<Rarity, RarityVisual> = { ... };
```

### 2.6 ガチャ演出シナリオ `src/data/gachaScenarios.ts`（ステップ2-B で追加）
```ts
export interface GachaScenarioDef {
  id: string;
  rarities: Rarity[];    // このシナリオが選ばれうるレア度
  weight: number;        // 重み付きランダム選択用
  phases: GachaPhase[];  // 演出フェーズの配列
}
```

### ガチャ抽選ロジック `src/lib/gacha.ts`（ステップ2-A で追加）
```ts
export type PullType = "daily" | "ticket";
// "daily": dailyRecords[dateKey].gachaPulled = true にする（デイリー/リカバリー共用）
// "ticket": specialGachaTickets -= 1 にする

export interface GachaResult {
  rarity: Rarity;
  prizeKind: "points" | "stamp" | "item";
  prizeId: string | null;
  prizePoints: number;
  isDuplicate: boolean;
  kakeraAwarded: number;
  prizeAsset: string;
  prizeName: string;
}
```

特記事項：
- スペシャルガチャ券の抽選テーブルは当面デイリーと同一。
  将来「券は高レア率アップ」等にする場合は `GACHA_RARITY_WEIGHTS` と別テーブルを追加すればよい構造にしておく。
- リカバリーガチャは過去日の `dailyRecords[recoveredDate].gachaPulled` を true にする（今日の record は変更しない）。

---

## 3. 保存データ（永続化スキーマ）

`localStorage` キー: `otakara_mission_v1`。`schemaVersion` で将来移行。

**現在の schemaVersion: 2**（v1→v2 マイグレーション済み）

```ts
export interface SaveData {
  schemaVersion: number;            // 現在 2
  activeProfileId: string;
  settings: AppSettings;
  profiles: Profile[];
}

export interface AppSettings {
  pinHash: string | null;           // "plain:1234" 形式（ステップ4でハッシュ化）
  yenPerPoint: number;              // 既定 10
  weeklyYenCap: number | null;      // 既定 300
  appVersion: string;

  // ステップ1.5で追加（schemaVersion 2）
  recoveryMissions: RecoveryMissionDef[];  // リカバリー専用ミッション一覧
  recoveryWeeklyLimit: number;      // 週あたりリカバリー上限（既定2）
  recoveryGrantsGacha: boolean;     // リカバリーでもガチャを引けるか（既定true）
  monthlyGoalDays: number;          // 月間目標日数（既定20）
  monthlyRewardPoints: number;      // 月間達成時のポイント報酬（既定10）
}

export interface Profile {
  id: string;
  name: string;
  avatar: AvatarConfig;
  missions: MissionDef[];
  points: { total: number; thisWeek: number };
  kakera: number;
  ownedStampIds: string[];
  ownedItemIds: string[];
  dailyRecords: Record<string, DailyRecord>;  // キー "YYYY-MM-DD"
  weekState: WeekState;

  // ステップ1.5で追加（schemaVersion 2）
  monthlyRewardGiven: Record<string, boolean>;  // キー "YYYY-MM"
  specialGachaTickets: number;                  // スペシャルガチャ券の枚数
}

export interface AvatarConfig {
  hair?: string; clothes?: string; hat?: string;
  accessory?: string; background?: string; pet?: string;
}

export interface DailyRecord {
  stamps: Record<string, string>;   // missionId -> stampId
  myMissionLabel?: string;
  completed: boolean;
  gachaPulled: boolean;

  // ステップ1.5で追加（schemaVersion 2）
  recovered?: boolean;              // リカバリーで達成扱いにした日
  recoveryMissionId?: string;       // 使ったリカバリーミッションのid
}

export interface WeekState {
  weekStartDate: string;            // 今週の月曜 "YYYY-MM-DD"
  completedDays: number;
  weeklyBonusGiven: boolean;

  // ステップ1.5で追加（schemaVersion 2）
  recoveryUsedThisWeek: number;     // 今週のリカバリー使用回数（週またぎでリセット）
}
```

### 不変条件（再掲・厳守）
- 日付キーは端末ローカル時間の `YYYY-MM-DD`。
- 1日のガチャは `gachaPulled` で1回に固定。
- `monthlyRewardGiven["YYYY-MM"]` で月間報酬の二重付与を防止。
- `weekState.recoveryUsedThisWeek` は週またぎで 0 にリセット。
- 所持・ポイント・かけらはバグで減らさない。

---

## 4. ロジック配置（src/lib/）

| ファイル | 責務 |
|---|---|
| `storage.ts` | SaveData の load/save、初期化、マイグレーション、export/import |
| `date.ts` | 日付キー生成、週の月曜計算、週またぎ判定、カレンダー配列生成 |
| `points.ts` | スタンプ→ポイント計算（2倍含む）、ボーナス加算 |
| `complete.ts` | 1日コンプリート判定、二重付与防止 |
| `weekly.ts` | 週コンプリート日数の更新、週間ボーナス判定（ステップ4） |
| `gacha.ts` | レア度抽選・景品抽選・ダブり→かけら変換・フォールバック・ガチャ権利判定（ステップ2-A） |
| `exchange.ts` | かけら交換所の購入処理（ステップ3） |
| `stats.ts` | 達成率・曜日ステータス・週/月サマリーを dailyRecords から計算 |
| `recovery.ts` | リカバリー候補判定・適用・残り回数 |
| `monthly.ts` | 月間ごほうびの達成判定・付与 |

---

## 5. スキーマバージョン履歴

| バージョン | 変更内容 |
|---|---|
| 1 | 初期スキーマ（ステップ0/1） |
| 2 | ステップ1.5追加: DailyRecord.recovered, WeekState.recoveryUsedThisWeek, Profile.monthlyRewardGiven/specialGachaTickets, AppSettings.recovery*/monthly* |
| （2のまま） | ステップ2-A: ガチャロジック・演出を追加。スキーマ変更なし（`gachaPulled`・`specialGachaTickets` は v2 で定義済み） |

---

## 6. コンテンツを増やす手順（運用メモ）

1. 画像（または絵文字）を用意。画像は `public/icons/...` に置く。
2. `src/data/stamps.ts` か `items.ts` に1件追記（id重複に注意）。
3. レア度を設定すれば、ガチャ・かけら価値・交換価格は自動で反映される。
4. ビルド→デプロイ。子どもの端末はPWA更新で自動反映。

**コードのロジックは一切触らないこと。** これが守られている限り、中身は無限に増やせる。
