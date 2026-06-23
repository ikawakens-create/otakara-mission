import type { Profile, AppSettings } from "../types";
import { STAMPS } from "../data/stamps";
import { isRecoveryCandidate, recoveryRemaining } from "../lib/recovery";
import { getTodayKey } from "../lib/date";
import styles from "./DayDetail.module.css";

interface Props {
  dateKey: string;
  profile: Profile;
  settings: AppSettings;
  onClose: () => void;
  onOpenRecovery: (dateKey: string) => void;
}

export default function DayDetail({
  dateKey,
  profile,
  settings,
  onClose,
  onOpenRecovery,
}: Props) {
  const record = profile.dailyRecords[dateKey];
  const today = getTodayKey();
  const canRecover = isRecoveryCandidate(profile, dateKey, today);
  const remaining = recoveryRemaining(profile, settings);

  const [y, m, d] = dateKey.split("-").map(Number);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>
            {m}がつ {d}にち（{y}）
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {record?.completed && !record.recovered && (
          <span className={`${styles.statusBadge} ${styles.complete}`}>🌟 コンプリート！</span>
        )}
        {record?.recovered && (
          <span className={`${styles.statusBadge} ${styles.recovered}`}>⭐ リカバリー達成</span>
        )}

        <div className={styles.missionList}>
          {profile.missions.map((mission) => {
            const stampId = record?.stamps[mission.id];
            const stamp = STAMPS.find((s) => s.id === stampId);
            return (
              <div
                key={mission.id}
                className={`${styles.missionRow}${stamp ? " " + styles.done : ""}`}
              >
                <span className={styles.missionEmoji}>{mission.emoji}</span>
                <span className={styles.missionLabel}>{mission.label}</span>
                {stamp && <span className={styles.stampAsset}>{stamp.asset}</span>}
              </div>
            );
          })}
        </div>

        {canRecover && (
          <>
            <button
              className={styles.recoveryBtn}
              onClick={() => {
                onClose();
                onOpenRecovery(dateKey);
              }}
              disabled={remaining === 0}
            >
              ⭐ リカバリーする（のこり{remaining}かい）
            </button>
            {remaining === 0 && (
              <div className={styles.limitMsg}>
                今週のリカバリーは使い切りました。来週また使えます！
              </div>
            )}
            {remaining > 0 && (
              <div className={styles.recoveryHint}>
                がんばったことを おうちのひとに つたえてね
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
