import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';

const TAB_HEIGHT = 64;

type TabConfig = {
  name:       string;
  label:      string;
  icon:       keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  { name: 'calendar',  label: 'カレンダー',  icon: 'calendar-outline', iconActive: 'calendar'   },
  { name: 'index',     label: 'ホーム',       icon: 'paw-outline',      iconActive: 'paw'        },
  { name: 'today-pet', label: '今日のペット', icon: 'apps-outline',     iconActive: 'apps'       },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets    = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {state.routes.map((route: { key: string; name: string }, idx: number) => {
        const isActive = state.index === idx;
        const isHome   = idx === 1;
        const tab      = TABS[idx];

        const onPress = () => {
          const event = navigation.emit({
            type:              'tabPress',
            target:            route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // ── ホームタブ（中央・大きな円） ──
        if (isHome) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tab}
            >
              <View style={styles.homeCircle}>
                <Ionicons
                  name={tab.iconActive}
                  size={28}
                  color={DS.home.accent}
                />
              </View>
              <Text style={[styles.label, styles.labelHomeActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        // ── 両サイドタブ ──
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={[styles.tab, styles.tabSide]}
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={24}
              color={isActive ? DS.home.text : DS.home.text}
            />
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
    flex:       1,
    alignItems: 'center',
    gap:        4,
    paddingBottom: 4,
  },
  tabSide: {
    paddingTop: 8,
  },

  // 中央のサーモンピーチ大円
  homeCircle: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: DS.home.activeTab,   // #F5C4A0
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
    fontFamily: DS.font.regular,
    color:      DS.home.text,
  },
  labelHomeActive: {
    fontFamily: DS.font.bold,
    color:      DS.home.accent,
  },
});

export { TAB_HEIGHT };
