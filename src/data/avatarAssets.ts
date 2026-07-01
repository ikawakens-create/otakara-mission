import type { AvatarAsset, AvatarCategory, Rarity } from "../types";

// 実在する webp だけが入る（未生成は undefined → プレースホルダ表示）
const ASSET_URLS = import.meta.glob("../assets/avatar/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export function resolveAvatarUrl(imagePath: string | undefined): string | undefined {
  if (!imagePath) return undefined;
  return ASSET_URLS[`../assets/avatar/${imagePath}`];
}

type Owner = "sister" | "younger" | "both";

function a(
  id: string,
  category: AvatarCategory,
  owner: Owner,
  label: string,
  opts: {
    rarity?: Rarity;
    starter?: boolean;
    offsetX?: number;
    offsetY?: number;
    scale?: number;
    hooded?: boolean;
  } = {}
): AvatarAsset {
  return {
    id,
    category,
    owner,
    label,
    imagePath: `${owner}/${category}/${id}.webp`,
    thumbPath: `${owner}/${category}/${id}.thumb.webp`,
    ...opts,
  };
}

export const AVATAR_ASSETS: AvatarAsset[] = [
  // ---- 服（both・顔なし）----
  a("out_younger_pinkfrill", "outfit", "both", "ピンクフリル", { rarity: "normal" }),
  a("out_younger_parka", "outfit", "both", "きいろパーカー", { rarity: "rare" }),
  a("out_sister_sailor", "outfit", "both", "セーラーふく", { rarity: "normal" }),
  a("out_sister_lavender", "outfit", "both", "ラベンダー", { rarity: "rare" }),
  // ---- 髪（both）----
  a("hair_younger_bob", "hair", "both", "ぱっつんボブ", { rarity: "normal" }),
  a("hair_sister_midi", "hair", "both", "ミディアム", { rarity: "normal" }),
  // ---- 顔（both）----
  a("face_genki", "face", "both", "げんき", { rarity: "normal" }),
  a("face_gentle", "face", "both", "おっとり", { rarity: "normal" }),
  // ---- 姉（sister）追加分 ----
  a("out_sister_hoodie", "outfit", "sister", "グレーパーカー", { rarity: "normal" }),
  a("out_sister_princess", "outfit", "sister", "おひめさまドレス", { rarity: "ultra_rare" }),
  a("out_sister_cat", "outfit", "sister", "ねこパーカー", { rarity: "rare", hooded: true }),
  a("hair_sister_twin", "hair", "sister", "ツインテール", { rarity: "rare" }),
  a("hair_sister_blackbob", "hair", "sister", "くろボブ", { rarity: "normal" }),
  a("hair_sister_braid", "hair", "sister", "みずいろみつあみ", { rarity: "rare" }),
  // ---- 共通（both）----
  a("hat_both_ribbon", "hat", "both", "リボン", { rarity: "normal" }),
  a("hat_both_santa", "hat", "both", "サンタぼうし", { rarity: "rare" }),
  a("hat_both_crown", "hat", "both", "おうかん", { rarity: "ultra_rare" }),
  a("hat_both_witch", "hat", "both", "まじょのぼうし", { rarity: "rare" }),
  a("hat_both_cap", "hat", "both", "キャップ", { rarity: "normal" }),
  a("hat_both_catears", "hat", "both", "ねこみみ", { rarity: "normal" }),
  a("acc_both_star", "accessory", "both", "ほしのアクセ", { rarity: "normal" }),
  a("pet_both_cat", "pet", "both", "ねこ", { rarity: "rare" }),
  a("bg_both_sky", "background", "both", "あおぞら", { rarity: "normal" }),
  a("sp_younger_banzai", "special", "younger", "ばんざい！", { rarity: "ultra_rare" }),
];

const BY_ID: Record<string, AvatarAsset> = Object.fromEntries(
  AVATAR_ASSETS.map((x) => [x.id, x])
);

export function avatarAsset(id: string | undefined): AvatarAsset | undefined {
  return id ? BY_ID[id] : undefined;
}

export function assetsInCategory(category: AvatarCategory): AvatarAsset[] {
  return AVATAR_ASSETS.filter((x) => x.category === category);
}

const STARTERS: Record<string, { outfit: string; hair: string; face: string }> = {
  younger: { outfit: "out_younger_pinkfrill", hair: "hair_younger_bob", face: "face_genki" },
  sister: { outfit: "out_sister_sailor", hair: "hair_sister_midi", face: "face_gentle" },
};

export function starterOutfitId(profileId: string): string | undefined {
  return STARTERS[profileId]?.outfit;
}

export function starterHairId(profileId: string): string | undefined {
  return STARTERS[profileId]?.hair;
}

export function starterFaceId(profileId: string): string | undefined {
  return STARTERS[profileId]?.face;
}

export function starterAssetIds(profileId: string): string[] {
  const s = STARTERS[profileId];
  return s ? [s.outfit, s.hair, s.face] : [];
}
