import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Poppins';

const {fontFamily: poppins} = loadFont('normal', {weights: ['700', '900']});

const PRIMARY = '#47C8E0';
const GOLD    = '#F5C218';

export const Scene4Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 22], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  // OG image entrance
  const imgSpr = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 14, stiffness: 115}});
  const imgY   = interpolate(imgSpr, [0, 1], [80, 0]);
  const imgOp  = interpolate(frame, [8, 28], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  // "CASTRS" text under image
  const textOp  = interpolate(frame, [28, 44], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const textSpr = spring({frame: Math.max(0, frame - 28), fps, config: {damping: 16, stiffness: 120}});
  const textY   = interpolate(textSpr, [0, 1], [40, 0]);

  // Divider
  const divW = interpolate(frame, [34, 50], [0, 240], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  // Tagline
  const tagOp = interpolate(frame, [44, 58], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  // CTA button
  const ctaOp  = interpolate(frame, [54, 68], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const ctaSpr = spring({frame: Math.max(0, frame - 54), fps, config: {damping: 12, stiffness: 150}});
  const ctaScale = interpolate(ctaSpr, [0, 1], [0.82, 1]);

  // Slow rotating ring + pulse glow
  const ringRot  = frame * 0.14;
  const glowPulse = 0.13 + Math.sin(frame * 0.09) * 0.05;

  return (
    <AbsoluteFill style={{background: '#070F1A', opacity: fadeIn}}>
      {/* Ambient radial glow */}
      <div style={{
        position:'absolute', inset:0,
        background:`radial-gradient(ellipse at 50% 44%, rgba(71,200,224,${glowPulse}) 0%, transparent 55%)`,
      }} />

      {/* Decorative rings */}
      <svg style={{position:'absolute',inset:0}} viewBox="0 0 1080 1920" width="100%" height="100%">
        <g transform={`translate(540,880) rotate(${ringRot})`}>
          <circle cx={0} cy={0} r={310} stroke="rgba(71,200,224,0.07)"  strokeWidth={1} fill="none" />
          <circle cx={0} cy={0} r={440} stroke="rgba(71,200,224,0.045)" strokeWidth={1} fill="none" />
          <circle cx={0} cy={0} r={580} stroke="rgba(245,194,24,0.03)"  strokeWidth={1} fill="none" />
        </g>
        {/* Ambient dots */}
        {[
          {cx:215,cy:590,r:2.5,c:PRIMARY},{cx:865,cy:625,r:2,c:GOLD},
          {cx:135,cy:1110,r:2.5,c:PRIMARY},{cx:945,cy:1060,r:2,c:GOLD},
          {cx:540,cy:445,r:3,c:PRIMARY},{cx:315,cy:1455,r:2,c:GOLD},
          {cx:765,cy:1385,r:2.5,c:PRIMARY},{cx:78,cy:1605,r:1.5,c:GOLD},
        ].map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r}
            fill={d.c} opacity={0.28 + Math.sin(frame * 0.06 + i * 0.9) * 0.18} />
        ))}
      </svg>

      {/* Main content */}
      <div style={{
        position:'absolute', inset:0,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:20,
      }}>
        {/* OG image */}
        <div style={{
          opacity:imgOp,
          transform:`translateY(${imgY}px)`,
          borderRadius:28,
          overflow:'hidden',
          boxShadow:`0 0 60px rgba(71,200,224,0.25), 0 20px 60px rgba(0,0,0,0.5)`,
        }}>
          <Img
            src={staticFile('og-image.png')}
            style={{width:540, height:'auto', display:'block'}}
          />
        </div>

        {/* "CASTRS" in Poppins Black */}
        <div style={{
          opacity:textOp,
          transform:`translateY(${textY}px)`,
          textAlign:'center',
        }}>
          <div style={{
            fontFamily:poppins,
            fontWeight:900,
            fontSize:110,
            color:'#FFFFFF',
            letterSpacing:8,
            lineHeight:0.9,
            textShadow:`0 0 60px rgba(71,200,224,0.55)`,
          }}>
            CASTRS
          </div>
          <div style={{
            fontFamily:poppins,
            fontWeight:700,
            fontSize:28,
            color:`rgba(255,255,255,0.5)`,
            letterSpacing:18,
            marginTop:6,
          }}>
            NATION
          </div>
        </div>

        {/* Glowing divider line */}
        <div style={{
          width:divW, height:2,
          background:`linear-gradient(90deg,transparent,${PRIMARY},transparent)`,
          boxShadow:`0 0 14px rgba(71,200,224,0.5)`,
          opacity:tagOp,
        }} />

        {/* Tagline */}
        <div style={{
          opacity:tagOp,
          fontFamily:poppins,
          fontWeight:700,
          color:'rgba(255,255,255,0.85)',
          fontSize:26,
          letterSpacing:6,
          textTransform:'uppercase',
          textAlign:'center',
        }}>
          CATCH. SCAN. COMPETE.
        </div>

        {/* CTA */}
        <div style={{
          opacity:ctaOp,
          transform:`scale(${ctaScale})`,
          marginTop:14,
          display:'flex', flexDirection:'column', alignItems:'center', gap:12,
        }}>
          <div style={{
            background:PRIMARY, borderRadius:50, padding:'18px 54px',
            color:'white', fontFamily:poppins, fontWeight:900,
            fontSize:24, textTransform:'uppercase', letterSpacing:2,
            boxShadow:`0 0 35px rgba(71,200,224,0.5)`,
          }}>
            Join the Nation →
          </div>
          <div style={{
            color:'rgba(255,255,255,0.35)',
            fontFamily:poppins, fontWeight:700,
            fontSize:18, letterSpacing:4,
          }}>
            castrs.app
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
