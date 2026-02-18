import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring} from 'remotion';

const PRIMARY       = '#47C8E0';
const POINTS_ORANGE = '#F5A020';
const GOLD          = '#F5C218';
const SUCCESS       = '#2DC74B';

// Fixed particle positions (deterministic — no Math.random per frame)
const PARTICLES = [
  {x: 195, y: 620,  vx: -2.2, vy: -3.1, color: GOLD,          size: 8,  delay: 28},
  {x: 885, y: 710,  vx:  3.0, vy: -3.8, color: PRIMARY,        size: 6,  delay: 34},
  {x: 145, y: 910,  vx: -3.2, vy: -2.2, color: POINTS_ORANGE,  size: 10, delay: 30},
  {x: 960, y: 815,  vx:  2.4, vy: -5.0, color: GOLD,           size: 7,  delay: 38},
  {x: 305, y: 1215, vx: -1.4, vy: -3.8, color: PRIMARY,        size: 5,  delay: 31},
  {x: 795, y: 1110, vx:  2.2, vy: -3.1, color: POINTS_ORANGE,  size: 9,  delay: 42},
  {x: 540, y: 510,  vx:  0.5, vy: -5.2, color: GOLD,           size: 6,  delay: 29},
  {x: 95,  y: 1320, vx: -2.0, vy: -2.4, color: PRIMARY,        size: 8,  delay: 37},
  {x: 985, y: 1425, vx:  3.2, vy: -3.0, color: GOLD,           size: 5,  delay: 36},
  {x: 410, y: 1520, vx: -1.2, vy: -4.2, color: POINTS_ORANGE,  size: 7,  delay: 44},
  {x: 695, y: 1615, vx:  2.1, vy: -4.8, color: PRIMARY,        size: 6,  delay: 40},
  {x: 255, y: 1710, vx: -3.0, vy: -3.2, color: GOLD,           size: 9,  delay: 33},
  {x: 820, y: 1310, vx:  1.8, vy: -2.8, color: POINTS_ORANGE,  size: 5,  delay: 45},
  {x: 60,  y: 1550, vx: -2.4, vy: -2.0, color: PRIMARY,        size: 7,  delay: 32},
];

const SPARKLES = [
  {cx: 175, cy: 820,  delay: 44}, {cx: 905, cy: 760,  delay: 50},
  {cx: 540, cy: 1320, delay: 56}, {cx: 255, cy: 1510, delay: 47},
  {cx: 835, cy: 1215, delay: 53}, {cx: 420, cy: 640,  delay: 41},
];

