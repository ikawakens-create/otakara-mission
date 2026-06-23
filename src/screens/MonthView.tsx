import { useState } from "react";
import type { Profile, AppSettings } from "../types";
import {
  getMonthCalendar,
  getMonthKeyForOffset,
  getTodayKey,
} from "../lib/date";
import {
  getDayStatus,
  getMissionMonthRate,
  getMonthCompleteDays,
  getMonthRecoveryDays,
} from "../lib/stats";
import { isRecoveryCandidate, recoveryRemaining, applyRecovery } from "../lib/recovery";
import { checkAndApplyMonthlyReward, getMonthlyProgress } from "../lib/monthly";
import DayDetail from "../components/DayDetail";
import RecoveryPicker from "../components/RecoveryPicker";
import styles from "./MonthView.module.css";

const NIGITE_THRESHOLD = 0.5;
const DAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"];

interface Props {
  profile: Profile;
  settings: AppSettings;
  onUpdateProfile: (p: Profile) => void;
}

export default function MonthView({ profile, settings, onUpdateProfile }: Props) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [recoveryTarget, setRecoveryTarget] = useState<string | null>(null);
  const [justAwarded, setJustAwarded] = useState(false);

  const today = getTodayKey();
  const monthKey = getMonthKeyForOffset(monthOffset);
  const [year, month] = monthKey.split("-").map(Number);
  const calDays = getMonthCalendar(year, month);
  const completeDays = getMonthCompleteDays(profile, year, month);
  const recoveryDays = getMonthRecoveryDays(profile, year, month);
  const { goalDays, given } = getMonthlyProgress(profile, year, month, settings);

  // 月間報酬の自動チェック（現在月のみ）
  const isCurrentMonth = monthOffset === 0;
  if (isCurrentMonth && !given && completeDays >= goalDays) {
    const { profile: newP, awarded } = checkAndApplyMonthlyReward(profile, year, month, settings);
    if (awarded) {
      onUpdateProfile(newP);
      setJustAwarded(true);
    }
  }

  function handleDayTap(dk: string) {
    if (dk > today) return;
    setSelectedDay(dk);
  }

  function handleRecoverySelect(missionId: string) {
    if (!recoveryTarget) return;
    const updated = applyRecovery(profile, recoveryTarget, missionId, settings);
    onUpdateProfile(updated);
    setRecoveryTarget(null);
  }

  const remaining = recoveryRemaining(profile, settings);

  return (
    <div className={styles.container}>
      {/* 月ナビ */}
      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={() => setMonthOffset((o) => o - 1)}>‹</button>
        <span className={styles.navLabel}>{year}ねん {month}がつ</span>
        <button
          className={styles.navBtn}
          disabled={monthOffset >= 0}
          onClick={() => setMonthOffset((o) => o + 1)}
        >›</button>
      </div>

      {/* サマリー */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryTitle}>こんげつのせいせき</div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryCount}>{completeDays}/{goalDays}</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${Math.min((completeDays / goalDays) * 100, 100)}%` }} />
          </div>
          <span className={styles.progressLabel}>
            {given ? "🎁 げっかんごほうびもらった！" : `あと${Math.max(0, goalDays - completeDays)}日`}
          </span>
        </div>
        {recoveryDays > 0 && (
          <div className={styles.summaryExtra}>⭐ リカバリー達成 {recoveryDays}日</div>
        )}
        {(justAwarded || (given && isCurrentMonth)) && (
          <div className={styles.rewardBanner}>
            🎁 げっかんごほうび！ +{settings.monthlyRewardPoints}pt ＋ がちゃけん1まい！
          </div>
        )}
      </div>

      {/* カレンダー */}
      <div className={styles.calendar}>
        <div className={styles.calHeader}>
          {DAY_HEADERS.map((h) => (
            <div key={h} className={styles.calHeaderCell}>{h}</div>
          ))}
        </div>
        <div className={styles.calGrid}>
          {calDays.map((dk, i) => {
            if (!dk) return <div key={i} className={`${styles.calDay} ${styles.empty}`} />;
            const record = profile.dailyRecords[dk];
            const status = getDayStatus(record, profile.missions.length, dk, today);
            const dayNum = Number(dk.split("-")[2]);
            const isToday = dk === today;
            const isCandidate = isRecoveryCandidate(profile, dk, today);
            return (
              <div
                key={dk}
                className={[
                  styles.calDay,
                  styles[status],
                  isToday ? styles.calToday : "",
                ].join(" ")}
                onClick={() => handleDayTap(dk)}
              >
                {dayNum}
                {isCandidate && <span style={{ position: "absolute", bottom: 0, right: 2, fontSize: "0.55rem" }}>⭐</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: "#ffd700" }} />
          コンプリート
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: "#c0c0c0" }} />
          リカバリー
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: "#ffe0ef" }} />
          一部達成
        </div>
      </div>

      {/* ミッション別達成率 */}
      <div className={styles.rateSection}>
        <div className={styles.rateSectionTitle}>ミッションべつ達成率（今月）</div>
        {profile.missions.map((m) => {
          const rate = getMissionMonthRate(profile, m.id, year, month);
          const isNigite = rate < NIGITE_THRESHOLD;
          return (
            <div key={m.id} className={styles.rateRow}>
              <span className={styles.rateEmoji}>{m.emoji}</span>
              <span className={styles.rateLabel}>{m.label}</span>
              <div className={styles.rateBar}>
                <div
                  className={`${styles.rateBarFill}${isNigite ? " " + styles.nigite : ""}`}
                  style={{ width: `${Math.round(rate * 100)}%` }}
                />
              </div>
              <span className={styles.rateValue}>{Math.round(rate * 100)}%</span>
              {isNigite && <span className={styles.nigateMark}>にがて</span>}
            </div>
          );
        })}
      </div>

      {/* 日詳細モーダル */}
      {selectedDay && (
        <DayDetail
          dateKey={selectedDay}
          profile={profile}
          settings={settings}
          onClose={() => setSelectedDay(null)}
          onOpenRecovery={(dk) => {
            setSelectedDay(null);
            setRecoveryTarget(dk);
          }}
        />
      )}

      {/* リカバリーピッカー */}
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
