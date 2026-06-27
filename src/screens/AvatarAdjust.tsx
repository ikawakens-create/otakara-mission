import { useState } from "react";
import type { AvatarCategory } from "../types";
import { AVATAR_ASSETS, resolveAvatarUrl } from "../data/avatarAssets";
import { RARITY_VISUALS } from "../data/gachaVisuals";
import styles from "./AvatarAdjust.module.css";

type Owner = "sister" | "younger";

const OWNER_LABELS: Record<Owner, string> = {
  sister: "おねえちゃん",
  younger: "いもうと",
};

const CATEGORY_LABELS: Record<AvatarCategory, string> = {
  outfit: "ふく",
  hair: "かみ",
  hat: "ぼうし",
  accessory: "こもの",
  pet: "ペット",
  background: "はいけい",
  special: "とくべつ",
};

const CATEGORIES: AvatarCategory[] = ["outfit", "hair", "hat", "accessory", "pet", "background", "special"];

interface Props {
  onBack: () => void;
}

export default function AvatarAdjust({ onBack }: Props) {
  const [owner, setOwner] = useState<Owner>("sister");
  const [category, setCategory] = useState<AvatarCategory>("outfit");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [copied, setCopied] = useState(false);

  const assets = AVATAR_ASSETS.filter(
    (a) => a.category === category && (a.owner === owner || a.owner === "both")
  );

  const selectedAsset = assets.find((a) => a.id === selectedId);
  const imageUrl = selectedAsset
    ? resolveAvatarUrl(selectedAsset.imagePath)
    : undefined;

  const t = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

  const snippet = selectedId
    ? `// ${selectedId} の調整値\noffsetX: ${offsetX}, offsetY: ${offsetY}, scale: ${scale.toFixed(2)}`
    : "";

  function handleOwnerChange(o: Owner) {
    setOwner(o);
    setSelectedId(undefined);
    setOffsetX(0);
    setOffsetY(0);
    setScale(1.0);
  }

  function handleCategoryChange(c: AvatarCategory) {
    setCategory(c);
    setSelectedId(undefined);
    setOffsetX(0);
    setOffsetY(0);
    setScale(1.0);
  }

  function handleSelectAsset(id: string) {
    const asset = AVATAR_ASSETS.find((a) => a.id === id);
    setSelectedId(id);
    setOffsetX(asset?.offsetX ?? 0);
    setOffsetY(asset?.offsetY ?? 0);
    setScale(asset?.scale ?? 1.0);
    setCopied(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} type="button">
          ‹
        </button>
        <span className={styles.headerTitle}>🎯 アバターのいちちょうせい</span>
      </header>

      <div className={styles.body}>
        {/* owner選択 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>キャラクター</div>
          <div className={styles.btnRow}>
            {(["sister", "younger"] as Owner[]).map((o) => (
              <button
                key={o}
                className={`${styles.choiceBtn}${owner === o ? " " + styles.choiceBtnActive : ""}`}
                onClick={() => handleOwnerChange(o)}
                type="button"
              >
                {OWNER_LABELS[o]}
              </button>
            ))}
          </div>
        </div>

        {/* カテゴリ選択 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>カテゴリ</div>
          <div className={styles.btnRow}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`${styles.choiceBtn}${category === c ? " " + styles.choiceBtnActive : ""}`}
                onClick={() => handleCategoryChange(c)}
                type="button"
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* 素材選択 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>素材</div>
          <div className={styles.assetList}>
            {assets.map((a) => {
              const rarityColor = a.rarity ? RARITY_VISUALS[a.rarity].glowColor : "#ddd";
              return (
                <button
                  key={a.id}
                  className={`${styles.assetBtn}${selectedId === a.id ? " " + styles.assetBtnActive : ""}`}
                  style={{ borderColor: rarityColor }}
                  onClick={() => handleSelectAsset(a.id)}
                  type="button"
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* プレビュー */}
        {selectedAsset && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>プレビュー</div>
              <div className={styles.previewFrame}>
                {imageUrl ? (
                  <img
                    className={styles.previewImg}
                    src={imageUrl}
                    alt={selectedAsset.label}
                    style={{ transform: t }}
                  />
                ) : (
                  <div
                    className={styles.previewPlaceholder}
                    style={{
                      borderColor: selectedAsset.rarity
                        ? RARITY_VISUALS[selectedAsset.rarity].glowColor
                        : "#ddd",
                      transform: t,
                    }}
                  >
                    {selectedAsset.label}
                    <br />
                    （画像未生成）
                  </div>
                )}
              </div>
            </div>

            {/* スライダー */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>位置・サイズ調整</div>

              <div className={styles.sliderRow}>
                <label className={styles.sliderLabel}>
                  offsetX（左右）: {offsetX}
                </label>
                <input
                  type="range"
                  className={styles.slider}
                  min={-80}
                  max={80}
                  step={1}
                  value={offsetX}
                  onChange={(e) => setOffsetX(Number(e.target.value))}
                />
              </div>

              <div className={styles.sliderRow}>
                <label className={styles.sliderLabel}>
                  offsetY（上下）: {offsetY}
                </label>
                <input
                  type="range"
                  className={styles.slider}
                  min={-80}
                  max={80}
                  step={1}
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                />
              </div>

              <div className={styles.sliderRow}>
                <label className={styles.sliderLabel}>
                  scale（大きさ）: {scale.toFixed(2)}
                </label>
                <input
                  type="range"
                  className={styles.slider}
                  min={0.85}
                  max={1.15}
                  step={0.01}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                />
              </div>

              <button
                className={styles.resetBtn}
                onClick={() => { setOffsetX(0); setOffsetY(0); setScale(1.0); }}
                type="button"
              >
                リセット
              </button>
            </div>

            {/* コピペ用スニペット */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>コピペ用スニペット</div>
              <div className={styles.snippet}>{snippet}</div>
              <button className={styles.copyBtn} onClick={handleCopy} type="button">
                {copied ? "✓ コピーしました" : "📋 コピー"}
              </button>
              <div className={styles.hint}>
                この値を「avatarAssets.ts の該当行に入れて」と Claude Code に渡してください。
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
