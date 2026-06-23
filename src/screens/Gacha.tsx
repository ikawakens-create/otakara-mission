import { useState, useEffect, useRef, useCallback } from "react";
import type { Profile } from "../types";
import {
  drawRarity,
  drawPrize,
  applyGachaResult,
  type GachaResult,
  type PullType,
} from "../lib/gacha";
import { soundPull, soundMachine, soundCapsule, soundReveal } from "../lib/sounds";
import { RARITY_VISUALS } from "../data/gachaVisuals";
import styles from "./Gacha.module.css";

type AnimPhase = "silhouette" | "machine" | "handle" | "capsule" | "open" | "reveal";
const ANIM_PHASES: AnimPhase[] = ["silhouette", "machine", "handle", "capsule", "open", "reveal"];

function getPhaseDuration(phase: AnimPhase, level: number): number {
  const base: Record<AnimPhase, number> = {
    silhouette: 700,
    machine: 900,
    handle: 800,
    capsule: 900,
    open: 650,
    reveal: 1000,
  };
  // 高レア度ほどカプセル落下・フィニッシュが長くなる
  const extra = phase === "capsule" ? level * 80 : phase === "reveal" ? level * 120 : 0;
  return base[phase] + extra;
}

export type PullReason = "complete" | "recovery" | "ticket";

interface Props {
  profile: Profile;
  pullReason: PullReason;
  dateKey: string;
  onSave: (updated: Profile) => void;
  onClose: () => void;
}

const REASON_LABEL: Record<PullReason, string> = {
  complete: "🎊 コンプリートごほうびガチャ！",
  recovery: "⭐ リカバリーごほうびガチャ！",
  ticket: "🎫 スペシャルけんガチャ！",
};

