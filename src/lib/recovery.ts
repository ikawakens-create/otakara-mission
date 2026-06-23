import type { Profile, AppSettings } from "../types";
import { getWeekStartDate } from "./date";

/**
 * その日がリカバリー対象かどうかを判定する。
 * 条件：過去日・全ミッション中ちょうど1個だけ未達・未コンプリート
 */
export function isRecoveryCandidate(
  profile: Profile,
  dateKey: string,
  todayKey: string
): boolean {
  if (dateKey >= todayKey) return false;
  const record = profile.dailyRecords[dateKey];
  if (!record) return false;
  if (record.completed) return false;

  const missionCount = profile.missions.length;
  const stampedCount = Object.keys(record.stamps).length;
  return stampedCount === missionCount - 1;
}

/**
 * リカバリーをその日に適用する。
 * - dailyRecord を recovered=true, completed=true に更新
 * - weekState.recoveryUsedThisWeek をインクリメント
 * - ボーナスポイント +1
 */
export function applyRecovery(
  profile: Profile,
  dateKey: string,
  recoveryMissionId: string,
  _settings: AppSettings
): Profile {
  const record = profile.dailyRecords[dateKey] ?? {
    stamps: {},
    completed: false,
    gachaPulled: false,
  };

  const updatedRecord = {
    ...record,
    completed: true,
    recovered: true,
    recoveryMissionId,
    // リカバリーのガチャ権利は gachaPulled=false のまま（ステップ2で消費）
    gachaPulled: record.gachaPulled,
  };

  // 今週の weekState に反映（週またぎを考慮）
  const recoveredWeekStart = getWeekStartDate(dateKey);
  const isCurrentWeek = recoveredWeekStart === profile.weekState.weekStartDate;

  const weekState = {
    ...profile.weekState,
    recoveryUsedThisWeek: profile.weekState.recoveryUsedThisWeek + 1,
    // 今週の日なら completedDays も更新（stats から計算し直すのが安全だが一応）
    completedDays: isCurrentWeek
      ? profile.weekState.completedDays + 1
      : profile.weekState.completedDays,
  };

  return {
    ...profile,
    points: {
      total: profile.points.total + 1,
      thisWeek: profile.points.thisWeek + 1,
    },
    weekState,
    dailyRecords: {
      ...profile.dailyRecords,
      [dateKey]: updatedRecord,
    },
  };
}

/** 今週のリカバリー残り回数 */
export function recoveryRemaining(profile: Profile, settings: AppSettings): number {
  return Math.max(0, settings.recoveryWeeklyLimit - profile.weekState.recoveryUsedThisWeek);
}
