import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { DS } from '@/theme';

type Props = {
  label: string;
  icon?: string;
  selected?: boolean;
  small?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Chip({ label, icon, selected, small, onPress, style, textStyle }: Props) {
  const bg    = selected ? DS.colors.accentPill : DS.colors.cardCream;
  const border = selected ? DS.colors.accentSoft  : DS.colors.border;
  const color  = selected ? DS.colors.accent       : DS.colors.textMid;
  const size   = small ? 12 : 13;
  const py     = small ? 4  : 6;
  const px     = small ? 10 : 12;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.base,
        { backgroundColor: bg, borderColor: border, paddingVertical: py, paddingHorizontal: px },
        style,
      ]}
    >
      {icon && (
        <Text style={{ fontSize: size, lineHeight: size + 2 }}>{icon}</Text>
      )}
      <Text
        style={[
          { fontFamily: selected ? DS.font.medium : DS.font.regular, fontSize: size, color },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    borderRadius:   DS.radius.pill,
    borderWidth:    1,
    alignSelf:      'flex-start',
  },
});
