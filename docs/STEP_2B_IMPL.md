# STEP_2B_IMPL.md — ガチャ期待度演出（2-B）実装指示書【確定版・修正済み】

前セッションの仕様（STEP_2_GACHA_SPEC.md）と実コード（gacha.ts / lib/gacha.ts）を突き合わせ、
未確定だった数値・対応・文言を確定した、Claude Code 向けの実装指示書。

参照：docs/STEP_2_GACHA_SPEC.md（演出の全体方針）／docs/GACHA_VISUAL.md（確定マシンSVG）／
docs/DATA_MODEL.md §2.4（抽選）。本書はそれらの上に乗る「2-B実装の確定値」を定める。

> **【2026-06 修正メモ】** 実リポジトリ（main）と突き合わせて以下を修正：
> - **§0・§2**：`src/data/gachaVisuals.ts` は2-Aで**すでに作成済み**だったため、「新規作成」→
>   「**既存ファイルの修正**」に変更。既存は `capsuleColor`（ただのCSS色）を持つが、確定マシンSVG
>   （GACHA_VISUAL.md）の金/虹/通常の描き分けに接続できないため、`capsule`（"normal"|"gold"|"rainbow"）
>   種別に**置き換える**。
> - 他章（§1・§3〜§9）は実コードと突き合わせ済みで内容変更なし（§1の重み修正は実コードと一致を確認）。

---

## 0. このステップでやること（順序）

1. **2-Aで作成済みの `src/data/gachaVisuals.ts` を修正**（`capsuleColor` → `capsule` 種別へ。下記§2）。
2. レア度重みを **合計100に修正**（下記§1）。
3. **タップで進む演出フロー＋スキップ** を実装（下記§5）。
4. **`src/data/gachaScenarios.ts`＋`lib/gachaPlayer.ts`** で4演出パターンを重み付き再生（下記§3〜§4）。
5. 確定マシンSVG（GACHA_VISUAL.md）を演出に組み込み、動き（ハンドル回転→カプセル揺れ→落下）を付ける。

結果と演出の分離（押下時に結果確定・演出は結果を変えない）を厳守。数値・文言は全て定数/データ化。

---

## 1. レア度重みの修正（確定）

`src/data/gacha.ts` の `GACHA_RARITY_WEIGHTS` を合計100に直す。**normal を 40→41**。
（現状は normal:40 で合計99。下記に直す。）

```ts
export const GACHA_RARITY_WEIGHTS: Record<Rarity, number> = {
  normal:     41,  // ← 40から変更（合計を100に）
  rare:       25,
  super_rare: 15,
  ultra_rare: 10,
  rainbow:     5,
  legend:      3,
  diamond:     1,
};
```
（合計 41+25+15+10+5+3+1 = 100）

---

## 2. gachaVisuals.ts（既存ファイルの修正・確定）

> ⚠️ **このファイルは新規作成ではない。** 2-Aで `src/data/gachaVisuals.ts` が既に存在する。
> 既存は `RarityVisual.capsuleColor: string`（"#aaaaaa" などのCSS色）を持つが、これは確定マシンSVG
> （GACHA_VISUAL.md の goldCap / rainbowCap / plainCap）の描き分けに接続できない。
> よって **`capsuleColor` を廃止し、`capsule: "normal" | "gold" | "rainbow"` に置き換える。**

レア度7段階 × カプセル色3種（通常/金/虹）の対応を**確定**：通常/通常/通常/金/金/虹/虹。
`capsule` の値は GACHA_VISUAL.md の fill 種別に対応（gold→cGold、rainbow→cRainbow、normal→通常色）。

