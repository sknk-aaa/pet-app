import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DS } from '@/theme';

type Props = {
  count: number;
  note?: string;
};

export function StreakBadge({ count, note }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.pill, DS.shadow.card]}>
        <Text style={styles.fire}>🔥</Text>
        <Text style={styles.label}>連続</Text>
        <Text style={styles.count}>{count}日</Text>
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
    flexDirection:    'row',
    alignItems:       'center',
    gap:              6,
    backgroundColor:  DS.colors.card,
    borderRadius:     DS.radius.pill,
    paddingVertical:  7,
    paddingHorizontal: 16,
  },
  fire: { fontSize: 16 },
  label: {
    color:      DS.colors.textMid,
    fontSize:   13,
  },
  count: {
    color:      DS.colors.accent,
    fontSize:   19,
    fontWeight: '700',
  },
  note: {
    color:    DS.colors.textHint,
    fontSize: 12,
  },
});
