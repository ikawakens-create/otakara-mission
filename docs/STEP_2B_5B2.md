# STEP_2B_5B2.md — §5b-2 マシンの動き（ハンドル回転＋カプセル落下）

## 目的
静止していた確定マシンに**動き**を付け、2-Bの演出を完成させる。
- ハンドルが回る（handle フェーズ）
- 1個のカプセルが取り出し口へ「コロン」と落ちる（capsule フェーズ）
- （任意）ハンドルが回るとき球のカプセルが軽く揺れる

## 大前提（壊さない）
- 動きは「**SVG内の特定パーツに CSS アニメのクラスを当てる**」方式で足す
  （金キラ・虹回転と同じ仕組み）。アニメの keyframes は `src/styles/gachaMachine.css` に追加する。
- 確定マシンの**形・色・座標は変えない**。
- タップ進行・文言・スキップ・効果音・dryRun（演出テスト）・通常ガチャは**維持**（回帰なし）。

---

## 1. GachaMachine に動き用 props を追加
`src/components/GachaMachine.tsx`

```ts
export interface GachaMachineProps {
  caps?: string[];
  level?: number;
  size?: number;
  className?: string;
  turning?: boolean;                                  // 追加：ハンドルを回す
  dropCapsule?: "normal" | "gold" | "rainbow" | null; // 追加：指定時にそのカプセルを落下表示
  jiggle?: boolean;                                   // 追加(任意)：球のカプセルを軽く揺らす
}
```

### a) ハンドル回転
- マシンの**十字ハンドル部分**（中心 cx=150, cy=286 の縦バー・横バー・中央ハブ）を
  `<g class="...">` でまとめ、`turning` が true のとき回転クラス（例 `handleTurn`）を付ける。
- CSS（gachaMachine.css に追加）例：
  ```css
  .handleTurn { transform-box: fill-box; transform-origin: center; animation: handleSpin .8s ease-in-out 1; }
  @keyframes handleSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
  ```
- ※ 背面の黄色い円盤は回さなくてよい（十字だけ回ればOK）。カチカチ感を出したければ
  `steps()` 等で段階回転にしてもよい（任意）。

### b) カプセル落下（取り出し口へコロン）
- `dropCapsule` が指定されたら、**落下用カプセルを1個**追加で描画し、
  ガラス球の下あたり → **取り出し口（茶色い四角・中心 x≈150, y≈347）** へ落として軽くバウンドさせる。
- カプセルの見た目は種類で出し分け（既存関数を流用）：
  `gold`→`goldCap`、`rainbow`→`rainbowCap`、`normal`→`plainCap`（色は cYellow など代表色でよい）。
- 落下要素は `<g class="capDrop">…</g>` で包み、CSSで移動させる。CSS例（数値は実機で要調整）：
  ```css
  .capDrop { transform-box: fill-box; animation: capDrop 1s ease-in 1 both; }
  @keyframes capDrop {
    0%   { transform: translateY(-150px); opacity: 0; }
    20%  { opacity: 1; }
    75%  { transform: translateY(0); }       /* 取り出し口に到達 */
    88%  { transform: translateY(-10px); }    /* 小さくバウンド */
    100% { transform: translateY(0); }        /* コロンと収まる */
  }
  ```
  - 落下カプセルの初期位置は「取り出し口の少し上」を基準にし、`translateY` で落とすと調整しやすい。
  - **取り出し口にきちんと収まって見える**ことがゴール（細かいpx値はビルドして見ながら調整可）。

### c) （任意）球のカプセル揺れ
- `jiggle` が true のとき、球の中身グループ（`<g clip-path="url(#ball)">`）に軽い揺れクラスを当てる。
  - 余裕があれば。難しければ省略可（必須ではない）。

---

## 2. Gacha.tsx の組み込み（マシンを通しで表示）
今は machine / handle フェーズで **別々に** GachaMachine を描いている。これだと切替時にマシンが
一瞬リセットされる。**machine・handle・capsule の3フェーズは1つの GachaMachine を出し続け、
props だけ変える**形にする（チラつき防止・動きが自然に繋がる）。

- `silhouette`：現状維持（❓シルエット）。
- `machine` / `handle` / `capsule`：**共通の GachaMachine を1つ**描画し、props を phase で変える：
  - `turning = (animPhase === "handle")`
  - `dropCapsule = (animPhase === "capsule") ? visual.capsule : null`
  - `level = visual.level`
  - （任意）`jiggle = (animPhase === "handle")`
  - 文言（sceneHint）は従来どおり phase ごとに表示。
  - capsule フェーズの旧・仮カプセル（`capsuleFall` の平らな四角）は GachaMachine の落下表示に置き換える。
- `open` / `reveal`：現状維持（カプセル開封→景品お披露目）。
- `visual.capsule` は `RARITY_VISUALS[result.rarity].capsule` を使う。

> 実装メモ：3フェーズで同じ要素として扱われるよう、条件分岐の作りに注意
> （machine/handle/capsule を1つの分岐にまとめ、中で props を出し分けると良い）。

---

## 完了条件（AC）
- handle フェーズで**ハンドルが回る**。
- capsule フェーズで**カプセルが1個、取り出し口へ落ちて軽くバウンド**する。
- 落下カプセルの種類が結果レア度に対応（gold/rainbow/normal）。
- machine→handle→capsule の間、マシンが**チラつかず通しで**表示される。
- タップ進行・文言・「とばす」・効果音・**演出テスト(dryRun)**・通常ガチャが従来どおり（**回帰なし**）。
- 金キラ・虹回転など §5b-1 の見た目が引き続き正しく動く。
- 確定マシンの形・色・座標を変えていない。
- `npm run build` が通る。

## 触らないこと
- 抽選ロジック・データ保存・レア度重み・`gachaVisuals.ts`。
- `open`/`reveal` の作り込み（このPRの対象外）。

## このPRで 2-B の §5 が完成
§5b-2 がマージできたら、ガチャの「見た目＋タップ進行＋動き」が一通り完成。
残るは §3〜§4（4つの演出パターンを重み付きで出し分け）＝2-B の演出バリエーション。
