import type { SaveData, Profile, AppSettings } from "../types";
import { DEFAULT_MISSIONS } from "../data/missions";
import { STAMPS } from "../data/stamps";
import { ITEMS } from "../data/items";
import { getTodayKey, getWeekStartDate } from "./date";

const STORAGE_KEY = "otakara_mission_v1";
const CURRENT_SCHEMA_VERSION = 1;

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
    },
  };
}

function buildDefaultSettings(): AppSettings {
  return {
    pinHash: null,
    yenPerPoint: 10,
    weeklyYenCap: 300,
    appVersion: "0.1.0",
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

function migrate(data: SaveData): SaveData {
  // 将来のスキーマ移行をここに追記する
  // if (data.schemaVersion < 2) { ... data.schemaVersion = 2; }
  return data;
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefaultSaveData();
    const parsed = JSON.parse(raw) as SaveData;
    return migrate(parsed);
  } catch {
    return buildDefaultSaveData();
  }
}

export function saveSaveData(data: SaveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getActiveProfile(data: SaveData): Profile {
  const profile = data.profiles.find((p) => p.id === data.activeProfileId);
  if (!profile) return data.profiles[0];
  return profile;
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
    const parsed = JSON.parse(json) as SaveData;
    if (typeof parsed.schemaVersion !== "number") return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}
