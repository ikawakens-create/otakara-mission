# GACHA_VISUAL.md — 確定したガチャマシンの見た目

ガチャの絵（マシン・カプセル）の**確定デザイン**。SVG＋CSSで実装する。
画像素材は使わず軽量・拡大に強い・アニメや色変更が容易、というこのアプリの方針に沿う。

## デザインの要点
- まるっと可愛い縦長フォルム。てっぺんに星の飾り。紙版のキャラ世界観に合うパステル。
- ピンクのボディ中央に大きな十字ハンドル（回す取っ手だと一目で分かる）。
- 下に黄色い台座、ほぼ正方形の取り出し口（カプセルが出るサイズ）。
- ガラス球の中はカプセルを六角格子ですき間なく満遍なく配置。
- カプセルのレア度表現：
  - 通常色（黄・緑・青・ピンク）
  - 金：メタリックなグラデ＋白いハイライト＋キラキラ星（点滅）＋反射スイープ
  - 虹：7色コニカル（円を一周）でゆっくり回転
- 中身の構成を変えることで「中身でレア度を煽る」演出に使える
  （通常色のみ／金・虹おおめ／金・虹だらけ）。

## 実装メモ
- カプセルは `cap(cx,cy,r,fill)` で1個を描画。fill は cYellow/cGreen/cBlue/cPink/cGold/cRainbow。
- 球内配置は六角格子（下記コードの fillCaps）。`BX/BY/BR` が球の中心と半径。
- 金の点滅・反射、虹の回転は CSS animation（goldshine/tw/sweep/rbrot）。
- レア度別の「中身プリセット」を data として持ち、シルエット〜マシン登場で出し分ける。

