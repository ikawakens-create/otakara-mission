import { useState, useCallback, useEffect, useRef } from "react";
import type { Profile, Rarity } from "../types";
import {
  drawRarity,
  drawPrize,
  applyGachaResult,
  type GachaResult,
  type PullType,
} from "../lib/gacha";
import { soundPull, soundMachine, soundCapsule, soundReveal } from "../lib/sounds";
import { RARITY_VISUALS, CAPSULE_CSS_COLORS } from "../data/gachaVisuals";
import {
  pickScenario,
  SCENARIO_BUILDUP,
  capsForLook,
  dropLookForScenario,
  SCENARIO_REVEAL,
  SCENARIO_REVEAL_TEXT,
  pickCutin,
  CUTIN_TEXT,
  type ScenarioId,
  type CutinLevel,
} from "../data/gachaScenarios";
import GachaMachine from "../components/GachaMachine";
import styles from "./Gacha.module.css";

type AnimPhase = "silhouette" | "machine" | "capsule" | "open" | "reveal";
const ANIM_PHASES: AnimPhase[] = ["silhouette", "machine", "capsule", "open", "reveal"];

// none = 非retry / empty = 回る・出てこない / prompt = タップ待ち / spin = 激しく回る / drop = 落下
type RetryStage = "none" | "empty" | "prompt" | "spin" | "drop";

const PHASE_PROMPT: Record<AnimPhase, string> = {
  silhouette: "？ なにが でるかな？",
  machine:    "ハンドルを まわそう！",
  capsule:    "ぐるぐる…ころん！",
  open:       "ぱかっ…！",
  reveal:     "やったー！",
};

const RETRY_HINT_EMPTY  = "あれ…？ でてこない！？";
const RETRY_HINT_PROMPT = "もう1回 タップ！！！";

export type PullReason = "complete" | "recovery" | "ticket";

interface Props {
  profile: Profile;
  pullReason: PullReason;
  dateKey: string;
  onSave: (updated: Profile) => void;
  onClose: () => void;
  forcedRarity?: Rarity;
  forcedScenario?: ScenarioId;
  forcedCutin?: CutinLevel;
  forcedRetry?: boolean;
  dryRun?: boolean;
}

const REASON_LABEL: Record<PullReason, string> = {
  complete: "🎊 コンプリートごほうびガチャ！",
  recovery: "⭐ リカバリーごほうびガチャ！",
  ticket:   "🎫 スペシャルけんガチャ！",
};

