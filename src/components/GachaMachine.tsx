import "../styles/gachaMachine.css";

export interface GachaMachineProps {
  caps?: string[];
  level?: number;
  size?: number;
  className?: string;
  turning?: boolean;
  dropCapsule?: "normal" | "gold" | "rainbow" | null;
  jiggle?: boolean;
}

const PRESET_NORMAL = ["cYellow", "cGreen", "cBlue", "cPink"];
const PRESET_RARE   = ["cYellow", "cGold", "cBlue", "cRainbow", "cPink", "cGreen", "cGold", "cRainbow"];
const PRESET_GOLD   = ["cGold", "cRainbow", "cGold", "cRainbow", "cGold"];

function presetForLevel(level: number): string[] {
  if (level <= 2) return PRESET_NORMAL;
  if (level <= 4) return PRESET_RARE;
  return PRESET_GOLD;
}

const DEFS = `<defs>
  <radialGradient id="glass" cx="38%" cy="30%" r="78%">
    <stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="#eafaff"/>
    <stop offset="70%" stop-color="#c7eeff"/><stop offset="100%" stop-color="#a7e0fb"/>
  </radialGradient>
  <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ff9ec4"/><stop offset="50%" stop-color="#ff7fb0"/><stop offset="100%" stop-color="#f2659b"/>
  </linearGradient>
  <linearGradient id="bodyTop" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffb0d2"/><stop offset="100%" stop-color="#ff8bb8"/>
  </linearGradient>
  <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffd86b"/><stop offset="100%" stop-color="#ffb73d"/>
  </linearGradient>
  <radialGradient id="cYellow" cx="35%" cy="28%" r="75%"><stop offset="0%" stop-color="#fff6a8"/><stop offset="100%" stop-color="#ffcf3f"/></radialGradient>
  <radialGradient id="cGreen"  cx="35%" cy="28%" r="75%"><stop offset="0%" stop-color="#baf3c6"/><stop offset="100%" stop-color="#5fd089"/></radialGradient>
  <radialGradient id="cBlue"   cx="35%" cy="28%" r="75%"><stop offset="0%" stop-color="#cfd6ff"/><stop offset="100%" stop-color="#8aa0f0"/></radialGradient>
  <radialGradient id="cPink"   cx="35%" cy="28%" r="75%"><stop offset="0%" stop-color="#ffc6e6"/><stop offset="100%" stop-color="#ff7ec0"/></radialGradient>
  <radialGradient id="cGold" cx="32%" cy="24%" r="80%">
    <stop offset="0%" stop-color="#ffffff"/><stop offset="22%" stop-color="#fff0a8"/>
    <stop offset="50%" stop-color="#ffd23f"/><stop offset="78%" stop-color="#f29d1a"/>
    <stop offset="100%" stop-color="#b86d12"/>
  </radialGradient>
  <radialGradient id="rbCore" cx="50%" cy="50%" r="60%">
    <stop offset="0%" stop-color="#ffffff" stop-opacity=".55"/><stop offset="60%" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
</defs>`;

const BX = 150, BY = 150, BR = 95;

function rainbowCap(cx: number, cy: number, r: number): string {
  const cols = ["#ff5f6d","#ffa14a","#ffe24a","#7be08a","#5fc8ff","#7a8cff","#d182ff"];
  let wedges = "";
  const n = cols.length;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    wedges += `<path d="M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${cols[i]}"/>`;
  }
  return `<g class="rbrot"><clipPath id="rc${cx}_${cy}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <g clip-path="url(#rc${cx}_${cy})">${wedges}</g></g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#rbCore)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/>
    <path d="M${cx-r+3} ${cy-2} a${r-3} ${r-3} 0 0 1 ${(r-3)*2} 0 z" fill="#fff" opacity=".3"/>`;
}

function goldCap(cx: number, cy: number, r: number): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#cGold)" stroke="#e8a72e" stroke-width="2"/>
    <ellipse class="sweep" cx="${cx-r*0.25}" cy="${cy-r*0.35}" rx="${r*0.55}" ry="${r*0.32}" fill="#fff" transform="rotate(-28 ${cx} ${cy})"/>
    <path class="tw" d="M${cx-r*0.35} ${cy-r*0.45} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#fff"/>
    <path class="tw2" d="M${cx+r*0.4} ${cy+r*0.15} l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" fill="#fff"/>
    <circle cx="${cx+r*0.45}" cy="${cy-r*0.3}" r="${r*0.1}" fill="#fff" opacity=".9"/>`;
}

function plainCap(cx: number, cy: number, r: number, fill: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${fill})" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
    <path d="M${cx-r+3} ${cy-2} a${r-3} ${r-3} 0 0 1 ${(r-3)*2} 0 z" fill="#fff" opacity=".26"/>`;
}

