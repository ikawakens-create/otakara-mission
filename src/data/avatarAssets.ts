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
  // ---- 妹（younger）----
  a("out_younger_pinkfrill", "outfit", "younger", "ピンクフリル", { rarity: "normal", starter: true }),
  a("out_younger_parka", "outfit", "younger", "きいろパーカー", { rarity: "rare" }),
  a("hair_younger_bob", "hair", "younger", "ぱっつんボブ", { rarity: "normal", starter: true }),
  // ---- 姉（sister）----
  a("out_sister_sailor", "outfit", "sister", "セーラーふく", { rarity: "normal", starter: true }),
  a("out_sister_lavender", "outfit", "sister", "ラベンダー", { rarity: "rare" }),
  a("hair_sister_midi", "hair", "sister", "ミディアム", { rarity: "normal", starter: true }),
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

export function assetsForOwner(profileId: string, category: AvatarCategory): AvatarAsset[] {
  return AVATAR_ASSETS.filter(
    (x) => x.category === category && (x.owner === profileId || x.owner === "both")
  );
}

export function starterOutfitId(profileId: string): string | undefined {
  return AVATAR_ASSETS.find(
    (x) => x.category === "outfit" && x.starter && (x.owner === profileId || x.owner === "both")
  )?.id;
}

export function starterHairId(profileId: string): string | undefined {
  return AVATAR_ASSETS.find(
    (x) => x.category === "hair" && x.starter && (x.owner === profileId || x.owner === "both")
  )?.id;
}

export function starterAssetIds(profileId: string): string[] {
  return AVATAR_ASSETS.filter(
    (x) => x.starter && (x.owner === profileId || x.owner === "both")
  ).map((x) => x.id);
}
