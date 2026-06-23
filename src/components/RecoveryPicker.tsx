import type { AppSettings } from "../types";
import styles from "./RecoveryPicker.module.css";

interface Props {
  dateKey: string;
  settings: AppSettings;
  remaining: number;
  onSelect: (recoveryMissionId: string) => void;
  onClose: () => void;
}

export default function RecoveryPicker({
  dateKey,
  settings,
  remaining,
  onSelect,
  onClose,
}: Props) {
  const [y, m, d] = dateKey.split("-").map(Number);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.title}>⭐ リカバリー</div>
        <div className={styles.sub}>
          {m}がつ{d}にち（{y}）のミッションを とりかえそう
        </div>
        <div className={styles.badge}>のこり {remaining}かい つかえます</div>

        {remaining === 0 ? (
          <div className={styles.limitMsg}>
            今週のリカバリーは {settings.recoveryWeeklyLimit}かい つかいました。
            来週また つかえます！
          </div>
        ) : (
          <div className={styles.list}>
            {settings.recoveryMissions.map((rm) => (
              <button
                key={rm.id}
                className={styles.item}
                onClick={() => onSelect(rm.id)}
              >
                <span className={styles.emoji}>{rm.emoji}</span>
                <span className={styles.label}>{rm.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
