import React from 'react';
import Svg, { Ellipse } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

export function PawIcon({ size = 24, color = '#F07840' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Ellipse cx="20" cy="28" rx="11" ry="9" fill={color} />
      <Ellipse cx="7"  cy="18" rx="4.5" ry="5.5" transform="rotate(-20, 7, 18)"  fill={color} />
      <Ellipse cx="14" cy="12" rx="4.5" ry="5.5" transform="rotate(-7, 14, 12)"  fill={color} />
      <Ellipse cx="26" cy="12" rx="4.5" ry="5.5" transform="rotate(7, 26, 12)"   fill={color} />
      <Ellipse cx="33" cy="18" rx="4.5" ry="5.5" transform="rotate(20, 33, 18)"  fill={color} />
    </Svg>
  );
}
