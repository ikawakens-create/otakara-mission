import { useRef, useState, type ChangeEvent } from "react";
import type { SaveData, RecoveryMissionDef } from "../types";
import PinPad from "../components/PinPad";
import styles from "./ParentSettings.module.css";
import { exportData, importData, isValidSaveShape } from "../lib/storage";
import { getTodayKey } from "../lib/date";

interface Props {
  saveData: SaveData;
  onUpdate: (d: SaveData) => void;
  onBack: () => void;
  onOpenTestGacha: () => void;
  onOpenAvatarAdjust: () => void;
}

export default function ParentSettings({ saveData, onUpdate, onBack, onOpenTestGacha, onOpenAvatarAdjust }: Props) {
  const { settings } = saveData;
  const [addEmoji, setAddEmoji] = useState("📝");
  const [addLabel, setAddLabel] = useState("");
  const [changingPin, setChangingPin] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<SaveData | null>(null); // プレビュー中の復元候補
  const [confirmRestore, setConfirmRestore] = useState(false);                 // 二段目の確認
  const [importError, setImportError] = useState(false);                       // 読み込み失敗表示
  const [toast, setToast] = useState<string | null>(null);                     // 軽い通知
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateSettings(patch: Partial<typeof settings>) {
    onUpdate({ ...saveData, settings: { ...settings, ...patch } });
  }

  function deleteRecoveryMission(id: string) {
    updateSettings({
      recoveryMissions: settings.recoveryMissions.filter((m) => m.id !== id),
    });
  }

  function addRecoveryMission() {
    const label = addLabel.trim();
    if (!label) return;
    const newMission: RecoveryMissionDef = {
      id: `rec_${Date.now()}`,
      emoji: addEmoji || "📝",
      label,
    };
    updateSettings({ recoveryMissions: [...settings.recoveryMissions, newMission] });
    setAddLabel("");
    setAddEmoji("📝");
  }

  function handlePinSet(pin: string) {
    updateSettings({ pinHash: `plain:${pin}` });
    setChangingPin(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }

  function handleExport() {
    const json = exportData(saveData);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `otakara-backup-${getTodayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("ほぞんしました");
  }

  function handleImportClick() {
    setImportError(false);
    fileInputRef.current?.click();
  }

  function handleFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを続けて選べるようにリセット
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const restored = importData(text);
      if (!restored || !isValidSaveShape(restored)) {
        setImportError(true);
        return;
      }
      setImportError(false);
      setPendingRestore(restored); // プレビューへ
    };
    reader.onerror = () => setImportError(true);
    reader.readAsText(file);
  }

  function confirmRestoreNow() {
    if (!pendingRestore) return;
    onUpdate(pendingRestore); // state更新＋App側のuseEffectでlocalStorageに保存される
    setPendingRestore(null);
    setConfirmRestore(false);
    showToast("もどしました");
  }

  function cancelRestore() {
    setPendingRestore(null);
    setConfirmRestore(false);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <span className={styles.headerTitle}>🔒 おうちのひとモード</span>
      </header>

      <div className={styles.body}>
        {/* PIN設定 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>PINの変更</div>
          <div className={styles.pinRow}>
            <span className={styles.pinStatus}>
              {settings.pinHash ? "PIN 設定済み" : "PINが設定されていません"}
            </span>
            <button className={styles.changePinBtn} onClick={() => setChangingPin(true)}>
              {settings.pinHash ? "変更する" : "設定する"}
            </button>
          </div>
        </div>

        {/* リカバリーミッション */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>リカバリーミッション</div>
          <div className={styles.missionList}>
            {settings.recoveryMissions.map((rm) => (
              <div key={rm.id} className={styles.missionItem}>
                <span className={styles.missionEmoji}>{rm.emoji}</span>
                <span className={styles.missionLabel}>{rm.label}</span>
                <button
                  className={styles.deleteBtn}
                  onClick={() => deleteRecoveryMission(rm.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className={styles.addArea}>
            <div className={styles.addForm}>
              <input
                className={styles.addEmojiInput}
                value={addEmoji}
                maxLength={2}
                onChange={(e) => setAddEmoji(e.target.value)}
              />
              <input
                className={styles.addLabelInput}
                placeholder="ミッションをかく"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addRecoveryMission(); }}
              />
              <button className={styles.addBtn} onClick={addRecoveryMission}>追加</button>
            </div>
          </div>
        </div>

        {/* リカバリー設定 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>リカバリー設定</div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>週あたりの回数上限</div>
              <div className={styles.settingHint}>1〜3回まで設定できます</div>
            </div>
            <input
              className={styles.numInput}
              type="number"
              min={1}
              max={3}
              value={settings.recoveryWeeklyLimit}
              onChange={(e) => {
                const v = Math.max(1, Math.min(3, Number(e.target.value)));
                updateSettings({ recoveryWeeklyLimit: v });
              }}
            />
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>リカバリーでもガチャを引ける</div>
              <div className={styles.settingHint}>ONだとリカバリー達成日にガチャ1回</div>
            </div>
            <button
              className={`${styles.toggle}${settings.recoveryGrantsGacha ? " " + styles.on : ""}`}
              onClick={() => updateSettings({ recoveryGrantsGacha: !settings.recoveryGrantsGacha })}
            >
              <div className={styles.toggleThumb} />
            </button>
          </div>
        </div>

        {/* データのバックアップ */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>データのバックアップ</div>
          <div className={styles.backupHint}>
            まんがいちに そなえて、データをファイルに ほぞんできます。
          </div>
          <div className={styles.backupButtons}>
            <button className={styles.backupBtn} onClick={handleExport}>
              📤 バックアップをつくる
            </button>
            <button className={styles.backupBtn} onClick={handleImportClick}>
              📥 バックアップからもどす
            </button>
          </div>
          {importError && (
            <div className={styles.backupError}>
              このファイルは よみこめませんでした。
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={handleFileChosen}
          />
        </div>

        {/* 演出テスト */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>開発ツール</div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>ガチャ演出のかくにん</div>
              <div className={styles.settingHint}>データを変えずに演出を何度でも再生できます</div>
            </div>
            <button className={styles.changePinBtn} onClick={onOpenTestGacha}>
              🎬 演出をテスト
            </button>
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>アバターのいちちょうせい</div>
              <div className={styles.settingHint}>素材の位置・サイズを確認してスニペットを取得できます</div>
            </div>
            <button className={styles.changePinBtn} onClick={onOpenAvatarAdjust}>
              🎯 ちょうせいする
            </button>
          </div>
        </div>

        {/* 月間ごほうび設定 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>月間ごほうび設定</div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>月間目標日数</div>
              <div className={styles.settingHint}>この日数達成で月間ごほうび</div>
            </div>
            <input
              className={styles.numInput}
              type="number"
              min={1}
              max={31}
              value={settings.monthlyGoalDays}
              onChange={(e) => {
                const v = Math.max(1, Math.min(31, Number(e.target.value)));
                updateSettings({ monthlyGoalDays: v });
              }}
            />
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>月間ごほうびポイント</div>
              <div className={styles.settingHint}>目標達成時に付与されるポイント数</div>
            </div>
            <input
              className={styles.numInput}
              type="number"
              min={1}
              max={100}
              value={settings.monthlyRewardPoints}
              onChange={(e) => {
                const v = Math.max(1, Math.min(100, Number(e.target.value)));
                updateSettings({ monthlyRewardPoints: v });
              }}
            />
          </div>
        </div>
      </div>

      {changingPin && (
        <PinPad
          mode="set"
          storedPin={settings.pinHash}
          onSuccess={handlePinSet}
          onCancel={() => setChangingPin(false)}
        />
      )}

      {pendingRestore && !confirmRestore && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <div className={styles.dialogTitle}>このバックアップを もどしますか？</div>
            <div className={styles.previewList}>
              {pendingRestore.profiles.map((p) => (
                <div key={p.id} className={styles.previewRow}>
                  <span className={styles.previewName}>{p.name}</span>
                  <span className={styles.previewStat}>ポイント {p.points.total}</span>
                  <span className={styles.previewStat}>かけら {p.kakera}</span>
                  <span className={styles.previewStat}>アイテム {p.ownedItemIds.length}こ</span>
                </div>
              ))}
            </div>
            <div className={styles.warnText}>
              ⚠ いまのデータは すべて うわがきされます。もとには もどせません。
            </div>
            <div className={styles.dialogButtons}>
              <button className={styles.cancelBtn} onClick={cancelRestore}>やめる</button>
              <button className={styles.dangerBtn} onClick={() => setConfirmRestore(true)}>もどす</button>
            </div>
          </div>
        </div>
      )}

      {pendingRestore && confirmRestore && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <div className={styles.dialogTitle}>ほんとうに うわがきしますか？</div>
            <div className={styles.warnText}>この そうさは とりけせません。</div>
            <div className={styles.dialogButtons}>
              <button className={styles.cancelBtn} onClick={cancelRestore}>やめる</button>
              <button className={styles.dangerBtn} onClick={confirmRestoreNow}>うわがきする</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
