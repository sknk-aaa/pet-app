import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '@/theme';
import { Photo } from '@/components/Photo';
import { useAllEntries } from '@/hooks/useEntries';
import type { CalendarEntryInfo } from '@/types';

const COLS = 3;
const GAP  = 2;

type Section = { yearMonth: string; year: number; month: number; entries: CalendarEntryInfo[] };

function groupByMonth(entries: CalendarEntryInfo[]): Section[] {
  const map = new Map<string, CalendarEntryInfo[]>();
  for (const e of entries) {
    const ym = e.date.slice(0, 7);
    if (!map.has(ym)) map.set(ym, []);
    map.get(ym)!.push(e);
  }
  return Array.from(map.entries()).map(([ym, items]) => {
    const [y, m] = ym.split('-').map(Number);
    return { yearMonth: ym, year: y, month: m, entries: items };
  });
}

export default function PhotoGrid() {
  const { width } = useWindowDimensions();
  const cellSize  = (width - GAP * (COLS - 1)) / COLS;

  const { data: entries = [], isLoading } = useAllEntries();
  const sections = useMemo(() => groupByMonth(entries), [entries]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={DS.colors.accent} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>すべての写真</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={DS.colors.accent} size="large" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.loader}>
          <Text style={styles.empty}>まだ写真がありません</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {sections.map((section, i) => (
            <View key={section.yearMonth}>
              {(i === 0 || sections[i - 1].year !== section.year) && (
                <Text style={styles.yearLabel}>{section.year}年</Text>
              )}
              <Text style={styles.sectionLabel}>{section.month}月</Text>
              <View style={styles.grid}>
                {section.entries.map(entry => (
                  <TouchableOpacity
                    key={entry.date}
                    activeOpacity={0.85}
                    onPress={() => router.push({ pathname: '/day-detail', params: { date: entry.date } })}
                  >
                    <Photo
                      style={{ width: cellSize, height: cellSize }}
                      uri={entry.thumbnail_uri}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: DS.colors.bg },
  nav: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DS.colors.border,
  },
  backBtn:  { padding: 4 },
  navTitle: { fontSize: 17, fontWeight: '600', color: DS.colors.text },
  loader:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:    { fontSize: 15, color: DS.colors.textHint },
  scroll:   { paddingBottom: 32 },
  yearLabel: {
    fontSize:          18,
    fontWeight:        '700',
    color:             DS.colors.text,
    paddingHorizontal: 14,
    paddingTop:        20,
    paddingBottom:     2,
  },
  sectionLabel: {
    fontSize:          14,
    fontWeight:        '600',
    color:             DS.colors.textMid,
    paddingHorizontal: 14,
    paddingTop:        10,
    paddingBottom:     8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           GAP,
  },
});
