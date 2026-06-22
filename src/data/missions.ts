import type { MissionDef } from "../types";

export const DEFAULT_MISSIONS: MissionDef[] = [
  { id: "sleep_by_10", emoji: "🌙", label: "10じまでに ねる", doublePoints: true },
  { id: "study", emoji: "✏️", label: "くもん・しゅくだいを やる" },
  { id: "help_mom", emoji: "🧹", label: "ママの おてつだい" },
  { id: "brush_teeth", emoji: "🦷", label: "はみがき（あさ・よる）" },
  { id: "wake_self", emoji: "⏰", label: "じぶんで おきる" },
  { id: "tidy_up", emoji: "🧸", label: "つかった ものを かたづける" },
  { id: "greeting", emoji: "👋", label: "あいさつ できた" },
  { id: "my_mission", emoji: "⭐", label: "じぶんで きめた ミッション", editableLabel: true },
];