## 確定コード（HTML/SVG/CSS 一式）
以下をコンポーネント化して使う。色配列 COLORS を差し替えると中身のレア度感が変わる。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    background: radial-gradient(circle at 50% 30%, #fff3fb 0%, #ffe9f4 40%, #ffdcec 100%);
    font-family:"Hiragino Maru Gothic Pro","Noto Sans JP",sans-serif;
  }
  @keyframes spinrb { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  .rbrot { animation:spinrb 3.5s linear infinite; transform-origin:center; transform-box:fill-box; }
  @keyframes twinkle { 0%,100%{opacity:.2; transform:scale(.7)} 50%{opacity:1; transform:scale(1.1)} }
  .tw { animation:twinkle 1.1s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }
  .tw2 { animation:twinkle 1.1s ease-in-out infinite .55s; transform-origin:center; transform-box:fill-box; }
  @keyframes sweep { 0%{opacity:0} 40%{opacity:.9} 60%{opacity:.9} 100%{opacity:0} }
  .sweep { animation:sweep 1.8s ease-in-out infinite; }
</style>
</head>
<body>
<script>
const defs = `
<defs>
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
  <radialGradient id="cGreen" cx="35%" cy="28%" r="75%"><stop offset="0%" stop-color="#baf3c6"/><stop offset="100%" stop-color="#5fd089"/></radialGradient>
  <radialGradient id="cBlue" cx="35%" cy="28%" r="75%"><stop offset="0%" stop-color="#cfd6ff"/><stop offset="100%" stop-color="#8aa0f0"/></radialGradient>
  <radialGradient id="cPink" cx="35%" cy="28%" r="75%"><stop offset="0%" stop-color="#ffc6e6"/><stop offset="100%" stop-color="#ff7ec0"/></radialGradient>
  <!-- 金: メタリックで明暗の差を強く -->
  <radialGradient id="cGold" cx="32%" cy="24%" r="80%">
    <stop offset="0%" stop-color="#ffffff"/><stop offset="22%" stop-color="#fff0a8"/>
    <stop offset="50%" stop-color="#ffd23f"/><stop offset="78%" stop-color="#f29d1a"/>
    <stop offset="100%" stop-color="#b86d12"/>
  </radialGradient>
  <!-- 虹: 7色コニカル（円を一周） -->
  <radialGradient id="rbCore" cx="50%" cy="50%" r="60%">
    <stop offset="0%" stop-color="#ffffff" stop-opacity=".55"/><stop offset="60%" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
</defs>`;

// 虹カプセル（コニカル風: 7色のくさび形を放射状に並べる）
function rainbowCap(cx, cy, r) {
  const cols=["#ff5f6d","#ffa14a","#ffe24a","#7be08a","#5fc8ff","#7a8cff","#d182ff"];
  let wedges="";
  const n=cols.length;
  for(let i=0;i<n;i++){
    const a0=(i/n)*2*Math.PI - Math.PI/2;
    const a1=((i+1)/n)*2*Math.PI - Math.PI/2;
    const x0=cx+r*Math.cos(a0), y0=cy+r*Math.sin(a0);
    const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
    wedges += `<path d="M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${cols[i]}"/>`;
  }
  return `<g class="rbrot"><clipPath id="rc${cx}_${cy}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <g clip-path="url(#rc${cx}_${cy})">${wedges}</g></g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#rbCore)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/>
    <path d="M${cx-r+3} ${cy-2} a${r-3} ${r-3} 0 0 1 ${(r-3)*2} 0 z" fill="#fff" opacity=".3"/>`;
}

// 金カプセル（複数のキラッ＋反射スイープ）
function goldCap(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#cGold)" stroke="#e8a72e" stroke-width="2"/>
    <ellipse class="sweep" cx="${cx-r*0.25}" cy="${cy-r*0.35}" rx="${r*0.55}" ry="${r*0.32}" fill="#fff" transform="rotate(-28 ${cx} ${cy})"/>
    <path class="tw" d="M${cx-r*0.35} ${cy-r*0.45} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#fff"/>
    <path class="tw2" d="M${cx+r*0.4} ${cy+r*0.15} l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" fill="#fff"/>
    <circle cx="${cx+r*0.45}" cy="${cy-r*0.3}" r="${r*0.1}" fill="#fff" opacity=".9"/>`;
}

function plainCap(cx, cy, r, fill) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${fill})" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
    <path d="M${cx-r+3} ${cy-2} a${r-3} ${r-3} 0 0 1 ${(r-3)*2} 0 z" fill="#fff" opacity=".26"/>`;
}

function cap(cx,cy,r,fill){
  if(fill==="cGold") return goldCap(cx,cy,r);
  if(fill==="cRainbow") return rainbowCap(cx,cy,r);
  return plainCap(cx,cy,r,fill);
}

const BX=150, BY=150, BR=95;
function fillCaps(colors) {
  const r=18, dx=r*2*0.92, dy=r*1.62;
  let pts=[];
  for (let row=0, y=BY-BR+r-2; y<=BY+BR-r+8; y+=dy, row++){
    const offset=(row%2)?dx/2:0;
    for (let x=BX-BR-r+offset; x<=BX+BR+r; x+=dx){
      if (Math.hypot(x-BX,y-BY) <= BR-2) pts.push([x,y]);
    }
  }
  let out=""; pts.forEach((p,i)=>{ out+=cap(p[0],p[1],r,colors[i%colors.length]); }); return out;
}

function machine(caps) {
  return `<svg width="300" height="380" viewBox="0 0 300 380">${defs}
    <rect x="62" y="318" width="176" height="58" rx="20" fill="url(#base)" stroke="#e89a23" stroke-width="3"/>
    <rect x="62" y="318" width="176" height="13" rx="6" fill="#ffe49a" opacity=".7"/>
    <rect x="127" y="326" width="46" height="42" rx="12" fill="#7a3b16" opacity=".92" stroke="#e89a23" stroke-width="2.5"/>
    <rect x="134" y="333" width="32" height="28" rx="8" fill="#5e2c10"/>
    <path d="M84 250 L216 250 Q224 250 222 262 L214 312 Q212 320 202 320 L98 320 Q88 320 86 312 L78 262 Q76 250 84 250 Z" fill="url(#body)" stroke="#e15691" stroke-width="3"/>
    <ellipse cx="150" cy="252" rx="66" ry="10" fill="url(#bodyTop)"/>
    <circle cx="150" cy="286" r="26" fill="#ffe089" stroke="#e89a23" stroke-width="3.5"/>
    <rect x="143" y="258" width="14" height="56" rx="7" fill="#ffcf3f" stroke="#e89a23" stroke-width="3"/>
    <rect x="122" y="279" width="56" height="14" rx="7" fill="#ffcf3f" stroke="#e89a23" stroke-width="3"/>
    <circle cx="150" cy="286" r="8" fill="#fff3c0" stroke="#e89a23" stroke-width="2.5"/>
    <circle cx="150" cy="286" r="3" fill="#b9760f"/>
    <circle cx="${BX}" cy="${BY}" r="${BR+5}" fill="url(#glass)" stroke="#ff9ec4" stroke-width="6"/>
    <clipPath id="ball"><circle cx="${BX}" cy="${BY}" r="${BR}"/></clipPath>
    <g clip-path="url(#ball)">${caps}</g>
    <ellipse cx="115" cy="106" rx="26" ry="38" fill="#fff" opacity=".38" transform="rotate(-22 115 106)"/>
    <circle cx="186" cy="104" r="9" fill="#fff" opacity=".45"/>
    <circle cx="${BX}" cy="${BY}" r="${BR+5}" fill="none" stroke="#fff" stroke-width="2" opacity=".4"/>
    <circle cx="150" cy="58" r="13" fill="#ffe26b" stroke="#e89a23" stroke-width="3"/>
    <path d="M150 34 l3.7 11 12 1 -9.3 7.4 3.7 11 -10.1 -6.4 -10.1 6.4 3.7 -11 -9.3 -7.4 12 -1 z" fill="#fff07a" stroke="#e89a23" stroke-width="2"/>
  </svg>`;
}

const COLORS = ['cYellow','cGold','cBlue','cRainbow','cPink','cGreen','cGold','cRainbow'];
document.body.insertAdjacentHTML("beforeend", machine(fillCaps(COLORS)));
</script>
</body>
</html>
```

## レア度別の中身プリセット（COLORS の例）
- つうじょう： `['cYellow','cGreen','cBlue','cPink']`
- レアおおめ： `['cYellow','cGold','cBlue','cRainbow','cPink','cGreen','cGold','cRainbow']`
- きん＆にじ だらけ： `['cGold','cRainbow','cGold','cRainbow','cGold']`

## 次の実装（動き）
- ハンドルがカチカチ回る → カプセルがグルッと揺れる → 1個が取り出し口へコロンと落ちる。
- タップで進める演出（HANDOFF.md / STEP_2_GACHA_SPEC.md 参照）に組み込む。
