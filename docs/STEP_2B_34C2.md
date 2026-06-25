# STEP_2B_34C2.md — §3-4c 改訂：激アツビートを「タップで引き直す」特別演出に

## 背景
現状の「出てこない→もう1回→確定」は自動再生でサラッと流れてしまい、特別感が弱い。
**「もう1回」を子ども自身がタップして引き直す**体験に変え、2回目のハンドルを**勢いよくぐるぐる回す＋タメ**で、
しっかり"激アツ専用演出"らしくする。対象は従来どおり **ダイヤ（confirmed）のときだけ**。結果は変えない。

## めざす流れ（ダイヤ＝retry時）
1. machine「ハンドルを まわそう！」→ **タップ**
2. ハンドルが回る → **でも出てこない**（カプセル落ちない）→ 文言「**あれ…？ でてこない！？**」
3. 大きく強調した誘い「**もう1回 タップ！！！**」を表示（タップ待ち）
4. **タップ** → ハンドルが**ぐるぐる勢いよく回る**（専用アニメ）→ **少しタメ** → カプセルが**ごろん**と落ちる ＋ **かくてい！！カットイン**
5. **タップ** → お披露目（burst の大フラッシュ）

※ 非retry（通常）は今までどおり：capsule で1タップ＝回る→落ちる。**変更しない（回帰なし）**。

---

## 実装方針（自動進行をやめ、タップ進行に）
§3-4c で入れた **retry自動進行（useEffect＋タイマー）を廃止**し、retryStage を**タップで進める**形にする。

`retryStage`: `"none" | "empty" | "prompt" | "spin" | "drop"`（意味は下記）

### retry時の capsule フェーズ内の進み方
- capsule に入った瞬間：`retryStage = "empty"`
  - ハンドルが回る（通常の handleSpin）／カプセルは落ちない（dropCapsule=null）／文言「あれ…？ でてこない！？」
  - ハンドル回転が終わる頃（例 0.8〜1.0秒後）に自動で `retryStage = "prompt"` にしてよい（ここはタイマー可）、
    または empty 表示のまま一定後に prompt へ。**prompt では「もう1回 タップ！！！」をデカく強調表示**。
- **prompt 状態で画面タップ**されたら：`retryStage = "spin"`
  - ハンドルが**激しくぐるぐる**回る（**新アニメ `handleSpinHard`**：回転数多め・速め・少し長め、例 1.2〜1.5秒）
  - 回り終わりに少し**タメ**（一拍）を入れてから `retryStage = "drop"`（この遷移はタイマー可）
- `retryStage = "drop"`：カプセルが落ちる（dropLookForScenario）＋ **かくてい！！カットイン**表示
  - drop 表示後の画面タップで通常どおり open→reveal（burst）へ。

> タップ進行の制御：現在 `advancePhase` は「画面タップで次フェーズへ」。retry中は、
> capsule フェーズ内のサブ進行（empty/prompt/spin/drop）を **advancePhase より優先して処理**すること。
> - 具体例：`advancePhase` の先頭で「retry中かつ capsule かつ retryStage==="prompt" なら、フェーズを進めず
>   retryStage を "spin" にして return」。それ以外のサブ遷移（empty→prompt、spin→drop）はタイマーで自動。
> - drop まで来たら、以降の advancePhase は通常どおり open へ進む。

### タイマーの扱い
- empty→prompt、spin→（タメ）→drop の自動遷移にだけタイマーを使う。
- §3-4c で作った `timersRef`＋`clearAllTimers` を流用し、**スキップ/フェーズ変更/アンマウントで全クリア**。
- 「とばす ▶」でいつでも result に飛べること（タイマー残さない）。

## 新アニメ：激しいハンドル回転
`gachaMachine.css` に `handleSpinHard` を追加（数値は実機調整可）：
```css
.handleSpinHard { transform-box: fill-box; transform-origin: center;
  animation: handleSpinHard 1.3s cubic-bezier(.2,.6,.2,1) 1; }
@keyframes handleSpinHard {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(1080deg); }   /* 3回転ぐるぐる */
}
```
- `GachaMachine` に **`turnHard?: boolean`** を追加し、true のとき十字ハンドルに `handleSpinHard` を当てる
  （通常の `turning` は従来の handleSpin のまま）。
- retry の `spin` ステージで `turnHard={true}` を渡す。

## Gacha.tsx の表示（retry時の capsule）
- `empty`：turning=true / turnHard=false / dropCapsule=null / hint「あれ…？ でてこない！？」
- `prompt`：turning=false / dropCapsule=null / hint は**専用の大強調**「もう1回 タップ！！！」
  （`styles.retryPrompt` などで大きく・点滅/鼓動。tapヒントの代わりにこれを目立たせる）
- `spin`：turnHard=true / dropCapsule=null / hint 空 or 「！！」
- `drop`：dropCapsule=セット / かくてい！！カットイン表示 / hint「ころん！」等

## テスト
- TestGacha の「🔥 でてこない演出」トグルは流用。ONで retry を再生し、
  **「もう1回 タップ！！！」でタップ→激しい回転→タメ→落下→かくてい！！** の流れを確認できること。

---

## 完了条件（AC）
- retry（ダイヤ）時：回る→出てこない→「**もう1回 タップ！！！**」（タップ待ち・強調表示）→**タップ**→
  **ハンドルが激しくぐるぐる**→少しタメ→カプセルごろん＋**かくてい！！**→タップで豪華お披露目（burst）。
- 「もう1回」は**自動で進まずタップで進む**。2回目の回転は**通常より激しい専用アニメ**。
- 非retry（通常・各シナリオ）は**従来どおり**（回帰なし）。
- 「とばす ▶」でいつでも結果へ（タイマー残らない）。
- 演出テストの「🔥 でてこない演出」で確認できる。
- 結果（レア度・景品）は不変。`npm run build` が通る。

## 触らないこと
- 抽選ロジック・データ保存・レア度重み・gachaVisuals・結果画面・カットイン段階/重み・マシンSVGの形状。
- 非retry時の capsule 挙動。

## メモ
- これが入れば 2-B 演出は本当に完成。長くなりそうなら動く単位で早めにコミット＆プッシュ。
