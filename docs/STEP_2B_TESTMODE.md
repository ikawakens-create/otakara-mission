# STEP_2B_TESTMODE.md — 演出プレビュー（開発テストモード）実装指示書

## 目的
ガチャ演出（2-B）は **1日1回しか引けない** ため、見た目の調整が事実上テストできない。
そこで「**演出を何度でも再生できるプレビュー**」を、本物のデータに一切触れずに用意する。
§5以降の演出開発でも、この道具を使って各レア度・各パターンを繰り返し確認する。

## 絶対に守ること（データ不変条件・CLAUDE.md §5）
- プレビューでは **`applyGachaResult` / `onSave` を絶対に呼ばない**。
  → `gachaPulledDate`（1日1回）・ポイント・かけら・所持アイテム・記録が **一切変化しないこと**。
- 既存の通常ガチャ（Home からの導線）は **今までどおり動く**こと（回帰なし）。
- 演出の見た目・コードは **1か所（GachaScreen）を共有**し、重複実装しない
  （§5で演出を強化したら、プレビューにも自動で反映される状態を保つ）。

## 入り口
- **おうちの人モード（ParentSettings, PIN保護済み）に「🎬 演出をテスト」ボタンを追加**する。
  PIN保護下なので娘さんは触れない。デプロイ後の実機（タブレット）からも到達できる。
- `App.tsx` の `Screen` 型に `"testGacha"` を追加し、画面切り替えで対応する。

---

## 実装内容（1PR）

### 1. GachaScreen にプレビュー対応を追加（最小改修）
`src/screens/Gacha.tsx` の `Props` に2つ追加：

```ts
import type { Rarity } from "../types";

interface Props {
  profile: Profile;
  pullReason: PullReason;
  dateKey: string;
  onSave: (updated: Profile) => void;
  onClose: () => void;
  forcedRarity?: Rarity;   // 追加：指定するとそのレア度で固定（プレビュー用）
  dryRun?: boolean;        // 追加：true なら結果を保存しない（プレビュー用）
}
```

`handlePull` を次のように変更（指定レア度を使い、dryRun では保存しない）：

```ts
const handlePull = useCallback(() => {
  const rarity = forcedRarity ?? drawRarity();        // ← 指定があればそれを使う
  const res = drawPrize(rarity, profile);
  if (!dryRun) {                                       // ← プレビュー時は保存しない
    const updated = applyGachaResult(profile, res, pullType, dateKey);
    onSave(updated);
  }
  setResult(res);
  setScreenPhase("animating");
  setAnimPhase("silhouette");
  soundPull();
  if (navigator.vibrate) navigator.vibrate(60);
}, [profile, pullType, dateKey, onSave, forcedRarity, dryRun]);
```

結果画面に、**プレビュー時のみ**「もう1回みる」ボタンを表示し、押すと再度 `handlePull` を実行できるようにする
（通常時は出さない）。スキップ・閉じるは従来どおり。

### 2. TestGacha 画面を新規作成
`src/screens/TestGacha.tsx`（プレビューのハブ）。

- 7レア度のボタン（ノーマル／レア／スーパーレア／げきレア／にじいろ／超超超レア／ダイヤモンド）＋「ランダム」ボタンを並べる。
  - ラベルは `RARITY_VISUALS[rarity].label` を使う（`src/data/gachaVisuals.ts`）。
- ボタンを押すと `GachaScreen` を以下で開く：
  - `forcedRarity = 選んだレア度`（「ランダム」のときは未指定）
  - `dryRun = true`
  - `profile = 現在のアクティブプロフィール`（表示用。保存はしない）
  - `pullReason="complete"`, `dateKey=今日`（dryRun なので値は使われないが props を満たすため渡す）
  - `onSave = () => {}`（何もしない空関数）, `onClose = プレビューを閉じてレア度選択へ戻る`
- 「もどる」ボタンでおうちの人モードへ戻る。

### 3. 入り口の配線
- `src/screens/ParentSettings.tsx` に「🎬 演出をテスト」ボタンを追加し、押すと `testGacha` 画面へ。
- `src/App.tsx`：`Screen` 型に `"testGacha"` を追加。ParentSettings から遷移できるよう
  `onOpenTestGacha` 等のコールバックを渡し、`screen === "testGacha"` のとき `<TestGacha .../>` を表示する。

---

## 完了条件（AC）
- おうちの人モードに「🎬 演出をテスト」があり、そこから TestGacha を開ける。
- 各レア度（＋ランダム）を選んで演出を **何度でも** 再生できる（「もう1回みる」で連続再生可）。
- 再生しても **本物のデータが一切変化しない**：
  - 1日1回の制限（`gachaPulledDate`）が消費されない／ポイント・かけら・アイテム・記録が増減しない。
  - 確認方法：プレビューで何度か引いた後、Home に戻っても「今日のガチャ」がまだ引ける状態のまま。
- 通常のガチャ（Home からの complete / recovery / ticket）は従来どおり1回付与で動く（回帰なし）。
- 演出コードは GachaScreen を共有（重複実装していない）。
- `npm run build`（型チェック含む）が通る。

## 備考
- この機能は開発・確認用。将来不要になれば `dryRun` 経路と TestGacha、ボタンを外せば消せる（本番ロジックに影響しない作り）。
