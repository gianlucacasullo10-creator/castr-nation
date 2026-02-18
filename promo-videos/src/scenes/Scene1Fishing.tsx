import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring} from 'remotion';

// Brand colours
const PRIMARY = '#47C8E0';
const WATER_Y = 1100; // water surface in 1080×1920 SVG space
const FISHER_X = 760;

// Deterministic star positions (avoids Math.random per-frame)
const STARS = [
  {x: 80,  y: 60,  r: 1.5, p: 0.0}, {x: 190, y: 130, r: 1.0, p: 1.2},
  {x: 330, y: 45,  r: 2.0, p: 0.5}, {x: 460, y: 95,  r: 1.5, p: 2.1},
  {x: 610, y: 35,  r: 1.0, p: 0.8}, {x: 730, y: 115, r: 2.0, p: 1.7},
  {x: 860, y: 75,  r: 1.5, p: 0.3}, {x: 960, y: 145, r: 1.0, p: 2.5},
  {x: 140, y: 235, r: 1.5, p: 1.0}, {x: 390, y: 205, r: 1.0, p: 0.6},
  {x: 560, y: 185, r: 2.0, p: 1.9}, {x: 710, y: 225, r: 1.5, p: 1.4},
  {x: 890, y: 255, r: 1.0, p: 0.2}, {x: 55,  y: 355, r: 1.0, p: 1.8},
  {x: 260, y: 325, r: 1.5, p: 0.9}, {x: 490, y: 305, r: 1.0, p: 2.3},
  {x: 660, y: 345, r: 2.0, p: 0.4}, {x: 810, y: 385, r: 1.0, p: 1.6},
  {x: 1010,y: 305, r: 1.5, p: 0.7}, {x: 105, y: 485, r: 1.0, p: 2.0},
  {x: 355, y: 435, r: 1.5, p: 1.1}, {x: 585, y: 465, r: 1.0, p: 0.3},
  {x: 790, y: 505, r: 2.0, p: 2.2}, {x: 420, y: 555, r: 1.0, p: 0.9},
  {x: 920, y: 545, r: 1.5, p: 1.5},
];

const getWavePath = (frame: number, offset: number = 0): string => {
  const t = (frame + offset) * 0.055;
  const b = WATER_Y;
  const a = 15;
  const y = (phase: number) => b + Math.sin(t + phase) * a;
  return [
    `M 0 ${y(0)}`,
    `C 180 ${y(0.4)} 270 ${y(1.2)} 405 ${y(0.8)}`,
    `C 540 ${y(1.6)} 675 ${y(0.6)} 810 ${y(1.4)}`,
    `C 945 ${y(0.2)} 1000 ${y(1.8)} 1080 ${y(1.0)}`,
    `L 1080 1920 L 0 1920 Z`,
  ].join(' ');
};

interface FishermanProps {frame: number}

