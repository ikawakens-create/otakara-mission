# CLAUDE.md — 開発ガイド（Claude Code 用）

このファイルは Claude Code が実装する際の指針。**実装前に必ず通読**すること。

---

## 1. プロジェクト概要

子ども向けミッション達成アプリ「おたからミッション」。
ミッションにスタンプを押し、1日全クリアでガチャを引き、景品（ポイント/スタンプ/着せ替えアイテム）を
集めてアバターを育てる。バックエンドなし・端末内完結の **PWA**。

詳細仕様は `docs/SPEC.md`、データ構造は `docs/DATA_MODEL.md` を参照。

---

## 2. 技術スタック（確定）

| 項目 | 採用 | 理由 |
|---|---|---|
| ビルド | **Vite** | 高速・PWA対応が容易 |
| 言語 | **TypeScript** | 型でデータ構造のミスを防ぐ。コンテンツ追加時の安全性 |
| UI | **React 18** | 既存資産・知見の流用 |
| スタイル | **CSS Modules** もしくは plain CSS | 子ども向けの大きなボタン中心。Tailwind不使用（依存を減らす） |
| 永続化 | **localStorage**（小データ）＋必要なら `idb-keyval`（大データ） | サーバ不要 |
| PWA | **vite-plugin-pwa** | 「ホーム画面に追加」でインストール可能に |
| デプロイ | **GitHub Pages** または Netlify | 無料・URL配布・更新が即反映 |
| アニメ | CSS animation 中心。必要なら軽量な `canvas-confetti` のみ | 依存を最小に |

**重要**：重いゲームエンジンやアニメライブラリは入れない。演出はCSS＋必要最小限のライブラリで作る。

---

## 3. ディレクトリ構成（目標）

```
src/
  main.tsx
  App.tsx
  screens/        # 画面単位（Home, MissionStamp, Gacha, Collection, Avatar, ParentMode）
  components/     # 再利用UI（Button, StampPicker, RarityBadge, ConfettiBurst ...）
  data/           # ★コンテンツ定義（コードと分離）
    missions.ts   # ミッション項目の初期値
    stamps.ts     # スタンプ一覧
    items.ts      # 着せ替えアイテム一覧
    gacha.ts      # ガチャのレア度テーブルと景品プール
  lib/            # ロジック（storage, gacha抽選, date, points計算, weekly判定）
  state/          # 状態管理（Context + reducer など軽量に）
  styles/
public/
  icons/          # PWAアイコン・スタンプ/アイテムの画像（または絵文字で代替）
  manifest 関連
docs/
```

---

## 4. コーディング規約

- **コンテンツとロジックを混ぜない**。スタンプ/アイテム/ガチャは必ず `src/data/*.ts` に定義し、
  画面側は import して使うだけ。画面コードに個別アイテムをハードコードしない。
- **新コンテンツ追加 = data配列に1件足すだけ**で動くこと。これを壊す実装はNG。
- 型は `src/types.ts`（または各dataファイル）に定義。`any` 禁止。
- 子ども向けUI：ボタンは大きく（最低 56px 高）、文字はひらがな中心、タップ領域を広く。
- 文言（日本語UIテキスト）も可能なら定数にまとめ、後から変えやすくする。
- 破壊的操作（データリセット等）は **おうちの人モード（PINロック）内**にのみ置く。

---

## 5. データの不変条件（壊してはいけないルール）

- プロフィールは2人分独立（姉/妹）。データを混在させない。
- `dailyRecords` の日付キーは `YYYY-MM-DD`（端末ローカル時間）。
- 1日のガチャは**コンプリート時に1回だけ**。`gachaPulledDate` で二重付与を防ぐ。
- ポイント・かけら・所持アイテムは**減ることはあっても勝手に消えない**（バグでの消失を厳禁）。
- ストレージのスキーマには `schemaVersion` を持たせ、将来のマイグレーションに備える。

詳細は `docs/DATA_MODEL.md`。

---

## 6. AI 役割分担（多AIワークフロー）

polyrush と同じ方式を踏襲する。

- **Claude（計画・レビュー担当）**：仕様策定、設計レビュー、PRレビュー、受け入れ判定。
- **Claude Code（実装・Git操作担当）**：ブランチ作成、実装、テスト、PR作成。
- **作業単位**：`docs/ROADMAP.md` のステップ／タスク単位でPRを切る。1PR=1タスクを基本とする。
- **完了条件**：各タスクの「完了条件（Acceptance Criteria）」を満たすこと。満たさないPRはマージしない。
- **評価**：ブロック別に独立採点。各タスク90点以上を目安にレビューを通す。

---

## 7. Git / 進め方

- `main` は常に動く状態を保つ。実装は `feat/...` ブランチで行いPRでマージ。
- コミットメッセージは何をしたか明確に（例：`feat: スタンプ選択パレットを実装`）。
- 各ステップ完了時にデプロイし、実機（子どものタブレット）で動作確認 → 次ステップへ。
- まず `docs/ROADMAP.md` のステップ1から着手する。**一度に全部作らない**。

---

## 8. 最初にやること

1. 本ファイルと `docs/SPEC.md`・`docs/DATA_MODEL.md`・`docs/ROADMAP.md` を読む。
2. Vite + React + TS でプロジェクト初期化、PWA・デプロイの土台を用意。
3. `src/types.ts` と `src/data/*.ts` の雛形を作る（DATA_MODEL.md に準拠）。
4. ROADMAP のステップ1のタスクから実装を開始。
