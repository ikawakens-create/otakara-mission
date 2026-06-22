import { useState, useEffect } from "react";
import type { SaveData } from "./types";
import { loadSaveData, saveSaveData } from "./lib/storage";
import { formatDateJa, getTodayKey } from "./lib/date";
import "./styles/global.css";

export default function App() {
  const [saveData, setSaveData] = useState<SaveData | null>(null);

  useEffect(() => {
    setSaveData(loadSaveData());
  }, []);

  useEffect(() => {
    if (saveData) saveSaveData(saveData);
  }, [saveData]);

  if (!saveData) return null;

  const today = getTodayKey();

  return (
    <div style={{ padding: "24px", maxWidth: "480px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", color: "var(--color-primary)", marginBottom: "8px" }}>
        🎁 おたからミッション
      </h1>
      <p style={{ color: "var(--color-text-light)", marginBottom: "24px" }}>
        {formatDateJa(today)}
      </p>
      <p style={{ fontSize: "1rem", color: "var(--color-text)" }}>
        ようこそ！アプリのきばんができました。
      </p>
      <p style={{ fontSize: "0.875rem", color: "var(--color-text-light)", marginTop: "8px" }}>
        スキーマバージョン: {saveData.schemaVersion}
      </p>
    </div>
  );
}
