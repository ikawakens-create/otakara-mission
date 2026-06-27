import type { AvatarConfig } from "../types";
import { avatarAsset, resolveAvatarUrl } from "../data/avatarAssets";
import { RARITY_VISUALS } from "../data/gachaVisuals";
import styles from "./Avatar.module.css";

const LAYERS: { key: keyof AvatarConfig }[] = [
  { key: "backgroundId" },
  { key: "outfitId" },
  { key: "hairId" },
  { key: "hatId" },
  { key: "accessoryId" },
  { key: "petId" },
];

function Layer({ id }: { id?: string }) {
  if (!id) return null;
  const asset = avatarAsset(id);
  if (!asset) return null;
  const url = resolveAvatarUrl(asset.imagePath);
  const t = `translate(${asset.offsetX ?? 0}px, ${asset.offsetY ?? 0}px) scale(${asset.scale ?? 1})`;
  if (url) {
    return <img className={styles.layer} src={url} alt="" style={{ transform: t }} />;
  }
  const color = asset.rarity ? RARITY_VISUALS[asset.rarity].glowColor : "#ddd";
  return (
    <div className={styles.placeholder} style={{ borderColor: color, transform: t }}>
      {asset.label}
    </div>
  );
}

interface Props {
  config: AvatarConfig;
  ownedIds: string[];
}

export default function Avatar({ config, ownedIds }: Props) {
  const special =
    config.specialId && ownedIds.includes(config.specialId)
      ? avatarAsset(config.specialId)
      : undefined;

  return (
    <div className={styles.frame}>
      {special ? (
        <Layer id={special.id} />
      ) : (
        (() => {
          const hideHair = !!avatarAsset(config.outfitId)?.hooded;
          return LAYERS.map(({ key }) => {
            if (key === "hairId" && hideHair) return null;
            return <Layer key={key} id={config[key] as string | undefined} />;
          });
        })()
      )}
    </div>
  );
}
