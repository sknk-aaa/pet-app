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

const TAB_HEIGHT = 82;

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
              activeOpacity={0.85}
              style={styles.tab}
            >
              <View style={[styles.homeCircle, isActive && styles.homeCircleActive]}>
                <Ionicons
                  name={tab.iconActive}
                  size={27}
                  color={isActive ? DS.home.accent : DS.home.text}
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
              size={26}
              color={DS.home.text}
            />
            <Text style={[styles.label, styles.labelInactive]}>{tab.label}</Text>
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
    borderTopColor:  'rgba(44,26,14,0.14)',
    paddingTop:      8,
    height:          TAB_HEIGHT + 34,
    ...Platform.select({ android: { elevation: 4 } }),
  },
  tab: {
    flex:       1,
    alignItems: 'center',
    gap:        4,
  },
  tabSide: {
    paddingTop: 5,
  },
  homeCircle: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: 'transparent',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -4,
  },
  homeCircleActive: {
    backgroundColor: DS.home.activeTab,
  },
  label: {
    fontSize:   10,
    textAlign:  'center',
  },
  labelInactive: {
    fontFamily: DS.font.regular,
    color:      DS.home.text,
  },
  labelHomeActive: {
    fontFamily: DS.font.bold,
    color:      DS.home.accent,
  },
});

export { TAB_HEIGHT };
