import type { Rarity } from "../types";

export const GACHA_RARITY_WEIGHTS: Record<Rarity, number> = {
  normal: 40,
  rare: 25,
  super_rare: 15,
  ultra_rare: 10,
  rainbow: 5,
  legend: 3,
  diamond: 1,
};

export const RARITY_POINT_REWARD: Record<Rarity, number> = {
  normal: 1,
  rare: 2,
  super_rare: 3,
  ultra_rare: 4,
  rainbow: 6,
  legend: 8,
  diamond: 10,
};

export const RARITY_TO_KAKERA: Record<Rarity, number> = {
  normal: 1,
  rare: 3,
  super_rare: 6,
  ultra_rare: 10,
  rainbow: 20,
  legend: 40,
  diamond: 80,
};

export const KAKERA_PRICE: Record<Rarity, number> = {
  normal: 5,
  rare: 12,
  super_rare: 25,
  ultra_rare: 50,
  rainbow: 100,
  legend: 200,
  diamond: 400,
};

export const PRIZE_KIND_WEIGHTS = {
  default: { points: 20, stamp: 40, item: 40 },
};
