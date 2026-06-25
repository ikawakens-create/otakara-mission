# STEP_2B_CUTIN.md — カットイン段階システム＋大当たりフラッシュのド派手化

## 目的
カットインに「煽りの段階」を作り、毎回ちがう声がかかるライブ感を出す。
あわせて大逆転/確定のお披露目フラッシュをド派手にする。結果（レア度・景品）は一切変えない（演出だけ）。

## 子ども向けの絶対ルール（honesty）
- **強いカットインは必ず良い結果に繋げる**（嘘をつかない）。
  → 段階は**結果レア度に応じて**出す。低い結果に「激アツ」「かくてい」は出さない。
- **ガセ（fakeout）にはカットインを出さない**（静かに肩透かし）。
- **大逆転（reversal）は「もしかして？？」まで**（隠してドーンの驚きを守る）。
- 「かくてい！！」は最高レア（diamond）だけ＝**ぜったい金（ゴージャス）**。

---

## 1. カットインのデータ（gachaScenarios.ts に追加 or 新規 gachaCutin.ts）
```ts
import type { Rarity } from "../types";

export type CutinLevel = "none" | "oh" | "maybe" | "hot" | "confirmed";

export const CUTIN_TEXT: Record<CutinLevel, string> = {
  none:      "",
  oh:        "お！",
  maybe:     "もしかして？？",
  hot:       "激アツ！！",
  confirmed: "かくてい！！",
};

// 結果レア度ごとの段階の重み（各行 合計100）。高い段階は高レアだけ＝嘘にならない。
export const CUTIN_WEIGHTS: Record<Rarity, Partial<Record<CutinLevel, number>>> = {
  normal:     { none: 100 },
  rare:       { none: 80, oh: 20 },
  super_rare: { none: 30, oh: 50, maybe: 20 },
  ultra_rare: { none: 20, oh: 35, maybe: 35, hot: 10 },
  rainbow:    { none: 10, oh: 25, maybe: 35, hot: 30 },
  legend:     { none: 5,  oh: 15, maybe: 30, hot: 50 },
  diamond:    { confirmed: 100 },  // ダイヤは必ず「かくてい！！」
};

// シナリオ制約を反映してカットイン段階を決める
export function pickCutin(rarity: Rarity, scenario: ScenarioId): CutinLevel {
  if (scenario === "fakeout") return "none";              // ガセは出さない
  const w = CUTIN_WEIGHTS[rarity];
  const entries = Object.entries(w) as [CutinLevel, number][];
  const total = entries.reduce((s, [, n]) => s + n, 0);
  let roll = Math.random() * total;
  let level: CutinLevel = "none";
  for (const [lv, n] of entries) { roll -= n; if (roll < 0) { level = lv; break; } }
  if (scenario === "reversal") {                          // 大逆転は「もしかして」まで
    if (level === "hot" || level === "confirmed") level = "maybe";
  }
  return level;
}
```
> 重みは後から data で調整可。狙いの体感：なし約69 / お15 / もしかして10 / 激アツ5 / かくてい1。

## 2. Gacha.tsx：カットインを「ハンドルを回そう」タップ直後に出す
- `GachaScreen` の Props に **`forcedCutin?: CutinLevel`**（テスト用）を追加。
- `cutin` を state に持つ。`handlePull` 内で：
  ```ts
  const cut = forcedCutin ?? pickCutin(rarity, sc);   // sc は決定済みの scenario
  setCutin(cut);
  ```
- **capsule フェーズ**（machine/capsule 共通ブロック内）で、`cutin !== "none"` のとき
  段階に応じたカットイン帯を表示する（capsule に入った直後＝ハンドルを回す直後）。
  - スライドイン→ホールド→フェードアウトで **約1.2〜1.5秒**。**落下カプセルを隠さない**位置に。
  - 段階ごとにクラスを変える（下記CSS）。テキストは `CUTIN_TEXT[cutin]`。
