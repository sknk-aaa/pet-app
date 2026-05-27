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

const TAB_HEIGHT = 49;

type TabConfig = {
  name:       string;
  label:      string;
  icon:       keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  { name: 'calendar',  label: 'カレンダー',   icon: 'calendar-outline',  iconActive: 'calendar'    },
  { name: 'index',     label: 'ホーム',        icon: 'paw-outline',       iconActive: 'paw'         },
  { name: 'today-pet', label: '今日のペット',  icon: 'paw-outline',       iconActive: 'paw'         },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets    = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {state.routes.map((route: { key: string; name: string }, idx: number) => {
        const isActive  = state.index === idx;
        const isHome    = idx === 1;
        const tab       = TABS[idx];
        const iconName  = isActive ? tab.iconActive : tab.icon;
        const color     = isActive ? DS.colors.accent : DS.colors.textHint;

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
                <Ionicons name={iconName} size={26} color={color} />
                <Text style={[styles.label, { color, fontWeight: isActive ? '600' : '400' }]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tab}
          >
            <Ionicons name={iconName} size={23} color={color} />
            <Text style={[styles.label, { color, fontWeight: isActive ? '600' : '400' }]}>
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth:  0.5,
    borderTopColor:  DS.colors.border,
    height:          TAB_HEIGHT + 34,
    overflow:        'visible',
    ...Platform.select({ android: { elevation: 8 } }),
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom:  6,
    gap:            3,
  },
  homeCircle: {
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: 'transparent',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -12,
    gap:             2,
  },
  homeCircleActive: {
    backgroundColor: DS.colors.accentPill,
  },
  label: {
    fontSize:   10,
    textAlign:  'center',
    lineHeight: 13,
  },
});

export { TAB_HEIGHT };
