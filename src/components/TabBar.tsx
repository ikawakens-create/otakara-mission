import styles from "./TabBar.module.css";

export type HomeTab = "today" | "week" | "month";

const TABS: { key: HomeTab; label: string }[] = [
  { key: "today", label: "きょう" },
  { key: "week", label: "こんしゅう" },
  { key: "month", label: "こんげつ" },
];

interface Props {
  active: HomeTab;
  onChange: (tab: HomeTab) => void;
}

export default function TabBar({ active, onChange }: Props) {
  return (
    <div className={styles.tabBar}>
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`${styles.tab}${active === t.key ? " " + styles.active : ""}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
