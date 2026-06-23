import type { Profile, DailyRecord } from "../types";
import { getWeekDays, getMonthCalendar, getTodayKey } from "./date";

export type DayStatus = "complete" | "recovered" | "partial" | "empty" | "future";

export function getDayStatus(
  record: DailyRecord | undefined,
  missionCount: number,
  dateKey: string,
  todayKey: string
): DayStatus {
  if (dateKey > todayKey) return "future";
  if (!record) return "empty";
  if (record.completed && record.recovered) return "recovered";
  if (record.completed) return "complete";
  const stamped = Object.keys(record.stamps).length;
  if (stamped > 0 && stamped < missionCount) return "partial";
  return "empty";
}

/** 週内のコンプリート日数（recovered も含む）を dailyRecords から計算 */
export function getWeekCompleteDays(profile: Profile, weekStartDate: string): number {
  return getWeekDays(weekStartDate).filter((dk) => {
    const r = profile.dailyRecords[dk];
    return r?.completed;
  }).length;
}

/** 月内のコンプリート日数（recovered も含む）を計算 */
export function getMonthCompleteDays(profile: Profile, year: number, month: number): number {
  const days = getMonthCalendar(year, month).filter(Boolean) as string[];
  return days.filter((dk) => profile.dailyRecords[dk]?.completed).length;
}

/** 月内のリカバリー達成日数 */
export function getMonthRecoveryDays(profile: Profile, year: number, month: number): number {
  const days = getMonthCalendar(year, month).filter(Boolean) as string[];
  return days.filter((dk) => profile.dailyRecords[dk]?.recovered).length;
}

/**
 * 特定ミッションの週達成率（0〜1）
 * そのミッションにスタンプが押された日 / 週内の過去日数
 */
export function getMissionWeekRate(
  profile: Profile,
  missionId: string,
  weekStartDate: string
): number {
  const today = getTodayKey();
  const days = getWeekDays(weekStartDate).filter((dk) => dk <= today);
  if (days.length === 0) return 0;
  const done = days.filter((dk) => Boolean(profile.dailyRecords[dk]?.stamps[missionId])).length;
  return done / days.length;
}

/**
 * 特定ミッションの月達成率（0〜1）
 */
export function getMissionMonthRate(
  profile: Profile,
  missionId: string,
  year: number,
  month: number
): number {
  const today = getTodayKey();
  const days = (getMonthCalendar(year, month).filter(Boolean) as string[]).filter(
    (dk) => dk <= today
  );
  if (days.length === 0) return 0;
  const done = days.filter((dk) => Boolean(profile.dailyRecords[dk]?.stamps[missionId])).length;
  return done / days.length;
}
