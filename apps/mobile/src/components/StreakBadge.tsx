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
    height:          32,
    borderRadius:    16,
    backgroundColor: '#FEF4EC',
    borderWidth:     1,
    borderColor:     '#F0DECE',
    flexDirection:   'row',
    alignItems:      'center',
    paddingLeft:     18,
    paddingRight:    20,
    gap:             4,
  },
  fire:  { fontSize: 15, lineHeight: 18 },
  label: {
    fontFamily: DS.font.regular,
    fontSize:   13,
    color:      DS.home.textSoft,
  },
  count: {
    fontFamily: DS.font.medium,
    fontSize:   13,
    color:      DS.home.textSoft,
  },
  note: {
    fontFamily: DS.font.regular,
    fontSize:   13,
    color:      DS.home.textSoft,
  },
});
