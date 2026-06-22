import type { Profile } from "../types";
import styles from "./ProfileSelect.module.css";

interface Props {
  profiles: Profile[];
  activeId: string;
  onSelect: (id: string) => void;
}

const AVATAR_EMOJI: Record<string, string> = {
  sister: "👧",
  younger: "🧒",
};

export default function ProfileSelect({ profiles, activeId, onSelect }: Props) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎁 おたからミッション</h1>
      <p className={styles.subtitle}>だれがつかうかな？</p>
      <div className={styles.cards}>
        {profiles.map((p) => (
          <button
            key={p.id}
            className={`${styles.card}${p.id === activeId ? " " + styles.selected : ""}`}
            onClick={() => onSelect(p.id)}
          >
            <span className={styles.avatar}>{AVATAR_EMOJI[p.id] ?? "👧"}</span>
            <span className={styles.name}>{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
