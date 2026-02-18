import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const PRIMARY = '#47C8E0';
const GOLD    = '#F5C218';

// Simple fish icon for the tagline decoration
const FishIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size * 0.55} viewBox="0 0 100 55">
    <ellipse cx={48} cy={28} rx={40} ry={21} fill={color} />
    <polygon points="4,10 18,28 4,46" fill={color} />
    <circle cx={72} cy={20} r={6} fill="white" />
    <circle cx={73} cy={20} r={3.5} fill="#0D1B2A" />
    <path d="M 84 28 L 92 35" stroke="#0D1B2A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
  </svg>
);

export const Scene4Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Logo image
  const logoSpr = spring({frame: Math.max(0, frame - 10), fps, config: {damping: 14, stiffness: 120}});
  const logoTransY = interpolate(logoSpr, [0, 1], [70, 0]);
  const logoOp    = interpolate(frame, [10, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Tagline
  const taglineOp = interpolate(frame, [30, 46], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Divider line grows in
  const dividerW  = interpolate(frame, [28, 44], [0, 220], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // CTA button
  const ctaOp  = interpolate(frame, [44, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ctaSpr = spring({frame: Math.max(0, frame - 44), fps, config: {damping: 12, stiffness: 150}});
  const ctaScale = interpolate(ctaSpr, [0, 1], [0.85, 1]);

  // Ambient glow pulse
  const glowOp = 0.14 + Math.sin(frame * 0.09) * 0.05;

  // Subtle rotation on rings
  const ringRot = frame * 0.15;

  return (
    <AbsoluteFill style={{background: '#070F1A', opacity: fadeIn}}>
      {/* Ambient radial glow */}
      <div style={{
        position:'absolute', inset:0,
        background:`radial-gradient(ellipse at 50% 44%, rgba(71,200,224,${glowOp}) 0%, transparent 55%)`,
      }} />

      {/* Decorative SVG rings */}
      <svg style={{position:'absolute',inset:0}} viewBox="0 0 1080 1920" width="100%" height="100%">
        <g transform={`translate(540,880) rotate(${ringRot})`}>
          <circle cx={0} cy={0} r={308} stroke="rgba(71,200,224,0.07)"  strokeWidth={1} fill="none" />
          <circle cx={0} cy={0} r={430} stroke="rgba(71,200,224,0.045)" strokeWidth={1} fill="none" />
          <circle cx={0} cy={0} r={560} stroke="rgba(245,194,24,0.03)"  strokeWidth={1} fill="none" />
        </g>
        {/* Subtle particle dots */}
        {[
          {cx:210,cy:580,r:2.5},{cx:870,cy:620,r:2},{cx:140,cy:1100,r:2.5},
          {cx:940,cy:1050,r:2},{cx:540,cy:440,r:3},{cx:320,cy:1450,r:2},
          {cx:760,cy:1380,r:2.5},{cx:80,cy:1600,r:1.5},{cx:1000,cy:1520,r:2},
        ].map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r}
            fill={i % 2 === 0 ? PRIMARY : GOLD}
            opacity={0.3 + Math.sin(frame * 0.06 + i * 0.8) * 0.2}
          />
        ))}
      </svg>

      {/* Main content */}
      <div style={{
        position:'absolute', inset:0,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        fontFamily:'Inter, sans-serif', gap:22,
      }}>
        {/* Logo image */}
        <div style={{opacity:logoOp, transform:`translateY(${logoTransY}px)`}}>
          <Img
            src={staticFile('castrs-logo.png')}
            style={{width:300, height:'auto', filter:'drop-shadow(0 0 30px rgba(71,200,224,0.4))'}}
          />
        </div>

        {/* Brand name text (shown alongside / as fallback) */}
        <div style={{opacity:logoOp, transform:`translateY(${logoTransY * 0.5}px)`, textAlign:'center'}}>
          <div style={{
            color:PRIMARY, fontSize:92, fontWeight:900, fontStyle:'italic',
            letterSpacing:5, textTransform:'uppercase', lineHeight:0.88,
            textShadow:'0 0 55px rgba(71,200,224,0.5)',
          }}>
            CASTRS
          </div>
          <div style={{
            color:'rgba(255,255,255,0.65)', fontSize:30, fontWeight:700,
            letterSpacing:16, textTransform:'uppercase',
          }}>
            NATION
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width:dividerW, height:2,
          background:`linear-gradient(90deg, transparent, ${PRIMARY}, transparent)`,
          boxShadow:`0 0 12px rgba(71,200,224,0.4)`,
          opacity:taglineOp,
        }} />

        {/* Fish icon + tagline */}
        <div style={{opacity:taglineOp, display:'flex', flexDirection:'column', alignItems:'center', gap:14}}>
          <FishIcon size={42} color={PRIMARY} />
          <div style={{
            color:'rgba(255,255,255,0.88)', fontSize:26, fontWeight:700,
            letterSpacing:6, textTransform:'uppercase', textAlign:'center',
          }}>
            CATCH. SCAN. COMPETE.
          </div>
        </div>

        {/* CTA button */}
        <div style={{opacity:ctaOp, transform:`scale(${ctaScale})`, marginTop:18, display:'flex', flexDirection:'column', alignItems:'center', gap:14}}>
          <div style={{
            background:PRIMARY, borderRadius:50, padding:'18px 52px',
            color:'white', fontWeight:900, fontStyle:'italic',
            fontSize:24, textTransform:'uppercase', letterSpacing:2,
            boxShadow:'0 0 30px rgba(71,200,224,0.45)',
          }}>
            Join the Nation →
          </div>
          <div style={{color:'rgba(255,255,255,0.38)', fontSize:18, letterSpacing:3}}>
            castrs.app
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
