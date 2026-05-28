import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = { size?: number; color?: string };

export function CrownIcon({ size = 32, color = '#F07040' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {/* crown body */}
      <Path
        d="M4 24h24l-3-12-5 6-4-8-4 8-5-6-3 12z"
        fill={color}
        strokeLinejoin="round"
      />
      {/* base bar */}
      <Path
        d="M4 24h24v2.5a1 1 0 01-1 1H5a1 1 0 01-1-1V24z"
        fill={color}
        opacity={0.7}
      />
      {/* jewels */}
      <Circle cx="16" cy="12" r="1.8" fill="#fff" opacity={0.9} />
      <Circle cx="8"  cy="18" r="1.4" fill="#fff" opacity={0.7} />
      <Circle cx="24" cy="18" r="1.4" fill="#fff" opacity={0.7} />
    </Svg>
  );
}
