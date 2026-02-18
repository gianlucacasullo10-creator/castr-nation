import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

// ─── Layout constants (1080 × 1920 SVG space) ───────────────────────────────
const WATER_Y  = 1060;   // Horizon / water surface
const FX       = 810;    // Fisherman centre-X
const FY       = WATER_Y;
// Rod hand position (derived once, used consistently for rod & line)
const HAND_X   = FX + 54;
const HAND_Y   = FY - 182;
const ROD_LEN  = 290;

// ─── Sunrise colours ────────────────────────────────────────────────────────
// Sky: deep purple at top → orange-gold at horizon
// Water: dark blue with warm surface reflection

// ─── Deterministic stars (only in upper purple zone) ────────────────────────
const STARS = [
  {x:  80, y:  55, r:1.5, p:0.0}, {x:195, y:125, r:1.0, p:1.2},
  {x: 330, y:  40, r:2.0, p:0.5}, {x:460, y:  85, r:1.5, p:2.1},
  {x: 615, y:  30, r:1.0, p:0.8}, {x:730, y: 110, r:2.0, p:1.7},
  {x: 870, y:  70, r:1.5, p:0.3}, {x:965, y: 140, r:1.0, p:2.5},
  {x: 140, y: 230, r:1.5, p:1.0}, {x:395, y: 200, r:1.0, p:0.6},
  {x: 565, y: 180, r:2.0, p:1.9}, {x:715, y: 220, r:1.5, p:1.4},
  {x: 895, y: 250, r:1.0, p:0.2}, {x: 55, y: 350, r:1.0, p:1.8},
  {x: 265, y: 320, r:1.5, p:0.9}, {x:495, y: 300, r:1.0, p:2.3},
  {x: 665, y: 340, r:2.0, p:0.4}, {x:820, y: 380, r:1.0, p:1.6},
  {x:1015, y: 300, r:1.5, p:0.7},
];

// ─── Water wave SVG path ─────────────────────────────────────────────────────
const wavePath = (frame: number, layerOffset: number = 0): string => {
  const t = frame * 0.05 + layerOffset;
  const b = WATER_Y;
  const a = 13;
  const y = (p: number) => b + Math.sin(t + p) * a;
  return [
    `M 0 ${y(0)}`,
    `C 180 ${y(0.5)} 270 ${y(1.4)} 405 ${y(0.9)}`,
    `C 540 ${y(1.8)} 675 ${y(0.7)} 810 ${y(1.5)}`,
    `C 945 ${y(0.3)} 1010 ${y(1.9)} 1080 ${y(1.1)}`,
    `L 1080 1920 L 0 1920 Z`,
  ].join(' ');
};

// ─── Fisherman silhouette ─────────────────────────────────────────────────────
// All positions absolute in 1080×1920 space, derived from FX / FY
const SILO = '#080410'; // near-black silhouette

