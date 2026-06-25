import type { Rarity } from "../types";
import { PRESET_GOLD, PRESET_NORMAL, presetForLevel } from "../components/GachaMachine";

export type ScenarioId = "standard" | "reversal" | "fakeout" | "guaranteed";

// 結果レア度ごとの演出重み（各行 合計100）。
// fakeout は normal/rare のみ、reversal/guaranteed は super_rare 以上のみ。
export const SCENARIO_WEIGHTS: Record<Rarity, Partial<Record<ScenarioId, number>>> = {
  normal:     { standard: 85, fakeout: 15 },
  rare:       { standard: 85, fakeout: 15 },
  super_rare: { standard: 80, reversal: 12, guaranteed: 8 },
  ultra_rare: { standard: 75, reversal: 15, guaranteed: 10 },
  rainbow:    { standard: 65, reversal: 20, guaranteed: 15 },
  legend:     { standard: 55, reversal: 20, guaranteed: 25 },
  diamond:    { standard: 30, reversal: 15, guaranteed: 55 },
};

export function pickScenario(rarity: Rarity): ScenarioId {
  const weights = SCENARIO_WEIGHTS[rarity];
  const entries = Object.entries(weights) as [ScenarioId, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [id, w] of entries) { roll -= w; if (roll < 0) return id; }
  return "standard";
}

// 前半（machine/capsule）で球が見せる「中身の煽り」
//  auto = 実レア度どおり / tease = 金・虹だらけで煽る / hide = ふつうに見せて隠す
export type BuildupLook = "auto" | "tease" | "hide";
export const SCENARIO_BUILDUP: Record<ScenarioId, BuildupLook> = {
  standard:   "auto",
  reversal:   "hide",
  fakeout:    "tease",
  guaranteed: "tease",
};

export function capsForLook(look: BuildupLook, level: number): string[] {
  if (look === "tease") return PRESET_GOLD;
  if (look === "hide")  return PRESET_NORMAL;
  return presetForLevel(level);
}

// 落下カプセルの見た目（演出に合わせて隠す/煽る）
export function dropLookForScenario(
  scenario: ScenarioId,
  trueCapsule: "normal" | "gold" | "rainbow",
): "normal" | "gold" | "rainbow" {
  const look = SCENARIO_BUILDUP[scenario];
  if (look === "hide")  return "normal";
  if (look === "tease") return "rainbow";
  return trueCapsule;
}

// お披露目の演出タイプ
export type RevealEffect = "normal" | "burst" | "soft";
export const SCENARIO_REVEAL: Record<ScenarioId, RevealEffect> = {
  standard:   "normal",
  reversal:   "burst",
  fakeout:    "soft",
  guaranteed: "burst",
};

// お披露目の一言（やさしく前向きに）
export const SCENARIO_REVEAL_TEXT: Record<ScenarioId, string> = {
  standard:   "やったー！",
  reversal:   "うわぁ…！ やったー！",
  fakeout:    "ふつう…でも かわいい！",
  guaranteed: "かくてい〜！ やったー！",
};

// ── カットイン段階 ────────────────────────────────────────────
export type CutinLevel = "none" | "oh" | "maybe" | "hot" | "confirmed";

export const CUTIN_TEXT: Record<CutinLevel, string> = {
  none:      "",
  oh:        "お！",
  maybe:     "もしかして？？",
  hot:       "激アツ！！",
  confirmed: "かくてい！！",
};

// 結果レア度ごとの段階の重み（各行 合計100）。高い段階は高レアだけ＝嘘にならない。
export const CUTIN_WEIGHTS: Record<Rarity, Partial<Record<CutinLevel, number>>> = {
  normal:     { none: 100 },
  rare:       { none: 80, oh: 20 },
  super_rare: { none: 30, oh: 50, maybe: 20 },
  ultra_rare: { none: 20, oh: 35, maybe: 35, hot: 10 },
  rainbow:    { none: 10, oh: 25, maybe: 35, hot: 30 },
  legend:     { none: 5,  oh: 15, maybe: 30, hot: 50 },
  diamond:    { confirmed: 100 },
};

export function pickCutin(rarity: Rarity, scenario: ScenarioId): CutinLevel {
  if (scenario === "fakeout") return "none";
  const w = CUTIN_WEIGHTS[rarity];
  const entries = Object.entries(w) as [CutinLevel, number][];
  const total = entries.reduce((s, [, n]) => s + n, 0);
  let roll = Math.random() * total;
  let level: CutinLevel = "none";
  for (const [lv, n] of entries) { roll -= n; if (roll < 0) { level = lv; break; } }
  if (scenario === "reversal") {
    if (level === "hot" || level === "confirmed") level = "maybe";
  }
  return level;
}
