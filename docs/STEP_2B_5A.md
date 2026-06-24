# STEP_2B_5A.md — §5a タップで進める演出＋文言＋スキップ

## 目的
今のガチャ演出は**時間で自動的に進む**作り。これを「**タップで一手ずつ進む**」に変える。
各停止に短い文言を出し、スキップは残す。
※ 確定マシンSVGの組み込みと本格的な動き（ハンドル回転・カプセル落下）は **§5b** で行う。
　§5aは「進行方式（タップ化）」と「文言」だけに集中する。

## 対象ファイル
- `src/screens/Gacha.tsx`（主）
- 必要なら `src/screens/Gacha.module.css`（タップ誘導ヒントの軽いスタイル追加のみ）

## 現状（変更前の作り）
- `renderAnim()` のシーン全体ラッパー `<div className={styles.sceneWrap} onClick={skipToResult}>` に
  なっており、**画面のどこを触ってもスキップ**してしまう。
- フェーズ進行は `useEffect` 内の `setTimeout(getPhaseDuration(...))` で**自動**。
- フェーズ：`silhouette → machine → handle → capsule → open → reveal →（result）`。
- 各フェーズに既に簡単な文言（sceneHint）あり。効果音はタイマーuseEffect内で再生。

---

## 変更内容

### 1. 自動進行 → タップ進行
- **タイマー進行の `useEffect`（`setTimeout` でフェーズを進めている箇所）を削除**する。
- 代わりに `advancePhase()` を追加：
  - `animPhase` を `ANIM_PHASES` の次へ進める。
  - 最後（`reveal`）で次に進んだら `screenPhase` を `"result"` にする。
- シーンのラッパー `<div className={styles.sceneWrap} ...>` の `onClick` を
  **`skipToResult` → `advancePhase` に変更**（＝画面タップで「次の一手」へ）。
  - `role="button"` の `aria-label` は `"つぎへ"` に変更。

### 2. 効果音は「そのフェーズに入った時」に鳴らす
- 今はタイマーuseEffect内で鳴らしている。これを **`advancePhase` の中**（入るフェーズに応じて）へ移す：
  - `machine` に入る → `soundMachine()`
  - `capsule` に入る → `soundCapsule()`
  - `reveal` に入る → `soundReveal(level)`（level は `RARITY_VISUALS[result.rarity].level`）
- 最初の `silhouette` は `handlePull` 内の `soundPull()` のままでよい。

### 3. タップ誘導ヒントを出す
- 演出中、画面に「**タップで つぎへ ▶**」を常時表示（子ども向けに大きめ・軽くぷるぷる程度）。
- 最後の `reveal` では「**タップで けっかを みる ▶**」など文言を変えてもよい。
- スキップ用の「**とばす ▶**」ボタンは**そのまま残す**
  （`onClick={skipToResult}` と `e.stopPropagation()` を維持。タップ進行と区別する）。

### 4. 各停止の文言を確定版に更新（STEP_2B_IMPL.md §5）
文言は定数にまとめる（例：`const PHASE_PROMPT: Record<AnimPhase, string>`）。

| フェーズ | 文言 |
|---|---|
| silhouette | ？ なにが でるかな？ |
| machine | ハンドルを まわそう！ |
| handle | ぐるぐる…！ |
| capsule | あけてみよう！ |
| open | ぱかっ…！ |
| reveal | やったー！（レア度ラベルは現状どおり別途表示） |

※ `handle` の「ぐるぐる…！」やリーチ時の「あれ…？」等は、§3〜§4（演出パターン）で差し替え予定。

### 5. 使わなくなったコードを片付ける（ビルドを通すため）
- `getPhaseDuration`、タイマー用 `useEffect`、`timerRef` / `clearTimer` が不要になれば**削除**する。
- `skipToResult` が `clearTimer` に依存していた場合は依存を外す（タイマーが無いので単に `setScreenPhase("result")`）。
- 未使用の変数・import を残さない（`tsc` が通ること）。

---

## 完了条件（AC）
- 演出が**自動で進まず、画面タップで1手ずつ**進む。
- 各停止に上記の文言が出る。「タップで つぎへ」の誘導が見える。
- 「とばす ▶」で即お披露目（result）へ飛べる。
- 効果音が各フェーズで鳴る（machine / capsule / reveal）。
- **演出テスト（dryRun）でも**タップ進行・スキップが同じく動き、「もう1回みる」も従来どおり。
- 通常ガチャ（Home から complete / recovery / ticket）も同じ進行で動く（**回帰なし**）。景品付与は従来どおり1回。
- `npm run build` が通る。

## 触らないこと
- 抽選ロジック（`lib/gacha.ts`）・データ保存・レア度重み・`gachaVisuals.ts` は変更しない。
- マシンSVGの組み込み／ハンドル回転・カプセル落下の作り込みは **§5b**（このPRではやらない）。
