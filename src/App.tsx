import { useState, useEffect, useCallback } from "react";
import type { SaveData } from "./types";
import { loadSaveData, saveSaveData } from "./lib/storage";
import ProfileSelect from "./screens/ProfileSelect";
import Home from "./screens/Home";
import ParentSettings from "./screens/ParentSettings";
import TestGacha from "./screens/TestGacha";
import Dressup from "./screens/Dressup";
import AvatarAdjust from "./screens/AvatarAdjust";
import PinPad from "./components/PinPad";
import "./styles/global.css";

type Screen = "profileSelect" | "home" | "pinGate" | "parentSettings" | "testGacha" | "avatar" | "avatarAdjust";

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

  const handleOpenTestGacha = useCallback(() => {
    setScreen("testGacha");
  }, []);

  const handleOpenAvatar = useCallback(() => {
    setScreen("avatar");
  }, []);

  const handleOpenAvatarAdjust = useCallback(() => {
    setScreen("avatarAdjust");
  }, []);

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
        onOpenTestGacha={handleOpenTestGacha}
        onOpenAvatarAdjust={handleOpenAvatarAdjust}
      />
    );
  }

  if (screen === "avatarAdjust") {
    return <AvatarAdjust onBack={() => setScreen("parentSettings")} />;
  }

  if (screen === "testGacha") {
    const activeProfile = saveData.profiles.find((p) => p.id === saveData.activeProfileId) ?? saveData.profiles[0];
    return (
      <TestGacha
        profile={activeProfile}
        onBack={() => setScreen("parentSettings")}
      />
    );
  }

  if (screen === "avatar") {
    const ap = saveData.profiles.find((p) => p.id === saveData.activeProfileId) ?? saveData.profiles[0];
    return (
      <Dressup
        profile={ap}
        onUpdateProfile={(up) =>
          handleUpdate({ ...saveData, profiles: saveData.profiles.map((p) => (p.id === up.id ? up : p)) })
        }
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
        onOpenAvatar={handleOpenAvatar}
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