export default function GachaScreen({ profile, pullReason, dateKey, onSave, onClose, forcedRarity, forcedScenario, forcedCutin, forcedRetry, dryRun }: Props) {
  const pullType: PullType = pullReason === "ticket" ? "ticket" : "daily";

  const [screenPhase, setScreenPhase] = useState<"intro" | "animating" | "result">("intro");
  const [animPhase, setAnimPhase] = useState<AnimPhase>("silhouette");
  const [result, setResult] = useState<GachaResult | null>(null);
  const [scenario, setScenario] = useState<ScenarioId>("standard");
  const [cutin, setCutin] = useState<CutinLevel>("none");
  const [cutinVisible, setCutinVisible] = useState(false);
  const [isRetry, setIsRetry] = useState(false);
  const [retryStage, setRetryStage] = useState<RetryStage>("none");

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function scheduleTimer(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }

  function clearAllTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  const handlePull = useCallback(() => {
    const rarity = forcedRarity ?? drawRarity();
    const sc = forcedScenario ?? pickScenario(rarity);
    const res = drawPrize(rarity, profile);
    if (!dryRun) {
      const updated = applyGachaResult(profile, res, pullType, dateKey);
      onSave(updated);
    }
    const cut = forcedCutin ?? pickCutin(rarity, sc);
    const retry = forcedRetry ?? (cut === "confirmed");
    setScenario(sc);
    setCutin(cut);
    setCutinVisible(false);
    setIsRetry(retry);
    setRetryStage("none");
    setResult(res);
    setScreenPhase("animating");
    setAnimPhase("silhouette");
    soundPull();
    if (navigator.vibrate) navigator.vibrate(60);
  }, [profile, pullType, dateKey, onSave, forcedRarity, forcedScenario, forcedCutin, forcedRetry, dryRun]);

  // retry: capsule フェーズ入場 → empty 開始、タイマーで prompt へ
  useEffect(() => {
    if (animPhase !== "capsule" || !isRetry) return;
    setRetryStage("empty");
    const t1 = scheduleTimer(() => setRetryStage("prompt"), 900);
    timersRef.current.push(t1);
    return () => clearAllTimers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animPhase, isRetry]);

  const skipToResult = useCallback(() => {
    clearAllTimers();
    setScreenPhase("result");
  }, []);

  const advancePhase = useCallback(() => {
    if (!result) return;

    // retry中の capsule サブ進行制御
    if (isRetry && animPhase === "capsule") {
      if (retryStage === "empty" || retryStage === "spin") {
        return; // このタップは無効（自動で進む）
      }
      if (retryStage === "prompt") {
        // 「もう1回」タップ → spin へ
        clearAllTimers();
        setRetryStage("spin");
        // spin(1.3s) + タメ(0.4s) 後に drop
        scheduleTimer(() => {
          setRetryStage("drop");
          setCutinVisible(true);
          scheduleTimer(() => setCutinVisible(false), 1400);
        }, 1700);
        return;
      }
      // retryStage === "drop" のときは通常進行（capsule→open）に落ちる
    }

    const level = RARITY_VISUALS[result.rarity].level;
    const idx = ANIM_PHASES.indexOf(animPhase);
    if (idx < ANIM_PHASES.length - 1) {
      const next = ANIM_PHASES[idx + 1];
      if (next === "machine") soundMachine();
      else if (next === "capsule") soundCapsule();
      else if (next === "reveal") soundReveal(level);
      setAnimPhase(next);
      // 非retry時のカットイン：capsule 入場時に表示
      if (next === "capsule" && !isRetry && cutin !== "none") {
        setCutinVisible(true);
        scheduleTimer(() => setCutinVisible(false), 1400);
      }
    } else {
      setScreenPhase("result");
    }
  }, [animPhase, result, cutin, isRetry, retryStage]);

  function renderIntro() {
    const ticketCount = profile.specialGachaTickets;
    return (
      <div className={styles.intro}>
        <div className={styles.machineEmoji} aria-hidden>🎰</div>
        <div className={styles.introReason}>{REASON_LABEL[pullReason]}</div>
        {pullReason === "ticket" && (
          <div className={styles.introSub}>のこり {ticketCount}まい</div>
        )}
        <button className={styles.pullBtn} onClick={handlePull}>
          ガチャを引く！
        </button>
        <button className={styles.cancelBtn} onClick={onClose}>
          やめる
        </button>
      </div>
    );
  }

  function renderAnim() {
    if (!result) return null;
    const visual = RARITY_VISUALS[result.rarity];
    const glowStyle =
      visual.level > 0
        ? { boxShadow: `0 0 32px ${visual.glowColor}, 0 0 64px ${visual.glowColor}` }
        : undefined;
    const filterStyle =
      visual.level > 0
        ? { filter: `drop-shadow(0 0 16px ${visual.glowColor})` }
        : undefined;
    const effect = SCENARIO_REVEAL[scenario];
    const revealText = SCENARIO_REVEAL_TEXT[scenario];

    const tapLabel = animPhase === "reveal"
      ? "タップで けっかを みる ▶"
      : (isRetry && animPhase === "capsule" && retryStage === "prompt")
        ? ""  // prompt中は tapHint を隠す（retryPrompt が目立つので）
        : "タップで つぎへ ▶";

    // capsule フェーズ表示パラメータ
    const isCapsulePhase = animPhase === "machine" || animPhase === "capsule";
    const capsuleTurning = animPhase === "capsule"
      ? (isRetry ? retryStage === "empty" : true)
      : false;
    const capsuleTurnHard = isRetry && animPhase === "capsule" && retryStage === "spin";
    const capsuleDropping = animPhase === "capsule" && (!isRetry || retryStage === "drop")
      ? dropLookForScenario(scenario, visual.capsule)
      : null;
    const capsuleHint = animPhase === "capsule" && isRetry
      ? (retryStage === "empty" ? RETRY_HINT_EMPTY
       : retryStage === "spin"  ? "！！"
       : retryStage === "drop"  ? PHASE_PROMPT.capsule
       : "")  // prompt中はここに出さない（retryPrompt で出す）
      : PHASE_PROMPT[animPhase];
    const capsuleJiggle = animPhase === "capsule" && (!isRetry || retryStage === "drop");

    return (
      <div className={styles.sceneWrap} onClick={advancePhase} role="button" aria-label="つぎへ">
        {animPhase === "silhouette" && (
          <div className={styles.sceneCenter}>
            <div className={styles.silhouette}>
              <span className={styles.silhouetteQ}>❓</span>
            </div>
            <p className={styles.sceneHint}>{PHASE_PROMPT.silhouette}</p>
          </div>
        )}

        {isCapsulePhase && (
          <div className={styles.sceneCenter}>
            <GachaMachine
              level={visual.level}
              size={260}
              caps={capsForLook(SCENARIO_BUILDUP[scenario], visual.level)}
              className={animPhase === "machine" ? styles.machineAppear : undefined}
              turning={capsuleTurning}
              turnHard={capsuleTurnHard}
              dropCapsule={capsuleDropping}
              jiggle={capsuleJiggle}
            />
            <p className={styles.sceneHint}>{capsuleHint}</p>
          </div>
        )}

        {isRetry && animPhase === "capsule" && retryStage === "prompt" && (
          <div className={styles.retryPrompt} aria-live="assertive">
            {RETRY_HINT_PROMPT}
          </div>
        )}

        {cutinVisible && cutin !== "none" && (
          <div
            className={[
              styles.cutinBanner,
              cutin === "oh"        ? styles.cutinOh        : "",
              cutin === "maybe"     ? styles.cutinMaybe     : "",
              cutin === "hot"       ? styles.cutinHot       : "",
              cutin === "confirmed" ? styles.cutinConfirmed : "",
            ].filter(Boolean).join(" ")}
            aria-live="assertive"
          >
            {CUTIN_TEXT[cutin]}
          </div>
        )}

        {animPhase === "open" && (
          <div className={styles.sceneCenter}>
            <div
              className={styles.capsuleOpen}
              style={{ borderColor: CAPSULE_CSS_COLORS[visual.capsule], ...glowStyle }}
            >
              <span className={styles.capsuleOpenInner} aria-hidden>✨</span>
            </div>
            <p className={styles.sceneHint}>{PHASE_PROMPT.open}</p>
          </div>
        )}

        {animPhase === "reveal" && effect === "burst" && (
          <div className={styles.revealFlash} aria-hidden />
        )}

        {animPhase === "reveal" && (
          <div className={styles.sceneCenter}>
            <div
              className={[
                styles.prizeReveal,
                effect === "burst" ? styles.revealBurst : "",
                effect === "soft"  ? styles.revealSoft  : "",
              ].filter(Boolean).join(" ")}
              style={filterStyle}
              aria-hidden
            >
              {result.prizeAsset}
            </div>
            <p className={styles.revealRarity} style={{ color: CAPSULE_CSS_COLORS[visual.capsule] }}>
              {visual.label}
            </p>
            <p className={styles.sceneHint}>{revealText}</p>
          </div>
        )}

        <p className={styles.tapHint}>{tapLabel}</p>

        <button className={styles.skipBtn} onClick={(e) => { e.stopPropagation(); skipToResult(); }}>
          とばす ▶
        </button>
      </div>
    );
  }

  function renderResult() {
    if (!result) return null;
    const visual = RARITY_VISUALS[result.rarity];
    const glowStyle =
      visual.level > 0
        ? { boxShadow: `0 0 20px ${visual.glowColor}` }
        : undefined;
    const filterStyle =
      visual.level > 0
        ? { filter: `drop-shadow(0 0 20px ${visual.glowColor})` }
        : undefined;

    return (
      <div className={styles.result}>
        <div
          className={styles.rarityBadge}
          style={{ backgroundColor: CAPSULE_CSS_COLORS[visual.capsule], ...glowStyle }}
        >
          {visual.label}
        </div>

        <div className={styles.resultPrize} style={filterStyle} aria-hidden>
          {result.prizeAsset}
        </div>

        <p className={styles.resultName}>{result.prizeName}</p>

        {result.isDuplicate && (
          <div className={styles.duplicateMsg}>
            ダブリ！ かけら +{result.kakeraAwarded}
          </div>
        )}

        {result.prizeKind === "points" && !result.isDuplicate && (
          <div className={styles.pointsMsg}>
            ポイント +{result.prizePoints}
          </div>
        )}

        {dryRun && (
          <button
            className={styles.pullBtn}
            onClick={() => {
              setResult(null);
              setScreenPhase("intro");
            }}
          >
            もう1回みる
          </button>
        )}

        <button className={styles.closeBtn} onClick={onClose}>
          とじる
        </button>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      {screenPhase === "intro" && renderIntro()}
      {screenPhase === "animating" && renderAnim()}
      {screenPhase === "result" && renderResult()}
    </div>
  );
}
