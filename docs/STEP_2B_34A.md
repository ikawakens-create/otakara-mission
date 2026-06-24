# STEP_2B_34A.md — §3-4a 演出シナリオ抽選＋前半の煽り出し分け

## 目的
ガチャの結果（レア度）は変えずに、**見せ方（演出シナリオ）を結果レア度に応じて重み付きで選び**、
演出の前半（球の中身・煽りの強さ）を出し分ける。これで「毎回おなじ」を卒業する第一歩。
※ お披露目の派手な演出（大逆転フラッシュ／ガセの肩透かし／確定カットイン）は **§3-4b** で足す。

## 設計方針（重要）
- **結果と演出は分離**：抽選（`lib/gacha.ts`）はそのまま。シナリオは「見せ方」だけを決める。
- 大げさな汎用エンジンは作らず、**シナリオ＝少数のデータ＋見せ方の切替**で実装する（軽量・拡張可）。
- **演出テスト（dryRun）でシナリオを指定して確認できる**ようにする。

---

## 1. gachaScenarios.ts（新規）
`src/data/gachaScenarios.ts`

```ts
import type { Rarity } from "../types";

export type ScenarioId = "standard" | "reversal" | "fakeout" | "guaranteed";

// 結果レア度ごとの演出重み（各行 合計100）。STEP_2B_IMPL.md §4 準拠。
// fakeout は normal/rare のみ、reversal/guaranteed は super_rare 以上のみ（この表で制約済み）。
export const SCENARIO_WEIGHTS: Record<Rarity, Partial<Record<ScenarioId, number>>> = {
  normal:     { standard: 85, fakeout: 15 },
  rare:       { standard: 85, fakeout: 15 },
  super_rare: { standard: 80, reversal: 12, guaranteed: 8 },
  ultra_rare: { standard: 75, reversal: 15, guaranteed: 10 },
  rainbow:    { standard: 65, reversal: 20, guaranteed: 15 },
  legend:     { standard: 55, reversal: 20, guaranteed: 25 },
  diamond:    { standard: 30, reversal: 15, guaranteed: 55 },
};

// 重み付きでシナリオを選ぶ
export function pickScenario(rarity: Rarity): ScenarioId {
  const weights = SCENARIO_WEIGHTS[rarity];
  const entries = Object.entries(weights) as [ScenarioId, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [id, w] of entries) { roll -= w; if (roll < 0) return id; }
  return "standard";
}

// 前半（machine/capsule）で球が見せる「中身の煽り」
//  auto = 実レア度どおり / tease = 金・虹だらけで煽る / hide = ふつうに見せて隠す
export type BuildupLook = "auto" | "tease" | "hide";
export const SCENARIO_BUILDUP: Record<ScenarioId, BuildupLook> = {
  standard:   "auto",
  reversal:   "hide",   // 高レアなのに地味に見せる（あとで大逆転）
  fakeout:    "tease",  // 低レアなのに派手に煽る（あとで肩透かし）
  guaranteed: "tease",  // 確定の予感をムンムンに
};
```

## 2. 球の中身プリセットの取り出し（重複を作らない）
`GachaMachine.tsx` 内の3プリセット（PRESET_NORMAL / PRESET_RARE / PRESET_GOLD）を **export** するか、
共通の場所に置いて参照できるようにする。BuildupLook → caps配列 を返すヘルパーを用意（場所は実装者判断）：

```ts
// look と level から、球に詰める caps を返す
function capsForLook(look: BuildupLook, level: number): string[] {
  if (look === "tease") return PRESET_GOLD;     // 金・虹だらけ
  if (look === "hide")  return PRESET_NORMAL;   // ふつう
  return presetForLevel(level);                 // auto = 実レア度どおり
}
```

## 3. Gacha.tsx への組み込み
- `GachaScreen` の Props に **`forcedScenario?: ScenarioId`** を追加（テスト用。指定時はそれを使う）。
- `scenario` を state に持つ（`useState<ScenarioId>("standard")` など）。
- `handlePull` の中で、結果レア度から **シナリオを決める**：
  ```ts
  const sc = forcedScenario ?? pickScenario(rarity);
  setScenario(sc);
  ```
  （`forcedScenario` 指定時は重み制約を無視してそのまま使う＝テスト用）
- 前半（machine / capsule）の `GachaMachine` に、シナリオの煽りに応じた **`caps` を渡す**：
  ```ts
  const look = SCENARIO_BUILDUP[scenario];
  // caps={capsForLook(look, visual.level)}
  ```
  → これで standard は今までどおり、fakeout/guaranteed は金虹だらけ、reversal はふつうに見える。
- `reveal` は**このPRでは現状維持**（本物のレア度を表示。派手な結末は §3-4b）。
- タップ進行・文言・スキップ・効果音は維持。

## 4. 演出テスト（TestGacha）でシナリオを選べるように
`src/screens/TestGacha.tsx`
- 既存のレア度選択に加えて、**シナリオ選択**（standard / reversal / fakeout / guaranteed ＋「ランダム」）を追加。
- 選んだシナリオを `GachaScreen` に `forcedScenario` として渡す（「ランダム」のときは未指定＝`pickScenario`に任せる）。
- レイアウトは既存に倣って素朴でよい（ボタン並べる程度）。

---

## 完了条件（AC）
- `gachaScenarios.ts` があり、`pickScenario` が重み表どおりに選ぶ（fakeout は normal/rare のみ、reversal/guaranteed は super_rare 以上のみ）。
- 通常ガチャで、結果レア度に応じてシナリオが選ばれ、**前半の球の見え方が変わる**
  （fakeout/guaranteed＝金虹だらけ、reversal＝ふつう、standard＝実レア度どおり）。
- 演出テストで **シナリオを指定して**各パターンの前半を確認できる。
- `reveal` は本物のレア度を表示（結果と演出の分離が保たれている）。
- タップ進行・スキップ・文言・効果音・通常ガチャが従来どおり（**回帰なし**）。データ付与は1回。
- `npm run build` が通る。

## 触らないこと
- 抽選ロジック（`lib/gacha.ts`）・データ保存・レア度重み・`gachaVisuals.ts`。
- お披露目（reveal/open）の派手な演出（**§3-4b**）。
- マシンSVGの形状・動き（ハンドル回転/落下）の作り。

## メモ
- §3-4a は「前半の煽り」だけなので、reversal（地味→本当は高レア）は、このPR時点では
  「地味に見えたけど結果は高レア」という素直な驚きになる。フラッシュ等の"大逆転感"は §3-4b で足す。
