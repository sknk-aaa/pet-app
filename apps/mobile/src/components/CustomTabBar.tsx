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
  { name: 'today-pet', label: '今日のペット',  icon: 'heart-outline',     iconActive: 'heart'       },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: bottomPad },
        DS.shadow.card,
      ]}
    >
      {state.routes.map((route, idx) => {
        const isActive  = state.index === idx;
        const isCenter  = idx === 1;
        const tab       = TABS[idx];
        const iconName  = isActive ? tab.iconActive : tab.icon;
        const color     = isActive ? DS.colors.accent : DS.colors.textHint;

        const onPress = () => {
          const event = navigation.emit({
            type:          'tabPress',
            target:        route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <View key={route.key} style={styles.centerWrapper}>
              <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.85}
                style={[
                  styles.centerButton,
                  isActive && styles.centerButtonActive,
                  DS.shadow.float,
                ]}
              >
                <Ionicons name={iconName} size={28} color={isActive ? '#fff' : DS.colors.textMid} />
              </TouchableOpacity>
              <Text style={[styles.label, { color, marginTop: 34 }]}>{tab.label}</Text>
            </View>
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
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth:  0.5,
    borderTopColor:  DS.colors.border,
    height:          TAB_HEIGHT + 34,
    overflow:        'visible',
    ...Platform.select({ android: { elevation: 8 } }),
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-end',
    paddingBottom:  6,
    gap:            3,
  },
  centerWrapper: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-end',
    paddingBottom:  6,
    overflow:       'visible',
  },
  centerButton: {
    position:        'absolute',
    top:             -24,
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: DS.colors.accentPill,
    alignItems:      'center',
    justifyContent:  'center',
  },
  centerButtonActive: {
    backgroundColor: DS.colors.accent,
  },
  label: {
    fontSize:   10,
    fontWeight: '400',
    textAlign:  'center',
    lineHeight: 13,
  },
});

export { TAB_HEIGHT };
