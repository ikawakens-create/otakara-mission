import type { MissionDef } from "../types";
import type { DailyRecord } from "../types";

export function isAllComplete(
  missions: MissionDef[],
  record: DailyRecord | undefined
): boolean {
  if (!record) return false;
  return missions.every((m) => Boolean(record.stamps[m.id]));
}