const FishermanSilhouette: React.FC<{frame: number}> = ({frame}) => {
  // Rod angle: rest → windup back → forward cast
  const rodDeg = interpolate(
    frame,
    [0,  25, 50, 80],
    [25, 82, 82, -58],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const rodRad = (rodDeg * Math.PI) / 180;
  const tipX = HAND_X + Math.sin(rodRad) * ROD_LEN;
  const tipY = HAND_Y - Math.cos(rodRad) * ROD_LEN;

  // Lure settles to water after cast (frames 80–100)
  const lureX = interpolate(frame, [80, 100], [tipX, 435], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const lureY = interpolate(frame, [80, 100], [tipY, WATER_Y - 2], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const ctrlX = (tipX + lureX) / 2;
  const ctrlY = Math.min(tipY, lureY) - 90;

  return (
    <g>
      {/* Shadow on ground */}
      <ellipse cx={FX} cy={FY + 9} rx={55} ry={11} fill="rgba(0,0,0,0.45)" />

      {/* Boots */}
      <rect x={FX - 30} y={FY - 20} width={27} height={22} rx={8}  fill={SILO} />
      <rect x={FX + 4}  y={FY - 20} width={27} height={22} rx={8}  fill={SILO} />

      {/* Legs */}
      <rect x={FX - 30} y={FY - 138} width={25} height={122} rx={11} fill={SILO} />
      <rect x={FX + 5}  y={FY - 138} width={25} height={122} rx={11} fill={SILO} />

      {/* Torso / jacket */}
      <rect x={FX - 34} y={FY - 260} width={68} height={128} rx={15} fill={SILO} />

      {/* Left arm (hanging naturally) */}
      <rect
        x={FX - 52} y={FY - 252} width={20} height={70} rx={10} fill={SILO}
        transform={`rotate(-14,${FX - 42},${FY - 252})`}
      />

      {/* Right arm (rod arm) — positioned to match HAND_X/HAND_Y */}
      <rect
        x={HAND_X - 10} y={FY - 258} width={20} height={80} rx={10} fill={SILO}
        transform={`rotate(20,${HAND_X},${FY - 258})`}
      />

      {/* Neck */}
      <rect x={FX - 13} y={FY - 280} width={26} height={26} rx={8} fill={SILO} />

      {/* Head */}
      <circle cx={FX} cy={FY - 314} r={36} fill={SILO} />

      {/* Fishing cap — brim + crown sit cleanly on head */}
      <ellipse cx={FX + 5} cy={FY - 348} rx={46} ry={14} fill={SILO} />
      <rect    x={FX - 23} y={FY - 396} width={46} height={52} rx={8} fill={SILO} />
      {/* Forward brim */}
      <ellipse cx={FX + 38} cy={FY - 348} rx={30} ry={11} fill={SILO} />

      {/* Fishing rod */}
      <line x1={HAND_X} y1={HAND_Y} x2={tipX} y2={tipY}
        stroke="#7A6030" strokeWidth={6} strokeLinecap="round" />
      <line x1={HAND_X + 2} y1={HAND_Y} x2={tipX + 2} y2={tipY}
        stroke="rgba(200,170,80,0.28)" strokeWidth={2.5} strokeLinecap="round" />

      {/* Fishing line (appears once rod starts moving) */}
      {frame >= 20 && (
        <path
          d={`M ${tipX} ${tipY} Q ${ctrlX} ${ctrlY} ${lureX} ${lureY}`}
          stroke="rgba(220,240,255,0.55)" strokeWidth={1.5} fill="none"
        />
      )}
    </g>
  );
};

// ─── Bass silhouette ──────────────────────────────────────────────────────────
interface BassProps {x: number; y: number; rotation: number; scale: number; opacity: number}

const BassSilhouette: React.FC<BassProps> = ({x, y, rotation, scale, opacity}) => (
  <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`} opacity={opacity}>
    {/* Body — realistic bass outline */}
    <path d="M -72 0 C -72 -30 -38 -36 0 -33 C 40 -30 70 -18 78 0 C 70 18 40 30 0 33 C -38 36 -72 30 -72 0 Z"
      fill={SILO} />
    {/* Tail — forked, bass signature */}
    <path d="M -70 0 L -108 -38 L -102 -6 L -102 6 L -108 38 Z" fill={SILO} />
    {/* Dorsal fin with spiny rays */}
    <path d="M -18 -33 L -10 -68 L 2 -65 L 16 -72 L 30 -64 L 44 -54 L 50 -33" fill={SILO} />
    {/* Pectoral fin */}
    <ellipse cx={22} cy={16} rx={28} ry={11} fill={SILO} transform="rotate(-32,22,16)" />
    {/* Anal fin */}
    <path d="M -24 30 L -26 52 L -8 48 L 0 30" fill={SILO} />
    {/* Mouth */}
    <path d="M 70 0 L 84 8 L 82 -6 Z" fill={SILO} />
  </g>
);

// ─── Splash ───────────────────────────────────────────────────────────────────
const Splash: React.FC<{x: number; y: number; lf: number}> = ({x, y, lf}) => {
  const prog = interpolate(lf, [0, 38], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const r1   = prog * 105;
  const r2   = prog * 64;
  const o1   = interpolate(prog, [0, 0.3, 1], [1, 0.55, 0]);
  const o2   = interpolate(prog, [0.1, 0.65, 1], [0.9, 0.3, 0]);
  const drops = [
    {a:0,d:1.0,s:5.5},{a:45,d:1.2,s:4},{a:90,d:0.9,s:6},{a:135,d:1.1,s:4},
    {a:180,d:0.8,s:5},{a:225,d:1.3,s:3.5},{a:270,d:1.0,s:5},{a:315,d:0.95,s:4},
  ];
  return (
    <g>
      <ellipse cx={x} cy={y} rx={r1} ry={r1*0.36} stroke="rgba(240,180,80,0.6)"  strokeWidth={2} fill="none" opacity={o1} />
      <ellipse cx={x} cy={y} rx={r2} ry={r2*0.36} stroke="rgba(255,220,120,0.85)" strokeWidth={3} fill="none" opacity={o2} />
      {drops.map((d, i) => {
        const rad  = (d.a * Math.PI) / 180;
        const dist = prog * 92 * d.d;
        const dx   = x + Math.cos(rad) * dist;
        const dy   = y - Math.abs(Math.sin(rad)) * dist * 0.52 - prog * 68;
        const dOp  = interpolate(prog, [0.3, 1], [0.9, 0]);
        return <circle key={i} cx={dx} cy={dy} r={d.s*(1-prog*0.35)} fill="rgba(255,220,120,0.85)" opacity={dOp} />;
      })}
    </g>
  );
};

// ─── Main scene ───────────────────────────────────────────────────────────────
export const Scene1Fishing: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn   = interpolate(frame, [0, 22],  [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const flashOut = interpolate(frame, [148,165], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  // Fish arc — frames 88–138 (50 frames = 1.67 s)
  const fishProg = interpolate(frame, [88, 138], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const fishX    = 435 + Math.sin(fishProg * Math.PI * 0.5) * 65;
  const fishY    = WATER_Y - Math.sin(fishProg * Math.PI) * 400;
  const fishRot  = interpolate(fishProg, [0, 0.3, 0.7, 1], [0, -20, -30, 10]);
  const fishOp   = interpolate(frame, [88, 94, 132, 140], [0, 1, 1, 0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  // Star opacity: fade out toward orange horizon
  const starFade = (starY: number) => Math.max(0, 1 - starY / 500);

  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      {/* ── SVG canvas ───────────────────────────────────────────────────── */}
      <svg style={{position:'absolute',inset:0}} viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs>
          {/* Sunrise sky gradient: purple → red-orange → gold at horizon */}
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"    stopColor="#0C0226" />
            <stop offset="28%"   stopColor="#380A56" />
            <stop offset="54%"   stopColor="#6E1426" />
            <stop offset="72%"   stopColor="#B83818" />
            <stop offset="85%"   stopColor="#D85010" />
            <stop offset="95%"   stopColor="#EA7018" />
            <stop offset="100%"  stopColor="#F09A28" />
          </linearGradient>

          {/* Water gradient: warm surface → dark deep */}
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1E3E50" />
            <stop offset="18%"  stopColor="#0E2435" />
            <stop offset="55%"  stopColor="#081828" />
            <stop offset="100%" stopColor="#040C18" />
          </linearGradient>

          {/* Sun radial glow */}
          <radialGradient id="sunGlow" cx="50%" cy="50%">
            <stop offset="0%"   stopColor="#FFE888" stopOpacity={1} />
            <stop offset="18%"  stopColor="#FFB830" stopOpacity={0.85} />
            <stop offset="50%"  stopColor="#FF7010" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FF4000" stopOpacity={0} />
          </radialGradient>

          {/* Sunrise reflection in water (column of warm light) */}
          <linearGradient id="reflect" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#F09A28" stopOpacity={0.22} />
            <stop offset="60%"  stopColor="#C06010" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#C06010" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect x={0} y={0} width={1080} height={WATER_Y} fill="url(#sky)" />

        {/* Stars (only in purple zone, fade near orange horizon) */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r}
            fill="white"
            opacity={starFade(s.y) * (0.6 + Math.sin(frame * 0.07 + s.p * 3) * 0.4)}
          />
        ))}

        {/* Rising sun disc + glow */}
        <circle cx={400} cy={WATER_Y} r={240} fill="url(#sunGlow)" />
        <circle cx={400} cy={WATER_Y} r={75}  fill="#FFE888" />
        {/* Subtle sun rays (static lines radiating from sun) */}
        {[0,30,60,90,120,150,210,240,270,300,330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line key={i}
              x1={400 + Math.cos(rad) * 82}  y1={WATER_Y + Math.sin(rad) * 82}
              x2={400 + Math.cos(rad) * 170}  y2={WATER_Y + Math.sin(rad) * 170}
              stroke="rgba(255,230,100,0.18)" strokeWidth={4} strokeLinecap="round"
            />
          );
        })}

        {/* Water body */}
        <rect x={0} y={WATER_Y} width={1080} height={1920 - WATER_Y} fill="url(#water)" />

        {/* Sunrise warm reflection column */}
        <rect x={310} y={WATER_Y} width={180} height={860} fill="url(#reflect)" />

        {/* Animated wave (two layers for depth) */}
        <path d={wavePath(frame)}     fill="#1C3A4E" opacity={0.88} />
        <path d={wavePath(frame, 12)} fill="#244A62" opacity={0.45} />

        {/* Shore/bank behind fisherman */}
        <path d="M 580 1062 Q 720 1040 920 1054 L 1080 1050 L 1080 1180 L 580 1180 Z" fill="#0C1C2E" />
        <path d="M 640 1062 Q 760 1044 940 1056 L 1080 1052 L 1080 1110 L 640 1110 Z" fill="#0A1828" />
        {/* Rocks */}
        <ellipse cx={840} cy={1072} rx={40} ry={16} fill="#08141E" />
        <ellipse cx={896} cy={1066} rx={24} ry={12} fill="#0A1622" />
        <ellipse cx={710} cy={1076} rx={30} ry={14} fill="#08141E" />

        {/* Fisherman */}
        <FishermanSilhouette frame={frame} />

        {/* Bass (airborne) */}
        {frame >= 88 && frame <= 140 && (
          <BassSilhouette x={fishX} y={fishY} rotation={fishRot} scale={1.7} opacity={fishOp} />
        )}

        {/* Splash */}
        {frame >= 88 && frame <= 126 && (
          <Splash x={435} y={WATER_Y} lf={frame - 88} />
        )}

        {/* Motion streak behind flying fish */}
        {frame >= 88 && frame <= 138 && fishOp > 0.5 && (() => {
          const trail = interpolate(fishProg, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
          return (
            <line
              x1={fishX + 40} y1={fishY}
              x2={fishX + 90} y2={fishY + 15}
              stroke="rgba(255,200,80,0.25)" strokeWidth={8} strokeLinecap="round"
              opacity={trail}
            />
          );
        })()}
      </svg>

      {/* CASTRS watermark — styled in brand cyan against the dark purple sky */}
      <div style={{
        position:'absolute', top:68, left:'50%', transform:'translateX(-50%)',
        color:'rgba(71,200,224,0.35)', fontFamily:'Inter, sans-serif',
        fontSize:30, fontWeight:900, fontStyle:'italic', letterSpacing:10,
      }}>
        CASTRS
      </div>

      {/* White flash → Scene 2 */}
      <div style={{
        position:'absolute', inset:0, background:'white',
        opacity:flashOut, pointerEvents:'none',
      }} />
    </AbsoluteFill>
  );
};
