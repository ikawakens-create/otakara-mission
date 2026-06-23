import { useState, useEffect, useCallback } from "react";
import type { SaveData } from "./types";
import { loadSaveData, saveSaveData } from "./lib/storage";
import ProfileSelect from "./screens/ProfileSelect";
import Home from "./screens/Home";
import ParentSettings from "./screens/ParentSettings";
import PinPad from "./components/PinPad";
import "./styles/global.css";

type Screen = "profileSelect" | "home" | "pinGate" | "parentSettings";

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

  const handleOpenParentSettings = useCallback(() => {
    if (!saveData) return;
    if (saveData.settings.pinHash) {
      setScreen("pinGate");
    } else {
      setScreen("parentSettings");
    }
  }, [saveData]);

  const handlePinVerified = useCallback(() => {
    setScreen("parentSettings");
  }, []);

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

  if (screen === "parentSettings") {
    return (
      <ParentSettings
        saveData={saveData}
        onUpdate={handleUpdate}
        onBack={() => setScreen("home")}
      />
    );
  }

  return (
    <>
      <Home
        saveData={saveData}
        onUpdate={handleUpdate}
        onSwitchProfile={() => setScreen("profileSelect")}
        onOpenParentSettings={handleOpenParentSettings}
      />
      {screen === "pinGate" && (
        <PinPad
          mode="verify"
          storedPin={saveData.settings.pinHash}
          onSuccess={handlePinVerified}
          onCancel={() => setScreen("home")}
        />
      )}
    </>
  );
}
