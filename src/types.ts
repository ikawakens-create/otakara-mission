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

export interface RecoveryMissionDef {
  id: string;
  emoji: string;
  label: string;
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

export type AvatarCategory =
  | "outfit"
  | "hair"
  | "hat"
  | "accessory"
  | "pet"
  | "background"
  | "special";

export interface AvatarAsset {
  id: string;
  category: AvatarCategory;
  owner: "sister" | "younger" | "both";
  label: string;
  imagePath: string;
  thumbPath: string;
  rarity?: Rarity;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  starter?: boolean;
}

export interface AvatarConfig {
  outfitId: string;
  hairId: string;
  hatId?: string;
  accessoryId?: string;
  petId?: string;
  backgroundId?: string;
  specialId?: string;
}

export interface DailyRecord {
  stamps: Record<string, string>;
  myMissionLabel?: string;
  completed: boolean;
  gachaPulled: boolean;
  recovered?: boolean;
  recoveryMissionId?: string;
}

export interface WeekState {
  weekStartDate: string;
  completedDays: number;
  weeklyBonusGiven: boolean;
  recoveryUsedThisWeek: number;
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
  monthlyRewardGiven: Record<string, boolean>;
  specialGachaTickets: number;
}

export interface AppSettings {
  pinHash: string | null;
  yenPerPoint: number;
  weeklyYenCap: number | null;
  appVersion: string;
  recoveryMissions: RecoveryMissionDef[];
  recoveryWeeklyLimit: number;
  recoveryGrantsGacha: boolean;
  monthlyGoalDays: number;
  monthlyRewardPoints: number;
}

export interface SaveData {
  schemaVersion: number;
  activeProfileId: string;
  settings: AppSettings;
  profiles: Profile[];
}
