import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { resolveLocalUri } from '@/services/photo';
import { DS } from '@/theme';

type Props = {
  size?: number;
  species?: string;
  iconUri?: string | null;
  bg?: string;
};

const SPECIES_EMOJI: Record<string, string> = {
  ねこ:       '🐱',
  いぬ:       '🐶',
  インコ:     '🦜',
  うさぎ:     '🐰',
  ハムスター: '🐹',
  その他:     '🐾',
};

export function PetAvatar({ size = 44, species = 'ねこ', iconUri: rawIconUri, bg }: Props) {
  const iconUri = resolveLocalUri(rawIconUri);
  const emoji = SPECIES_EMOJI[species] ?? '🐾';
  const fontSize = size * 0.48;

  return (
    <View
      style={[
        styles.circle,
        {
          width:        size,
          height:       size,
          borderRadius: size / 2,
          ...(bg ? { backgroundColor: bg } : {}),
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
    backgroundColor: DS.colors.pawWarm,
    borderWidth:     1,
    borderColor:     'rgba(240,112,64,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
  },
});
