import React from 'react';
import Svg, { Path, Ellipse, Rect } from 'react-native-svg';

type Props = { size?: number; color?: string };

export function MailSentIcon({ size = 64, color = '#F07040' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* envelope body */}
      <Rect x="6" y="18" width="40" height="28" rx="4" fill={color} opacity={0.15} />
      <Path
        d="M6 22a4 4 0 014-4h32a4 4 0 014 4v20a4 4 0 01-4 4H10a4 4 0 01-4-4V22z"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* envelope flap lines */}
      <Path
        d="M6 22l20 13 20-13"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* paw - palm */}
      <Ellipse cx="50" cy="20" rx="7" ry="6" fill={color} />
      {/* paw - toe pads */}
      <Ellipse cx="44.5" cy="13.5" rx="2.2" ry="2.8" transform="rotate(-15 44.5 13.5)" fill={color} />
      <Ellipse cx="50" cy="12"   rx="2.2" ry="2.8" fill={color} />
      <Ellipse cx="55.5" cy="13.5" rx="2.2" ry="2.8" transform="rotate(15 55.5 13.5)" fill={color} />
    </Svg>
  );
}
