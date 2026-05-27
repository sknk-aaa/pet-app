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
      <View style={styles.pill}>
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
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               6,
    height:            38,
    minWidth:          148,
    backgroundColor:   DS.home.pill,
    borderRadius:      DS.radius.pill,
    borderWidth:       1,
    borderColor:       DS.home.outline,
    paddingHorizontal: 18,
  },
  fire:  { fontSize: 18, lineHeight: 22 },
  label: {
    fontFamily: DS.font.medium,
    color:      DS.home.text,
    fontSize:   16,
  },
  count: {
    fontFamily: DS.font.bold,
    color:      DS.home.accent,
    fontSize:   20,
  },
  note: {
    fontFamily: DS.font.regular,
    color:      DS.home.textSoft,
    fontSize:   14,
  },
});
