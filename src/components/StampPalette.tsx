import { useEffect } from "react";
import type { StampDef } from "../types";
import styles from "./StampPalette.module.css";

interface Props {
  stamps: StampDef[];
  onSelect: (stamp: StampDef) => void;
  onClose: () => void;
}

export default function StampPalette({ stamps, onSelect, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <p className={styles.title}>すたんぷを えらんでね 🎉</p>
        <div className={styles.grid}>
          {stamps.map((s) => (
            <button
              key={s.id}
              className={styles.stampBtn}
              onClick={() => onSelect(s)}
            >
              <span className={styles.stampEmoji}>{s.asset}</span>
              <span className={styles.stampName}>{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
