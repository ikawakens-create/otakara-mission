import type { Profile, Rarity } from "../types";
import {
  GACHA_RARITY_WEIGHTS,
  RARITY_POINT_REWARD,
  RARITY_TO_KAKERA,
  PRIZE_KIND_WEIGHTS,
} from "../data/gacha";
import { STAMPS } from "../data/stamps";
import { ITEMS } from "../data/items";

export type PullType = "daily" | "ticket";
// "daily": dailyRecords[dateKey].gachaPulled を true にする（コンプリート/リカバリー共用）
// "ticket": specialGachaTickets を 1 減らす

export interface GachaResult {
  rarity: Rarity;
  prizeKind: "points" | "stamp" | "item";
  prizeId: string | null;
  prizePoints: number;
  isDuplicate: boolean;
  kakeraAwarded: number;
  prizeAsset: string;
  prizeName: string;
}

export function drawRarity(): Rarity {
  const entries = Object.entries(GACHA_RARITY_WEIGHTS) as [Rarity, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return "normal";
}

export function drawPrize(rarity: Rarity, profile: Profile): GachaResult {
  const { points: pw, stamp: sw, item: iw } = PRIZE_KIND_WEIGHTS.default;
  const total = pw + sw + iw;
  const roll = Math.random() * total;

  if (roll < pw) {
    const pts = RARITY_POINT_REWARD[rarity];
    return {
      rarity,
      prizeKind: "points",
      prizeId: null,
      prizePoints: pts,
      isDuplicate: false,
      kakeraAwarded: 0,
      prizeAsset: "⭐",
      prizeName: `ポイント +${pts}`,
    };
  }

  if (roll < pw + sw) {
    const pool = STAMPS.filter((s) => s.rarity === rarity);
    const candidates = pool.length > 0 ? pool : STAMPS;
    const stamp = candidates[Math.floor(Math.random() * candidates.length)];
    const isDup = profile.ownedStampIds.includes(stamp.id);
    return {
      rarity,
      prizeKind: "stamp",
      prizeId: stamp.id,
      prizePoints: 0,
      isDuplicate: isDup,
      kakeraAwarded: isDup ? RARITY_TO_KAKERA[rarity] : 0,
      prizeAsset: stamp.asset,
      prizeName: stamp.name,
    };
  }

  const pool = ITEMS.filter((i) => i.rarity === rarity);
  const candidates = pool.length > 0 ? pool : ITEMS;
  const item = candidates[Math.floor(Math.random() * candidates.length)];
  const isDup = profile.ownedItemIds.includes(item.id);
  return {
    rarity,
    prizeKind: "item",
    prizeId: item.id,
    prizePoints: 0,
    isDuplicate: isDup,
    kakeraAwarded: isDup ? RARITY_TO_KAKERA[rarity] : 0,
    prizeAsset: item.asset,
    prizeName: item.name,
  };
}

export function canPullOnDate(
  profile: Profile,
  dateKey: string,
  recoveryGrantsGacha: boolean
): boolean {
  const record = profile.dailyRecords[dateKey];
  if (!record || record.gachaPulled) return false;
  if (record.completed && !record.recovered) return true;
  if (record.recovered && recoveryGrantsGacha) return true;
  return false;
}

/** 過去日のリカバリーガチャ権利（未使用）を探して最新日付を返す */
export function findPendingRecoveryDate(
  profile: Profile,
  recoveryGrantsGacha: boolean,
  todayKey: string
): string | null {
  if (!recoveryGrantsGacha) return null;
  const dates = Object.keys(profile.dailyRecords)
    .filter((d) => d < todayKey)
    .sort()
    .reverse();
  for (const date of dates) {
    const r = profile.dailyRecords[date];
    if (r.recovered && r.completed && !r.gachaPulled) return date;
  }
  return null;
}

export function canPullTicket(profile: Profile): boolean {
  return profile.specialGachaTickets > 0;
}

export function applyGachaResult(
  profile: Profile,
  result: GachaResult,
  pullType: PullType,
  dateKey: string
): Profile {
  let updated: Profile = { ...profile };

  if (result.prizeKind === "points") {
    updated.points = {
      total: updated.points.total + result.prizePoints,
      thisWeek: updated.points.thisWeek + result.prizePoints,
    };
  } else if (result.prizeKind === "stamp" && result.prizeId !== null) {
    if (result.isDuplicate) {
      updated.kakera = updated.kakera + result.kakeraAwarded;
    } else {
      updated.ownedStampIds = [...updated.ownedStampIds, result.prizeId];
    }
  } else if (result.prizeKind === "item" && result.prizeId !== null) {
    if (result.isDuplicate) {
      updated.kakera = updated.kakera + result.kakeraAwarded;
    } else {
      updated.ownedItemIds = [...updated.ownedItemIds, result.prizeId];
    }
  }

  if (pullType === "daily") {
    const existing = updated.dailyRecords[dateKey] ?? {
      stamps: {},
      completed: false,
      gachaPulled: false,
    };
    updated.dailyRecords = {
      ...updated.dailyRecords,
      [dateKey]: { ...existing, gachaPulled: true },
    };
  } else {
    updated.specialGachaTickets = Math.max(0, updated.specialGachaTickets - 1);
  }

  return updated;
}
