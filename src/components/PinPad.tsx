import { useState } from "react";
import styles from "./PinPad.module.css";

interface Props {
  mode: "set" | "verify";
  storedPin: string | null;
  onSuccess: (pin: string) => void;
  onCancel: () => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function PinPad({ mode, storedPin, onSuccess, onCancel }: Props) {
  const [digits, setDigits] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [error, setError] = useState("");

  const phase = mode === "set" && confirm === null ? "入力" : mode === "set" ? "確認" : "確認";
  const current = confirm !== null ? confirm : digits;

  function press(k: string) {
    if (k === "") return;
    if (k === "⌫") {
      setError("");
      if (confirm !== null) setConfirm(confirm.slice(0, -1));
      else setDigits(digits.slice(0, -1));
      return;
    }
    const next = [...current, k].slice(0, 4);
    if (confirm !== null) {
      setConfirm(next);
      if (next.length === 4) {
        if (next.join("") === digits.join("")) {
          onSuccess(next.join(""));
        } else {
          setError("ちがいます。もういちど。");
          setConfirm([]);
        }
      }
    } else {
      const updated = [...digits, k].slice(0, 4);
      setDigits(updated);
      if (updated.length === 4) {
        if (mode === "set") {
          setConfirm([]);
        } else {
          // verify
          const plain = storedPin?.replace(/^plain:/, "") ?? "";
          if (updated.join("") === plain) {
            onSuccess(updated.join(""));
          } else {
            setError("ちがいます。もういちど。");
            setDigits([]);
          }
        }
      }
    }
  }

  const title =
    mode === "set" && confirm === null
      ? "あたらしいPINを きめてね"
      : mode === "set"
      ? "もういちど おなじPINを おしてね"
      : "おうちのひとモード";

  const sub =
    mode === "verify" ? "4ケタのPINを にゅうりょく" : `(${phase}) 4ケタすうじ`;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>{title}</div>
        <div className={styles.sub}>{sub}</div>
        <div className={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`${styles.dot}${i < current.length ? " " + styles.filled : ""}`}
            />
          ))}
        </div>
        <div className={styles.numGrid}>
          {KEYS.map((k, i) => (
            <button key={i} className={`${styles.numBtn}${k === "⌫" ? " " + styles.delBtn : ""}`} onClick={() => press(k)}>
              {k}
            </button>
          ))}
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    </div>
  );
}
