import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring} from 'remotion';

const PRIMARY = '#47C8E0';
const NAVY    = '#0D1B2A';
const SUCCESS = '#2DC74B';
const MUTED   = 'rgba(255,255,255,0.06)';
const TEXT    = '#E8F4FA';

// Mini bass SVG drawn inside the camera viewfinder
const MiniBass: React.FC = () => (
  <svg viewBox="0 0 420 420" width="100%" height="100%">
    <rect width="420" height="420" fill="#091C2C" />
    {/* Subtle underwater light shafts */}
    <rect x={140} y={0} width={40} height={420} fill="rgba(71,200,224,0.04)" transform="rotate(-8,180,210)" />
    <rect x={260} y={0} width={25} height={420} fill="rgba(71,200,224,0.03)" transform="rotate(5,270,210)" />
    {/* Water floor */}
    <rect x={0} y={330} width={420} height={90} fill="#061018" />
    <ellipse cx={80}  cy={350} rx={40} ry={12} fill="#050E16" />
    <ellipse cx={340} cy={360} rx={30} ry={10} fill="#050E16" />

    {/* Bass fish */}
    <g transform="translate(210,195) rotate(-8) scale(2.6)">
      <ellipse cx={0} cy={0} rx={62} ry={26} fill="#3A6A4A" />
      <path d="M -57 -9 C -18 -28 18 -28 57 -9" stroke="#2A5038" strokeWidth={12} fill="none" />
      <ellipse cx={5} cy={11} rx={46} ry={12} fill="#9BBFA8" />
      <path d="M -56 0 L -90 -30 L -84 0 L -90 30 Z" fill="#2A5038" />
      <path d="M -12 -26 L -3 -52 L 14 -49 L 28 -40 L 33 -26" fill="#2A5038" />
      <circle cx={43} cy={-5} r={8}   fill="white" />
      <circle cx={44} cy={-5} r={5}   fill="#1A2010" />
      <circle cx={46} cy={-7} r={2}   fill="white" />
      <path d="M 59 0 Q 67 6 64 12" stroke="#1A2010" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </g>

    {/* Photo corner brackets */}
    <path d="M 0 0 L 45 0 M 0 0 L 0 45" stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M 420 0 L 375 0 M 420 0 L 420 45" stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M 0 420 L 45 420 M 0 420 L 0 375" stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M 420 420 L 375 420 M 420 420 L 420 375" stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
  </svg>
);

