import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

const WATER_Y = 1060; // in 1080×1920 SVG space

// ─── Stars ───────────────────────────────────────────────────────────────────
const STARS = [
  {x:80,y:55,r:1.5,p:0.0},{x:195,y:125,r:1.0,p:1.2},{x:330,y:40,r:2.0,p:0.5},
  {x:460,y:85,r:1.5,p:2.1},{x:615,y:30,r:1.0,p:0.8},{x:730,y:110,r:2.0,p:1.7},
  {x:870,y:70,r:1.5,p:0.3},{x:965,y:140,r:1.0,p:2.5},{x:140,y:230,r:1.5,p:1.0},
  {x:395,y:200,r:1.0,p:0.6},{x:565,y:180,r:2.0,p:1.9},{x:715,y:220,r:1.5,p:1.4},
  {x:895,y:250,r:1.0,p:0.2},{x:55,y:350,r:1.0,p:1.8},{x:265,y:320,r:1.5,p:0.9},
  {x:495,y:300,r:1.0,p:2.3},{x:665,y:340,r:2.0,p:0.4},{x:820,y:380,r:1.0,p:1.6},
];

// ─── Wave path ────────────────────────────────────────────────────────────────
const wavePath = (frame: number, off: number = 0): string => {
  const t = frame * 0.05 + off;
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

// ─── Splash ────────────────────────────────────────────────────────────────────
const Splash: React.FC<{x: number; y: number; lf: number}> = ({x, y, lf}) => {
  const prog = interpolate(lf, [0, 38], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const r1 = prog * 105;
  const r2 = prog * 64;
  const o1 = interpolate(prog, [0, 0.3, 1], [1, 0.55, 0]);
  const o2 = interpolate(prog, [0.1, 0.65, 1], [0.9, 0.3, 0]);
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

  const fadeIn   = interpolate(frame, [0, 22],   [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const flashOut = interpolate(frame, [148, 165], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  // ── Fish arc: frames 88–138 ──────────────────────────────────────────────
  const fishProg = interpolate(frame, [88, 138], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const fishXpct = ((435 + Math.sin(fishProg * Math.PI * 0.5) * 65) / 1080) * 100;
  const fishYpct = ((WATER_Y - Math.sin(fishProg * Math.PI) * 400) / 1920) * 100;
  const fishRot  = interpolate(fishProg, [0, 0.3, 0.7, 1], [20, -10, -30, 15]);
  const fishOp   = interpolate(frame, [88, 95, 132, 140], [0, 1, 1, 0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  // ── Fishing rod animation ─────────────────────────────────────────────────
  // Wind up → hold → release → fish strikes (rod snaps back)
  const rodAngle = interpolate(
    frame, [0, 20, 50, 80, 88, 100],
    [-2, -10, -10, -3, 9, 5],
    {extrapolateLeft:'clamp', extrapolateRight:'clamp'},
  );
  const totalRodAngle = rodAngle + Math.sin(frame * 0.09) * 1.5;

  // Star fade (dim toward orange horizon)
  const starAlpha = (sy: number) => Math.max(0, 1 - sy / 460);

  return (
    <AbsoluteFill style={{opacity: fadeIn}}>

      {/* ── SVG: sky, sun, water, waves, shore, rod ──────────────────────── */}
      <svg style={{position:'absolute',inset:0}} viewBox="0 0 1080 1920" width="100%" height="100%">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0C0226" />
            <stop offset="28%"  stopColor="#380A56" />
            <stop offset="54%"  stopColor="#6E1426" />
            <stop offset="72%"  stopColor="#B83818" />
            <stop offset="86%"  stopColor="#D85010" />
            <stop offset="95%"  stopColor="#EA7018" />
            <stop offset="100%" stopColor="#F09A28" />
          </linearGradient>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1E3E50" />
            <stop offset="20%"  stopColor="#0E2436" />
            <stop offset="60%"  stopColor="#081828" />
            <stop offset="100%" stopColor="#040C18" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="50%">
            <stop offset="0%"   stopColor="#FFE888" stopOpacity={1}    />
            <stop offset="20%"  stopColor="#FFB830" stopOpacity={0.85} />
            <stop offset="55%"  stopColor="#FF7010" stopOpacity={0.3}  />
            <stop offset="100%" stopColor="#FF4000" stopOpacity={0}    />
          </radialGradient>
          <linearGradient id="reflect" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#F09A28" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#C06010" stopOpacity={0}    />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect x={0} y={0} width={1080} height={WATER_Y} fill="url(#sky)" />

        {/* Stars */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white"
            opacity={starAlpha(s.y) * (0.6 + Math.sin(frame * 0.07 + s.p * 3) * 0.4)} />
        ))}

        {/* Rising sun */}
        <circle cx={400} cy={WATER_Y} r={250} fill="url(#sunGlow)" />
        <circle cx={400} cy={WATER_Y} r={75}  fill="#FFE888" />
        {[0,30,60,90,120,150,210,240,270,300,330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line key={i}
              x1={400 + Math.cos(rad) * 84}  y1={WATER_Y + Math.sin(rad) * 84}
              x2={400 + Math.cos(rad) * 175}  y2={WATER_Y + Math.sin(rad) * 175}
              stroke="rgba(255,230,100,0.16)" strokeWidth={4} strokeLinecap="round"
            />
          );
        })}

        {/* Water */}
        <rect x={0} y={WATER_Y} width={1080} height={1920 - WATER_Y} fill="url(#water)" />
        <rect x={320} y={WATER_Y} width={160} height={860} fill="url(#reflect)" />

        {/* Animated waves */}
        <path d={wavePath(frame)}     fill="#1C3A4E" opacity={0.88} />
        <path d={wavePath(frame, 12)} fill="#244A62" opacity={0.45} />

        {/* Shore / bank */}
        <path d="M 580 1062 Q 720 1040 920 1054 L 1080 1050 L 1080 1180 L 580 1180 Z" fill="#0C1C2E" />
        <path d="M 640 1062 Q 760 1044 940 1056 L 1080 1052 L 1080 1110 L 640 1110 Z" fill="#0A1828" />
        <ellipse cx={840} cy={1072} rx={40} ry={16} fill="#08141E" />
        <ellipse cx={896} cy={1066} rx={24} ry={12} fill="#0A1622" />
        <ellipse cx={710} cy={1076} rx={30} ry={14} fill="#08141E" />

        {/* Splash */}
        {frame >= 88 && frame <= 126 && (
          <Splash x={435} y={WATER_Y} lf={frame - 88} />
        )}

        {/*
          Fishing rod — pivot at (990, 1068) on shore.
          In local space (translated to pivot):
            butt→mid  : (0,0)    → (-130,-186)   thick dark segment
            mid→tip   : (-130,186) → (-390,-557)  tapering to fine tip
          Fishing line hangs from tip to water surface.
        */}
        <g transform={`translate(990,1068) rotate(${totalRodAngle})`}>
          {/* Butt / lower section — thick */}
          <line x1={0} y1={0} x2={-130} y2={-186}
            stroke="#040A10" strokeWidth={10} strokeLinecap="round" />
          {/* Mid section */}
          <line x1={-124} y1={-177} x2={-280} y2={-400}
            stroke="#060E18" strokeWidth={6} strokeLinecap="round" />
          {/* Tip section — thin */}
          <line x1={-274} y1={-392} x2={-390} y2={-557}
            stroke="#0C1E30" strokeWidth={2.5} strokeLinecap="round" />
          {/* Fishing line — subtle white thread from tip to water */}
          <line x1={-390} y1={-557} x2={-562} y2={-12}
            stroke="rgba(220,235,255,0.32)" strokeWidth={1.4} />
          {/* Tiny lure dot at water entry */}
          <circle cx={-562} cy={-12} r={5} fill="rgba(71,200,224,0.55)" />
        </g>
      </svg>

      {/* ── Fish emoji (silhouetted, jumping in arc) ────────────────────── */}
      {frame >= 88 && frame <= 140 && (
        <div style={{
          position: 'absolute',
          left: `${fishXpct}%`,
          top: `${fishYpct}%`,
          fontSize: 185,
          lineHeight: 1,
          userSelect: 'none',
          transform: `translate(-50%, -50%) rotate(${fishRot}deg) scaleX(-1)`,
          filter: 'brightness(0) saturate(0)',
          opacity: fishOp,
        }}>
          🐟
        </div>
      )}

      {/* ── CASTRS watermark ──────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 68, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(71,200,224,0.35)', fontFamily: 'Inter, sans-serif',
        fontSize: 30, fontWeight: 900, fontStyle: 'italic', letterSpacing: 10,
      }}>
        CASTRS
      </div>

      {/* ── White flash → Scene 2 ─────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, background: 'white',
        opacity: flashOut, pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};
