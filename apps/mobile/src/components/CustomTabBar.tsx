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
  { name: 'today-pet', label: '今日のペット',  icon: 'image-outline',     iconActive: 'image'       },
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
        const color     = isActive ? DS.home.accent : DS.home.text;

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
                <Ionicons name={iconName} size={31} color={color} />
                <Text style={[styles.label, { color }, isActive && styles.labelActive]}>
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
            <Ionicons name={iconName} size={29} color={color} />
            <Text style={[styles.label, { color }, isActive && styles.labelActive]}>
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
    backgroundColor: DS.home.card,
    borderTopLeftRadius:  32,
    borderTopRightRadius: 32,
    height:          TAB_HEIGHT + 49,
    overflow:        'visible',
    shadowColor:     '#80512F',
    shadowOffset:    { width: 0, height: -2 },
    shadowOpacity:   0.06,
    shadowRadius:    14,
    ...Platform.select({ android: { elevation: 8 } }),
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom:  8,
    gap:            6,
  },
  homeCircle: {
    width:           78,
    height:          78,
    borderRadius:    39,
    backgroundColor: 'transparent',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -27,
    gap:             4,
  },
  homeCircleActive: {
    backgroundColor: '#FFEBD9',
  },
  label: {
    fontFamily: DS.font.regular,
    fontSize:   13,
    textAlign:  'center',
    lineHeight: 18,
  },
  labelActive: { fontFamily: DS.font.bold },
});

export { TAB_HEIGHT };
