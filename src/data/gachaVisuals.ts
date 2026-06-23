import type { Rarity } from "../types";

export interface RarityVisual {
  label: string;        // 日本語表示名
  capsuleColor: string; // カプセルの背景色（CSS色）
  glowColor: string;    // グロー効果の色（CSS色）
  level: number;        // 0〜6（演出強度・効果音の段数に使用）
}

export const RARITY_VISUALS: Record<Rarity, RarityVisual> = {
  normal: {
    label: "ノーマル",
    capsuleColor: "#aaaaaa",
    glowColor: "transparent",
    level: 0,
  },
  rare: {
    label: "レア ⭐",
    capsuleColor: "#42a5f5",
    glowColor: "rgba(66,165,245,0.6)",
    level: 1,
  },
  super_rare: {
    label: "スーパーレア ⭐⭐",
    capsuleColor: "#ab47bc",
    glowColor: "rgba(171,71,188,0.6)",
    level: 2,
  },
  ultra_rare: {
    label: "激レア 🌟",
    capsuleColor: "#ffd700",
    glowColor: "rgba(255,215,0,0.7)",
    level: 3,
  },
  rainbow: {
    label: "レインボー 🌈",
    capsuleColor: "#ff6eb4",
    glowColor: "rgba(255,110,180,0.7)",
    level: 4,
  },
  legend: {
    label: "超超超レア 💫",
    capsuleColor: "#ef5350",
    glowColor: "rgba(239,83,80,0.75)",
    level: 5,
  },
  diamond: {
    label: "💎 ダイヤモンド 💎",
    capsuleColor: "#90caf9",
    glowColor: "rgba(232,160,255,0.8)",
    level: 6,
  },
};
