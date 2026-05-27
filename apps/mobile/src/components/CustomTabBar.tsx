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
import Svg, { Ellipse, Rect, Line, Path, Circle } from 'react-native-svg';
import { DS } from '@/theme';

const TAB_HEIGHT = 49;

function PawIcon({ size = 24, color = DS.colors.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Ellipse cx={12} cy={16.5} rx={5.5} ry={3.8} fill={color} />
      <Ellipse cx={7} cy={10.5} rx={2} ry={2.6} fill={color} />
      <Ellipse cx={17} cy={10.5} rx={2} ry={2.6} fill={color} />
      <Ellipse cx={4} cy={7} rx={1.6} ry={2} fill={color} />
      <Ellipse cx={20} cy={7} rx={1.6} ry={2} fill={color} />
    </Svg>
  );
}

function CalIcon({ size = 24, color = DS.colors.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round">
      <Rect x={3} y={4} width={18} height={17} rx={3} />
      <Line x1={16} y1={2} x2={16} y2={6} />
      <Line x1={8} y1={2} x2={8} y2={6} />
      <Line x1={3} y1={10} x2={21} y2={10} />
      <Rect x={7} y={13} width={3} height={3} rx={0.5} fill={color} stroke="none" />
      <Rect x={14} y={13} width={3} height={3} rx={0.5} fill={color} stroke="none" />
    </Svg>
  );
}

function PetTabIcon({ size = 24, color = DS.colors.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2.5} y={2.5} width={19} height={19} rx={5} stroke={color} strokeWidth={1.7} fill="none" />
      <Ellipse cx={12} cy={15.5} rx={4.5} ry={3.2} fill={color} />
      <Ellipse cx={8} cy={10.5} rx={1.7} ry={2.1} fill={color} />
      <Ellipse cx={16} cy={10.5} rx={1.7} ry={2.1} fill={color} />
      <Ellipse cx={5.5} cy={7.5} rx={1.3} ry={1.7} fill={color} />
      <Ellipse cx={18.5} cy={7.5} rx={1.3} ry={1.7} fill={color} />
    </Svg>
  );
}

type TabConfig = {
  name:  string;
  label: string;
  Icon:  typeof PawIcon;
};

const TABS: TabConfig[] = [
  { name: 'calendar',  label: 'カレンダー',   Icon: CalIcon    },
  { name: 'index',     label: 'ホーム',        Icon: PawIcon    },
  { name: 'today-pet', label: '今日のペット',  Icon: PetTabIcon },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {state.routes.map((route: { key: string; name: string }, idx: number) => {
        const isActive = state.index === idx;
        const isHome   = idx === 1;
        const tab      = TABS[idx];
        const color    = isActive ? DS.colors.accent : DS.colors.textHint;

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
                <tab.Icon size={26} color={color} />
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
            <tab.Icon size={23} color={color} />
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
    fontSize:  10,
    textAlign: 'center',
    lineHeight: 13,
  },
});

export { TAB_HEIGHT };
