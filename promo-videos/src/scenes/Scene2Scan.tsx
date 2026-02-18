import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring} from 'remotion';

const PRIMARY = '#47C8E0';
const NAVY    = '#0D1B2A';
const SUCCESS = '#2DC74B';
const MUTED   = 'rgba(255,255,255,0.06)';
const TEXT    = '#E8F4FA';

// ─── Fish emoji + pulsing AI scan rings inside the camera viewfinder ──────────
const MiniBass: React.FC<{frame: number}> = ({frame}) => {
  const lf        = Math.max(0, frame - 52);
  const ringScale = 1 + Math.sin(lf * 0.18) * 0.06;
  const ringOp    = 0.55 + Math.sin(lf * 0.14) * 0.2;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(155deg, #2A5A38 0%, #183A24 45%, #0C1E14 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Bokeh blobs */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 25% 75%, rgba(60,140,70,0.28) 0%, transparent 55%)'}} />
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 75% 25%, rgba(40,100,60,0.20) 0%, transparent 45%)'}} />

      {/* Fish emoji — large, natural colours */}
      <div style={{
        fontSize: 195, lineHeight: 1, zIndex: 2, userSelect: 'none',
        transform: 'rotate(-8deg) scaleX(-1)',
        filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.55))',
      }}>
        🐟
      </div>

      {/* AI scan ring — inner */}
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: `${220 * ringScale}px`, height: `${220 * ringScale}px`,
        border: `2.5px solid rgba(71,200,224,${ringOp})`,
        boxShadow: `0 0 18px rgba(71,200,224,${ringOp * 0.45})`,
      }} />
      {/* AI scan ring — outer */}
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: `${310 * ringScale}px`, height: `${310 * ringScale}px`,
        border: `1.5px solid rgba(71,200,224,${ringOp * 0.38})`,
      }} />

      {/* Vignette */}
      <div style={{position:'absolute',inset:0,boxShadow:'inset 0 0 55px rgba(0,0,0,0.45)'}} />

      {/* Corner brackets (SVG overlay) */}
      <svg style={{position:'absolute',inset:0}} viewBox="0 0 420 420" width="100%" height="100%">
        <path d="M 0 0 L 48 0 M 0 0 L 0 48"       stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M 420 0 L 372 0 M 420 0 L 420 48"     stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M 0 420 L 48 420 M 0 420 L 0 372"     stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M 420 420 L 372 420 M 420 420 L 420 372" stroke={PRIMARY} strokeWidth={4} fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
};

// ─── Scene 2 ──────────────────────────────────────────────────────────────────
export const Scene2Scan: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const bgOpacity   = interpolate(frame, [0, 22],  [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const whiteRecede = interpolate(frame, [0, 18],  [1, 0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  const phoneSpr   = spring({frame: Math.max(0, frame - 12), fps, config: {damping: 18, stiffness: 110}});
  const phoneTransY = interpolate(phoneSpr, [0, 1], [540, 0]);

  const reticle      = interpolate(frame, [25, 50],    [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const shutterFlash = interpolate(frame, [47, 52, 59],[0, 1, 0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const captured     = frame >= 52;

  const speciesStr = 'Largemouth Bass';
  const charsShown = Math.min(
    speciesStr.length,
    Math.floor(interpolate(frame, [57, 93], [0, speciesStr.length], {extrapolateLeft:'clamp', extrapolateRight:'clamp'})),
  );
  const typed  = speciesStr.slice(0, charsShown);
  const cursor = frame >= 57 && frame < 93 && Math.floor(frame / 8) % 2 === 0;

  const locGlow = interpolate(frame, [80, 93], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  const btnPressSpr = spring({frame: Math.max(0, frame - 97), fps, config: {damping: 7, stiffness: 380}});
  const btnScale    = frame >= 97 ? interpolate(btnPressSpr, [0, 0.6, 1], [1, 0.9, 1]) : 1;
  const btnSuccess  = frame >= 101;

  const trophyFlash = interpolate(frame, [99, 105, 113], [0, 0.35, 0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const fadeOut     = interpolate(frame, [105, 120],       [0, 1],       {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  return (
    <AbsoluteFill style={{background: NAVY, opacity: bgOpacity}}>
      <div style={{position:'absolute',inset:0,background:'white',opacity:whiteRecede,pointerEvents:'none'}} />
      <div style={{
        position:'absolute',inset:0,
        background:'radial-gradient(ellipse at 50% 35%, rgba(71,200,224,0.09) 0%, transparent 60%)',
      }} />

      {/* Top label */}
      <div style={{
        position:'absolute', top:180, left:'50%',
        transform:`translateX(-50%) translateY(${phoneTransY * 0.25}px)`,
        textAlign:'center', fontFamily:'Inter, sans-serif',
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
                    <div style={{
                      position:'absolute',inset:0,
                      background:'repeating-linear-gradient(0deg,transparent,transparent 5px,rgba(71,200,224,0.025) 5px,rgba(71,200,224,0.025) 6px)',
                    }} />
                    {([
                      {top:0,   left:0,  borderTop:`3px solid ${PRIMARY}`,  borderLeft:`3px solid ${PRIMARY}`},
                      {top:0,   right:0, borderTop:`3px solid ${PRIMARY}`,  borderRight:`3px solid ${PRIMARY}`},
                      {bottom:0,left:0,  borderBottom:`3px solid ${PRIMARY}`,borderLeft:`3px solid ${PRIMARY}`},
                      {bottom:0,right:0, borderBottom:`3px solid ${PRIMARY}`,borderRight:`3px solid ${PRIMARY}`},
                    ] as React.CSSProperties[]).map((s, i) => (
                      <div key={i} style={{position:'absolute',width:32,height:32,...s}} />
                    ))}
                    <div style={{
                      position:'absolute', left:0, right:0, top:`${reticle * 88}%`, height:2,
                      background:`linear-gradient(90deg,transparent,${PRIMARY},transparent)`,
                      boxShadow:`0 0 8px ${PRIMARY}`,
                    }} />
                  </>
                ) : (
                  <>
                    <MiniBass frame={frame} />
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
                {charsShown === speciesStr.length && <span style={{color:PRIMARY, fontSize:16}}>✓</span>}
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

      <div style={{position:'absolute',inset:0,background:SUCCESS,opacity:trophyFlash,pointerEvents:'none'}} />
      <div style={{position:'absolute',inset:0,background:'#070F1A',opacity:fadeOut,pointerEvents:'none'}} />
    </AbsoluteFill>
  );
};
