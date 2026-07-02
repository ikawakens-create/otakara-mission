import { useState } from "react";
import type { AvatarAsset, AvatarCategory, Profile } from "../types";
import { assetsInCategory, resolveAvatarUrl } from "../data/avatarAssets";
import { RARITY_VISUALS } from "../data/gachaVisuals";
import styles from "./Zukan.module.css";

interface Props {
  profile: Profile;
  onBack: () => void;
  onOpenDressup: () => void;
}

const CATEGORY_TABS: { key: AvatarCategory; label: string }[] = [
  { key: "outfit", label: "ふく" },
  { key: "hair", label: "かみ" },
  { key: "face", label: "かお" },
  { key: "hat", label: "ぼうし" },
  { key: "accessory", label: "こもの" },
  { key: "pet", label: "ペット" },
  { key: "background", label: "はいけい" },
  { key: "special", label: "とくべつ" },
];

// このプロフィールで集められる対象（owner==自分 or both、かつ画像が存在するもの）
function collectibleAssets(category: AvatarCategory, profileId: string): AvatarAsset[] {
  return assetsInCategory(category).filter(
    (a) =>
      (a.owner === profileId || a.owner === "both") &&
      (resolveAvatarUrl(a.thumbPath) ?? resolveAvatarUrl(a.imagePath)) !== undefined
  );
}

export default function Zukan({ profile, onBack, onOpenDressup }: Props) {
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>("outfit");
  const [detail, setDetail] = useState<AvatarAsset | null>(null);

  const ownedIds = profile.ownedItemIds;

  // 全体カウント
  const allCollectible = CATEGORY_TABS.flatMap((t) => collectibleAssets(t.key, profile.id));
  const totalCount = allCollectible.length;
  const ownedCount = allCollectible.filter((a) => ownedIds.includes(a.id)).length;
  const percent = totalCount === 0 ? 0 : Math.round((ownedCount / totalCount) * 100);
  const allComplete = totalCount > 0 && ownedCount === totalCount;

  // 選択カテゴリ
  const categoryAssets = collectibleAssets(activeCategory, profile.id);
  const catOwned = categoryAssets.filter((a) => ownedIds.includes(a.id)).length;
  const catTotal = categoryAssets.length;
  const catComplete = catTotal > 0 && catOwned === catTotal;
  const activeLabel = CATEGORY_TABS.find((t) => t.key === activeCategory)?.label ?? "";

  function isCategoryComplete(cat: AvatarCategory): boolean {
    const list = collectibleAssets(cat, profile.id);
    return list.length > 0 && list.every((a) => ownedIds.includes(a.id));
  }

  // 詳細ポップアップ用の派生値
  const detailOwned = detail ? ownedIds.includes(detail.id) : false;
  const detailColor = detail?.rarity ? RARITY_VISUALS[detail.rarity].glowColor : "#dddddd";
  const detailUrl = detail
    ? resolveAvatarUrl(detail.imagePath) ?? resolveAvatarUrl(detail.thumbPath)
    : undefined;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} type="button">‹</button>
        <span className={styles.headerTitle}>📖 ずかん</span>
      </header>

      <div className={styles.body}>
        {/* 全体カウント */}
        <div className={styles.summary}>
          {allComplete ? (
            <div className={styles.completeBanner}>🎉 ぜんぶ あつめた！ 🎉</div>
          ) : (
            <div className={styles.summaryTop}>
              <span className={styles.summaryLabel}>あつめたよ</span>
              <span className={styles.summaryCount}>{ownedCount} / {totalCount}</span>
            </div>
          )}
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* カテゴリタブ */}
        <div className={styles.tabRow}>
          {CATEGORY_TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.tab}${activeCategory === key ? " " + styles.tabActive : ""}`}
              onClick={() => setActiveCategory(key)}
              type="button"
            >
              {label}
              {isCategoryComplete(key) && <span className={styles.tabStar}>⭐</span>}
            </button>
          ))}
        </div>

        {/* カテゴリ内カウント */}
        <div className={styles.catCount}>
          {activeLabel}　{catOwned} / {catTotal}
          {catComplete && <span className={styles.catComplete}>コンプ！</span>}
        </div>

        {/* グリッド */}
        <div className={styles.grid}>
          {categoryAssets.map((asset) => {
            const owned = ownedIds.includes(asset.id);
            const rarityColor = asset.rarity ? RARITY_VISUALS[asset.rarity].glowColor : "#dddddd";
            const url = resolveAvatarUrl(asset.thumbPath) ?? resolveAvatarUrl(asset.imagePath);

            return (
              <button
                key={asset.id}
                className={`${styles.cell}${owned ? "" : " " + styles.cellLocked}`}
                style={{
                  borderColor: rarityColor,
                  boxShadow: owned ? `0 0 10px ${rarityColor}` : "none",
                }}
                onClick={() => setDetail(asset)}
                type="button"
                aria-label={owned ? asset.label : "みかくにん"}
              >
                <div className={styles.cellImgWrap}>
                  {owned && url ? (
                    <img className={styles.cellImg} src={url} alt={asset.label} />
                  ) : (
                    <span className={styles.cellSilhouette}>🔒</span>
                  )}
                  {owned && asset.rarity && asset.rarity !== "normal" && (
                    <span className={styles.rarityRibbon} style={{ background: rarityColor }}>
                      {RARITY_VISUALS[asset.rarity].label}
                    </span>
                  )}
                </div>
                <span className={styles.cellLabel}>{owned ? asset.label : "？？？"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 詳細ポップアップ */}
      {detail && (
        <div className={styles.overlay} onClick={() => setDetail(null)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailImgWrap} style={{ borderColor: detailColor }}>
              {detailOwned && detailUrl ? (
                <img className={styles.detailImg} src={detailUrl} alt={detail.label} />
              ) : (
                <span className={styles.detailSilhouette}>🔒</span>
              )}
            </div>
            <div className={styles.detailName}>{detailOwned ? detail.label : "？？？"}</div>
            {detail.rarity && (
              <div className={styles.detailRarity} style={{ color: detailColor }}>
                {RARITY_VISUALS[detail.rarity].label}
              </div>
            )}
            <div className={styles.detailStatus}>
              {detailOwned ? "もってるよ ✓" : "まだ もってないよ・ガチャで あたるかも！"}
            </div>
            {detailOwned && (
              <button className={styles.useBtn} onClick={onOpenDressup} type="button">
                👗 きせかえで つかう
              </button>
            )}
            <button className={styles.closeBtn} onClick={() => setDetail(null)} type="button">
              とじる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
