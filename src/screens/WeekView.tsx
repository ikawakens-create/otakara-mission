import { useState } from "react";
import type { Profile, AppSettings } from "../types";
import { STAMPS } from "../data/stamps";
import {
  getWeekStartForOffset,
  getWeekDays,
  getTodayKey,
  getWeekStartDate,
  DAY_NAMES_JA,
} from "../lib/date";
import { getDayStatus, getMissionWeekRate, getWeekCompleteDays } from "../lib/stats";
import { isRecoveryCandidate, recoveryRemaining, applyRecovery } from "../lib/recovery";
import RecoveryPicker from "../components/RecoveryPicker";
import styles from "./WeekView.module.css";

const WEEKLY_BONUS_DAYS = 5;
const NIGITE_THRESHOLD = 0.5;

interface Props {
  profile: Profile;
  settings: AppSettings;
  onUpdateProfile: (p: Profile) => void;
}

export default function WeekView({ profile, settings, onUpdateProfile }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [recoveryTarget, setRecoveryTarget] = useState<string | null>(null);

  const today = getTodayKey();
  const currentWeekStart = getWeekStartDate(today);
  const weekStart = getWeekStartForOffset(weekOffset);
  const weekDays = getWeekDays(weekStart);
  const isCurrentWeek = weekStart === currentWeekStart;

  const completeDays = getWeekCompleteDays(profile, weekStart);
  const remaining = recoveryRemaining(profile, settings);

  const candidates = weekDays.filter((dk) => isRecoveryCandidate(profile, dk, today));

  function handleRecoverySelect(missionId: string) {
    if (!recoveryTarget) return;
    const updated = applyRecovery(profile, recoveryTarget, missionId, settings);
    onUpdateProfile(updated);
    setRecoveryTarget(null);
  }

  return (
    <div className={styles.container}>
      {/* 週ナビ */}
      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={() => setWeekOffset((o) => o - 1)}>
          ‹
        </button>
        <span className={styles.navLabel}>
          {weekStart.replace(/-/g, "/")} 〜
        </span>
        <button
          className={styles.navBtn}
          disabled={weekOffset >= 0}
          onClick={() => setWeekOffset((o) => o + 1)}
        >
          ›
        </button>
      </div>

      {/* 週サマリー */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryTitle}>こんしゅうの せいせき</div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryCount}>{completeDays}/7</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(completeDays / 7) * 100}%` }}
            />
          </div>
          <span className={styles.progressLabel}>
            {completeDays >= WEEKLY_BONUS_DAYS
              ? "🎉 ウィークリーボーナス達成！"
              : `あと${WEEKLY_BONUS_DAYS - completeDays}日でボーナス`}
          </span>
        </div>
        {isCurrentWeek && remaining > 0 && candidates.length > 0 && (
          <div className={styles.recoveryHint}>
            ⭐ リカバリーチャンス あり（のこり{remaining}かい）
          </div>
        )}
      </div>

      {/* グリッド */}
      <div className={styles.gridWrapper}>
        <table className={styles.grid}>
          <thead>
            <tr>
              <th className={styles.missionHeader}>ミッション</th>
              {weekDays.map((dk, i) => {
                const [, , d] = dk.split("-").map(Number);
                const isToday = dk === today;
                const isWeekend = i >= 5;
                return (
                  <th
                    key={dk}
                    className={`${styles.dayHeader}${isToday ? " " + styles.today : ""}${isWeekend ? " " + styles.weekend : ""}`}
                  >
                    {DAY_NAMES_JA[i]}
                    <br />
                    <span style={{ fontWeight: "normal", fontSize: "0.7rem" }}>{d}</span>
                  </th>
                );
              })}
              <th className={styles.rateHeader}>達成率</th>
            </tr>
          </thead>
          <tbody>
            {profile.missions.map((mission) => {
              const rate = getMissionWeekRate(profile, mission.id, weekStart);
              const isNigite = rate < NIGITE_THRESHOLD;
              return (
                <tr key={mission.id}>
                  <td className={`${styles.missionLabelCell}`}>
                    <div className={styles.missionLabelInner}>
                      <span>{mission.emoji}</span>
                      <span style={{ fontSize: "0.72rem", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80 }}>
                        {mission.label}
                      </span>
                    </div>
                  </td>
                  {weekDays.map((dk) => {
                    const record = profile.dailyRecords[dk];
                    const stampId = record?.stamps[mission.id];
                    const stamp = STAMPS.find((s) => s.id === stampId);
                    const isFuture = dk > today;
                    return (
                      <td key={dk} className={`${styles.cell}${isFuture ? " " + styles.future : ""}`}>
                        {stamp ? stamp.asset : ""}
                      </td>
                    );
                  })}
                  <td className={styles.rateCell}>
                    {Math.round(rate * 100)}%
                    {isNigite && (
                      <div className={styles.nigateMark}>にがて</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className={styles.footerRow}>
              <td />
              {weekDays.map((dk) => {
                const record = profile.dailyRecords[dk];
                const status = getDayStatus(record, profile.missions.length, dk, today);
                return (
                  <td key={dk}>
                    {status === "complete" ? "🌟" : status === "recovered" ? "⭐" : ""}
                  </td>
                );
              })}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* リカバリー候補 */}
      {isCurrentWeek && candidates.length > 0 && (
        <div className={styles.recoveryCandidates}>
          <div className={styles.recoveryCandidatesTitle}>⭐ あと1個の日（リカバリーできます）</div>
          {candidates.map((dk) => {
            const [, m, d] = dk.split("-").map(Number);
            return (
              <div key={dk} className={styles.recoveryItem}>
                <span className={styles.recoveryItemDate}>{m}がつ{d}にち</span>
                <button
                  className={styles.recoveryItemBtn}
                  disabled={remaining === 0}
                  onClick={() => setRecoveryTarget(dk)}
                >
                  リカバリー
                </button>
              </div>
            );
          })}
        </div>
      )}

      {recoveryTarget && (
        <RecoveryPicker
          dateKey={recoveryTarget}
          settings={settings}
          remaining={remaining}
          onSelect={handleRecoverySelect}
          onClose={() => setRecoveryTarget(null)}
        />
      )}
    </div>
  );
}