```ts
import type { Rarity } from "../types";

export interface RarityVisual {
  label:     string;                            // 表示用レア度名（ひらがな中心・子ども向け）
  capsule:   "normal" | "gold" | "rainbow";     // カプセル見た目（GACHA_VISUALの色種に対応）
  glowColor: string;                            // グロー色（CSS）
  level:     number;                            // 0〜6 演出強度（フィニッシュの派手さ段数）
}

export const RARITY_VISUALS: Record<Rarity, RarityVisual> = {
  normal:     { label: "ノーマル",     capsule: "normal",  glowColor: "#ffd0e0", level: 0 },
  rare:       { label: "レア",         capsule: "normal",  glowColor: "#bfe3ff", level: 1 },
  super_rare: { label: "スーパーレア", capsule: "normal",  glowColor: "#c7b8ff", level: 2 },
  ultra_rare: { label: "げきレア",     capsule: "gold",    glowColor: "#ffe08a", level: 3 },
  rainbow:    { label: "にじいろ",     capsule: "gold",    glowColor: "#ffd24a", level: 4 },
  legend:     { label: "超超超レア",   capsule: "rainbow", glowColor: "#b6f0ff", level: 5 },
  diamond:    { label: "ダイヤモンド", capsule: "rainbow", glowColor: "#ffffff", level: 6 },
};
```

**修正の手順（Claude Code向け）**
- 既存 `interface RarityVisual` の `capsuleColor: string` を削除し、`capsule: "normal" | "gold" | "rainbow"` を追加。
- `RARITY_VISUALS` を上記の確定テーブルに更新（label/glowColor/level 含め置き換え）。
  - ※既存ファイルの label は絵文字付き（例「激レア 🌟」）だったが、子ども向け（ひらがな中心・CLAUDE.md §4）に合わせて
    上記の確定 label に置き換える。label・glowColor は **データなので後から自由に調整可**。
- **既存コードで `capsuleColor` や旧 `RARITY_VISUALS` を参照している箇所があれば、`capsule` を使う形に修正**
  （`grep -rn capsuleColor src/` 等で確認してから直す）。型エラーが残らないこと。

> 注：カプセル色は3段階（通常/金/虹）だが、フィニッシュ演出の派手さは level 0〜6 で7段階に細かく差をつける。
> 「中身でレア度を煽る」球プリセット（通常色のみ／金おおめ／虹だらけ）も、結果の capsule 種に応じて選ぶ。

---

## 3. 4つの演出パターン（確定方針）

すべて「結果は確定済み、見せ方だけ」。詳細は STEP_2_GACHA_SPEC.md §3 と同じ。

- **王道 standard**：結果レア度どおりの派手さ（低レア=あっさり／高レア=最初から金・虹で派手）。
- **隠して大逆転 reversal**：高レア結果限定。地味な入り→終盤で虹・フラッシュ・ファンファーレ。
- **ガセ fakeout**：低レア結果限定。途中まで虹っぽく煽る→控えめ結果（軽い肩透かし）。低頻度。
- **確定演出 guaranteed**：高レア結果限定。特別カットイン→高レア確定の合図。ダイヤは原則これ。

---

## 4. 演出の選び方（重み・確定）

結果レア度ごとの演出重み（合計100）。`gachaScenarios.ts` に定数として持ち、後から調整可能に。

| 結果レア度 | 王道 | 隠して大逆転 | ガセ | 確定演出 |
|---|---|---|---|---|
| normal     | 85 | 0  | 15 | 0  |
| rare       | 85 | 0  | 15 | 0  |
| super_rare | 80 | 12 | 0  | 8  |
| ultra_rare | 75 | 15 | 0  | 10 |
| rainbow    | 65 | 20 | 0  | 15 |
| legend     | 55 | 20 | 0  | 25 |
| diamond    | 30 | 15 | 0  | 55 |

ルール（守ること）：
- **ガセは normal / rare 限定**（高レアでガセはやらない）。
- **大逆転・確定演出は super_rare 以上限定**（低レアでは出さない）。
- diamond は確定演出比率を最大に。

---

## 5. タップで進む演出フロー＋文言（確定）

勝手に進めず、子どもがタップで一手ずつ進める。各停止に短い一言（ひらがな・大きめ）。

