import type { AvatarConfig } from "../types";
import { AVATAR_ASSETS, resolveAvatarUrl } from "../data/avatarAssets";
import Avatar from "./Avatar";
import styles from "./AvatarThumb.module.css";

interface Props {
  config: AvatarConfig;
  ownedIds: string[];
  fallbackEmoji: string;
  onClick?: () => void;
}

function hasAnyImage(config: AvatarConfig, ownedIds: string[]): boolean {
  const ids = [
    config.specialId,
    config.outfitId,
    config.hairId,
    config.hatId,
    config.accessoryId,
    config.petId,
    config.backgroundId,
  ].filter(Boolean) as string[];

  return ids.some((id) => {
    if (!ownedIds.includes(id)) return false;
    const asset = AVATAR_ASSETS.find((a) => a.id === id);
    return asset ? !!resolveAvatarUrl(asset.imagePath) : false;
  });
}

export default function AvatarThumb({ config, ownedIds, fallbackEmoji, onClick }: Props) {
  const showAvatar = hasAnyImage(config, ownedIds);

  return (
    <button
      className={styles.circle}
      onClick={onClick}
      aria-label="きせかえをひらく"
      type="button"
    >
      {showAvatar ? (
        <div className={styles.avatarWrap}>
          <Avatar config={config} ownedIds={ownedIds} />
        </div>
      ) : (
        <span className={styles.emoji}>{fallbackEmoji}</span>
      )}
    </button>
  );
}
