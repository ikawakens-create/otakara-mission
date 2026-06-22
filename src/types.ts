export type Rarity =
  | "normal"
  | "rare"
  | "super_rare"
  | "ultra_rare"
  | "rainbow"
  | "legend"
  | "diamond";

export type ItemCategory =
  | "hair"
  | "clothes"
  | "hat"
  | "accessory"
  | "background"
  | "pet";

export interface MissionDef {
  id: string;
  emoji: string;
  label: string;
  doublePoints?: boolean;
  editableLabel?: boolean;
}

export interface StampDef {
  id: string;
  name: string;
  rarity: Rarity;
  asset: string;
  starter?: boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: Rarity;
  asset: string;
  starter?: boolean;
}

export interface AvatarConfig {
  hair?: string;
  clothes?: string;
  hat?: string;
  accessory?: string;
  background?: string;
  pet?: string;
}

export interface DailyRecord {
  stamps: Record<string, string>;
  myMissionLabel?: string;
  completed: boolean;
  gachaPulled: boolean;
}

export interface WeekState {
  weekStartDate: string;
  completedDays: number;
  weeklyBonusGiven: boolean;
}

export interface Profile {
  id: string;
  name: string;
  avatar: AvatarConfig;
  missions: MissionDef[];
  points: { total: number; thisWeek: number };
  kakera: number;
  ownedStampIds: string[];
  ownedItemIds: string[];
  dailyRecords: Record<string, DailyRecord>;
  weekState: WeekState;
}

export interface AppSettings {
  pinHash: string | null;
  yenPerPoint: number;
  weeklyYenCap: number | null;
  appVersion: string;
}

export interface SaveData {
  schemaVersion: number;
  activeProfileId: string;
  settings: AppSettings;
  profiles: Profile[];
}