- これまでの **reveal時の「✨かくてい！✨」(revealCutin) は廃止**（カットインは前半のこの仕組みに一本化）。
- `SCENARIO_REVEAL` の **guaranteed を "cutin" → "burst"** に変更（確定のお披露目は大フラッシュで祝う）。
  `revealCutinPrize` の付与も不要に。

## 3. カットインの見た目（段階でどんどん激しく・ゴージャスに）
`Gacha.module.css` に段階別クラス（数値は実機調整可）。**枠も色も段階で派手にエスカレート**：
- `.cutinOh`（お！）：落ち着いた**青〜水色**、小さめ、控えめなスライドイン。
- `.cutinMaybe`（もしかして？？）：**紫系**、少し大きく、ぷるぷる揺れ。
- `.cutinHot`（激アツ！！）：**赤〜オレンジ（炎グラデ）**、大きく、**激しいシェイク**＋ギザギザ/斜め枠。
- `.cutinConfirmed`（かくてい！！）：**金（メタリックゴールドのグラデ）＋虹のキラキラ**、**最大・最ゴージャス**、
  ドーンと拡大して光る。**色は必ず金基調**。

## 4. 大当たりフラッシュをド派手に（reversal/guaranteed の reveal、effect==="burst"）
`Gacha.module.css` の `revealFlash` / `revealBurst` を強化（要素を重ねる）：
1. **全画面ホワイトアウト**：一瞬で真っ白→晴れる＋**2回ピカッ**。例：
   `@keyframes flashFade { 0%{opacity:0} 6%{opacity:1} 22%{opacity:.15} 38%{opacity:.9} 100%{opacity:0} }`、
   duration 0.9s 程度。白基調に少し金/虹を混ぜてもよい。
2. **集中線/閃光**：景品の後ろに放射状の光を1枚（reveal かつ burst のときだけ）。
   `repeating-conic-gradient` のくさび円を scale(0.3→1.6)＋ゆっくり回転＋フェード。
3. **キラキラ弾け**：星をいくつか外側へ飛ばす（translate＋fade、ディレイ違い）。CSSのみ。
4. **景品の登場(revealBurst)を大きく**：scale のオーバーシュートを 1.5 前後まで、軽い wobble。
- standard / fakeout の reveal は**今のまま**（派手にしない）。

## 5. テスト（TestGacha）
- レア度・シナリオ選択に加えて、**カットイン選択**（なし/お/もしかして/激アツ/かくてい＋ランダム）を追加し、
  `forcedCutin` として渡す（「ランダム」は未指定＝`pickCutin` に任せる）。
- 各段階のカットインと、大当たりフラッシュを狙って確認できるようにする。

---

## 完了条件（AC）
- カットインが「ハンドルを回そう」タップ直後に、段階に応じて出る（なし/お/もしかして/激アツ/かくてい）。
- 段階が上がるほど枠・色が派手になり、**かくてい！！は金でゴージャス**。
- **ガセはカットイン無し**、**大逆転は「もしかして？？」まで**、**かくてい！！はダイヤのみ**。
- カットインが落下カプセルを隠さない（1.2〜1.5秒で消える）。
- 大逆転/確定のお披露目フラッシュが前より**ド派手**（ホワイトアウト＋集中線＋キラキラ）。standard/fakeout は不変。
- 旧 reveal時カットイン(✨かくてい！✨)は廃止され、二重に出ない。
- 演出テストでレア度×シナリオ×カットインを指定して各演出を確認できる。
- 結果（レア度・景品）は不変。タップ進行・スキップ・効果音・通常ガチャが従来どおり（回帰なし）。
- `npm run build` が通る。

## 触らないこと
- 抽選ロジック・データ保存・レア度重み・gachaVisuals・結果画面・マシンSVGの形状/動き。
- §3-4c の激アツ（出てこない→もう1回→確定）。

## メモ
- 長くなりそうなら、動く単位で**早めにコミット＆プッシュ**すること（リミットで消えないように）。