export const Scene2Scan: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Fade in (from white flash of scene 1)
  const bgOpacity    = interpolate(frame, [0, 22],   [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const whiteRecede  = interpolate(frame, [0, 18],   [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Phone slides up with spring
  const phoneSpr = spring({frame: Math.max(0, frame - 12), fps, config: {damping: 18, stiffness: 110}});
  const phoneTransY = interpolate(phoneSpr, [0, 1], [540, 0]);

  // Scanning reticle sweeps down (frames 40–65)
  const reticle = interpolate(frame, [40, 65], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Camera shutter flash (frames 62–74)
  const shutterFlash = interpolate(frame, [62, 67, 74], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const captured = frame >= 67;

  // Species typing  "Largemouth Bass" = 14 chars, 1 char per ~2.8 frames → done ~frame 107
  const speciesStr = 'Largemouth Bass';
  const charsShown = Math.min(
    speciesStr.length,
    Math.floor(interpolate(frame, [72, 108], [0, speciesStr.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})),
  );
  const typed = speciesStr.slice(0, charsShown);
  const cursor = frame >= 72 && frame < 108 && Math.floor(frame / 8) % 2 === 0;

  // Location icon glow (frame 95+)
  const locGlow = interpolate(frame, [95, 108], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Submit button press (frame 112+)
  const btnPressSpr = spring({frame: Math.max(0, frame - 112), fps, config: {damping: 7, stiffness: 380}});
  const btnScale = frame >= 112 ? interpolate(btnPressSpr, [0, 0.6, 1], [1, 0.9, 1]) : 1;
  const btnSuccess = frame >= 116;

  // Trophy flash
  const trophyFlash = interpolate(frame, [114, 120, 128], [0, 0.35, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Fade out
  const fadeOut = interpolate(frame, [120, 135], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: NAVY, opacity: bgOpacity}}>
      {/* White bleed from scene 1 flash */}
      <div style={{position:'absolute',inset:0,background:'white',opacity:whiteRecede,pointerEvents:'none'}} />

      {/* Background glow */}
      <div style={{
        position:'absolute',inset:0,
        background:'radial-gradient(ellipse at 50% 35%, rgba(71,200,224,0.09) 0%, transparent 60%)',
      }} />

      {/* Top label */}
      <div style={{
        position:'absolute', top:180, left:'50%', transform:'translateX(-50%)',
        textAlign:'center', fontFamily:'Inter, sans-serif',
        transform:`translateX(-50%) translateY(${phoneTransY * 0.25}px)`,
      }}>
        <div style={{color:PRIMARY,  fontSize:54, fontWeight:900, fontStyle:'italic', letterSpacing:3, lineHeight:1}}>SCAN YOUR</div>
        <div style={{color:'#FFFFFF',fontSize:54, fontWeight:900, fontStyle:'italic', letterSpacing:3, lineHeight:1}}>CATCH</div>
      </div>

      {/* Phone */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        transform:`translateX(-50%) translateY(calc(-50% + ${phoneTransY}px))`,
      }}>
        {/* Shell */}
        <div style={{
          width:490, height:980, borderRadius:64,
          background:'linear-gradient(145deg,#1C2E40,#0A1520)',
          border:'2px solid rgba(255,255,255,0.11)',
          boxShadow:'0 28px 80px rgba(0,0,0,0.65), inset 0 0 0 2px rgba(255,255,255,0.04)',
          overflow:'hidden', position:'relative',
        }}>
          {/* Screen */}
          <div style={{
            position:'absolute', top:13, left:13, right:13, bottom:13,
            borderRadius:54, background:NAVY, overflow:'hidden',
          }}>
            {/* Status bar */}
            <div style={{
              display:'flex', justifyContent:'space-between', padding:'14px 26px 0',
              color:TEXT, fontSize:15, fontWeight:600, fontFamily:'Inter, sans-serif',
            }}>
              <span>9:41</span>
              <span style={{fontSize:13, letterSpacing:2}}>●●●</span>
            </div>

            {/* App UI */}
            <div style={{padding:'18px 26px', fontFamily:'Inter, sans-serif'}}>
              {/* Header */}
              <div style={{
                color:PRIMARY, fontSize:30, fontWeight:900, fontStyle:'italic',
                textTransform:'uppercase', letterSpacing:1, marginBottom:18,
              }}>
                Verify Catch
              </div>

              {/* Camera box */}
              <div style={{
                width:'100%', aspectRatio:'1', borderRadius:38,
                border: captured ? 'none' : `2px dashed rgba(71,200,224,0.38)`,
                background: captured ? 'transparent' : 'rgba(255,255,255,0.03)',
                overflow:'hidden', position:'relative', marginBottom:16,
              }}>
                {!captured ? (
                  <>
                    {/* Scan lines */}
                    <div style={{
                      position:'absolute',inset:0,
                      background:'repeating-linear-gradient(0deg,transparent,transparent 5px,rgba(71,200,224,0.025) 5px,rgba(71,200,224,0.025) 6px)',
                    }} />
                    {/* Corner brackets */}
                    {([
                      {top:0,left:0,  bt:'3px solid '+PRIMARY, bl:'3px solid '+PRIMARY},
                      {top:0,right:0, bt:'3px solid '+PRIMARY, br:'3px solid '+PRIMARY},
                      {bottom:0,left:0,  bb:'3px solid '+PRIMARY, bl:'3px solid '+PRIMARY},
                      {bottom:0,right:0, bb:'3px solid '+PRIMARY, br:'3px solid '+PRIMARY},
                    ] as React.CSSProperties[]).map((s,i) => (
                      <div key={i} style={{position:'absolute',width:32,height:32,...s}} />
                    ))}
                    {/* Reticle sweep line */}
                    <div style={{
                      position:'absolute', left:0, right:0, top:`${reticle * 88}%`, height:2,
                      background:`linear-gradient(90deg,transparent,${PRIMARY},transparent)`,
                      boxShadow:`0 0 8px ${PRIMARY}`,
                    }} />
                  </>
                ) : (
                  <>
                    <MiniBass />
                    {/* Shutter flash */}
                    <div style={{position:'absolute',inset:0,background:'white',opacity:shutterFlash}} />
                  </>
                )}
              </div>

              {/* Species input */}
              <div style={{
                background:MUTED, borderRadius:22, padding:'15px 18px',
                marginBottom:13, display:'flex', alignItems:'center', gap:10,
              }}>
                <span style={{fontSize:19}}>🐟</span>
                <span style={{color: typed ? PRIMARY : 'rgba(255,255,255,0.22)', fontWeight:700, fontSize:17, flex:1}}>
                  {typed || 'Species...'}
                  {cursor && <span style={{color:PRIMARY}}>|</span>}
                </span>
                {charsShown === speciesStr.length && (
                  <span style={{color:PRIMARY, fontSize:16}}>✓</span>
                )}
              </div>

              {/* Location input */}
              <div style={{
                background:MUTED, borderRadius:22, padding:'15px 18px',
                marginBottom:22, display:'flex', alignItems:'center', gap:10,
              }}>
                <span style={{
                  fontSize:19,
                  filter: locGlow > 0 ? `drop-shadow(0 0 ${locGlow * 8}px ${PRIMARY})` : 'none',
                }}>📍</span>
                <span style={{color:PRIMARY, fontWeight:700, fontSize:17}}>Lake Ontario</span>
              </div>

              {/* Submit button */}
              <div style={{
                background: btnSuccess ? SUCCESS : PRIMARY,
                borderRadius:22, padding:'20px 0', textAlign:'center',
                transform:`scale(${btnScale})`,
                boxShadow: btnSuccess ? `0 0 30px rgba(45,199,75,0.4)` : `0 0 20px rgba(71,200,224,0.25)`,
                transition:'background 0.15s',
              }}>
                <span style={{color:'white',fontWeight:900,fontStyle:'italic',fontSize:19,textTransform:'uppercase',letterSpacing:1}}>
                  {btnSuccess ? '✓  Trophy Verified!' : 'Verify & Submit'}
                </span>
              </div>
            </div>
          </div>

          {/* Notch */}
          <div style={{
            position:'absolute', top:13, left:'50%', transform:'translateX(-50%)',
            width:130, height:34, background:'#000', borderRadius:'0 0 22px 22px',
          }} />
        </div>
      </div>

      {/* Trophy success flash */}
      <div style={{position:'absolute',inset:0,background:SUCCESS,opacity:trophyFlash,pointerEvents:'none'}} />

      {/* Fade to scene 3 */}
      <div style={{position:'absolute',inset:0,background:'#070F1A',opacity:fadeOut,pointerEvents:'none'}} />
    </AbsoluteFill>
  );
};
