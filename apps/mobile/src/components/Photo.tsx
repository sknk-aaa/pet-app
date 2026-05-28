import React from 'react';
import { Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  style?: StyleProp<ViewStyle>;
  aspectRatio?: number;
  radius?: number;
  uri?: string | null;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
};

const WARM_GRADIENT: [string, string, string, string] = [
  '#EAD4A8',
  '#D4A870',
  '#C09058',
  '#E8D098',
];

export function Photo({ style, aspectRatio, radius = 16, uri, resizeMode = 'cover' }: Props) {
  const baseStyle: ViewStyle = {
    borderRadius: radius,
    ...(aspectRatio != null ? { aspectRatio } : {}),
  };
  const flatStyle = StyleSheet.flatten([baseStyle, style]) ?? baseStyle;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={flatStyle as any}
        resizeMode={resizeMode}
      />
    );
  }
  return (
    <LinearGradient
      colors={WARM_GRADIENT}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={flatStyle}
    />
  );
}
