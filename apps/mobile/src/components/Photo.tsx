import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  style?: ViewStyle;
  aspectRatio?: number;
  radius?: number;
};

const WARM_GRADIENT: [string, string, string, string] = [
  '#EAD4A8',
  '#D4A870',
  '#C09058',
  '#E8D098',
];

export function Photo({ style, aspectRatio, radius = 16 }: Props) {
  return (
    <LinearGradient
      colors={WARM_GRADIENT}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        { borderRadius: radius },
        aspectRatio != null && { aspectRatio },
        style,
      ]}
    />
  );
}