const Fisherman: React.FC<FishermanProps> = ({frame}) => {
  const x = FISHER_X;
  const base = WATER_Y;

  // Rod swings: rest → wind-up → forward cast
  const rodDeg = interpolate(
    frame,
    [0,  25,  50,  80],
    [20, 75,  75, -55],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const rodRad = (rodDeg * Math.PI) / 180;
  const ROD = 290;

  const handX = x + 18;
  const handY = base - 195;
  const tipX = handX + Math.sin(rodRad) * ROD;
  const tipY = handY - Math.cos(rodRad) * ROD;

  // Lure / line endpoint: drifts to water after cast
  const lureX = interpolate(frame, [80, 100], [tipX, 350], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lureY = interpolate(frame, [80, 100], [tipY, WATER_Y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ctrlX = (tipX + lureX) / 2;
  const ctrlY = Math.min(tipY, lureY) - 80;

  return (
    <g>
      {/* Ground shadow */}
      <ellipse cx={x} cy={base + 8} rx={55} ry={12} fill="rgba(0,0,0,0.35)" />

      {/* Legs */}
      <rect x={x - 20} y={base - 100} width={19} height={105} rx={9} fill="#0D1E30" />
      <rect x={x + 2}  y={base - 100} width={19} height={105} rx={9} fill="#0D1E30" />

      {/* Boots */}
      <ellipse cx={x - 10} cy={base + 5}  rx={16} ry={9} fill="#081520" />
      <ellipse cx={x + 12} cy={base + 5}  rx={16} ry={9} fill="#081520" />

      {/* Jacket body */}
      <rect x={x - 28} y={base - 220} width={56} height={125} rx={16} fill="#1A3A52" />

      {/* Vest pockets */}
      <rect x={x - 20} y={base - 205} width={20} height={32} rx={5} fill="#1E4868" />
      <rect x={x + 2}  y={base - 205} width={20} height={32} rx={5} fill="#1E4868" />

      {/* Back arm */}
      <rect
        x={x - 44} y={base - 215} width={17} height={60} rx={9} fill="#1A3A52"
        transform={`rotate(-18, ${x - 36}, ${base - 215})`}
      />
      {/* Rod arm */}
      <rect
        x={x + 25} y={base - 215} width={17} height={65} rx={9} fill="#1A3A52"
        transform={`rotate(22, ${x + 30}, ${base - 215})`}
      />

      {/* Head */}
      <circle cx={x} cy={base - 265} r={34} fill="#D4A97A" />

      {/* Fishing cap */}
      <ellipse cx={x + 6} cy={base - 298} rx={38} ry={15} fill="#1A3A52" />
      <rect x={x - 31} y={base - 308} width={70} height={18} rx={5} fill="#1A3A52" />
      {/* Cap brim */}
      <ellipse cx={x + 42} cy={base - 294} rx={24} ry={9} fill="#132C42" />

      {/* Eyes */}
      <circle cx={x - 11} cy={base - 265} r={4.5} fill="#2A1508" />
      <circle cx={x + 13} cy={base - 265} r={4.5} fill="#2A1508" />

      {/* Fishing rod */}
      <line x1={handX} y1={handY} x2={tipX} y2={tipY}
        stroke="#8B7040" strokeWidth={5.5} strokeLinecap="round" />
      <line x1={handX + 2} y1={handY} x2={tipX + 2} y2={tipY}
        stroke="rgba(200,165,80,0.25)" strokeWidth={2} strokeLinecap="round" />

      {/* Fishing line */}
      {frame >= 25 && (
        <path
          d={`M ${tipX} ${tipY} Q ${ctrlX} ${ctrlY} ${lureX} ${lureY}`}
          stroke="rgba(210,240,255,0.55)" strokeWidth={1.5} fill="none"
        />
      )}
    </g>
  );
};

interface BassProps {x: number; y: number; rotation: number; scale: number; opacity: number}

const Bass: React.FC<BassProps> = ({x, y, rotation, scale, opacity}) => (
  <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`} opacity={opacity}>
    {/* Body */}
    <ellipse cx={0} cy={0} rx={66} ry={28} fill="#3A6A4A" />
    {/* Dark back */}
    <path d="M -60 -10 C -20 -30 20 -30 60 -10" stroke="#2A5038" strokeWidth={13} fill="none" />
    {/* Light belly */}
    <ellipse cx={6} cy={12} rx={50} ry={14} fill="#9BBFA8" />
    {/* Lateral stripe */}
    <path d="M -52 2 L 58 2" stroke="rgba(0,0,0,0.18)" strokeWidth={9} strokeLinecap="round" />

    {/* Tail */}
    <path d="M -59 0 L -94 -32 L -88 0 L -94 32 Z" fill="#2A5038" />
    <line x1="-62" y1="0" x2="-94" y2="-32" stroke="#1E3A28" strokeWidth={2} />
    <line x1="-62" y1="0" x2="-94" y2="32"  stroke="#1E3A28" strokeWidth={2} />

    {/* Dorsal fin */}
    <path d="M -14 -28 L -4 -58 L 16 -54 L 32 -44 L 36 -28" fill="#2A5038" />
    <line x1="-8"  y1="-28" x2="-4"  y2="-58" stroke="#1E3A28" strokeWidth={1.5} />
    <line x1="8"   y1="-28" x2="12"  y2="-54" stroke="#1E3A28" strokeWidth={1.5} />
    <line x1="22"  y1="-28" x2="26"  y2="-46" stroke="#1E3A28" strokeWidth={1.5} />

    {/* Pectoral fin */}
    <ellipse cx={20} cy={13} rx={23} ry={9} fill="#2A5038" transform="rotate(-28,20,13)" />

    {/* Eye */}
    <circle cx={46} cy={-6} r={9}   fill="white" />
    <circle cx={47} cy={-6} r={5.5} fill="#1A2010" />
    <circle cx={49} cy={-8} r={2.5} fill="white" />

    {/* Mouth */}
    <path d="M 62 0 Q 70 6 67 12" stroke="#1A2010" strokeWidth={2.5} fill="none" strokeLinecap="round" />

    {/* Scale pattern */}
    <path d="M -22 -7 Q -12 -20 -2 -7"  stroke="rgba(0,0,0,0.18)" strokeWidth={1} fill="none" />
    <path d="M -2  -7 Q  8  -20 18 -7"  stroke="rgba(0,0,0,0.18)" strokeWidth={1} fill="none" />
    <path d="M 18  -7 Q 28  -20 38 -7"  stroke="rgba(0,0,0,0.18)" strokeWidth={1} fill="none" />
    <path d="M -22  7 Q -12  -6 -2  7"  stroke="rgba(0,0,0,0.13)" strokeWidth={1} fill="none" />
    <path d="M -2   7 Q  8   -6 18  7"  stroke="rgba(0,0,0,0.13)" strokeWidth={1} fill="none" />

    {/* Water droplets on body (airborne effect) */}
    <circle cx={-28} cy={-22} r={4.5} fill="rgba(140,215,255,0.85)" />
    <circle cx={12}  cy={-38} r={3.5} fill="rgba(140,215,255,0.85)" />
    <circle cx={42}  cy={-20} r={3}   fill="rgba(140,215,255,0.85)" />
  </g>
);

interface SplashProps {x: number; y: number; localFrame: number}

const Splash: React.FC<SplashProps> = ({x, y, localFrame}) => {
  const prog = interpolate(localFrame, [0, 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const r1 = prog * 100;
  const r2 = prog * 62;
  const o1 = interpolate(prog, [0, 0.35, 1], [1, 0.55, 0]);
  const o2 = interpolate(prog, [0.1, 0.65, 1], [0.9, 0.3, 0]);

  const drops = [
    {a: 0,   d: 1.0, s: 5.5}, {a: 45,  d: 1.2, s: 4},
    {a: 90,  d: 0.9, s: 6},   {a: 135, d: 1.1, s: 4},
    {a: 180, d: 0.8, s: 5},   {a: 225, d: 1.3, s: 3.5},
    {a: 270, d: 1.0, s: 5},   {a: 315, d: 0.95,s: 4},
  ];

  return (
    <g>
      <ellipse cx={x} cy={y} rx={r1} ry={r1 * 0.38} stroke="rgba(100,200,255,0.65)" strokeWidth={2} fill="none" opacity={o1} />
      <ellipse cx={x} cy={y} rx={r2} ry={r2 * 0.38} stroke="rgba(150,220,255,0.85)" strokeWidth={3} fill="none" opacity={o2} />
      {drops.map((d, i) => {
        const rad = (d.a * Math.PI) / 180;
        const dist = prog * 88 * d.d;
        const dx = x + Math.cos(rad) * dist;
        const dy = y - Math.abs(Math.sin(rad)) * dist * 0.55 - prog * 65;
        const dOp = interpolate(prog, [0.3, 1], [0.9, 0]);
        return <circle key={i} cx={dx} cy={dy} r={d.s * (1 - prog * 0.35)} fill="rgba(150,220,255,0.85)" opacity={dOp} />;
      })}
    </g>
  );
};

export const Scene1Fishing: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const fadeIn    = interpolate(frame, [0, 22],   [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flashOut  = interpolate(frame, [148, 165],[0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Fish arc: frames 88–138
  const fishProg = interpolate(frame, [88, 138], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fishX  = 350 + Math.sin(fishProg * Math.PI * 0.7) * 90;
  const fishY  = WATER_Y - Math.sin(fishProg * Math.PI) * 390;
  const fishRot = interpolate(fishProg, [0, 0.35, 0.7, 1], [0, -18, -28, 8]);
  const fishOp  = interpolate(frame, [88, 94, 132, 140], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Phone materialises at the end (bridge to Scene 2)
  const phoneOp = interpolate(frame, [145, 162], [0, 0.45], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const phoneScale = spring({frame: Math.max(0, frame - 145), fps, config: {damping: 16, stiffness: 140}});

  const showFish   = frame >= 88  && frame <= 140;
  const showSplash = frame >= 88  && frame <= 124;

  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      {/* Sky */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #050D18 0%, #0D1B2A 28%, #12243A 54%, #0A1E30 70%, #091820 100%)',
      }} />

      {/* Stars */}
      <svg style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '60%'}} viewBox="0 0 1080 1150" preserveAspectRatio="xMidYMid slice">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white"
            opacity={0.65 + Math.sin(frame * 0.07 + s.p * 3) * 0.35} />
        ))}
      </svg>

      {/* Moon */}
      <div style={{
        position: 'absolute', width: 90, height: 90, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #FFFAE8, #EEE290)',
        boxShadow: '0 0 45px 18px rgba(238,226,144,0.22)',
        top: 150, right: 185,
      }} />

      {/* Water + fisherman + fish */}
      <svg style={{position: 'absolute', inset: 0}} viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#10283A" />
            <stop offset="50%"  stopColor="#091E2E" />
            <stop offset="100%" stopColor="#050E18" />
          </linearGradient>
        </defs>

        {/* Water body */}
        <rect x={0} y={WATER_Y} width={1080} height={1920 - WATER_Y} fill="url(#wg)" />

        {/* Moon reflection ripple */}
        <rect x={820} y={WATER_Y} width={55} height={350} fill="rgba(238,226,144,0.055)" />

        {/* Animated waves (two layers for depth) */}
        <path d={getWavePath(frame)}     fill="#152E42" opacity={0.85} />
        <path d={getWavePath(frame, 10)} fill="#1B3A52" opacity={0.50} />

        {/* Shore / bank */}
        <path d="M 550 1100 Q 700 1082 900 1094 L 1080 1090 L 1080 1200 L 550 1200 Z" fill="#0F2030" />
        <path d="M 620 1100 Q 760 1086 920 1096 L 1080 1092 L 1080 1150 L 620 1150 Z" fill="#0C1C2C" />

        {/* Rocks */}
        <ellipse cx={830} cy={1112} rx={38} ry={16} fill="#0A1820" />
        <ellipse cx={882} cy={1106} rx={22} ry={11} fill="#0C1E2E" />
        <ellipse cx={700} cy={1118} rx={28} ry={13} fill="#0A1820" />

        {/* Fisherman */}
        <Fisherman frame={frame} />

        {/* Fish */}
        {showFish && <Bass x={fishX} y={fishY} rotation={fishRot} scale={1.65} opacity={fishOp} />}

        {/* Splash */}
        {showSplash && <Splash x={350} y={WATER_Y} localFrame={frame - 88} />}
      </svg>

      {/* Castrs watermark */}
      <div style={{
        position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)',
        color: `rgba(71,200,224,0.32)`, fontFamily: 'Inter, sans-serif',
        fontSize: 30, fontWeight: 900, fontStyle: 'italic', letterSpacing: 10,
      }}>
        CASTRS
      </div>

      {/* Phone ghost (bridge to Scene 2) */}
      {frame >= 145 && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 160,
          transform: `translateX(-50%) scale(${phoneScale})`,
          opacity: phoneOp,
          width: 260, height: 520, borderRadius: 36,
          background: 'rgba(10,20,32,0.85)',
          border: '1.5px solid rgba(71,200,224,0.4)',
          boxShadow: '0 0 40px rgba(71,200,224,0.2)',
        }} />
      )}

      {/* White flash transition */}
      <div style={{
        position: 'absolute', inset: 0, background: 'white',
        opacity: flashOut, pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};
