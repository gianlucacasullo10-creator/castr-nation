import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Scene1Fishing} from './scenes/Scene1Fishing';
import {Scene2Scan} from './scenes/Scene2Scan';
import {Scene3Points} from './scenes/Scene3Points';
import {Scene4Logo} from './scenes/Scene4Logo';

// Total: 450 frames (15s @ 30fps)
// Scene 1: 0–164    (5.5s) — fishing
// Scene 2: 155–294  (4.7s) — scan (crossfades with end of scene 1)
// Scene 3: 280–389  (3.7s) — points reveal
// Scene 4: 370–449  (2.7s) — logo outro

export const PromoReel1: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#070F1A', fontFamily: 'Inter, system-ui, sans-serif'}}>
    <Sequence from={0} durationInFrames={165}>
      <Scene1Fishing />
    </Sequence>
    <Sequence from={155} durationInFrames={135}>
      <Scene2Scan />
    </Sequence>
    <Sequence from={278} durationInFrames={112}>
      <Scene3Points />
    </Sequence>
    <Sequence from={368} durationInFrames={82}>
      <Scene4Logo />
    </Sequence>
  </AbsoluteFill>
);
