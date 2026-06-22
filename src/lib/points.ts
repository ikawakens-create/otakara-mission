import type { MissionDef } from "../types";

export function calcMissionPoints(mission: MissionDef): number {
  return mission.doublePoints ? 2 : 1;
}

export function calcDayPoints(
  missions: MissionDef[],
  stampedIds: Record<string, string>
): number {
  return missions
    .filter((m) => stampedIds[m.id])
    .reduce((sum, m) => sum + calcMissionPoints(m), 0);
}
