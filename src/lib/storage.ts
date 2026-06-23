import type { SaveData, Profile, AppSettings, RecoveryMissionDef } from "../types";
import { DEFAULT_MISSIONS } from "../data/missions";
import { STAMPS } from "../data/stamps";
import { ITEMS } from "../data/items";
import { getTodayKey, getWeekStartDate } from "./date";

const STORAGE_KEY = "otakara_mission_v1";
const CURRENT_SCHEMA_VERSION = 2;

export const DEFAULT_RECOVERY_MISSIONS: RecoveryMissionDef[] = [
  { id: "rec_read_book", emoji: "📖", label: "えほんを 1さつ よむ" },
  { id: "rec_tidy_toys", emoji: "🧸", label: "おもちゃを 10こ かたづける" },
  { id: "rec_extra_help", emoji: "🧹", label: "おてつだいを もう1つ する" },
  { id: "rec_exercise", emoji: "🏃", label: "たいそうを 5ぷん する" },
];

function buildDefaultProfile(id: string, name: string): Profile {
  const starterStampIds = STAMPS.filter((s) => s.starter).map((s) => s.id);
  const starterItemIds = ITEMS.filter((i) => i.starter).map((i) => i.id);
  return {
    id,
    name,
    avatar: {},
    missions: [...DEFAULT_MISSIONS],
    points: { total: 0, thisWeek: 0 },
    kakera: 0,
    ownedStampIds: starterStampIds,
    ownedItemIds: starterItemIds,
    dailyRecords: {},
    weekState: {
      weekStartDate: getWeekStartDate(getTodayKey()),
      completedDays: 0,
      weeklyBonusGiven: false,
      recoveryUsedThisWeek: 0,
    },
    monthlyRewardGiven: {},
    specialGachaTickets: 0,
  };
}

function buildDefaultSettings(): AppSettings {
  return {
    pinHash: null,
    yenPerPoint: 10,
    weeklyYenCap: 300,
    appVersion: "0.1.0",
    recoveryMissions: DEFAULT_RECOVERY_MISSIONS,
    recoveryWeeklyLimit: 2,
    recoveryGrantsGacha: true,
    monthlyGoalDays: 20,
    monthlyRewardPoints: 10,
  };
}

function buildDefaultSaveData(): SaveData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activeProfileId: "sister",
    settings: buildDefaultSettings(),
    profiles: [
      buildDefaultProfile("sister", "おねえちゃん"),
      buildDefaultProfile("younger", "いもうと"),
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(raw: any): SaveData {
  let data = raw as SaveData;

  if ((data.schemaVersion ?? 0) < 2) {
    // v1 → v2: 新フィールドを追加
    const defaultSettings = buildDefaultSettings();
    data = {
      ...data,
      settings: {
        ...defaultSettings,
        ...data.settings,
        // v2 で追加された設定は既存データに存在しないので defaults を適用
        recoveryMissions: data.settings.recoveryMissions ?? defaultSettings.recoveryMissions,
        recoveryWeeklyLimit: data.settings.recoveryWeeklyLimit ?? defaultSettings.recoveryWeeklyLimit,
        recoveryGrantsGacha: data.settings.recoveryGrantsGacha ?? defaultSettings.recoveryGrantsGacha,
        monthlyGoalDays: data.settings.monthlyGoalDays ?? defaultSettings.monthlyGoalDays,
        monthlyRewardPoints: data.settings.monthlyRewardPoints ?? defaultSettings.monthlyRewardPoints,
      },
      profiles: data.profiles.map((p) => ({
        ...p,
        monthlyRewardGiven: p.monthlyRewardGiven ?? {},
        specialGachaTickets: p.specialGachaTickets ?? 0,
        weekState: {
          ...p.weekState,
          recoveryUsedThisWeek: p.weekState.recoveryUsedThisWeek ?? 0,
        },
        dailyRecords: Object.fromEntries(
          Object.entries(p.dailyRecords).map(([k, r]) => [
            k,
            {
              ...r,
              recovered: (r as DailyRecordV1).recovered ?? false,
            },
          ])
        ),
      })),
    };
    data.schemaVersion = 2;
  }

  return data;
}

// 型ヘルパー（マイグレーション内の旧フィールドアクセス用）
interface DailyRecordV1 {
  recovered?: boolean;
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefaultSaveData();
    return migrate(JSON.parse(raw));
  } catch {
    return buildDefaultSaveData();
  }
}

export function saveSaveData(data: SaveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getActiveProfile(data: SaveData): Profile {
  return data.profiles.find((p) => p.id === data.activeProfileId) ?? data.profiles[0];
}

export function updateProfile(data: SaveData, updated: Profile): SaveData {
  return {
    ...data,
    profiles: data.profiles.map((p) => (p.id === updated.id ? updated : p)),
  };
}

export function exportData(data: SaveData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): SaveData | null {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed.schemaVersion !== "number") return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}
