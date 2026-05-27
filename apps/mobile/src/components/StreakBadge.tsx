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
    height:          36,
    borderRadius:    18,
    backgroundColor: DS.home.pill,
    borderWidth:     1.5,
    borderColor:     DS.home.outline,
    flexDirection:   'row',
    alignItems:      'center',
    paddingLeft:     15,
    paddingRight:    17,
    gap:             5,
  },
  fire:  { fontSize: 17, lineHeight: 20 },
  label: {
    fontFamily: DS.font.medium,
    fontSize:   14,
    color:      DS.home.text,
  },
  count: {
    fontFamily: DS.font.bold,
    fontSize:   14,
    color:      DS.home.accent,
  },
  note: {
    fontFamily: DS.font.regular,
    fontSize:   13,
    color:      DS.home.textSoft,
  },
});