export const Scene3Points: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Green flash entry (from Scene 2 success)
  const greenFlash = interpolate(frame, [0, 12], [0.7, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // "TROPHY VERIFIED!" slam
  const titleSpr = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 6, stiffness: 200}});

  // Check / species badge
  const badgeOp  = interpolate(frame, [28, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const badgeSpr = spring({frame: Math.max(0, frame - 28), fps, config: {damping: 10, stiffness: 160}});

  // Points counter counts up  (base 75 × 1.4 = 105)
  const pointsVal = Math.round(interpolate(frame, [42, 84], [0, 105], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

  // Multiplier badge
  const multOp  = interpolate(frame, [52, 64], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const multSpr = spring({frame: Math.max(0, frame - 52), fps, config: {damping: 12, stiffness: 200}});

  // Glow pulse on points number
  const glow = 0.5 + Math.sin(frame * 0.15) * 0.2;

  // Fade out
  const fadeOut = interpolate(frame, [96, 112], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#070F1A'}}>
      {/* Green success flash */}
      <div style={{position:'absolute',inset:0,background:SUCCESS,opacity:greenFlash,pointerEvents:'none'}} />

      {/* Radial background glow */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse at 50% 42%, rgba(71,200,224,0.14) 0%, transparent 55%)',
      }} />

      {/* Particles + sparkles */}
      <svg style={{position:'absolute',inset:0}} viewBox="0 0 1080 1920" width="100%" height="100%">
        {/* Decorative rings */}
        <circle cx={540} cy={870} r={310} stroke="rgba(71,200,224,0.07)"  strokeWidth={1} fill="none" />
        <circle cx={540} cy={870} r={440} stroke="rgba(71,200,224,0.04)"  strokeWidth={1} fill="none" />
        <circle cx={540} cy={870} r={580} stroke="rgba(245,194,24,0.03)"  strokeWidth={1} fill="none" />

        {PARTICLES.map((p, i) => {
          const lf = Math.max(0, frame - p.delay);
          const px = p.x + p.vx * lf;
          const py = p.y + p.vy * lf;
          const op = interpolate(lf, [0, 5, 55, 75], [0, 1, 1, 0], {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
          return (
            <g key={i}>
              <circle cx={px} cy={py} r={p.size} fill={p.color} opacity={op} />
              <line
                x1={p.x + p.vx * Math.max(0, lf - 10)} y1={p.y + p.vy * Math.max(0, lf - 10)}
                x2={px} y2={py}
                stroke={p.color} strokeWidth={p.size * 0.45} opacity={op * 0.45}
              />
            </g>
          );
        })}

        {SPARKLES.map((s, i) => {
          const lf = Math.max(0, frame - s.delay);
          const ss = spring({frame: lf, fps, config: {damping: 8, stiffness: 300}});
          const so = interpolate(lf, [0, 4, 18, 34], [0, 1, 0.85, 0], {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
          return (
            <g key={i} transform={`translate(${s.cx},${s.cy}) scale(${ss * 1.6})`} opacity={so}>
              <line x1={0} y1={-22} x2={0}   y2={22}  stroke={GOLD} strokeWidth={2} />
              <line x1={-22} y1={0} x2={22}  y2={0}   stroke={GOLD} strokeWidth={2} />
              <line x1={-15} y1={-15} x2={15} y2={15} stroke={GOLD} strokeWidth={1.5} />
              <line x1={15}  y1={-15} x2={-15} y2={15} stroke={GOLD} strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>

      {/* Main content */}
      <div style={{
        position:'absolute', inset:0,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        fontFamily:'Inter, sans-serif', gap:32,
      }}>
        {/* Trophy emoji */}
        <div style={{fontSize:118, lineHeight:1, transform:`scale(${titleSpr})`}}>🏆</div>

        {/* TROPHY VERIFIED! */}
        <div style={{textAlign:'center', transform:`scale(${titleSpr})`}}>
          <div style={{
            color:'#FFFFFF', fontSize:82, fontWeight:900, fontStyle:'italic',
            textTransform:'uppercase', letterSpacing:2, lineHeight:0.9,
            textShadow:'0 0 50px rgba(71,200,224,0.35)',
          }}>
            TROPHY
          </div>
          <div style={{
            color:PRIMARY, fontSize:82, fontWeight:900, fontStyle:'italic',
            textTransform:'uppercase', letterSpacing:2, lineHeight:0.9,
          }}>
            VERIFIED!
          </div>
        </div>

        {/* Species badge */}
        <div style={{
          opacity:badgeOp, transform:`scale(${badgeSpr})`,
          background:'rgba(71,200,224,0.12)',
          border:`1px solid rgba(71,200,224,0.38)`,
          borderRadius:50, padding:'10px 34px',
          color:PRIMARY, fontSize:22, fontWeight:700, letterSpacing:3,
        }}>
          LARGEMOUTH BASS
        </div>

        {/* Points */}
        <div style={{textAlign:'center'}}>
          <div style={{
            color:POINTS_ORANGE, fontSize:130, fontWeight:900, fontStyle:'italic', lineHeight:1,
            textShadow:`0 0 ${glow * 70}px rgba(245,160,32,${glow * 0.7})`,
          }}>
            +{pointsVal}
          </div>
          <div style={{
            color:GOLD, fontSize:38, fontWeight:800, letterSpacing:9, marginTop:-10,
          }}>
            PTS
          </div>
        </div>

        {/* Multiplier badge */}
        <div style={{
          opacity:multOp, transform:`scale(${Math.max(0, multSpr)})`,
          background:'rgba(245,194,24,0.12)',
          border:`2px solid rgba(245,194,24,0.55)`,
          borderRadius:20, padding:'13px 30px',
          display:'flex', alignItems:'center', gap:10,
        }}>
          <span style={{color:GOLD, fontWeight:900, fontStyle:'italic', fontSize:28, letterSpacing:1}}>
            ×1.4 MULTIPLIER
          </span>
        </div>
      </div>

      {/* Fade to scene 4 */}
      <div style={{position:'absolute',inset:0,background:'#070F1A',opacity:fadeOut,pointerEvents:'none'}} />
    </AbsoluteFill>
  );
};
