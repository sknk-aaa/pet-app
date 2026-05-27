import React from 'react';
import { View, Switch, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DS } from '@/theme';

type Props = {
  label: string;
  value: boolean;
  onValueChange?: (v: boolean) => void;
  sublabel?: string;
};

export function Toggle({ label, value, onValueChange, sublabel }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onValueChange?.(!value)}
      style={styles.row}
    >
      <View style={styles.left}>
        <Text style={styles.label}>{label}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D8CEC4', true: DS.colors.accent }}
        thumbColor={DS.colors.white}
        ios_backgroundColor="#D8CEC4"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    minHeight: 44,
  },
  left: { flex: 1, marginRight: 12 },
  label: {
    fontSize: 16,
    color:    DS.colors.text,
  },
  sublabel: {
    fontSize:  12,
    color:     DS.colors.textHint,
    marginTop: 2,
  },
});
