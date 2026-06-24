import { useState } from "react";
import type { Profile, Rarity } from "../types";
import { RARITY_VISUALS, CAPSULE_CSS_COLORS } from "../data/gachaVisuals";
import { type ScenarioId } from "../data/gachaScenarios";
import { getTodayKey } from "../lib/date";
import GachaScreen from "./Gacha";
import styles from "./TestGacha.module.css";

const RARITIES: Rarity[] = [
  "normal",
  "rare",
  "super_rare",
  "ultra_rare",
  "rainbow",
  "legend",
  "diamond",
];

const SCENARIOS: Array<{ id: ScenarioId | null; label: string }> = [
  { id: null,        label: "🎲 ランダム" },
  { id: "standard",  label: "王道" },
  { id: "reversal",  label: "大逆転" },
  { id: "fakeout",   label: "ガセ" },
  { id: "guaranteed", label: "確定" },
];

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function TestGacha({ profile, onBack }: Props) {
  const [selectedRarity, setSelectedRarity] = useState<Rarity | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(null);
  const [gachaOpen, setGachaOpen] = useState(false);

  function openGacha(rarity: Rarity | null) {
    setSelectedRarity(rarity);
    setGachaOpen(true);
  }

  if (gachaOpen) {
    return (
      <GachaScreen
        profile={profile}
        pullReason="complete"
        dateKey={getTodayKey()}
        onSave={() => {}}
        onClose={() => setGachaOpen(false)}
        forcedRarity={selectedRarity ?? undefined}
        forcedScenario={selectedScenario ?? undefined}
        dryRun={true}
      />
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <span className={styles.headerTitle}>🎬 演出をテスト</span>
      </header>

      <div className={styles.body}>
        <p className={styles.hint}>レア度を選んで演出をかくにん！ データは変わりません。</p>

        <div className={styles.rarityGrid}>
          {RARITIES.map((rarity) => {
            const visual = RARITY_VISUALS[rarity];
            const bgColor = CAPSULE_CSS_COLORS[visual.capsule];
            return (
              <button
                key={rarity}
                className={styles.rarityBtn}
                style={{ background: bgColor, boxShadow: `0 4px 14px ${visual.glowColor}88` }}
                onClick={() => openGacha(rarity)}
              >
                {visual.label}
              </button>
            );
          })}

          <button className={styles.randomBtn} onClick={() => openGacha(null)}>
            🎲 ランダム
          </button>
        </div>

        <p className={styles.sectionLabel}>シナリオ</p>
        <div className={styles.scenarioGrid}>
          {SCENARIOS.map(({ id, label }) => (
            <button
              key={id ?? "random"}
              className={
                styles.scenarioBtn +
                (selectedScenario === id ? " " + styles.scenarioBtnActive : "")
              }
              onClick={() => setSelectedScenario(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
