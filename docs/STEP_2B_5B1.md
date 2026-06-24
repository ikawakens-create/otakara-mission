# STEP_2B_5B1.md — §5b-1 確定マシンSVGの組み込み（静止版）

## 目的
ガチャ演出の🎰絵文字（仮置き）を、**確定マシン（GACHA_VISUAL.md のSVG）**に置き換える。
このPRのゴールは「**本物のマシンが正しく表示される**」こと。静止でOK。
ハンドル回転・カプセル落下などの**動きは §5b-2** で付ける（このPRではやらない）。

## 前提：確定SVGをリポジトリに入れる
- 添付の **`GACHA_VISUAL.md` を `docs/GACHA_VISUAL.md` として追加**する（このPRに含める）。
  これは「マシンの確定デザイン（SVG＋CSS一式）」。コンポーネント化の元ネタになる。

---

## 作るもの：GachaMachine コンポーネント
`src/components/GachaMachine.tsx`（＋ `src/styles/gachaMachine.css` などスタイル）

- `docs/GACHA_VISUAL.md` の SVG を **React コンポーネントに移植**する。
- **最重要：確定デザインを忠実に再現すること**。次を勝手に変えない（再設計しない）：
  - マシンの形・色・座標、グラデ定義（`defs`）。
  - ガラス球内のカプセル**六角格子配置**（`fillCaps` / `BX,BY,BR`）。
  - **金**カプセル（メタリック＋キラキラ星＋反射スイープ）。
  - **虹**カプセル（7色コニカル＋ゆっくり回転）。
  - 星の飾り・十字ハンドル・取り出し口など各パーツ。

### CSSアニメ（金のキラ／反射、虹の回転）の扱い
- 金・虹のアニメは元コードで SVG 内の **class（"rbrot" "tw" "tw2" "sweep" 等）** を参照している。
- **CSS Modules はクラス名をハッシュ化して一致しなくなる**ので注意。
  これらの keyframes とクラスは **グローバルCSS**（例 `src/styles/gachaMachine.css` を
  `GachaMachine.tsx` で `import`）に置くか、クラス名が一致する形で実装する。
- **見た目が GACHA_VISUAL.md と一致すれば、移植の手法（JSX化／dangerouslySetInnerHTML 等）は問わない。**
  - 補足：`rainbowCap` / `goldCap` 等が SVG 文字列を返す作りなので、
    それらを使って内側SVGを生成し描画する方法でもよい（確定の見た目を保つことを優先）。

### Props（最小）
```ts
interface GachaMachineProps {
  caps?: string[];      // 球に詰めるカプセル色配列（COLORS相当）。省略時「つうじょう」
  size?: number;        // 表示サイズ（省略時は適当な既定値、例 260）
  className?: string;
}
```

### 中身プリセット（レア度で簡易出し分け）
GACHA_VISUAL.md の例に従い3プリセットを用意（本コンポーネント内の定数でよい）：
- つうじょう： `['cYellow','cGreen','cBlue','cPink']`
- レアおおめ： `['cYellow','cGold','cBlue','cRainbow','cPink','cGreen','cGold','cRainbow']`
- きん＆にじ だらけ： `['cGold','cRainbow','cGold','cRainbow','cGold']`

このPRでは「結果レア度 → プリセット」の**簡易対応**でよい（例：`level 0–2 = つうじょう / 3–4 = レアおおめ / 5–6 = だらけ`）。
※ 本格的な「中身でレア度を煽る」出し分けは §3–4 で行う。

---

## Gacha.tsx への組み込み（静止）
- **`machine` フェーズ**と **`handle` フェーズ**の🎰（`machineAppear` / `handleRow`）を **GachaMachine に差し替える**
  （このPRでは静止表示。ハンドルはまだ回さなくてよい）。
- `silhouette` フェーズは既存の❓シルエットのままでよい（無理に差し替えない）。
- `capsule` / `open` / `reveal` フェーズは**このPRでは現状維持**でよい
  （カプセル落下や開封の作り込みは §5b-2／既存のままでも可）。
- カプセルのプリセットは `result.rarity` の `level`（`RARITY_VISUALS`）から簡易対応で選ぶ。
- **タップ進行・各文言・「とばす」・効果音・dryRun（演出テスト）は維持**（回帰なし）。

---

## 完了条件（AC）
- `docs/GACHA_VISUAL.md` がリポジトリにある。
- `src/components/GachaMachine.tsx` があり、**`machine`/`handle` フェーズで確定マシンが表示**される。
- **金カプセルはキラキラ＋反射、虹カプセルは回転**して見える（CSSアニメが効いている）。
- 見た目が `docs/GACHA_VISUAL.md` と**一致**（形・色・配置を変えていない）。
- 結果レア度に応じて球の中身プリセットが変わる（簡易対応でよい）。
- タップ進行・スキップ・文言・効果音・**演出テスト(dryRun)**・通常ガチャが従来どおり（**回帰なし**）。
- `npm run build` が通る。

## 触らないこと
- 抽選ロジック（`lib/gacha.ts`）・データ保存・レア度重み・`gachaVisuals.ts` の `capsule`/`level` 定義。
- **ハンドル回転・カプセル落下・揺れの動き（§5b-2）**。
