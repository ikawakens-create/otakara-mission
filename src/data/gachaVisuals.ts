import type { Rarity } from "../types";

export interface RarityVisual {
  label:     string;                            // 表示用レア度名（ひらがな中心・子ども向け）
  capsule:   "normal" | "gold" | "rainbow";    // カプセル見た目（GACHA_VISUALの色種に対応）
  glowColor: string;                            // グロー色（CSS）
  level:     number;                            // 0〜6 演出強度（フィニッシュの派手さ段数）
}

export const RARITY_VISUALS: Record<Rarity, RarityVisual> = {
  normal:     { label: "ノーマル",     capsule: "normal",  glowColor: "#ffd0e0", level: 0 },
  rare:       { label: "レア",         capsule: "normal",  glowColor: "#bfe3ff", level: 1 },
  super_rare: { label: "スーパーレア", capsule: "normal",  glowColor: "#c7b8ff", level: 2 },
  ultra_rare: { label: "げきレア",     capsule: "gold",    glowColor: "#ffe08a", level: 3 },
  rainbow:    { label: "にじいろ",     capsule: "gold",    glowColor: "#ffd24a", level: 4 },
  legend:     { label: "超超超レア",   capsule: "rainbow", glowColor: "#b6f0ff", level: 5 },
  diamond:    { label: "ダイヤモンド", capsule: "rainbow", glowColor: "#ffffff", level: 6 },
};

// capsule 種別 → CSS 表示色（Gacha.tsx 等で inline style に使用）
export const CAPSULE_CSS_COLORS: Record<"normal" | "gold" | "rainbow", string> = {
  normal:  "#aaaaaa",
  gold:    "#ffd700",
  rainbow: "#b6f0ff",
};
