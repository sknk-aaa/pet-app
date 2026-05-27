import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';

type Props = {
  label: string;
  value?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  divider?: boolean;
  labelColor?: string;
};

export function SettingRow({
  label,
  value,
  rightElement,
  onPress,
  chevron = true,
  divider = true,
  labelColor,
}: Props) {
  const Row = onPress ? TouchableOpacity : View;

  return (
    <>
      <Row
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.row}
      >
        <Text style={[styles.label, labelColor ? { color: labelColor } : undefined]}>
          {label}
        </Text>
        <View style={styles.right}>
          {rightElement}
          {value && <Text style={styles.value}>{value}</Text>}
          {chevron && onPress && (
            <Ionicons
              name="chevron-forward"
              size={16}
              color={DS.colors.textHint}
            />
          )}
        </View>
      </Row>
      {divider && <View style={styles.divider} />}
    </>
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
  label: {
    fontSize: 16,
    color:    DS.colors.text,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  value: {
    fontSize: 15,
    color:    DS.colors.textMid,
  },
  divider: {
    height:          0.5,
    backgroundColor: DS.colors.border,
  },
});