export default function GachaScreen({ profile, pullReason, dateKey, onSave, onClose }: Props) {
  const pullType: PullType = pullReason === "ticket" ? "ticket" : "daily";

  const [screenPhase, setScreenPhase] = useState<"intro" | "animating" | "result">("intro");
  const [animPhase, setAnimPhase] = useState<AnimPhase>("silhouette");
  const [result, setResult] = useState<GachaResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const handlePull = useCallback(() => {
    const rarity = drawRarity();
    const res = drawPrize(rarity, profile);
    const updated = applyGachaResult(profile, res, pullType, dateKey);
    onSave(updated);
    setResult(res);
    setScreenPhase("animating");
    setAnimPhase("silhouette");
    soundPull();
    if (navigator.vibrate) navigator.vibrate(60);
  }, [profile, pullType, dateKey, onSave]);

  const skipToResult = useCallback(() => {
    clearTimer();
    setScreenPhase("result");
  }, [clearTimer]);

  useEffect(() => {
    if (screenPhase !== "animating" || !result) return;

    const level = RARITY_VISUALS[result.rarity].level;

    if (animPhase === "machine") soundMachine();
    else if (animPhase === "capsule") soundCapsule();
    else if (animPhase === "reveal") soundReveal(level);

    const duration = getPhaseDuration(animPhase, level);
    const idx = ANIM_PHASES.indexOf(animPhase);

    timerRef.current = setTimeout(() => {
      if (idx < ANIM_PHASES.length - 1) {
        setAnimPhase(ANIM_PHASES[idx + 1]);
      } else {
        setScreenPhase("result");
      }
    }, duration);

    return clearTimer;
  }, [screenPhase, animPhase, result, clearTimer]);

  function renderIntro() {
    const ticketCount = profile.specialGachaTickets;
    return (
      <div className={styles.intro}>
        <div className={styles.machineEmoji} aria-hidden>🎰</div>
        <div className={styles.introReason}>{REASON_LABEL[pullReason]}</div>
        {pullReason === "ticket" && (
          <div className={styles.introSub}>のこり {ticketCount}まい</div>
        )}
        <button className={styles.pullBtn} onClick={handlePull}>
          ガチャを引く！
        </button>
        <button className={styles.cancelBtn} onClick={onClose}>
          やめる
        </button>
      </div>
    );
  }

  function renderAnim() {
    if (!result) return null;
    const visual = RARITY_VISUALS[result.rarity];
    const glowStyle =
      visual.level > 0
        ? { boxShadow: `0 0 32px ${visual.glowColor}, 0 0 64px ${visual.glowColor}` }
        : undefined;
    const filterStyle =
      visual.level > 0
        ? { filter: `drop-shadow(0 0 16px ${visual.glowColor})` }
        : undefined;

    return (
      <div className={styles.sceneWrap} onClick={skipToResult} role="button" aria-label="とばす">
        {animPhase === "silhouette" && (
          <div className={styles.sceneCenter}>
            <div className={styles.silhouette}>
              <span className={styles.silhouetteQ}>❓</span>
            </div>
            <p className={styles.sceneHint}>なにがでるかな…</p>
          </div>
        )}

        {animPhase === "machine" && (
          <div className={styles.sceneCenter}>
            <div className={styles.machineAppear} aria-hidden>🎰</div>
            <p className={styles.sceneHint}>ガチャガチャ…</p>
          </div>
        )}

        {animPhase === "handle" && (
          <div className={styles.sceneCenter}>
            <div className={styles.handleRow}>
              <span className={styles.machineEmoji2} aria-hidden>🎰</span>
              <span className={styles.handleSpin} aria-hidden>🔄</span>
            </div>
            <p className={styles.sceneHint}>まわすよ！</p>
          </div>
        )}

        {animPhase === "capsule" && (
          <div className={styles.sceneCenter}>
            <div
              className={styles.capsuleFall}
              style={{ backgroundColor: visual.capsuleColor, ...glowStyle }}
            />
            <p className={styles.sceneHint}>でてきた！</p>
          </div>
        )}

        {animPhase === "open" && (
          <div className={styles.sceneCenter}>
            <div
              className={styles.capsuleOpen}
              style={{ borderColor: visual.capsuleColor, ...glowStyle }}
            >
              <span className={styles.capsuleOpenInner} aria-hidden>✨</span>
            </div>
            <p className={styles.sceneHint}>あけるよ…</p>
          </div>
        )}

        {animPhase === "reveal" && (
          <div className={styles.sceneCenter}>
            <div className={styles.prizeReveal} style={filterStyle} aria-hidden>
              {result.prizeAsset}
            </div>
            <p className={styles.revealRarity} style={{ color: visual.capsuleColor }}>
              {visual.label}
            </p>
          </div>
        )}

        <button className={styles.skipBtn} onClick={(e) => { e.stopPropagation(); skipToResult(); }}>
          とばす ▶
        </button>
      </div>
    );
  }

  function renderResult() {
    if (!result) return null;
    const visual = RARITY_VISUALS[result.rarity];
    const glowStyle =
      visual.level > 0
        ? { boxShadow: `0 0 20px ${visual.glowColor}` }
        : undefined;
    const filterStyle =
      visual.level > 0
        ? { filter: `drop-shadow(0 0 20px ${visual.glowColor})` }
        : undefined;

    return (
      <div className={styles.result}>
        <div
          className={styles.rarityBadge}
          style={{ backgroundColor: visual.capsuleColor, ...glowStyle }}
        >
          {visual.label}
        </div>

        <div className={styles.resultPrize} style={filterStyle} aria-hidden>
          {result.prizeAsset}
        </div>

        <p className={styles.resultName}>{result.prizeName}</p>

        {result.isDuplicate && (
          <div className={styles.duplicateMsg}>
            ダブリ！ かけら +{result.kakeraAwarded}
          </div>
        )}

        {result.prizeKind === "points" && !result.isDuplicate && (
          <div className={styles.pointsMsg}>
            ポイント +{result.prizePoints}
          </div>
        )}

        <button className={styles.closeBtn} onClick={onClose}>
          とじる
        </button>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      {screenPhase === "intro" && renderIntro()}
      {screenPhase === "animating" && renderAnim()}
      {screenPhase === "result" && renderResult()}
    </div>
  );
}
