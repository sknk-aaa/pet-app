import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { DS } from '@/theme';

type Props = {
  children: React.ReactNode;
  cream?: boolean;
  style?: ViewStyle;
  p?: number;
};

export function Card({ children, cream, style, p = 16 }: Props) {
  return (
    <View
      style={[
        styles.base,
        { padding: p },
        cream && styles.cream,
        DS.shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: DS.colors.card,
    borderRadius:    DS.radius.card,
  },
  cream: {
    backgroundColor: DS.colors.cardCream,
  },
});
