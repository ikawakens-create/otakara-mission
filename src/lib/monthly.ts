import type { Profile, AppSettings } from "../types";
import { getMonthCompleteDays } from "./stats";
import { getMonthKey } from "./date";

/**
 * 月間目標を達成済みかつ未付与なら報酬を付与したプロフィールを返す。
 * 二重付与は monthlyRewardGiven[YYYY-MM] で防止。
 */
export function checkAndApplyMonthlyReward(
  profile: Profile,
  year: number,
  month: number,
  settings: AppSettings
): { profile: Profile; awarded: boolean } {
  const key = getMonthKey(year, month);
  if (profile.monthlyRewardGiven[key]) {
    return { profile, awarded: false };
  }

  const completeDays = getMonthCompleteDays(profile, year, month);
  if (completeDays < settings.monthlyGoalDays) {
    return { profile, awarded: false };
  }

  const updated: Profile = {
    ...profile,
    points: {
      total: profile.points.total + settings.monthlyRewardPoints,
      thisWeek: profile.points.thisWeek + settings.monthlyRewardPoints,
    },
    specialGachaTickets: profile.specialGachaTickets + 1,
    monthlyRewardGiven: { ...profile.monthlyRewardGiven, [key]: true },
  };

  return { profile: updated, awarded: true };
}

/** 月間ごほうびの進捗情報 */
export function getMonthlyProgress(
  profile: Profile,
  year: number,
  month: number,
  settings: AppSettings
): { completeDays: number; goalDays: number; given: boolean } {
  const key = getMonthKey(year, month);
  return {
    completeDays: getMonthCompleteDays(profile, year, month),
    goalDays: settings.monthlyGoalDays,
    given: profile.monthlyRewardGiven[key] ?? false,
  };
}
