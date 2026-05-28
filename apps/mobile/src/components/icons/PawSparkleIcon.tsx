import React from 'react';
import Svg, { Ellipse, Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  sparkleColor?: string;
};

const STAR = 'M0-2.5 L0.6-0.6 L2.5 0 L0.6 0.6 L0 2.5 L-0.6 0.6 L-2.5 0 L-0.6-0.6Z';

export function PawSparkleIcon({ size = 24, color = '#F07840', sparkleColor }: Props) {
  const sc = sparkleColor ?? color;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Ellipse cx="20" cy="28" rx="11" ry="9" fill={color} />
      <Ellipse cx="7"  cy="18" rx="4.5" ry="5.5" transform="rotate(-20, 7, 18)"  fill={color} />
      <Ellipse cx="14" cy="12" rx="4.5" ry="5.5" transform="rotate(-7, 14, 12)"  fill={color} />
      <Ellipse cx="26" cy="12" rx="4.5" ry="5.5" transform="rotate(7, 26, 12)"   fill={color} />
      <Ellipse cx="33" cy="18" rx="4.5" ry="5.5" transform="rotate(20, 33, 18)"  fill={color} />
      <Path d={STAR} fill={sc} opacity="0.9" transform="translate(37, 7) scale(1.1)" />
      <Path d={STAR} fill={sc} opacity="0.7" transform="translate(32, 2) scale(0.8)" />
      <Path d={STAR} fill={sc} opacity="0.8" transform="translate(3,  6) scale(0.9)" />
    </Svg>
  );
}
