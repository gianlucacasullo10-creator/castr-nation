import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring} from 'remotion';

const PRIMARY = '#47C8E0';
const NAVY    = '#0D1B2A';
const SUCCESS = '#2DC74B';
const MUTED   = 'rgba(255,255,255,0.06)';
const TEXT    = '#E8F4FA';

// Realistic bass photo inside the camera viewfinder
const MiniBass: React.FC = () => (
  <svg viewBox="0 0 420 420" width="100%" height="100%">
    <defs>
      {/* Outdoor bokeh background */}
      <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#5A9AB8" />
        <stop offset="55%"  stopColor="#3A6E88" />
        <stop offset="100%" stopColor="#183848" />
      </linearGradient>
      {/* Bass body — dark olive back → silver belly */}
      <linearGradient id="bassBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#1A3020" />
        <stop offset="22%"  stopColor="#2C5234" />
        <stop offset="52%"  stopColor="#4A7A54" />
        <stop offset="80%"  stopColor="#8AB098" />
        <stop offset="100%" stopColor="#C8DCC8" />
      </linearGradient>
      {/* Tail gradient */}
      <linearGradient id="tailG" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%"   stopColor="#2C5234" />
        <stop offset="100%" stopColor="#162818" />
      </linearGradient>
      {/* Eye gradient */}
      <radialGradient id="eyeG" cx="38%" cy="36%" r="55%">
        <stop offset="0%"   stopColor="#7A5228" />
        <stop offset="55%"  stopColor="#2C1808" />
        <stop offset="100%" stopColor="#080804" />
      </radialGradient>
      {/* Warm light shaft */}
      <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="rgba(120,200,230,0.12)" />
        <stop offset="100%" stopColor="rgba(120,200,230,0)" />
      </linearGradient>
    </defs>

    {/* Background: blurred outdoor lake scene */}
    <rect width="420" height="420" fill="url(#bg1)" />
    {/* Bokeh circles (out-of-focus background lights) */}
    <circle cx={60}  cy={80}  r={28} fill="rgba(180,220,240,0.10)" />
    <circle cx={360} cy={60}  r={20} fill="rgba(180,220,240,0.08)" />
    <circle cx={320} cy={340} r={35} fill="rgba(60,120,90,0.12)" />
    <circle cx={80}  cy={370} r={22} fill="rgba(60,120,90,0.10)" />
    {/* Light shafts through water */}
    <rect x={100} y={0} width={50}  height={420} fill="url(#shaft)" transform="skewX(-6)" />
    <rect x={260} y={0} width={30}  height={420} fill="url(#shaft)" transform="skewX(8)" />
    {/* Vague water surface line */}
    <rect x={0} y={310} width={420} height={110} fill="rgba(10,30,44,0.45)" />

    {/* ── Bass fish ── centered, slight upward tilt */}
    <g transform="translate(210,200) rotate(-10) scale(2.75)">
      {/* Main body shape — more accurate than simple ellipse */}
      <path d="M -68 0 C -68 -28 -36 -34 0 -31 C 38 -28 65 -16 72 0 C 65 16 38 28 0 31 C -36 34 -68 28 -68 0 Z"
        fill="url(#bassBody)" />

      {/* Dark olive back */}
      <path d="M -62 -12 C -22 -32 22 -32 62 -12" stroke="#162818" strokeWidth={15} fill="none" />

      {/* Lateral line (distinctive bass ID feature) */}
      <path d="M -54 -1 L 62 -1" stroke="rgba(0,0,0,0.22)" strokeWidth={3.5} strokeLinecap="round" />

      {/* Scale texture */}
      <path d="M -32 -8 Q -20 -20 -8 -8" stroke="rgba(0,0,0,0.14)" strokeWidth={1.5} fill="none" />
      <path d="M  -8 -8 Q   4 -20 16 -8" stroke="rgba(0,0,0,0.14)" strokeWidth={1.5} fill="none" />
      <path d="M  16 -8 Q  28 -20 40 -8" stroke="rgba(0,0,0,0.14)" strokeWidth={1.5} fill="none" />
      <path d="M  40 -8 Q  52 -20 62 -8" stroke="rgba(0,0,0,0.12)" strokeWidth={1.5} fill="none" />
      <path d="M -30  8 Q -18  -4 -6  8" stroke="rgba(0,0,0,0.11)" strokeWidth={1.5} fill="none" />
      <path d="M  -6  8 Q   6  -4 18  8" stroke="rgba(0,0,0,0.11)" strokeWidth={1.5} fill="none" />
      <path d="M  18  8 Q  30  -4 42  8" stroke="rgba(0,0,0,0.11)" strokeWidth={1.5} fill="none" />

      {/* Tail — forked, bass signature */}
      <path d="M -64 0 C -72 -10 -96 -34 -94 -38 C -88 -32 -80 -10 -72 0 C -80 10 -88 32 -94 38 C -96 34 -72 10 -64 0 Z"
        fill="url(#tailG)" />

      {/* Dorsal fin — spiny anterior, soft posterior */}
      <path d="M -12 -31 L -6 -60 L 4 -57 L 16 -65 L 28 -57 L 40 -48 L 48 -40 L 52 -31"
        fill="#1E3824" stroke="#142018" strokeWidth={0.8} />
      {/* Dorsal spines */}
      {[-8,-2,10,22,34,44].map((sx, i) => (
        <line key={i} x1={sx} y1={-31} x2={sx+2} y2={-60+i*5}
          stroke="#142018" strokeWidth={1.5} />
      ))}

      {/* Pectoral fin */}
      <ellipse cx={22} cy={14} rx={25} ry={10} fill="#1E3824" transform="rotate(-28,22,14)" />

      {/* Pelvic fin */}
      <path d="M 2 28 L 4 46 L 14 44 L 18 28" fill="#1E3824" />

      {/* Anal fin */}
      <path d="M -22 28 L -24 48 L -6 46 L -2 28" fill="#1E3824" />

      {/* Eye — large, bass are sight predators */}
      <circle cx={44} cy={-6} r={12} fill="white" />
      <circle cx={44} cy={-6} r={9}  fill="url(#eyeG)" />
      <circle cx={47} cy={-9} r={3.5} fill="white" />
      {/* Pupil slit */}
      <ellipse cx={44} cy={-6} rx={4} ry={6} fill="rgba(0,0,0,0.6)" />
      {/* Eye ring */}
      <circle cx={44} cy={-6} r={12} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={1} />

      {/* Mouth — bass have famously large mouths */}
      <path d="M 68 2 Q 75 8 72 16"  stroke="#0A1008" strokeWidth={3}   fill="none" strokeLinecap="round" />
      <path d="M 66 -5 L 76 -2"       stroke="#0A1008" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </g>

    {/* Subtle vignette */}
    <rect width="420" height="420"
      fill="none"
      stroke="rgba(0,0,0,0.3)" strokeWidth={30}
    />

    {/* Photo corner brackets */}
    <path d="M 0 0 L 45 0 M 0 0 L 0 45"    stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M 420 0 L 375 0 M 420 0 L 420 45"   stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M 0 420 L 45 420 M 0 420 L 0 375"   stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
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
