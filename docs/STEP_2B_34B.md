# STEP_2B_34B.md — §3-4b 落下カプセルの隠す/煽る＋お披露目のシナリオ別演出

## 目的
§3-4a で「前半（球の中身）」をシナリオで出し分けたので、§3-4b では：
1. **落下カプセルもシナリオに合わせて隠す/煽る**（必須）。結果を最後までバラさない。
2. **お披露目（reveal）にシナリオ別の演出**を付ける（大逆転フラッシュ／ガセ肩透かし／確定カットイン）。

これで「前半～結末」まで一貫してドキドキの振れ幅が出る。結果（レア度・景品）は一切変えない（演出だけ）。
※ 「出てこない→もう1回→確定」の激アツ専用ビートは **§3-4c**（このPRではやらない）。

## 子ども向けの大事な約束
- **ガセ（肩透かし）はやさしく**。ガッカリ感を強く出さない。結果は normal/rare だが、
  「ふつう…でも かわいい！」のように**前向きな一言**にする。悲しい/否定的な表現は使わない。

---

## 1. gachaScenarios.ts に追加
`src/data/gachaScenarios.ts`

```ts
// 落下カプセルの見た目（演出に合わせて隠す/煽る）
//  hide → ふつうに見せる / tease → 派手に見せる / auto → 本物のカプセル
export function dropLookForScenario(
  scenario: ScenarioId,
  trueCapsule: "normal" | "gold" | "rainbow",
): "normal" | "gold" | "rainbow" {
  const look = SCENARIO_BUILDUP[scenario];
  if (look === "hide") return "normal";
  if (look === "tease") return "rainbow"; // 派手に煽る
  return trueCapsule;                      // auto = 本物
}

// お披露目の演出タイプ
export type RevealEffect = "normal" | "burst" | "cutin" | "soft";
export const SCENARIO_REVEAL: Record<ScenarioId, RevealEffect> = {
  standard:   "normal",
  reversal:   "burst",  // 隠してたのでフラッシュで大逆転
  fakeout:    "soft",   // 煽ったのでやさしく肩透かし
  guaranteed: "cutin",  // 「かくてい！」カットイン
};

// お披露目の一言（やさしく前向きに）
export const SCENARIO_REVEAL_TEXT: Record<ScenarioId, string> = {
  standard:   "やったー！",
  reversal:   "うわぁ…！ やったー！",
  fakeout:    "ふつう…でも かわいい！",
  guaranteed: "かくてい〜！ やったー！",
};
```

## 2. Gacha.tsx：落下カプセルを隠す/煽る
- capsule フェーズの `dropCapsule` を、**本物のレア度ではなくシナリオに合わせる**：
  ```ts
  dropCapsule={animPhase === "capsule"
    ? dropLookForScenario(scenario, visual.capsule)
    : null}
  ```
  → reversal は普通のカプセルが落ちて見え、fakeout/guaranteed は派手なカプセルが落ちて見える。
  → 本物のレア度は **reveal で初めて分かる**（結果と演出の分離を最後まで維持）。

## 3. Gacha.tsx：お披露目にシナリオ別演出
- reveal フェーズで `effect = SCENARIO_REVEAL[scenario]` を取り、見せ方を変える：
  - **burst（reversal）**：景品が出る瞬間に**フラッシュ＋キラキラ弾ける**演出（明るく祝う）。
  - **cutin（guaranteed）**：先に「**✨ かくてい！✨**」の帯が出てから景品お披露目。
  - **soft（fakeout）**：派手な演出なし。控えめなグロー＋やさしい雰囲気。
  - **normal（standard）**：現状どおり（level に応じたグロー）。
- reveal の一言（sceneHint）は `PHASE_PROMPT.reveal` の代わりに **`SCENARIO_REVEAL_TEXT[scenario]`** を使う。
- 景品・レア度ラベルは**本物**を表示（reveal で真実が出る）。
- 演出は CSS で作る（紙吹雪ライブラリは入れない）。クラスは `Gacha.module.css` に追加してよい
  （これらは SVG の外＝Reactの要素に当てるので CSS Modules でOK）。
  - 例：`.revealBurst`（フラッシュ＋拡大）、`.revealCutin`（帯のスライドイン）、`.revealSoft`（控えめ）。
- 効果音 `soundReveal(level)` は維持。必要なら burst/cutin のとき少し強め…等の調整は任意。

## 4. テスト
- TestGacha は §3-4a で**シナリオ指定済み**なので追加変更は不要。
  各シナリオを選んで、前半の煽り → 落下カプセル → お披露目までが一貫するか確認する。

---

## 完了条件（AC）
- **落下カプセル**がシナリオに合う（reversal=ふつう／fakeout・guaranteed=派手／standard=本物）。
  reveal まで本物のレア度が分からない（隠す/煽るが効いている）。
- **お披露目**がシナリオ別に変わる：
  - reversal＝フラッシュで大逆転感、guaranteed＝「かくてい！」カットイン、
    fakeout＝やさしい肩透かし、standard＝従来どおり。
- reveal の一言がシナリオ別になる（ガセはやさしい前向きな文言）。
- 結果（レア度・景品・かけら）は変わっていない（演出だけ）。
- 演出テストで各シナリオの前半～結末が一貫して確認できる。
- タップ進行・スキップ・効果音・通常ガチャが従来どおり（**回帰なし**）。
- `npm run build` が通る。

## 触らないこと
- 抽選ロジック・データ保存・レア度重み・`gachaVisuals.ts`。
- 結果画面（renderResult の景品名・ダブり・ポイント表示）の中身。
- マシンSVGの形状・動き、§3-4c の激アツ（出てこない→もう1回→確定）。
