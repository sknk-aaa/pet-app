import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DS } from '@/theme';
import { PawIcon } from './icons/PawIcon';

type Props = {
  count: number;
  note?: string;
};

export function StreakBadge({ count, note }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        <PawIcon size={15} color={DS.home.accent} />
        <Text style={styles.label}>連続</Text>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.label}>日</Text>
      </View>
      {note && <Text style={styles.note}>{note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  pill: {
    height:          32,
    borderRadius:    16,
    backgroundColor: 'rgba(255, 245, 235, 0.8)',
    borderWidth:     1,
    borderColor:     'rgba(240, 220, 200, 0.4)',
    flexDirection:   'row',
    alignItems:      'center',
    paddingLeft:     18,
    paddingRight:    20,
    gap:             4,
  },
  label: {
    fontFamily: DS.font.regular,
    fontSize:   13,
    color:      DS.home.textSoft,
  },
  count: {
    fontFamily: DS.font.bold,
    fontSize:   15,
    color:      DS.home.accent,
  },
  note: {
    fontFamily: DS.font.regular,
    fontSize:   13,
    color:      DS.home.textSoft,
  },
});