function cap(cx: number, cy: number, r: number, fill: string): string {
  if (fill === "cGold")    return goldCap(cx, cy, r);
  if (fill === "cRainbow") return rainbowCap(cx, cy, r);
  return plainCap(cx, cy, r, fill);
}

function fillCaps(colors: string[]): string {
  const r = 18, dx = r * 2 * 0.92, dy = r * 1.62;
  const pts: [number, number][] = [];
  let row = 0;
  for (let y = BY - BR + r - 2; y <= BY + BR - r + 8; y += dy, row++) {
    const offset = (row % 2) ? dx / 2 : 0;
    for (let x = BX - BR - r + offset; x <= BX + BR + r; x += dx) {
      if (Math.hypot(x - BX, y - BY) <= BR - 2) pts.push([x, y]);
    }
  }
  let out = "";
  pts.forEach((p, i) => { out += cap(p[0], p[1], r, colors[i % colors.length]); });
  return out;
}

function buildHandleGroup(turning: boolean): string {
  const cls = turning ? ' class="handleTurn"' : '';
  return `<g${cls}>
    <rect x="143" y="258" width="14" height="56" rx="7" fill="#ffcf3f" stroke="#e89a23" stroke-width="3"/>
    <rect x="122" y="279" width="56" height="14" rx="7" fill="#ffcf3f" stroke="#e89a23" stroke-width="3"/>
    <circle cx="150" cy="286" r="8" fill="#fff3c0" stroke="#e89a23" stroke-width="2.5"/>
    <circle cx="150" cy="286" r="3" fill="#b9760f"/>
  </g>`;
}

function buildDropCapsule(kind: "normal" | "gold" | "rainbow"): string {
  const cx = 150, cy = 347, r = 13;
  let inner: string;
  if (kind === "gold") inner = goldCap(cx, cy, r);
  else if (kind === "rainbow") inner = rainbowCap(cx, cy, r);
  else inner = plainCap(cx, cy, r, "cYellow");
  return `<g class="capDrop">${inner}</g>`;
}

export default function GachaMachine({ caps, level = 0, size = 260, className, turning = false, dropCapsule = null, jiggle = false }: GachaMachineProps) {
  const colors = caps ?? presetForLevel(level);
  const capsHtml = fillCaps(colors);
  const svgHeight = Math.round(size * 380 / 300);

  const svgHtml = `<svg width="${size}" height="${svgHeight}" viewBox="0 0 300 380" xmlns="http://www.w3.org/2000/svg">${DEFS}
    <rect x="62" y="318" width="176" height="58" rx="20" fill="url(#base)" stroke="#e89a23" stroke-width="3"/>
    <rect x="62" y="318" width="176" height="13" rx="6" fill="#ffe49a" opacity=".7"/>
    <rect x="127" y="326" width="46" height="42" rx="12" fill="#7a3b16" opacity=".92" stroke="#e89a23" stroke-width="2.5"/>
    <rect x="134" y="333" width="32" height="28" rx="8" fill="#5e2c10"/>
    <path d="M84 250 L216 250 Q224 250 222 262 L214 312 Q212 320 202 320 L98 320 Q88 320 86 312 L78 262 Q76 250 84 250 Z" fill="url(#body)" stroke="#e15691" stroke-width="3"/>
    <ellipse cx="150" cy="252" rx="66" ry="10" fill="url(#bodyTop)"/>
    <circle cx="150" cy="286" r="26" fill="#ffe089" stroke="#e89a23" stroke-width="3.5"/>
    ${buildHandleGroup(turning)}
    ${dropCapsule ? buildDropCapsule(dropCapsule) : ''}
    <circle cx="${BX}" cy="${BY}" r="${BR+5}" fill="url(#glass)" stroke="#ff9ec4" stroke-width="6"/>
    <clipPath id="ball"><circle cx="${BX}" cy="${BY}" r="${BR}"/></clipPath>
    <g clip-path="url(#ball)"${jiggle ? ' class="ballJiggle"' : ''}>${capsHtml}</g>
    <ellipse cx="115" cy="106" rx="26" ry="38" fill="#fff" opacity=".38" transform="rotate(-22 115 106)"/>
    <circle cx="186" cy="104" r="9" fill="#fff" opacity=".45"/>
    <circle cx="${BX}" cy="${BY}" r="${BR+5}" fill="none" stroke="#fff" stroke-width="2" opacity=".4"/>
    <circle cx="150" cy="58" r="13" fill="#ffe26b" stroke="#e89a23" stroke-width="3"/>
    <path d="M150 34 l3.7 11 12 1 -9.3 7.4 3.7 11 -10.1 -6.4 -10.1 6.4 3.7 -11 -9.3 -7.4 12 -1 z" fill="#fff07a" stroke="#e89a23" stroke-width="2"/>
  </svg>`;

  return (
    <div
      className={className}
      style={{ display: "block", lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
