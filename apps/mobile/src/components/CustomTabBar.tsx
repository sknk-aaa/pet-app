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

const TAB_HEIGHT = 56;

type TabConfig = {
  name:       string;
  label:      string;
  icon:       keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  { name: 'calendar',  label: 'カレンダー',  icon: 'calendar-outline', iconActive: 'calendar'   },
  { name: 'index',     label: 'ホーム',       icon: 'paw-outline',      iconActive: 'paw'        },
  { name: 'today-pet', label: '今日のペット', icon: 'image-outline',    iconActive: 'image'      },
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

        if (isHome) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tab}
            >
              <View style={[styles.homeButton, isActive && styles.homeButtonActive]}>
                <Ionicons
                  name={tab.iconActive}
                  size={22}
                  color={isActive ? '#FFFFFF' : DS.home.textSoft}
                />
              </View>
              <Text style={[styles.label, isActive ? styles.labelHomeActive : styles.labelInactive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={[styles.tab, styles.tabSide]}
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={22}
              color={isActive ? DS.home.accent : DS.home.textSoft}
            />
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
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
    alignItems:      'flex-start',
    backgroundColor: DS.home.background,
    borderTopWidth:  StyleSheet.hairlineWidth,
    borderTopColor:  DS.home.outline,
    paddingTop:      10,
    height:          TAB_HEIGHT + 34,
    ...Platform.select({ android: { elevation: 8 } }),
  },
  tab: {
    flex:       1,
    alignItems: 'center',
    gap:        4,
  },
  tabSide: {
    paddingTop: 4,
  },
  homeButton: {
    width:           48,
    height:          48,
    borderRadius:    12,
    backgroundColor: 'transparent',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -10,
  },
  homeButtonActive: {
    backgroundColor: DS.home.accent,
    shadowColor:     DS.home.accent,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    10,
    elevation:       6,
  },
  label: {
    fontSize:   10,
    textAlign:  'center',
    letterSpacing: 0.2,
  },
  labelInactive: {
    fontFamily: DS.font.regular,
    color:      DS.home.textSoft,
  },
  labelActive: {
    fontFamily: DS.font.bold,
    color:      DS.home.accent,
  },
  labelHomeActive: {
    fontFamily: DS.font.bold,
    color:      DS.home.accent,
  },
});

export { TAB_HEIGHT };
