import { useState } from "react";
import type { Profile, SaveData, StampDef } from "../types";
import { STAMPS } from "../data/stamps";
import { isAllComplete } from "../lib/complete";
import { formatDateJa, getTodayKey } from "../lib/date";
import MissionCard from "../components/MissionCard";
import StampPalette from "../components/StampPalette";
import styles from "./Home.module.css";

const AVATAR_EMOJI: Record<string, string> = {
  sister: "👧",
  younger: "🧒",
};

interface Props {
  saveData: SaveData;
  onUpdate: (updated: SaveData) => void;
  onSwitchProfile: () => void;
}

export default function Home({ saveData, onUpdate, onSwitchProfile }: Props) {
  const [paletteForMissionId, setPaletteForMissionId] = useState<string | null>(null);

  const profile: Profile =
    saveData.profiles.find((p) => p.id === saveData.activeProfileId) ??
    saveData.profiles[0];

  const today = getTodayKey();
  const todayRecord = profile.dailyRecords[today] ?? {
    stamps: {},
    completed: false,
    gachaPulled: false,
  };

  const ownedStamps: StampDef[] = STAMPS.filter((s) =>
    profile.ownedStampIds.includes(s.id)
  );

  const allComplete = isAllComplete(profile.missions, todayRecord);
  const stampedCount = Object.keys(todayRecord.stamps).length;
  const totalCount = profile.missions.length;

  function updateProfile(updated: Profile): void {
    onUpdate({
      ...saveData,
      profiles: saveData.profiles.map((p) => (p.id === updated.id ? updated : p)),
    });
  }

  function handleStampSelect(stampDef: StampDef) {
    if (!paletteForMissionId) return;
    const missionId = paletteForMissionId;
    setPaletteForMissionId(null);

    const newRecord = {
      ...todayRecord,
      stamps: { ...todayRecord.stamps, [missionId]: stampDef.id },
    };

    const updatedMissions = profile.missions;
    const nowComplete = isAllComplete(updatedMissions, newRecord);
    newRecord.completed = nowComplete;

    let newPoints = { ...profile.points };
    if (nowComplete && !todayRecord.completed) {
      newPoints = {
        total: profile.points.total + 1,
        thisWeek: profile.points.thisWeek + 1,
      };
    }

    updateProfile({
      ...profile,
      points: newPoints,
      dailyRecords: { ...profile.dailyRecords, [today]: newRecord },
    });
  }

  function handleRemoveStamp(missionId: string) {
    const newStamps = { ...todayRecord.stamps };
    delete newStamps[missionId];
    const newRecord = {
      ...todayRecord,
      stamps: newStamps,
      completed: false,
    };
    updateProfile({
      ...profile,
      dailyRecords: { ...profile.dailyRecords, [today]: newRecord },
    });
  }

  function handleUpdateMyMissionLabel(_missionId: string, label: string) {
    const newRecord = { ...todayRecord, myMissionLabel: label };
    updateProfile({
      ...profile,
      dailyRecords: { ...profile.dailyRecords, [today]: newRecord },
    });
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.appTitle}>🎁 おたからミッション</span>
          <button className={styles.switchBtn} onClick={onSwitchProfile}>
            きりかえ
          </button>
        </div>

        <div className={styles.profileRow}>
          <div className={styles.avatarCircle}>
            {AVATAR_EMOJI[profile.id] ?? "👧"}
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{profile.name}</div>
            <div className={styles.dateText}>{formatDateJa(today)}</div>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{profile.points.total}</span>
            <span className={styles.statLabel}>ポイント</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{profile.points.thisWeek}</span>
            <span className={styles.statLabel}>今週</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{profile.kakera}</span>
            <span className={styles.statLabel}>かけら</span>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.progressRow}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${totalCount > 0 ? (stampedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {stampedCount}/{totalCount}
          </span>
        </div>

        {allComplete && (
          <div className={styles.completeBanner}>
            <div className={styles.completeBannerTitle}>🌟 ぜんぶできた！</div>
            <div className={styles.completeBannerSub}>
              すごい！きょうのミッション コンプリート！
            </div>
          </div>
        )}

        <div className={styles.missionList}>
          {profile.missions.map((mission) => {
            const stampId = todayRecord.stamps[mission.id];
            const stampDef = STAMPS.find((s) => s.id === stampId);
            return (
              <MissionCard
                key={mission.id}
                mission={mission}
                stampedAsset={stampDef?.asset}
                myMissionLabel={todayRecord.myMissionLabel}
                ownedStamps={ownedStamps}
                onTap={() => setPaletteForMissionId(mission.id)}
                onRemoveStamp={() => handleRemoveStamp(mission.id)}
                onUpdateMyMissionLabel={(label) =>
                  handleUpdateMyMissionLabel(mission.id, label)
                }
              />
            );
          })}
        </div>
      </div>

      {paletteForMissionId && (
        <StampPalette
          stamps={ownedStamps}
          onSelect={handleStampSelect}
          onClose={() => setPaletteForMissionId(null)}
        />
      )}
    </div>
  );
}
