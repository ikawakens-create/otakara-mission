import { useState, useEffect, useCallback } from "react";
import type { SaveData } from "./types";
import { loadSaveData, saveSaveData } from "./lib/storage";
import ProfileSelect from "./screens/ProfileSelect";
import Home from "./screens/Home";
import "./styles/global.css";

type Screen = "profileSelect" | "home";

export default function App() {
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [screen, setScreen] = useState<Screen>("home");

  useEffect(() => {
    setSaveData(loadSaveData());
  }, []);

  useEffect(() => {
    if (saveData) saveSaveData(saveData);
  }, [saveData]);

  const handleUpdate = useCallback((updated: SaveData) => {
    setSaveData(updated);
  }, []);

  const handleProfileSelect = useCallback(
    (id: string) => {
      if (!saveData) return;
      setSaveData({ ...saveData, activeProfileId: id });
      setScreen("home");
    },
    [saveData]
  );

  if (!saveData) return null;

  if (screen === "profileSelect") {
    return (
      <ProfileSelect
        profiles={saveData.profiles}
        activeId={saveData.activeProfileId}
        onSelect={handleProfileSelect}
      />
    );
  }

  return (
    <Home
      saveData={saveData}
      onUpdate={handleUpdate}
      onSwitchProfile={() => setScreen("profileSelect")}
    />
  );
}
