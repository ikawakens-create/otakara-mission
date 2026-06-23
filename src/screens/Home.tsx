import { useState } from "react";
import type { Profile, SaveData, StampDef } from "../types";
import { STAMPS } from "../data/stamps";
import { isAllComplete } from "../lib/complete";
import { formatDateJa, getTodayKey, getWeekStartDate, isNewWeek } from "../lib/date";
import { canPullOnDate, findPendingRecoveryDate, canPullTicket } from "../lib/gacha";
import MissionCard from "../components/MissionCard";
import StampPalette from "../components/StampPalette";
import TabBar, { type HomeTab } from "../components/TabBar";
import WeekView from "./WeekView";
import MonthView from "./MonthView";
import GachaScreen, { type PullReason } from "./Gacha";
import styles from "./Home.module.css";

const AVATAR_EMOJI: Record<string, string> = {
  sister: "👧",
  younger: "🧒",
};

interface Props {
  saveData: SaveData;
  onUpdate: (updated: SaveData) => void;
  onSwitchProfile: () => void;
  onOpenParentSettings: () => void;
}

export default function Home({ saveData, onUpdate, onSwitchProfile, onOpenParentSettings }: Props) {
  const [paletteForMissionId, setPaletteForMissionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<HomeTab>("today");
  const [gachaState, setGachaState] = useState<{
    pullReason: PullReason;
    dateKey: string;
  } | null>(null);

  const today = getTodayKey();

  // 週またぎリセット
  let resolvedData = saveData;
  const profile: Profile =
    resolvedData.profiles.find((p) => p.id === resolvedData.activeProfileId) ??
    resolvedData.profiles[0];

  if (isNewWeek(profile.weekState.weekStartDate, today)) {
    const newWeekStart = getWeekStartDate(today);
    const updatedProfile: Profile = {
      ...profile,
      weekState: {
        weekStartDate: newWeekStart,
        completedDays: 0,
        weeklyBonusGiven: false,
        recoveryUsedThisWeek: 0,
      },
    };
    resolvedData = {
      ...saveData,
      profiles: saveData.profiles.map((p) =>
        p.id === updatedProfile.id ? updatedProfile : p
      ),
    };
    if (resolvedData !== saveData) onUpdate(resolvedData);
  }

  const currentProfile: Profile =
    resolvedData.profiles.find((p) => p.id === resolvedData.activeProfileId) ??
    resolvedData.profiles[0];

  const todayRecord = currentProfile.dailyRecords[today] ?? {
    stamps: {},
    completed: false,
    gachaPulled: false,
  };

  const ownedStamps: StampDef[] = STAMPS.filter((s) =>
    currentProfile.ownedStampIds.includes(s.id)
  );

  const allComplete = isAllComplete(currentProfile.missions, todayRecord);
  const stampedCount = Object.keys(todayRecord.stamps).length;
  const totalCount = currentProfile.missions.length;

  const dailyGachaAvailable = canPullOnDate(
    currentProfile,
    today,
    resolvedData.settings.recoveryGrantsGacha
  );
  const recoveryGachaDate = findPendingRecoveryDate(
    currentProfile,
    resolvedData.settings.recoveryGrantsGacha,
    today
  );
  const ticketGachaAvailable = canPullTicket(currentProfile);

  function openGacha(pullReason: PullReason, dateKey: string) {
    setGachaState({ pullReason, dateKey });
  }

  function handleGachaSave(updated: Profile) {
    onUpdate({
      ...resolvedData,
      profiles: resolvedData.profiles.map((p) => (p.id === updated.id ? updated : p)),
    });
  }

  function handleGachaClose() {
    setGachaState(null);
  }

  function updateProfile(updated: Profile): void {
    onUpdate({
      ...resolvedData,
      profiles: resolvedData.profiles.map((p) => (p.id === updated.id ? updated : p)),
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

    const nowComplete = isAllComplete(currentProfile.missions, newRecord);
    newRecord.completed = nowComplete;

    let newPoints = { ...currentProfile.points };
    if (nowComplete && !todayRecord.completed) {
      newPoints = {
        total: currentProfile.points.total + 1,
        thisWeek: currentProfile.points.thisWeek + 1,
      };
    }

    updateProfile({
      ...currentProfile,
      points: newPoints,
      dailyRecords: { ...currentProfile.dailyRecords, [today]: newRecord },
    });
  }

  function handleRemoveStamp(missionId: string) {
    const newStamps = { ...todayRecord.stamps };
    delete newStamps[missionId];
    const newRecord = { ...todayRecord, stamps: newStamps, completed: false };
    updateProfile({
      ...currentProfile,
      dailyRecords: { ...currentProfile.dailyRecords, [today]: newRecord },
    });
  }

  function handleUpdateMyMissionLabel(_missionId: string, label: string) {
    const newRecord = { ...todayRecord, myMissionLabel: label };
    updateProfile({
      ...currentProfile,
      dailyRecords: { ...currentProfile.dailyRecords, [today]: newRecord },
    });
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.appTitle}>🎁 おたからミッション</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={styles.switchBtn} onClick={onOpenParentSettings} title="おうちのひとモード">
              🔒
            </button>
            <button className={styles.switchBtn} onClick={onSwitchProfile}>
              きりかえ
            </button>
          </div>
        </div>

        <div className={styles.profileRow}>
          <div className={styles.avatarCircle}>
            {AVATAR_EMOJI[currentProfile.id] ?? "👧"}
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{currentProfile.name}</div>
            <div className={styles.dateText}>{formatDateJa(today)}</div>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{currentProfile.points.total}</span>
            <span className={styles.statLabel}>ポイント</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{currentProfile.points.thisWeek}</span>
            <span className={styles.statLabel}>今週</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{currentProfile.kakera}</span>
            <span className={styles.statLabel}>かけら</span>
          </div>
          {currentProfile.specialGachaTickets > 0 && (
            <div className={styles.statItem}>
              <span className={styles.statValue}>{currentProfile.specialGachaTickets}</span>
              <span className={styles.statLabel}>がちゃけん</span>
            </div>
          )}
        </div>
      </header>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === "today" && (
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

          {/* ガチャセクション */}
          {dailyGachaAvailable && (
            <div className={styles.gachaCard}>
              <div className={styles.gachaCardTitle}>🎊 ガチャを引こう！</div>
              <button
                className={styles.gachaBtn}
                onClick={() => openGacha(
                  todayRecord.recovered ? "recovery" : "complete",
                  today
                )}
              >
                ガチャを引く！
              </button>
            </div>
          )}

          {recoveryGachaDate && (
            <div className={styles.gachaCard}>
              <div className={styles.gachaCardTitle}>⭐ リカバリーごほうびガチャ！</div>
              <button
                className={`${styles.gachaBtn} ${styles.gachaBtnRecovery}`}
                onClick={() => openGacha("recovery", recoveryGachaDate)}
              >
                ガチャを引く！
              </button>
            </div>
          )}

          {ticketGachaAvailable && (
            <div className={styles.gachaCard}>
              <div className={styles.gachaCardTitle}>
                🎫 スペシャルけん（{currentProfile.specialGachaTickets}まい）
              </div>
              <button
                className={`${styles.gachaBtn} ${styles.gachaBtnTicket}`}
                onClick={() => openGacha("ticket", today)}
              >
                けんで引く！
              </button>
            </div>
          )}

          <div className={styles.missionList}>
            {currentProfile.missions.map((mission) => {
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
      )}

      {activeTab === "week" && (
        <WeekView
          profile={currentProfile}
          settings={resolvedData.settings}
          onUpdateProfile={updateProfile}
        />
      )}

      {activeTab === "month" && (
        <MonthView
          profile={currentProfile}
          settings={resolvedData.settings}
          onUpdateProfile={updateProfile}
        />
      )}

      {paletteForMissionId && (
        <StampPalette
          stamps={ownedStamps}
          onSelect={handleStampSelect}
          onClose={() => setPaletteForMissionId(null)}
        />
      )}

      {gachaState && (
        <GachaScreen
          profile={currentProfile}
          pullReason={gachaState.pullReason}
          dateKey={gachaState.dateKey}
          onSave={handleGachaSave}
          onClose={handleGachaClose}
        />
      )}
    </div>
  );
}
