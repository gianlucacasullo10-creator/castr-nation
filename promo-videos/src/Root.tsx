import React from 'react';
import {Composition} from 'remotion';
import {PromoReel1} from './PromoReel1';

export const Root: React.FC = () => (
  <Composition
    id="PromoReel1"
    component={PromoReel1}
    durationInFrames={450}
    fps={30}
    width={1080}
    height={1920}
  />
);
