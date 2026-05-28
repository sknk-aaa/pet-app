import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PawSparkleIcon } from './icons/PawSparkleIcon';
import { DS } from '@/theme';

type Props = {
  visible: boolean;
  message?: string;
};

export function SaveToast({ visible, message = '今日の1枚を記録しました' }: Props) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const insets     = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 260, friction: 18, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 80,  duration: 240, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,   duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { bottom: insets.bottom + 100, opacity, transform: [{ translateY }] },
      ]}
    >
      <PawSparkleIcon size={22} color="#fff" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position:          'absolute',
    alignSelf:         'center',
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    backgroundColor:   DS.home.accent,
    borderRadius:      DS.home.radius.pill,
    paddingVertical:   13,
    paddingHorizontal: 22,
    shadowColor:       '#C85020',
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.30,
    shadowRadius:      12,
    elevation:         8,
  },
  text: {
    fontFamily: DS.font.medium,
    fontSize:   15,
    color:      '#fff',
  },
});
