import React from 'react';
import Svg, { Path } from 'react-native-svg';

type Props = { size?: number; color?: string };

const STAR = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} L${cx + r * 0.3} ${cy - r * 0.3} L${cx + r} ${cy} L${cx + r * 0.3} ${cy + r * 0.3} L${cx} ${cy + r} L${cx - r * 0.3} ${cy + r * 0.3} L${cx - r} ${cy} L${cx - r * 0.3} ${cy - r * 0.3}Z`;

export function SparklesIcon({ size = 64, color = '#F07040' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* large center star */}
      <Path d={STAR(32, 32, 14)} fill={color} />
      {/* small top-right */}
      <Path d={STAR(52, 12, 7)} fill={color} opacity={0.8} />
      {/* small bottom-left */}
      <Path d={STAR(14, 50, 6)} fill={color} opacity={0.6} />
      {/* tiny top-left */}
      <Path d={STAR(16, 16, 4)} fill={color} opacity={0.5} />
    </Svg>
  );
}