| # | シーン | 動き | 文言 |
|---|---|---|---|
| 1 | 引くボタン | 「ガチャをひく！」ボタン（ぷるぷる） | ガチャを ひく！ |
| 2 | シルエット | 影で登場・中身の色チラ見え | ？ なにが でるかな？ |
| 3 | マシン登場 | マシン出現・ハンドル強調 | ハンドルを まわそう！ |
| 4 | 演出ゾーン | ハンドル回転→カプセル揺れ→1個落下。煽り挿入 | （演出可変。リーチ時「あれ…？」） |
| 5 | カプセル | 取り出し口にコロン・ぷるぷる | あけてみよう！ |
| 6 | お披露目 | カプセル開く→景品ドーン＋レア度フィニッシュ | やったー！ ／ <prizeName> ゲット！ |

- 各停止は**タップ**で次へ。タップ自体を煽りトリガーに（タップで色が変わる等）。
- **スキップボタン常時表示**（即お披露目へ）。文言・各シーンは定数化。
- `<prizeName>` は GachaResult.prizeName を使用。

---

## 6. 実装の接続（既存コードとの関係）

- 抽選は既存 `lib/gacha.ts` の `drawRarity()`→`drawPrize()` をそのまま使用（結果確定）。
- 演出側は `GachaResult.rarity` を受け取り、§2の RARITY_VISUALS と §4の重みでシナリオ選択。
- `lib/gachaPlayer.ts`（新規）：シナリオ（フェーズ配列）を順に再生する汎用エンジン。個別演出をハードコードしない。
- `gachaScenarios.ts`（新規）：GachaScenarioDef（id / rarities / weight / phases）を定義。
- 状態更新は既存 `applyGachaResult()` を演出完了後（またはスキップ時）に呼ぶ。二重付与しない。
- マシン描画は GACHA_VISUAL.md のSVGをコンポーネント化して使用（§5のPRで組み込み）。

---

## 7. 完了条件（AC・2-B）

- gachaVisuals.ts が修正され、レア度7段階のカプセル種別（通常/通常/通常/金/金/虹/虹＝`capsule`）とlevelが定義されている。
  旧 `capsuleColor` への参照が残っていない（型エラーなし）。
- レア度重みが合計100（normal 41）。
- 各シーンがタップで進み、各停止に文言が出る。スキップで即お披露目へ飛べる。
- 結果は押下時確定、演出はそれを変えない（分離維持）。
- 結果レア度に応じて§4の重みで演出が選ばれ、毎回同じにならない。
- ガセは normal/rare 限定、大逆転・確定演出は super_rare 以上限定。
- diamond は専用フィニッシュ。
- 演出シナリオ・重み・文言・カプセル対応がデータ定義で、追加・変更がコード変更なしで済む。
- 演出長：通常5〜7秒・大当たり8〜10秒。スキップ可能。

---

## 8. 進め方

1. §1（重み100化）と §2（gachaVisuals.ts 修正）を先に。小さいのでまとめて1PR可。
2. §5（タップ進行＋スキップ）を実装し、確定マシンSVGを組み込んで動きを付ける（1PR）。
3. §3〜§4（4演出＋重み抽選）を gachaScenarios.ts＋gachaPlayer.ts で実装（1PR）。
4. 各PRでAC確認 → マージ → 実機（娘さんの端末）で反応を見る。
5. 反応を見て重み・文言・演出の派手さを調整（すべて定数なのでdata変更だけ）。

---

## 9. 画像の渡し方メモ（チャット運用）

- 画像は present_files で1枚ずつ渡すと確実に見える（複数枚・インラインは表示されないことがある）。

---

## 10. 未保存だったファイルのメモ（重要・将来の自分へ）

本書（STEP_2B_IMPL.md）と GACHA_VISUAL.md は、一時 main リポジトリに未コミットだった。
2-Bの最初のPRで **本書を docs/ にコミット**して迷子防止する。GACHA_VISUAL.md は §5（マシン組み込み）の
PRで docs/ に追加する（その時 SVG をコンポーネント化するため）。
