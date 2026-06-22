import { useRef, useState } from "react";
import type { MissionDef, StampDef } from "../types";
import styles from "./MissionCard.module.css";

const LONG_PRESS_MS = 700;

interface Props {
  mission: MissionDef;
  stampedAsset: string | undefined;
  myMissionLabel?: string;
  onTap: () => void;
  onRemoveStamp: () => void;
  onUpdateMyMissionLabel?: (label: string) => void;
  ownedStamps: StampDef[];
}

export default function MissionCard({
  mission,
  stampedAsset,
  myMissionLabel,
  onTap,
  onRemoveStamp,
  onUpdateMyMissionLabel,
  ownedStamps: _ownedStamps,
}: Props) {
  const isStamped = Boolean(stampedAsset);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);

  const startPress = () => {
    if (!isStamped) return;
    setPressing(true);
    timerRef.current = setTimeout(() => {
      setPressing(false);
      onRemoveStamp();
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPressing(false);
  };

  const handleCardClick = () => {
    if (isStamped) return;
    if (mission.editableLabel && !myMissionLabel?.trim()) {
      setEditingLabel(true);
      return;
    }
    onTap();
  };

  const displayLabel =
    mission.editableLabel
      ? myMissionLabel?.trim() || "なにをするか きめよう…"
      : mission.label;

  return (
    <div
      className={`${styles.card}${isStamped ? " " + styles.stamped : ""}`}
      onPointerDown={isStamped ? startPress : undefined}
      onPointerUp={isStamped ? cancelPress : undefined}
      onPointerLeave={isStamped ? cancelPress : undefined}
      onClick={handleCardClick}
    >
      {pressing && (
        <div
          className={styles.longPressProgress}
          style={{ width: "100%", transitionDuration: `${LONG_PRESS_MS}ms` }}
        />
      )}

      <span className={styles.missionEmoji}>{mission.emoji}</span>

      <div className={styles.content}>
        {mission.editableLabel && editingLabel ? (
          <input
            className={styles.labelInput}
            autoFocus
            placeholder="ミッションを かいてね"
            defaultValue={myMissionLabel ?? ""}
            onBlur={(e) => {
              const val = e.target.value.trim();
              onUpdateMyMissionLabel?.(val);
              setEditingLabel(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div
              className={styles.label}
              onClick={
                mission.editableLabel && !isStamped
                  ? (e) => { e.stopPropagation(); setEditingLabel(true); }
                  : undefined
              }
            >
              {displayLabel}
            </div>
            {mission.doublePoints && !isStamped && (
              <div className={styles.hint}>✨ 2ばいポイント</div>
            )}
            {isStamped && (
              <div className={styles.longPressHint}>ながおしでとりけし</div>
            )}
          </>
        )}
      </div>

      <div className={styles.stampArea}>
        {isStamped ? stampedAsset : ""}
      </div>
    </div>
  );
}
