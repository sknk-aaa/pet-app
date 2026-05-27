import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { DS } from '@/theme';

type Props = {
  size?: number;
  species?: string;
  iconUri?: string | null;
};

const SPECIES_EMOJI: Record<string, string> = {
  ねこ:       '🐱',
  いぬ:       '🐶',
  インコ:     '🦜',
  うさぎ:     '🐰',
  ハムスター: '🐹',
  その他:     '🐾',
};

export function PetAvatar({ size = 44, species = 'ねこ', iconUri }: Props) {
  const emoji = SPECIES_EMOJI[species] ?? '🐾';
  const fontSize = size * 0.48;

  return (
    <View
      style={[
        styles.circle,
        {
          width:  size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {iconUri ? (
        <Image
          source={{ uri: iconUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={{ fontSize }}>{emoji}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: DS.colors.accentLight,
    borderWidth:     1.5,
    borderColor:     DS.colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
});
