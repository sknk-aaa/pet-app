import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { PawIcon } from './icons/PawIcon';

const TAB_HEIGHT = 64;

type TabConfig = {
  name:       string;
  label:      string;
  icon:       keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  { name: 'calendar',  label: 'カレンダー',  icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'index',     label: 'ホーム',       icon: 'paw-outline',      iconActive: 'paw'      },
  { name: 'today-pet', label: '今日のペット', icon: 'apps-outline',     iconActive: 'apps'     },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets    = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const scales    = useRef(TABS.map(() => new Animated.Value(1))).current;

  const bounce = (idx: number, isHome: boolean) => {
    const scale = scales[idx];
    scale.setValue(isHome ? 0.80 : 0.88);
    Animated.spring(scale, {
      toValue:         1,
      tension:         isHome ? 220 : 280,
      friction:        isHome ? 5   : 7,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {state.routes.map((route: { key: string; name: string }, idx: number) => {
        const isActive = state.index === idx;
        const isHome   = idx === 1;
        const tab      = TABS[idx];

        const onPress = () => {
          bounce(idx, isHome);
          const event = navigation.emit({
            type:              'tabPress',
            target:            route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isHome) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={1}
              style={styles.tab}
            >
              <Animated.View style={[styles.homeCircle, { transform: [{ scale: scales[idx] }] }]}>
                <PawIcon size={28} color={DS.home.accent} />
              </Animated.View>
              <Text style={[styles.label, styles.labelHomeActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={1}
            style={[styles.tab, styles.tabSide]}
          >
            <Animated.View style={{ transform: [{ scale: scales[idx] }] }}>
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={24}
                color={DS.home.text}
              />
            </Animated.View>
            <Text style={[styles.label, styles.labelSide]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'flex-end',
    backgroundColor: DS.home.background,
    borderTopWidth:  StyleSheet.hairlineWidth,
    borderTopColor:  DS.home.outline,
    paddingTop:      6,
    height:          TAB_HEIGHT + 34,
    ...Platform.select({ android: { elevation: 4 } }),
  },
  tab: {
    flex:          1,
    alignItems:    'center',
    gap:           4,
    paddingBottom: 4,
  },
  tabSide: {
    paddingTop: 8,
  },
  homeCircle: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: DS.home.activeTab,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    2,
    shadowColor:     '#C85020',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.18,
    shadowRadius:    6,
    elevation:       3,
  },
  label: {
    fontSize:  10,
    textAlign: 'center',
  },
  labelSide: {
    color:      DS.home.text,
  },
  labelHomeActive: {
    fontWeight: 'bold',
    color:      DS.home.accent,
  },
});

export { TAB_HEIGHT };
