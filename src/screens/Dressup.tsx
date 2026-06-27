import { useState } from "react";
import type { Profile, AvatarCategory, AvatarConfig } from "../types";
import { assetsForOwner, resolveAvatarUrl } from "../data/avatarAssets";
import { RARITY_VISUALS } from "../data/gachaVisuals";
import Avatar from "../components/Avatar";
import styles from "./Dressup.module.css";

const CATEGORY_TABS: { key: AvatarCategory; label: string }[] = [
  { key: "outfit", label: "ふく" },
  { key: "hair", label: "かみ" },
  { key: "hat", label: "ぼうし" },
  { key: "accessory", label: "こもの" },
  { key: "pet", label: "ペット" },
  { key: "background", label: "はいけい" },
  { key: "special", label: "とくべつ" },
];

const REQUIRED_CATEGORIES: AvatarCategory[] = ["outfit", "hair"];

interface Props {
  profile: Profile;
  onUpdateProfile: (updated: Profile) => void;
  onBack: () => void;
}

export default function Dressup({ profile, onUpdateProfile, onBack }: Props) {
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>("outfit");

  const config = profile.avatar;
  const ownedIds = profile.ownedItemIds;

  function equip(category: AvatarCategory, id: string | undefined) {
    const next: AvatarConfig = { ...config };
    switch (category) {
      case "outfit":
        next.outfitId = id!;
        break;
      case "hair":
        next.hairId = id!;
        break;
      case "hat":
        next.hatId = id;
        break;
      case "accessory":
        next.accessoryId = id;
        break;
      case "pet":
        next.petId = id;
        break;
      case "background":
        next.backgroundId = id;
        break;
      case "special":
        next.specialId = id;
        break;
    }
    onUpdateProfile({ ...profile, avatar: next });
  }

  function removeSpecial() {
    onUpdateProfile({
      ...profile,
      avatar: { ...config, specialId: undefined },
    });
  }

  function currentEquippedId(category: AvatarCategory): string | undefined {
    switch (category) {
      case "outfit": return config.outfitId;
      case "hair": return config.hairId;
      case "hat": return config.hatId;
      case "accessory": return config.accessoryId;
      case "pet": return config.petId;
      case "background": return config.backgroundId;
      case "special": return config.specialId;
    }
  }

  const allCategoryAssets = assetsForOwner(profile.id, activeCategory);
  const isRequired = REQUIRED_CATEGORIES.includes(activeCategory);
  const equippedId = currentEquippedId(activeCategory);

  // special タブ: 未所持もロック表示で並べる
  const displayAssets =
    activeCategory === "special"
      ? allCategoryAssets
      : allCategoryAssets.filter((a) => ownedIds.includes(a.id));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} type="button">
          ‹
        </button>
        <span className={styles.headerTitle}>👗 きせかえ</span>
      </header>

      <div className={styles.preview}>
        <div className={styles.avatarWrap}>
          <Avatar config={config} ownedIds={ownedIds} />
        </div>
      </div>

      <div className={styles.tabRow}>
        {CATEGORY_TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.tab}${activeCategory === key ? " " + styles.tabActive : ""}`}
            onClick={() => setActiveCategory(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {/* とくべつをはずすボタン */}
        {activeCategory === "special" && config.specialId && (
          <button className={styles.removeSpecialBtn} onClick={removeSpecial} type="button">
            とくべつをはずす
          </button>
        )}

        {/* なしタイル（外せるカテゴリのみ） */}
        {!isRequired && activeCategory !== "special" && (
          <button
            className={`${styles.tile}${!equippedId ? " " + styles.tileSelected : ""}`}
            onClick={() => equip(activeCategory, undefined)}
            type="button"
          >
            <span className={styles.tileNone}>なし</span>
          </button>
        )}

        {displayAssets.map((asset) => {
          const owned = ownedIds.includes(asset.id);
          const isLocked = activeCategory === "special" && !owned;
          const isEquipped = equippedId === asset.id;
          const url = resolveAvatarUrl(asset.thumbPath) ?? resolveAvatarUrl(asset.imagePath);
          const rarityColor = asset.rarity ? RARITY_VISUALS[asset.rarity].glowColor : "#ddd";

          return (
            <button
              key={asset.id}
              className={`${styles.tile}${isEquipped ? " " + styles.tileSelected : ""}${isLocked ? " " + styles.tileLocked : ""}`}
              style={{ borderColor: rarityColor }}
              onClick={() => !isLocked && equip(activeCategory, asset.id)}
              disabled={isLocked}
              type="button"
              aria-label={asset.label}
            >
              {url ? (
                <img className={styles.tileImg} src={url} alt={asset.label} />
              ) : (
                <span className={styles.tilePlaceholder}>{asset.label}</span>
              )}
              {isLocked && <span className={styles.lockOverlay}>🔒</span>}
              <span className={styles.tileLabel}>{asset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
